# Deployment Guide

## How It Works

The application now has **automatic API URL detection** - no hardcoded URLs needed!

### Client Side
The client (`client/src/config.ts`) automatically detects the correct API URL based on:
- **Localhost**: Uses `http://localhost:5000`
- **Network IP**: Uses `http://<your-ip>:5000`
- **Production**: Uses the same hostname with port 5000

### Server Side
The server (`server/index.js`) now:
- Serves the built client files from `client/dist`
- Handles all API routes under `/api` and `/auth`
- Serves the React app for all other routes (SPA support)
- Uses centralized configuration from `server/config/config.js`

## Development

```bash
# Terminal 1 - Run server
cd server
npm run dev

# Terminal 2 - Run client
cd client
npm run dev
```

## Production Deployment

### Option 1: Build and Run Together
```bash
# From server directory
npm run build:full
```

This will:
1. Build the client app (`cd ../client && npm run build`)
2. Start the server which serves the built client

### Option 2: Manual Build
```bash
# Build client
cd client
npm run build

# Start server (which serves the built client)
cd ../server
npm start
```

### Option 3: Separate Build
```bash
# Build client only
cd server
npm run build

# Then start server
npm start
```

## Accessing the Application

After running in production mode:
- **Local**: `http://localhost:5000`
- **Network**: `http://<your-network-ip>:5000` (e.g., `http://172.20.10.2:5000`)

The server serves both the API and the React app on the same port (5000).

## Environment Variables

### Server (.env)
```env
PORT=5000
NODE_ENV=production
DB_URL=mongodb://localhost:27017/quicktap
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Client (.env)
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

**Note**: Client automatically detects API URL - no need to set VITE_API_URL!

## How API Detection Works

### Client Config (`client/src/config.ts`)
```typescript
getApiUrl: () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Automatically uses current hostname with port 5000
  return `http://${hostname}:5000`;
}
```

### Usage in Components
```typescript
import { API_URL } from '@/api';

// Automatically uses correct URL based on environment
fetch(`${API_URL}/api/foods`)
```

## Benefits

✅ **No hardcoded URLs** - works on any network
✅ **Single deployment** - one server serves both frontend and backend
✅ **Automatic detection** - no manual configuration needed
✅ **Network flexible** - works on localhost, LAN, or production
✅ **Easy testing** - access from any device on your network

## Troubleshooting

### Client can't connect to server
1. Check server is running on port 5000
2. Check firewall allows port 5000
3. Verify network IP address in server logs

### API requests fail
1. Check browser console for the detected API_URL
2. Verify server is accessible at that URL
3. Check CORS configuration in `server/config/config.js`

### Production build not working
1. Ensure `client/dist` folder exists after build
2. Check server logs for any file serving errors
3. Verify `NODE_ENV=production` in server .env
