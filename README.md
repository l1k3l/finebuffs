# Warehouse Management System

A lightweight warehouse management system for tracking inventory with QR code scanning capabilities.

## Features

- Product inventory tracking with current stock counts
- QR/barcode generation and mobile scanning
- Add/remove stock with quantity selection
- Full transaction history and audit trail
- User authentication and activity tracking
- Mobile-optimized interface for warehouse use
- Low stock alerts and reorder level management

## Tech Stack

- **Frontend**: React with React Router
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **QR Codes**: Python qrcode library
- **QR Scanning**: html5-qrcode library

## Project Structure

```
finebuffs/
├── backend/          # Python FastAPI backend
│   ├── main.py       # FastAPI application
│   ├── pyproject.toml # Python dependencies
│   └── .env.example  # Environment template
├── frontend/         # React frontend
│   ├── src/          # React components and pages
│   ├── package.json  # Node.js dependencies
│   └── .env.example  # Environment template
├── supabase/         # Database schema and migrations
└── render.yaml       # Deployment configuration
```

## Setup Instructions

### Prerequisites
- Python 3.9+ with [uv](https://docs.astral.sh/uv/) package manager
- Node.js 16+ with npm
- Supabase account

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
uv sync
uv run uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase and API URLs
npm install
npm start
```

### Environment Variables

**Backend (.env):**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Development

1. Start the backend server on http://localhost:8000
2. Start the frontend development server on http://localhost:3000
3. Access the application at http://localhost:3000

## Key Features Explained

### QR Code Functionality
- Each product automatically generates a unique QR code
- QR codes link directly to the product detail page
- Mobile-optimized scanner for quick inventory updates
- Downloadable QR codes for physical labeling

### Inventory Management
- Real-time stock tracking with transaction history
- Configurable reorder levels with low stock alerts
- Bulk stock updates with optional notes
- User activity tracking for audit trails

## API Endpoints

The FastAPI backend provides RESTful endpoints:
- `GET /products` - List all products
- `POST /products` - Create new product
- `GET /products/{id}` - Get product details
- `POST /update-stock` - Update product inventory
- `GET /transactions` - View transaction history
- `GET /products/{id}/qr-code` - Generate QR code

## Deployment

This application is configured for deployment on Render using the included `render.yaml`:

- **Backend**: Render Web Service (Python)
- **Frontend**: Render Static Site (Node.js build)
- **Database**: Supabase (PostgreSQL with real-time features)

### Production Environment Variables
Set these in your Render dashboard:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
- `ALLOWED_ORIGINS` (your frontend domain)
- `REACT_APP_*` variables for the frontend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details.