#!/usr/bin/env python3
"""
Test script to verify backend setup and Supabase connection.
Run this after setting up your environment variables.
"""

import os
import sys
from dotenv import load_dotenv

def test_environment():
    """Test that all required environment variables are set."""
    print("🔍 Testing environment variables...")

    load_dotenv()

    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SECRET_KEY'
    ]

    missing_vars = []

    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
        else:
            print(f"✅ {var} is set")

    if missing_vars:
        print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file and make sure all required variables are set.")
        return False

    print("\n✅ All required environment variables are set!")
    return True

def test_supabase_connection():
    """Test connection to Supabase."""
    print("\n🔗 Testing Supabase connection...")

    try:
        from supabase import create_client

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        supabase = create_client(url, key)

        # Test basic connection by trying to fetch from products table
        response = supabase.table("products").select("count").execute()

        print("✅ Successfully connected to Supabase!")
        print(f"✅ Products table is accessible")

        return True

    except ImportError:
        print("❌ Supabase library not installed. Run: uv sync")
        return False
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        print("Please check your SUPABASE_URL and SUPABASE_ANON_KEY")
        return False

def test_dependencies():
    """Test that all required dependencies are available."""
    print("\n📦 Testing dependencies...")

    required_packages = [
        'fastapi',
        'uvicorn',
        'supabase',
        'python-jose',
        'qrcode',
        'python-dotenv'
    ]

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Please run: uv sync")
        return False

    print("\n✅ All required dependencies are installed!")
    return True

def main():
    """Run all tests."""
    print("🏗️  Testing Warehouse Management Backend Setup")
    print("=" * 50)

    all_tests_passed = True

    # Test environment variables
    if not test_environment():
        all_tests_passed = False

    # Test dependencies
    if not test_dependencies():
        all_tests_passed = False

    # Test Supabase connection
    if not test_supabase_connection():
        all_tests_passed = False

    print("\n" + "=" * 50)

    if all_tests_passed:
        print("🎉 All tests passed! Your backend setup is ready.")
        print("\nNext steps:")
        print("1. Start the backend server: uv run uvicorn main:app --reload")
        print("2. Test the API at: http://localhost:8000/docs")
        print("3. Set up the frontend in the ../frontend directory")
    else:
        print("❌ Some tests failed. Please fix the issues above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()