#!/usr/bin/env python3
"""
Setup script for the warehouse management backend.
Run this to initialize the project with uv.
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stderr:
            print(e.stderr)
        sys.exit(1)

def main():
    print("🏗️  Setting up Warehouse Management Backend")

    # Check if uv is installed
    try:
        subprocess.run(["uv", "--version"], check=True, capture_output=True)
        print("✅ uv is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ uv is not installed. Please install it first:")
        print("   curl -LsSf https://astral.sh/uv/install.sh | sh")
        sys.exit(1)

    # Initialize uv project if uv.lock doesn't exist
    if not os.path.exists("uv.lock"):
        run_command("uv sync", "Installing dependencies")
    else:
        print("✅ Dependencies already installed")

    # Create .env file if it doesn't exist
    if not os.path.exists(".env"):
        print("\n📝 Creating .env file from template...")
        with open(".env.example", "r") as template:
            with open(".env", "w") as env_file:
                env_file.write(template.read())
        print("✅ .env file created. Please update it with your Supabase credentials.")
    else:
        print("✅ .env file already exists")

    print("\n🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Update .env file with your Supabase credentials")
    print("2. Run the SQL schema in your Supabase dashboard")
    print("3. Start the server with: uv run uvicorn main:app --reload")

if __name__ == "__main__":
    main()