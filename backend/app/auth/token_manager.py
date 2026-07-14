from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.spotify_oauth import refresh_spotify_tokens
from app.models.user import User
from app.utils.security import decrypt_token, encrypt_token


class TokenRefreshError(Exception):
    pass


async def store_spotify_tokens(
    user: User,
    access_token: str,
    refresh_token: str | None,
    expires_in: int,
) -> None:
    user.spotify_access_token = encrypt_token(access_token)
    if refresh_token:
        user.spotify_refresh_token = encrypt_token(refresh_token)
    user.token_expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)


async def get_valid_access_token(db: AsyncSession, user: User) -> str:
    if not user.spotify_access_token:
        raise TokenRefreshError("No Spotify access token stored")

    access_token = decrypt_token(user.spotify_access_token)
    if not access_token:
        raise TokenRefreshError("Failed to decrypt access token")

    if user.token_expires_at and user.token_expires_at > datetime.now(UTC) + timedelta(seconds=60):
        return access_token

    if not user.spotify_refresh_token:
        raise TokenRefreshError("No refresh token available")

    refresh_token = decrypt_token(user.spotify_refresh_token)
    if not refresh_token:
        raise TokenRefreshError("Failed to decrypt refresh token")

    token_data = await refresh_spotify_tokens(refresh_token)
    new_access = token_data["access_token"]
    new_refresh = token_data.get("refresh_token", refresh_token)
    expires_in = token_data.get("expires_in", 3600)

    await store_spotify_tokens(user, new_access, new_refresh, expires_in)
    await db.flush()

    return new_access


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
