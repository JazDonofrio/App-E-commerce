"""Backend API tests for Under Street ecommerce."""
import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://urban-wear-hub-5.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Backend .env Mongo access for seeding a test session
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Read from backend .env if env vars not set
if 'MONGO_URL' not in os.environ:
    try:
        with open('/app/backend/.env') as f:
            for line in f:
                line = line.strip()
                if line.startswith('MONGO_URL='):
                    MONGO_URL = line.split('=', 1)[1].strip('"').strip("'")
                elif line.startswith('DB_NAME='):
                    DB_NAME = line.split('=', 1)[1].strip('"').strip("'")
    except Exception:
        pass


@pytest.fixture(scope="session")
def mongo_db():
    cl = MongoClient(MONGO_URL)
    return cl[DB_NAME]


@pytest.fixture(scope="session")
def auth_token(mongo_db):
    user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    token = f"test_session_{uuid.uuid4().hex}"
    mongo_db.users.insert_one({
        "user_id": user_id,
        "email": f"TEST_{user_id}@example.com",
        "name": "Admin Tester",
        "picture": "https://via.placeholder.com/150",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    mongo_db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield {"token": token, "user_id": user_id}
    mongo_db.users.delete_one({"user_id": user_id})
    mongo_db.user_sessions.delete_one({"session_token": token})
    mongo_db.orders.delete_many({"user_id": user_id})


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token['token']}"}


# ---------- Root ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Products ----------
class TestProducts:
    def test_list_products_has_12(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert len(products) >= 12
        p = products[0]
        for k in ("id", "name", "price", "category", "images", "sizes"):
            assert k in p

    def test_filter_category_hoodies(self):
        r = requests.get(f"{API}/products", params={"category": "hoodies"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(p["category"] == "hoodies" for p in data)

    def test_sort_price_asc(self):
        r = requests.get(f"{API}/products", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_sort_price_desc(self):
        r = requests.get(f"{API}/products", params={"sort": "price_desc"})
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_get_product_by_id(self):
        pid = requests.get(f"{API}/products").json()[0]["id"]
        r = requests.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_get_product_not_found(self):
        r = requests.get(f"{API}/products/nonexistent_xyz")
        assert r.status_code == 404


# ---------- Orders ----------
def _make_order_payload(price=10000, qty=1):
    pid = requests.get(f"{API}/products").json()[0]["id"]
    return {
        "items": [{
            "product_id": pid,
            "name": "Test Item",
            "price": price,
            "image": "https://x.com/i.jpg",
            "size": "M",
            "quantity": qty,
        }],
        "shipping": {
            "full_name": "TEST User", "email": "t@t.com", "phone": "111",
            "address": "Addr 1", "city": "BA", "province": "CABA", "zip_code": "1000",
        },
        "payment_method": "mercadopago",
    }


class TestOrders:
    def test_create_order_shipping_charged(self):
        # subtotal < 50000 -> shipping 4500
        r = requests.post(f"{API}/orders", json=_make_order_payload(price=10000, qty=1))
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["status"] == "pending"
        assert o["subtotal"] == 10000
        assert o["shipping_cost"] == 4500
        assert o["total"] == 14500

    def test_create_order_free_shipping(self):
        r = requests.post(f"{API}/orders", json=_make_order_payload(price=60000, qty=1))
        assert r.status_code == 200
        o = r.json()
        assert o["shipping_cost"] == 0
        assert o["total"] == 60000

    def test_mock_pay_success_then_fail(self):
        r = requests.post(f"{API}/orders", json=_make_order_payload())
        oid = r.json()["id"]

        r2 = requests.post(f"{API}/orders/{oid}/mock-pay")
        assert r2.status_code == 200
        body = r2.json()
        assert body["status"] == "paid"
        assert body["payment_id"].startswith("mp_")

        # Verify persisted
        r3 = requests.get(f"{API}/orders/{oid}")
        assert r3.status_code == 200
        assert r3.json()["status"] == "paid"

        # Second pay should fail
        r4 = requests.post(f"{API}/orders/{oid}/mock-pay")
        assert r4.status_code == 400


# ---------- Auth ----------
class TestAuth:
    def test_me_401_no_auth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401

    def test_me_with_bearer(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_my_orders_401(self):
        assert requests.get(f"{API}/my/orders").status_code == 401

    def test_my_orders_authed_scoped(self, auth_headers, auth_token):
        # create order with auth -> should be scoped to user
        r = requests.post(f"{API}/orders", json=_make_order_payload(), headers=auth_headers)
        oid = r.json()["id"]
        r2 = requests.get(f"{API}/my/orders", headers=auth_headers)
        assert r2.status_code == 200
        ids = [o["id"] for o in r2.json()]
        assert oid in ids
        # All belong to this user
        assert all(o["user_id"] == auth_token["user_id"] for o in r2.json())


# ---------- Admin ----------
class TestAdmin:
    def test_admin_requires_auth(self):
        assert requests.get(f"{API}/admin/orders").status_code == 401
        assert requests.get(f"{API}/admin/stats").status_code == 401
        assert requests.patch(f"{API}/admin/orders/x/status", json={"status": "paid"}).status_code == 401

    def test_admin_stats(self, auth_headers):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        for k in ("total_orders", "pending", "paid", "shipped", "revenue"):
            assert k in data

    def test_admin_orders_list(self, auth_headers):
        r = requests.get(f"{API}/admin/orders", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_update_status(self, auth_headers):
        r = requests.post(f"{API}/orders", json=_make_order_payload())
        oid = r.json()["id"]
        r2 = requests.patch(
            f"{API}/admin/orders/{oid}/status",
            json={"status": "shipped"},
            headers=auth_headers,
        )
        assert r2.status_code == 200
        assert r2.json()["status"] == "shipped"
        assert requests.get(f"{API}/orders/{oid}").json()["status"] == "shipped"

    def test_admin_update_status_invalid(self, auth_headers):
        r = requests.patch(
            f"{API}/admin/orders/xxx/status",
            json={"status": "invalid"},
            headers=auth_headers,
        )
        assert r.status_code == 400
