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
import json
from jose import JWTError, jwt

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

# Supabase client with service key for admin operations
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
)

security = HTTPBearer()

# Pydantic models
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

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
    try:
        token = credentials.credentials

        # Verify the JWT token with Supabase
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserInfo(id=response.user.id, email=response.user.email)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/")
async def root():
    return {"message": "Warehouse Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Product endpoints
@app.get("/products")
async def get_products(current_user: UserInfo = Depends(get_current_user)):
    try:
        response = supabase.table("products").select("*").order("name").execute()
        return {"products": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/{product_id}")
async def get_product(product_id: str, current_user: UserInfo = Depends(get_current_user)):
    try:
        response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": response.data}
    except Exception as e:
        if "PGRST116" in str(e):  # Supabase error for no rows found
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/products")
async def create_product(product: Product, current_user: UserInfo = Depends(get_current_user)):
    try:
        response = supabase.table("products").insert(product.dict()).execute()
        return {"message": "Product created successfully", "product": response.data[0]}
    except Exception as e:
        if "duplicate key value" in str(e):
            raise HTTPException(status_code=400, detail="SKU already exists")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserInfo = Depends(get_current_user)
):
    try:
        # Only update fields that are provided
        update_data = {k: v for k, v in product_update.dict().items() if v is not None}

        response = supabase.table("products").update(update_data).eq("id", product_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"message": "Product updated successfully", "product": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: UserInfo = Depends(get_current_user)):
    try:
        response = supabase.table("products").delete().eq("id", product_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Stock management endpoints
@app.post("/update-stock")
async def update_stock(stock_update: StockUpdate, current_user: UserInfo = Depends(get_current_user)):
    try:
        # Insert transaction record (this will automatically update product stock via trigger)
        transaction_data = {
            "product_id": stock_update.product_id,
            "user_id": current_user.id,
            "change_amount": stock_update.change_amount,
            "notes": stock_update.notes
        }

        response = supabase.table("inventory_transactions").insert(transaction_data).execute()

        # Get updated product info
        product_response = supabase.table("products").select("*").eq("id", stock_update.product_id).single().execute()

        return {
            "message": "Stock updated successfully",
            "transaction": response.data[0],
            "updated_product": product_response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
async def get_transactions(
    limit: int = 50,
    product_id: Optional[str] = None,
    current_user: UserInfo = Depends(get_current_user)
):
    try:
        query = supabase.table("transaction_history").select("*")

        if product_id:
            # We'll need to filter by product_id in the view
            query = query.eq("product_id", product_id)

        response = query.limit(limit).execute()
        return {"transactions": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/low-stock")
async def get_low_stock_products(current_user: UserInfo = Depends(get_current_user)):
    try:
        response = supabase.table("low_stock_products").select("*").execute()
        return {"low_stock_products": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# QR Code generation
@app.get("/products/{product_id}/qr-code")
async def generate_qr_code(product_id: str, current_user: UserInfo = Depends(get_current_user)):
    try:
        # Verify product exists
        product_response = supabase.table("products").select("*").eq("id", product_id).single().execute()
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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)