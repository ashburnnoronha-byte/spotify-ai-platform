from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.schemas.chat import ChatMessage, ChatResponse, ChatSource, IndexResponse
from app.services.spotify_service import SpotifyService

try:
    from langchain_chroma import Chroma
except ImportError:  # pragma: no cover - handled at runtime
    Chroma = None  # type: ignore[assignment]

try:
    from langchain_core.documents import Document
except ImportError:  # pragma: no cover - fallback keeps FastAPI import-safe

    @dataclass
    class Document:  # type: ignore[no-redef]
        page_content: str
        metadata: dict[str, Any]

try:
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
except ImportError:  # pragma: no cover - LLM becomes unavailable
    StrOutputParser = None  # type: ignore[assignment]
    ChatPromptTemplate = None  # type: ignore[assignment]
    ChatOpenAI = None  # type: ignore[assignment]
    OpenAIEmbeddings = None  # type: ignore[assignment]

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:  # pragma: no cover - Gemini becomes unavailable
    ChatGoogleGenerativeAI = None  # type: ignore[assignment]


settings = get_settings()


class ChatServiceUnavailable(Exception):
    pass


class LocalHashEmbeddings:
    """Deterministic local embeddings for development without an OpenAI key."""

    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        for token in text.lower().replace("/", " ").replace("-", " ").split():
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:4], "big") % self.dimensions
            vector[idx] += 1.0

        magnitude = math.sqrt(sum(value * value for value in vector))
        if magnitude == 0:
            return vector
        return [value / magnitude for value in vector]


