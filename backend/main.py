from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Under Street API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Models ----------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"
    created_at: datetime


class Product(BaseModel):
    id: str
    name: str
    category: str  # hoodies, tees, pants, caps, jackets
    price: float
    description: str
    image: str
    images: List[str] = []
    sizes: List[str] = []
    stock: int = 20
    featured: bool = False
    created_at: datetime


class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    image: str
    size: str
    quantity: int


class ShippingInfo(BaseModel):
    full_name: str
    email: str
    phone: str
    address: str
    city: str
    province: str
    zip_code: str
    notes: Optional[str] = ""


class CreateOrderRequest(BaseModel):
    items: List[CartItem]
    shipping: ShippingInfo
    payment_method: Literal["mercadopago", "cash_on_delivery"] = "mercadopago"


class Order(BaseModel):
    id: str
    user_id: Optional[str] = None
    items: List[CartItem]
    shipping: ShippingInfo
    payment_method: str
    subtotal: float
    shipping_cost: float
    total: float
    status: str  # pending, paid, shipped, cancelled
    payment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------- Auth helpers ----------
async def get_current_user_from_request(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)


async def get_current_user(request: Request) -> User:
    return await get_current_user_from_request(request)


async def get_optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user_from_request(request)
    except HTTPException:
        return None


# ---------- Auth routes ----------
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=10.0) as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()

    email = data["email"]
    name = data["name"]
    picture = data.get("picture", "")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "admin",  # single-owner store: all logged-in users are admins
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )

    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": "admin",
    }


@api_router.get("/auth/me", response_model=User)
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------- Products ----------
@api_router.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = None,
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if featured is not None:
        query["featured"] = featured

    cursor = db.products.find(query, {"_id": 0})
    products = await cursor.to_list(200)

    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])

    if sort == "price_asc":
        products.sort(key=lambda x: x["price"])
    elif sort == "price_desc":
        products.sort(key=lambda x: -x["price"])
    elif sort == "newest":
        products.sort(key=lambda x: x["created_at"], reverse=True)

    return products


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(p.get("created_at"), str):
        p["created_at"] = datetime.fromisoformat(p["created_at"])
    return p


# ---------- Orders ----------
@api_router.post("/orders", response_model=Order)
async def create_order(req: CreateOrderRequest, request: Request):
    user = await get_optional_user(request)

    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = sum(i.price * i.quantity for i in req.items)
    shipping_cost = 0 if subtotal >= 50000 else 4500
    total = subtotal + shipping_cost

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    order_doc = {
        "id": order_id,
        "user_id": user.user_id if user else None,
        "items": [i.model_dump() for i in req.items],
        "shipping": req.shipping.model_dump(),
        "payment_method": req.payment_method,
        "subtotal": subtotal,
        "shipping_cost": shipping_cost,
        "total": total,
        "status": "pending",
        "payment_id": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.orders.insert_one(order_doc)

    order_doc["created_at"] = now
    order_doc["updated_at"] = now
    return Order(**order_doc)


@api_router.post("/orders/{order_id}/mock-pay")
async def mock_pay(order_id: str):
    """Simulates MercadoPago payment success for an order."""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="Order is not pending")
    payment_id = f"mp_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "paid", "payment_id": payment_id, "updated_at": now}},
    )
    return {"ok": True, "payment_id": payment_id, "status": "paid"}


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("updated_at"), str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return order


