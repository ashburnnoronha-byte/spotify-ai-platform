from fastapi import APIRouter

from app.api.routes import analytics, auth, chat, spotify

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(spotify.router)
api_router.include_router(analytics.router)
api_router.include_router(chat.router)
