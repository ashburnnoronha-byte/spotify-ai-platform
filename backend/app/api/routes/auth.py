from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.spotify_oauth import (
    build_authorization_url,
    exchange_code_for_tokens,
    fetch_spotify_profile,
    generate_oauth_state,
    validate_oauth_state,
)
from app.auth.token_manager import store_spotify_tokens
from app.config import get_settings
from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user, security
from app.auth.token_manager import get_user_by_id
from app.schemas.auth import AuthStatus, TokenResponse, UserProfile
from app.utils.security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.get("/login")
async def login() -> RedirectResponse:
    state = await generate_oauth_state()
    url = build_authorization_url(state)
    return RedirectResponse(url=url)


@router.get("/callback")
async def callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    if not await validate_oauth_state(state):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    try:
        token_data = await exchange_code_for_tokens(code)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange authorization code: {e.response.text}",
        ) from e

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)

    try:
        profile = await fetch_spotify_profile(access_token)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            params = urlencode({"error": "spotify_rate_limited"})
            return RedirectResponse(url=f"{settings.frontend_url}/login?{params}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch Spotify profile",
        ) from e

    spotify_id = profile["id"]
    result = await db.execute(select(User).where(User.spotify_id == spotify_id))
    user = result.scalar_one_or_none()

    images = profile.get("images", [])
    profile_image = images[0]["url"] if images else None

    if user:
        user.email = profile.get("email")
        user.display_name = profile.get("display_name")
        user.profile_image_url = profile_image
        user.country = profile.get("country")
        user.product = profile.get("product")
    else:
        user = User(
            spotify_id=spotify_id,
            email=profile.get("email"),
            display_name=profile.get("display_name"),
            profile_image_url=profile_image,
            country=profile.get("country"),
            product=profile.get("product"),
        )
        db.add(user)
        await db.flush()

    await store_spotify_tokens(user, access_token, refresh_token, expires_in)
    await db.flush()

    jwt_token = create_access_token(str(user.id))
    params = urlencode({"token": jwt_token})
    redirect_url = f"{settings.frontend_url}/auth/callback?{params}"
    return RedirectResponse(url=redirect_url)


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/status", response_model=AuthStatus)
async def auth_status(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthStatus:
    if not credentials:
        return AuthStatus(authenticated=False)

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return AuthStatus(authenticated=False)

    user = await get_user_by_id(db, int(payload["sub"]))
    if not user:
        return AuthStatus(authenticated=False)

    return AuthStatus(authenticated=True, user=UserProfile.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_session(current_user: User = Depends(get_current_user)) -> TokenResponse:
    jwt_token = create_access_token(str(current_user.id))
    return TokenResponse(
        access_token=jwt_token,
        user=UserProfile.model_validate(current_user),
    )


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logged out successfully. Clear your client-side token."}
