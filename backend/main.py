from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import qrcode
from io import BytesIO
import base64
from pydantic import BaseModel
from typing import Optional, List
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Warehouse Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# --- Pydantic Models ---
class Product(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    stock_count: int = 0
    reorder_level: int = 10

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    reorder_level: Optional[int] = None

class StockUpdate(BaseModel):
    product_id: str
    change_amount: int
    notes: Optional[str] = None

class UserInfo(BaseModel):
    id: str
    email: str

class AuthenticatedDeps(BaseModel):
    client: Client
    user: UserInfo
    class Config:
        arbitrary_types_allowed = True

# --- Generic Exception Handler ---
def handle_exception(e: Exception):
    logger.error(f"An unexpected error occurred: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="An internal server error occurred.")

# --- Authentication Dependency ---
async def get_authenticated_deps(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthenticatedDeps:
    """
    Creates a new Supabase client for each request, authenticated with the user's JWT.
    This ensures all operations are performed with the user's permissions, enforcing RLS.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Use the ANON_KEY. The user's JWT provides the authorization.
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        raise HTTPException(status_code=500, detail="Supabase URL/key not configured")

    authed_client = create_client(supabase_url, supabase_anon_key)
    authed_client.auth.set_session(access_token=token, refresh_token=token)

    try:
        user_response = authed_client.auth.get_user()
        if not user_response.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        
        user = UserInfo(id=user_response.user.id, email=user_response.user.email)
        return AuthenticatedDeps(client=authed_client, user=user)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

@app.get("/")
async def root():
    return {"message": "Warehouse Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Product endpoints
@app.get("/products")
async def get_products(deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        response = deps.client.table("products").select("*").order("name").execute()
        return {"products": response.data}
    except Exception as e:
        handle_exception(e)

@app.get("/products/{product_id}")
async def get_product(product_id: str, deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        response = deps.client.table("products").select("*").eq("id", product_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": response.data}
    except Exception as e:
        if "PGRST116" in str(e):  # Supabase error for no rows found
            raise HTTPException(status_code=404, detail="Product not found")
        handle_exception(e)

@app.post("/products")
async def create_product(product: Product, deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        response = deps.client.table("products").insert(product.dict()).execute()
        return {"message": "Product created successfully", "product": response.data[0]}
    except Exception as e:
        if "duplicate key value" in str(e):
            raise HTTPException(status_code=400, detail="SKU already exists")
        handle_exception(e)

@app.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    deps: AuthenticatedDeps = Depends(get_authenticated_deps)
):
    try:
        # Only update fields that are provided
        update_data = {k: v for k, v in product_update.dict().items() if v is not None}

        response = deps.client.table("products").update(update_data).eq("id", product_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"message": "Product updated successfully", "product": response.data[0]}
    except Exception as e:
        handle_exception(e)

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        response = deps.client.table("products").delete().eq("id", product_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"message": "Product deleted successfully"}
    except Exception as e:
        handle_exception(e)

# Stock management endpoints
@app.post("/update-stock")
async def update_stock(stock_update: StockUpdate, deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        # Insert transaction record (this will automatically update product stock via trigger)
        transaction_data = {
            "product_id": stock_update.product_id,
            "user_id": deps.user.id,
            "change_amount": stock_update.change_amount,
            "notes": stock_update.notes
        }

        response = deps.client.table("inventory_transactions").insert(transaction_data).execute()

        # Get updated product info
        product_response = deps.client.table("products").select("*").eq("id", stock_update.product_id).single().execute()

        return {
            "message": "Stock updated successfully",
            "transaction": response.data[0],
            "updated_product": product_response.data
        }
    except Exception as e:
        handle_exception(e)

@app.get("/transactions")
async def get_transactions(
    limit: int = 50,
    product_id: Optional[str] = None,
    deps: AuthenticatedDeps = Depends(get_authenticated_deps)
):
    try:
        query = deps.client.table("transaction_history").select("*")

        if product_id:
            # We'll need to filter by product_id in the view
            query = query.eq("product_id", product_id)

        response = query.limit(limit).execute()
        return {"transactions": response.data}
    except Exception as e:
        handle_exception(e)

@app.get("/low-stock")
async def get_low_stock_products(deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        response = deps.client.table("low_stock_products").select("*").execute()
        return {"low_stock_products": response.data}
    except Exception as e:
        handle_exception(e)

# QR Code generation
@app.get("/products/{product_id}/qr-code")
async def generate_qr_code(product_id: str, deps: AuthenticatedDeps = Depends(get_authenticated_deps)):
    try:
        # Verify product exists
        product_response = deps.client.table("products").select("*").eq("id", product_id).single().execute()
        if not product_response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Generate QR code that links to the product page
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        qr_data = f"{frontend_url}/product/{product_id}"

        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return {
            "qr_code_data": qr_data,
            "qr_code_image": f"data:image/png;base64,{img_str}",
            "product": product_response.data
        }
    except Exception as e:
        handle_exception(e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)