from fastapi import APIRouter

from app.api.v1.endpoints import auth, avatar, brands, checkout, favorites, orders, products, stock_alerts, tryon, tryon_selections, users, waitlist

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(avatar.router, prefix="/avatar", tags=["avatar"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
api_router.include_router(tryon.router, prefix="/tryon", tags=["tryon"])
api_router.include_router(tryon_selections.router, prefix="/tryon/selections", tags=["tryon-selections"])
api_router.include_router(stock_alerts.router, prefix="/stock-alerts", tags=["stock-alerts"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])
api_router.include_router(waitlist.router, prefix="/waitlist", tags=["waitlist"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
