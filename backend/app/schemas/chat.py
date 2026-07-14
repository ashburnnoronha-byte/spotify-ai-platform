from pydantic import BaseModel, Field


class ChatSource(BaseModel):
    title: str
    kind: str
    content: str


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    rebuild_index: bool = False


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource] = Field(default_factory=list)
    used_llm: bool
    indexed_documents: int


class IndexResponse(BaseModel):
    indexed_documents: int
    message: str
