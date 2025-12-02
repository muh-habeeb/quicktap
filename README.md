# QuickTap - Quick Start Guide

## 🚀 Automatic API Connection

**No hardcoded URLs needed!** The app automatically detects the correct API URL based on your environment.

## Development Mode

### Quick Start (Both Server & Client)
```bash
npm install
npm run dev
```

### Or Run Separately
```bash
# Terminal 1 - Server
cd server
npm install
npm run dev

# Terminal 2 - Client  
cd client
npm install
npm run dev
```

**Access:**
- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

## Production Mode

### Build and Run
```bash
# Install root dependencies (optional, for concurrently)
npm install

# Build client
npm run build

# Start server (serves built client + API)
npm start
```

**Access:** `http://localhost:5000` (single URL for everything!)

## Network Access

The app automatically works on your local network:

1. Start the server (dev or production)
2. Check server logs for your network IP (e.g., `http://172.20.10.2:5000`)
3. Access from any device on the same network
4. **No configuration needed** - it just works!

## First Time Setup

### 1. Environment Variables

**Server** (`server/.env`):
```env
PORT=5000
DB_URL=mongodb://localhost:27017/quicktap
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**Client** (`client/.env`):
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_RAZORPAY_KEY_ID=your-razorpay-key
```

### 2. Database

Make sure MongoDB is running:
```bash
mongod
```

### 3. Create Admin User

```bash
cd server
npm run setup-admin
```

Follow prompts to create admin account.

## How It Works

### Client Auto-Detection
The client (`client/src/config.ts`) automatically detects:
- ✅ Localhost → `http://localhost:5000`
- ✅ Network IP → `http://<your-ip>:5000`
- ✅ Production → Same hostname with port 5000

### All API Calls Use Auto-Detection
```typescript
import { API_URL } from '@/api';

// Automatically uses correct URL
fetch(`${API_URL}/api/foods`)
```

### Server Serves Everything
In production, server serves:
- ✅ React app (from `client/dist`)
- ✅ API routes (`/api/*`, `/auth/*`)
- ✅ All on port 5000

## Available Scripts

### Root Directory
- `npm run dev` - Run both server and client
- `npm run build` - Build client for production
- `npm start` - Start production server
- `npm run build:start` - Build and start production

### Server
- `npm run dev` - Development with nodemon
- `npm start` - Production mode
- `npm run setup-admin` - Create admin user
- `npm run build` - Build client from server directory

### Client
- `npm run dev` - Development with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Features

- 🍕 Food Ordering System
- 💺 Seat Booking System
- 💳 Razorpay Payment Integration
- 🔐 Google OAuth Authentication
- 👥 Community Posts & Comments
- 📢 Admin Dashboard
- 🖼️ Cloudinary Image Upload
- 🤖 AI-Powered Recommendations

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary
- Razorpay

## Support

For issues or questions, check the code comments or [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting tips.
