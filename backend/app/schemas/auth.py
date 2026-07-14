from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    spotify_id: str
    email: str | None
    display_name: str | None
    profile_image_url: str | None
    country: str | None
    product: str | None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class AuthStatus(BaseModel):
    authenticated: bool
    user: UserProfile | None = None