class ChatService:
    def __init__(self, db: AsyncSession, user: User):
        if Chroma is None:
            raise ChatServiceUnavailable(
                "AI chat dependencies are not installed. Run: pip install -r requirements.txt"
            )

        self.db = db
        self.user = user
        self.spotify = SpotifyService(db, user)
        self.embedding_provider = self._embedding_provider()
        self.collection_name = f"user_music_{user.id}_{self.embedding_provider}"
        self.vectorstore = Chroma(
            collection_name=self.collection_name,
            embedding_function=self._build_embeddings(),
            persist_directory=settings.chroma_persist_dir,
        )

    def _embedding_provider(self) -> str:
        if (
            settings.use_openai_embeddings
            and settings.openai_api_key
            and OpenAIEmbeddings is not None
        ):
            return "openai"
        return "local"

    def _build_embeddings(self):
        if self.embedding_provider == "openai" and OpenAIEmbeddings is not None:
            return OpenAIEmbeddings(
                model=settings.embedding_model,
                api_key=settings.openai_api_key,
            )
        return LocalHashEmbeddings()

    async def index_spotify_data(self) -> IndexResponse:
        documents = await self._build_spotify_documents()
        if not documents:
            return IndexResponse(
                indexed_documents=0,
                message="No Spotify data was available to index.",
            )

        ids = [
            hashlib.sha256(
                f"{self.user.id}:{doc.metadata.get('kind')}:{doc.metadata.get('spotify_id')}:{doc.page_content}".encode(
                    "utf-8"
                )
            ).hexdigest()
            for doc in documents
        ]
        embeddings = self.vectorstore._embedding_function.embed_documents(  # type: ignore[attr-defined]
            [doc.page_content for doc in documents]
        )
        self.vectorstore._collection.upsert(  # type: ignore[attr-defined]
            ids=ids,
            documents=[doc.page_content for doc in documents],
            metadatas=[doc.metadata for doc in documents],
            embeddings=embeddings,
        )

        return IndexResponse(
            indexed_documents=self._document_count(),
            message=f"Indexed {len(documents)} Spotify listening-history documents.",
        )

    async def answer(
        self,
        message: str,
        history: list[ChatMessage] | None = None,
        rebuild_index: bool = False,
    ) -> ChatResponse:
        if rebuild_index or self._document_count() == 0:
            await self.index_spotify_data()

        docs = self.vectorstore.similarity_search(message, k=8)
        answer, used_llm = await self._generate_answer(message, history or [], docs)

        return ChatResponse(
            answer=answer,
            sources=[
                ChatSource(
                    title=str(doc.metadata.get("title", "Spotify data")),
                    kind=str(doc.metadata.get("kind", "spotify")),
                    content=doc.page_content,
                )
                for doc in docs[:4]
            ],
            used_llm=used_llm,
            indexed_documents=self._document_count(),
        )

    async def _generate_answer(
        self,
        message: str,
        history: list[ChatMessage],
        docs: list[Document],
    ) -> tuple[str, bool]:
        context = "\n\n".join(f"- {doc.page_content}" for doc in docs)

        chat_model = self._build_chat_model()
        if chat_model is not None and ChatPromptTemplate is not None and StrOutputParser is not None:
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are an AI music analyst. Answer using only the user's Spotify "
                        "listening-history context. Be concise, helpful, and honest when the "
                        "context is insufficient.",
                    ),
                    (
                        "human",
                        "Conversation history:\n{history}\n\nSpotify context:\n{context}\n\n"
                        "User question: {question}",
                    ),
                ]
            )
            chain = prompt | chat_model | StrOutputParser()
            try:
                response = await chain.ainvoke(
                    {
                        "history": self._format_history(history),
                        "context": context or "No indexed Spotify context found.",
                        "question": message,
                    }
                )
                return response, True
            except Exception as e:
                return self._fallback_answer(message, docs, llm_error=e), False

        return self._fallback_answer(message, docs), False

    def _build_chat_model(self):
        provider = settings.llm_provider.lower()
        if provider == "gemini" and settings.google_api_key and ChatGoogleGenerativeAI is not None:
            return ChatGoogleGenerativeAI(
                model=settings.gemini_model,
                google_api_key=settings.google_api_key,
                temperature=0.3,
            )
        if provider == "openai" and settings.openai_api_key and ChatOpenAI is not None:
            return ChatOpenAI(
                model=settings.llm_model,
                api_key=settings.openai_api_key,
                temperature=0.3,
            )
        return None

    def _fallback_answer(
        self,
        message: str,
        docs: list[Document],
        llm_error: Exception | None = None,
    ) -> str:
        if not docs:
            return (
                "I do not have indexed Spotify data for you yet. Click 'Index Spotify data' "
                "or try again after your Spotify data loads."
            )

        question = message.lower()
        if "genre" in question:
            genres: dict[str, int] = {}
            for doc in docs:
                genre_text = str(doc.metadata.get("genres", ""))
                for genre in [item.strip() for item in genre_text.split(",") if item.strip()]:
                    genres[genre] = genres.get(genre, 0) + 1
            if genres:
                top = sorted(genres.items(), key=lambda item: item[1], reverse=True)[:3]
                return "Your strongest genre signals are " + ", ".join(name for name, _ in top) + "."

        if "artist" in question or "artists" in question:
            artists = [doc.metadata.get("title") for doc in docs if doc.metadata.get("kind") in {"top_artist", "followed_artist"}]
            if artists:
                return "Based on your indexed history, artists that stand out are " + ", ".join(map(str, artists[:5])) + "."

        if "workout" in question or "mood" in question:
            tracks = [doc.metadata.get("title") for doc in docs if doc.metadata.get("kind") in {"top_track", "saved_track", "recent_track"}]
            if tracks:
                return "For that mood, I would start with " + ", ".join(map(str, tracks[:5])) + "."

        footer = ""
        if llm_error is not None:
            footer = f"\n\nGemini/LLM fallback reason: {self._safe_error_message(llm_error)}"
        elif not settings.google_api_key and settings.llm_provider.lower() == "gemini":
            footer = "\n\nAdd `GOOGLE_API_KEY` for Gemini answers."
        elif settings.llm_provider.lower() == "openai" and not settings.openai_api_key:
            footer = "\n\nAdd `OPENAI_API_KEY` for OpenAI answers."

        return (
            "Here is what I found in your Spotify history:\n"
            + "\n".join(f"- {doc.page_content}" for doc in docs[:5])
            + footer
        )

    def _safe_error_message(self, error: Exception) -> str:
        message = str(error)
        if settings.google_api_key:
            message = message.replace(settings.google_api_key, "[redacted]")
        if settings.openai_api_key:
            message = message.replace(settings.openai_api_key, "[redacted]")
        return message[:500]

    async def _build_spotify_documents(self) -> list[Document]:
        docs: list[Document] = []

        top_artists = await self.spotify.get_top_artists("medium_term", 20)
        top_tracks = await self.spotify.get_top_tracks("medium_term", 20)
        recent = await self.spotify.get_recently_played(50)
        playlists = await self.spotify.get_playlists(20, 0)
        saved = await self.spotify.get_saved_tracks(20, 0)
        followed = await self.spotify.get_followed_artists(20)

        docs.extend(self._artist_docs(top_artists.get("items", []), "top_artist"))
        docs.extend(self._track_docs(top_tracks.get("items", []), "top_track"))
        docs.extend(self._recent_docs(recent.get("items", [])))
        docs.extend(self._playlist_docs(playlists.get("items", [])))
        docs.extend(self._saved_docs(saved.get("items", [])))
        docs.extend(self._artist_docs(followed.get("artists", {}).get("items", []), "followed_artist"))

        return docs

    def _artist_docs(self, artists: list[dict[str, Any]], kind: str) -> list[Document]:
        docs: list[Document] = []
        for index, artist in enumerate(artists, start=1):
            genres = artist.get("genres") or []
            content = (
                f"{kind.replace('_', ' ').title()} #{index}: {artist.get('name')} "
                f"with genres {', '.join(genres) or 'unknown'} and Spotify popularity "
                f"{artist.get('popularity', 'unknown')}."
            )
            docs.append(
                Document(
                    page_content=content,
                    metadata={
                        "user_id": self.user.id,
                        "kind": kind,
                        "spotify_id": artist.get("id", ""),
                        "title": artist.get("name", "Unknown artist"),
                        "genres": ", ".join(genres),
                        "rank": index,
                    },
                )
            )
        return docs

    def _track_docs(self, tracks: list[dict[str, Any]], kind: str) -> list[Document]:
        docs: list[Document] = []
        for index, track in enumerate(tracks, start=1):
            artists = ", ".join(artist.get("name", "") for artist in track.get("artists", []))
            album = (track.get("album") or {}).get("name", "unknown album")
            content = (
                f"{kind.replace('_', ' ').title()} #{index}: {track.get('name')} by {artists} "
                f"from {album}. Spotify popularity: {track.get('popularity', 'unknown')}."
            )
            docs.append(
                Document(
                    page_content=content,
                    metadata={
                        "user_id": self.user.id,
                        "kind": kind,
                        "spotify_id": track.get("id", ""),
                        "title": track.get("name", "Unknown track"),
                        "artists": artists,
                        "album": album,
                        "rank": index,
                    },
                )
            )
        return docs

    def _recent_docs(self, items: list[dict[str, Any]]) -> list[Document]:
        docs: list[Document] = []
        for item in items:
            track = item.get("track") or {}
            played_at = item.get("played_at", "")
            artists = ", ".join(artist.get("name", "") for artist in track.get("artists", []))
            docs.append(
                Document(
                    page_content=f"Recently played: {track.get('name')} by {artists} at {played_at}.",
                    metadata={
                        "user_id": self.user.id,
                        "kind": "recent_track",
                        "spotify_id": track.get("id", ""),
                        "title": track.get("name", "Unknown track"),
                        "artists": artists,
                        "played_at": played_at,
                    },
                )
            )
        return docs

    def _playlist_docs(self, playlists: list[dict[str, Any]]) -> list[Document]:
        docs: list[Document] = []
        for playlist in playlists:
            track_total = (playlist.get("tracks") or {}).get("total", 0)
            content = (
                f"Playlist: {playlist.get('name')} with {track_total} tracks. "
                f"Description: {playlist.get('description') or 'No description'}."
            )
            docs.append(
                Document(
                    page_content=content,
                    metadata={
                        "user_id": self.user.id,
                        "kind": "playlist",
                        "spotify_id": playlist.get("id", ""),
                        "title": playlist.get("name", "Unknown playlist"),
                        "track_total": track_total,
                    },
                )
            )
        return docs

    def _saved_docs(self, items: list[dict[str, Any]]) -> list[Document]:
        return self._track_docs([item.get("track") or {} for item in items], "saved_track")

    def _document_count(self) -> int:
        try:
            return int(self.vectorstore._collection.count())  # type: ignore[attr-defined]
        except Exception:
            return 0

    def _format_history(self, history: list[ChatMessage]) -> str:
        return "\n".join(f"{item.role}: {item.content}" for item in history[-8:])
