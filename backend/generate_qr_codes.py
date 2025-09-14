#!/usr/bin/env python3
"""
Script to generate QR code images for all products in the database.
This creates printable QR codes for warehouse shelves.
"""

import os
import qrcode
from dotenv import load_dotenv
from supabase import create_client

def setup_supabase():
    """Set up Supabase client."""
    load_dotenv()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")

    return create_client(url, key)

def generate_qr_code(data, filename):
    """Generate a QR code image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    return filename

def main():
    """Generate QR codes for all products."""
    print("📱 Generating QR codes for all products...")

    # Create QR codes directory
    os.makedirs("qr_codes", exist_ok=True)

    try:
        # Set up Supabase
        supabase = setup_supabase()

        # Get all products
        response = supabase.table("products").select("*").execute()
        products = response.data

        if not products:
            print("No products found in the database.")
            return

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        print(f"Found {len(products)} products. Generating QR codes...")

        for product in products:
            product_id = product['id']
            product_name = product['name']
            sku = product['sku']

            # Generate QR code data (URL to product page)
            qr_data = f"{frontend_url}/product/{product_id}"

            # Create filename
            safe_sku = "".join(c for c in sku if c.isalnum() or c in ("-", "_"))
            filename = f"qr_codes/{safe_sku}_{product_id[:8]}.png"

            # Generate QR code
            generate_qr_code(qr_data, filename)

            print(f"✅ Generated QR code for {product_name} (SKU: {sku}) -> {filename}")

        print(f"\n🎉 Generated {len(products)} QR codes in the 'qr_codes' directory!")
        print("\nYou can now print these QR codes and place them on your warehouse shelves.")
        print("Each QR code links directly to the product's detail page for quick stock updates.")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure your .env file is properly configured and the database contains products.")

if __name__ == "__main__":
    main()