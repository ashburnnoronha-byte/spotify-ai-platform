from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.auth.token_manager import TokenRefreshError
from app.database.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, IndexResponse
from app.services.chat_service import ChatService, ChatServiceUnavailable
from app.utils.exceptions import SpotifyAPIError

router = APIRouter(prefix="/chat", tags=["chat"])


def _service(db: AsyncSession, user: User) -> ChatService:
    try:
        return ChatService(db, user)
    except ChatServiceUnavailable as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from e


@router.post("/index", response_model=IndexResponse)
async def index_spotify_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IndexResponse:
    service = _service(db, current_user)
    try:
        return await service.index_spotify_data()
    except TokenRefreshError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e
    except SpotifyAPIError as e:
        if e.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Spotify rate limit reached while indexing. Wait a moment and try again.",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Spotify API error while indexing: {e.detail}",
        ) from e


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    service = _service(db, current_user)
    try:
        return await service.answer(
            payload.message,
            history=payload.history,
            rebuild_index=payload.rebuild_index,
        )
    except TokenRefreshError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e
    except SpotifyAPIError as e:
        if e.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Spotify rate limit reached while preparing chat context. Wait and try again.",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Spotify API error while preparing chat context: {e.detail}",
        ) from e