@api_router.get("/my/orders", response_model=List[Order])
async def my_orders(user: User = Depends(get_current_user)):
    cursor = db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1)
    orders = await cursor.to_list(100)
    for o in orders:
        if isinstance(o.get("created_at"), str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
        if isinstance(o.get("updated_at"), str):
            o["updated_at"] = datetime.fromisoformat(o["updated_at"])
    return orders


# ---------- Admin ----------
@api_router.get("/admin/orders", response_model=List[Order])
async def admin_orders(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    query = {}
    if status and status != "all":
        query["status"] = status
    cursor = db.orders.find(query, {"_id": 0}).sort("created_at", -1)
    orders = await cursor.to_list(500)
    for o in orders:
        if isinstance(o.get("created_at"), str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
        if isinstance(o.get("updated_at"), str):
            o["updated_at"] = datetime.fromisoformat(o["updated_at"])
    return orders


@api_router.get("/admin/stats")
async def admin_stats(user: User = Depends(get_current_user)):
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    paid = await db.orders.count_documents({"status": "paid"})
    shipped = await db.orders.count_documents({"status": "shipped"})

    pipeline = [
        {"$match": {"status": {"$in": ["paid", "shipped"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    revenue = rev[0]["total"] if rev else 0

    return {
        "total_orders": total_orders,
        "pending": pending,
        "paid": paid,
        "shipped": shipped,
        "revenue": revenue,
    }


@api_router.patch("/admin/orders/{order_id}/status")
async def admin_update_status(
    order_id: str,
    body: dict,
    user: User = Depends(get_current_user),
):
    new_status = body.get("status")
    if new_status not in ["pending", "paid", "shipped", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    now = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one(
        {"id": order_id}, {"$set": {"status": new_status, "updated_at": now}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True, "status": new_status}


# ---------- Seed ----------
SEED_PRODUCTS = [
    # Hoodies
    {
        "name": "Void Black Hoodie",
        "category": "hoodies",
        "price": 52000,
        "description": "Hoodie oversize 100% algodón peinado 400gsm. Cortes asimétricos y bolsillo kangaroo.",
        "image": "https://images.unsplash.com/photo-1647540573277-4954a0c302c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxibGFjayUyMGhvb2RpZSUyMGZhc2hpb258ZW58MHx8fHwxNzc2OTkzNjU2fDA&ixlib=rb-4.1.0&q=85",
        "sizes": ["S", "M", "L", "XL"],
        "stock": 30,
        "featured": True,
    },
    {
        "name": "Acid Rain Hoodie",
        "category": "hoodies",
        "price": 58000,
        "description": "Hoodie heavyweight con bordado acid yellow en el pecho. Edición limitada.",
        "image": "https://images.unsplash.com/photo-1647540573277-4954a0c302c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxibGFjayUyMGhvb2RpZSUyMGZhc2hpb258ZW58MHx8fHwxNzc2OTkzNjU2fDA&ixlib=rb-4.1.0&q=85",
        "sizes": ["M", "L", "XL"],
        "stock": 15,
        "featured": True,
    },
    {
        "name": "Shadow Zip Hoodie",
        "category": "hoodies",
        "price": 64000,
        "description": "Hoodie con cierre full-zip, corte boxy y detalles reflectivos en manga.",
        "image": "https://images.unsplash.com/photo-1647540573277-4954a0c302c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxibGFjayUyMGhvb2RpZSUyMGZhc2hpb258ZW58MHx8fHwxNzc2OTkzNjU2fDA&ixlib=rb-4.1.0&q=85",
        "sizes": ["S", "M", "L"],
        "stock": 20,
    },
    # Tees
    {
        "name": "Neon Graffiti Tee",
        "category": "tees",
        "price": 22000,
        "description": "Remera oversize con estampa serigrafiada a mano. Algodón 220gsm.",
        "image": "https://images.unsplash.com/photo-1767897213817-8664d9b82393?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsJTIwbmlnaHR8ZW58MHx8fHwxNzc2OTkzNjQzfDA&ixlib=rb-4.1.0&q=85",
        "sizes": ["S", "M", "L", "XL"],
        "stock": 50,
        "featured": True,
    },
    {
        "name": "Void Logo Tee",
        "category": "tees",
        "price": 18000,
        "description": "Remera negra básica con logo Under Street bordado en el pecho.",
        "image": "https://images.unsplash.com/photo-1767897213817-8664d9b82393?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsJTIwbmlnaHR8ZW58MHx8fHwxNzc2OTkzNjQzfDA&ixlib=rb-4.1.0&q=85",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "stock": 40,
    },
    # Pants
    {
        "name": "Heavy Cargo Pants",
        "category": "pants",
        "price": 72000,
        "description": "Cargo pants con múltiples bolsillos, ajuste wide-leg y cadena incluida.",
        "image": "https://images.pexels.com/photos/35043249/pexels-photo-35043249.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "sizes": ["28", "30", "32", "34", "36"],
        "stock": 25,
        "featured": True,
    },
    {
        "name": "Techwear Joggers",
        "category": "pants",
        "price": 55000,
        "description": "Joggers técnicos resistentes al agua con tejido ripstop.",
        "image": "https://images.pexels.com/photos/35043249/pexels-photo-35043249.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "sizes": ["S", "M", "L", "XL"],
        "stock": 18,
    },
    # Caps
    {
        "name": "Street Dad Cap",
        "category": "caps",
        "price": 19000,
        "description": "Gorra dad-hat negra con logo bordado en relieve. Cierre metálico.",
        "image": "https://images.unsplash.com/photo-1558015382-8feeaeb602f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxzdHJlZXR3ZWFyJTIwY2Fwc3xlbnwwfHx8fDE3NzY5OTM2NTZ8MA&ixlib=rb-4.1.0&q=85",
        "sizes": ["UNICO"],
        "stock": 60,
        "featured": True,
    },
    {
        "name": "Trucker Neon Cap",
        "category": "caps",
        "price": 21000,
        "description": "Gorra trucker con malla trasera y parche acid yellow.",
        "image": "https://images.unsplash.com/photo-1558015382-8feeaeb602f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxzdHJlZXR3ZWFyJTIwY2Fwc3xlbnwwfHx8fDE3NzY5OTM2NTZ8MA&ixlib=rb-4.1.0&q=85",
        "sizes": ["UNICO"],
        "stock": 45,
    },
    # Jackets
    {
        "name": "Riot Bomber Jacket",
        "category": "jackets",
        "price": 98000,
        "description": "Campera bomber con interior acolchado y bordados en mangas.",
        "image": "https://images.pexels.com/photos/15213190/pexels-photo-15213190.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "sizes": ["S", "M", "L", "XL"],
        "stock": 12,
        "featured": True,
    },
    {
        "name": "Punk Denim Jacket",
        "category": "jackets",
        "price": 85000,
        "description": "Campera denim desgastada con parches y tachas. Cada pieza es única.",
        "image": "https://images.pexels.com/photos/15213190/pexels-photo-15213190.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "sizes": ["S", "M", "L"],
        "stock": 8,
    },
    {
        "name": "Graffiti Varsity Jacket",
        "category": "jackets",
        "price": 110000,
        "description": "Varsity jacket con parches hechos a mano y forro satinado.",
        "image": "https://images.pexels.com/photos/15213190/pexels-photo-15213190.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "sizes": ["M", "L", "XL"],
        "stock": 10,
    },
]


@app.on_event("startup")
async def seed_products():
    count = await db.products.count_documents({})
    if count > 0:
        logger.info(f"Products already seeded: {count}")
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for p in SEED_PRODUCTS:
        docs.append({
            "id": f"prod_{uuid.uuid4().hex[:10]}",
            "images": [p["image"]],
            "featured": p.get("featured", False),
            "created_at": now,
            **p,
        })
    await db.products.insert_many(docs)
    logger.info(f"Seeded {len(docs)} products")


@api_router.get("/")
async def root():
    return {"message": "Under Street API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
