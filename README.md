# 🍽️ QuickTap - Hotel Food Order Management System

<div align="center">

![QuickTap Logo](https://img.shields.io/badge/QuickTap-Food%20Ordering-teal?style=for-the-badge)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**A modern, full-stack hotel food ordering and management system with NFC/QR code functionality, real-time seat booking, and intelligent recommendations.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [API Docs](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**QuickTap** is a comprehensive hotel food ordering and management system designed to streamline the dining experience for both customers and hotel staff. The system features contactless ordering via NFC/QR codes, real-time seat booking, AI-powered food recommendations, and a complete admin dashboard for order and inventory management.

### 🎥 Demo

- **Live Demo**: [https://quicktap-m27k.onrender.com](https://quicktap-m27k.onrender.com)
- **Admin Panel**: `/admin` (after authentication)
- **Customer Portal**: `/food` (main ordering interface)

### 🌟 Why QuickTap?

- ⚡ **Contactless Ordering**: Scan QR codes at tables for instant menu access
- 🪑 **Smart Seat Management**: Real-time seat availability with automatic blocking
- 🤖 **AI Recommendations**: Personalized food suggestions based on order history
- 💳 **Secure Payments**: Integrated Razorpay payment gateway
- 📊 **Real-time Analytics**: Track orders, revenue, and customer preferences
- 🔐 **Secure Authentication**: Google OAuth 2.0 integration
- 📱 **Mobile Responsive**: Works seamlessly on all devices

---

## 🚀 Key Features

### For Customers

#### 🍔 Food Ordering
- Browse menu with categories (Meals, Appetizers, Desserts, Beverages, etc.)
- View detailed nutritional information and preparation time
- Real-time availability status
- Add to cart with quantity management
- **Intelligent Recommendations**: AI-powered suggestions based on:
  - Previous order history
  - Spending patterns
  - Category preferences
  - Frequently ordered items together

#### 🪑 Seat Booking System
- View real-time seat availability (15 seats)
- Select multiple seats
- Automatic seat blocking (30-minute reservation)
- Payment verification before confirmation
- Visual seat status indicators:
  - 🟢 Available
  - 🔴 Blocked/Occupied
  - ⏱️ Time remaining display

#### 📱 NFC/QR Code Functionality
- Scan QR codes at tables to access menu
- Instant redirection to food ordering page
- Table-specific order tracking
- Contactless experience

#### 💳 Payment Integration
- Razorpay payment gateway
- Real-time payment verification
- Order confirmation after successful payment
- Payment receipt generation
- Auto-release seats if payment fails

#### 🤖 AI Chatbot Assistant
- Get instant answers about menu items
- Dietary preference queries
- Nutritional information
- Restaurant services information
- Powered by Google Gemini AI

#### 👥 Community Features
- Share updates and posts
- Event announcements
- Comment and like functionality
- Community engagement

#### ⭐ Customer Feedback
- Direct link to Google Maps reviews
- Loyalty program (Coming Soon)
- Exclusive offers and rewards

### For Administrators

#### 📊 Admin Dashboard
- Overview of orders, payments, and bookings
- Real-time statistics
- Revenue tracking

#### 🍕 Food Management
- Add/Edit/Delete menu items
- Upload images via Cloudinary
- Set availability status
- Manage categories and pricing
- Nutritional information management

#### 📦 Order Management
- View all orders with status
- Update order status (Pending → Preparing → Ready → Delivered)
- Filter by date and status
- Order details with customer information

#### 💰 Payment Tracking
- View all Razorpay transactions
- Payment verification status
- Revenue reports
- Transaction details with order mapping

#### 🪑 Seat Management
- View all seat bookings
- Booking statistics
- Expire old bookings manually
- Seat utilization analytics
- Auto-blocking system monitoring

#### 📢 Content Moderation
- Review community posts
- Approve/Reject content
- Manage announcements
- User engagement tracking

#### 👤 Admin User Management
- Secure admin authentication
- Role-based access control
- Admin setup script

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                    │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │   Pages    │  │ Components │  │   Services/API      │  │
│  │            │  │            │  │                     │  │
│  │ • Home     │  │ • Header   │  │ • Auth Service      │  │
│  │ • Food     │  │ • Footer   │  │ • Cart Service      │  │
│  │ • Admin    │  │ • Cards    │  │ • Seat Service      │  │
│  │ • Chatbot  │  │ • Dialogs  │  │ • Payment Service   │  │
│  │ • Community│  │ • Buttons  │  │ • Feedback Service  │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS + WebSocket
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                 Server (Node.js + Express)                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │   Routes   │  │Controllers │  │     Middleware      │  │
│  │            │  │            │  │                     │  │
│  │ • Auth     │  │ • Food     │  │ • JWT Auth          │  │
│  │ • Food     │  │ • Order    │  │ • Admin Auth        │  │
│  │ • Order    │  │ • Payment  │  │ • Error Handler     │  │
│  │ • Seat     │  │ • Seat     │  │ • CORS              │  │
│  │ • Payment  │  │ • Feedback │  │                     │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (MongoDB)                        │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │   Models   │  │Collections │  │      Indexes        │  │
│  │            │  │            │  │                     │  │
│  │ • User     │  │ • users    │  │ • userId + email    │  │
│  │ • Food     │  │ • foods    │  │ • category          │  │
│  │ • Order    │  │ • orders   │  │ • status            │  │
│  │ • Seat     │  │ • seats    │  │ • seatNumber        │  │
│  │ • Payment  │  │ • payments │  │ • razorpayOrderId   │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

External Services:
├─ Google OAuth 2.0 (Authentication)
├─ Razorpay (Payment Gateway)
├─ Cloudinary (Image Storage)
├─ Google Gemini AI (Chatbot)
└─ Google Maps (Reviews)
```

### Data Flow

1. **Customer Journey**:
   ```
   Scan QR Code → Login (Google OAuth) → Browse Menu → 
   Add to Cart → Select Seats → Payment (Razorpay) → 
   Order Confirmation → Order Tracking
   ```

2. **Admin Journey**:
   ```
   Admin Login → Dashboard → Manage Food/Orders/Seats → 
   Update Status → View Analytics → Content Moderation
   ```

3. **Seat Booking Flow**:
   ```
   Select Seats → Create Temp Reservation (30 min) → 
   Payment Verification → Confirm Booking → Auto-expire if unpaid
   ```

---

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

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react) | UI Framework | 18.3.1 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript) | Type Safety | 5.6.2 |
| ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite) | Build Tool | 5.4.2 |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss) | Styling | 3.4.1 |
| ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000) | Component Library | Latest |
| ![React Router](https://img.shields.io/badge/React_Router-6.x-CA4245?logo=reactrouter) | Routing | 6.x |
| ![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios) | HTTP Client | 1.x |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js) | Runtime | 18+ |
| ![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express) | Web Framework | 4.21.1 |
| ![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb) | Database | 7.x |
| ![Mongoose](https://img.shields.io/badge/Mongoose-8.x-880000) | ODM | 8.8.3 |
| ![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens) | Authentication | Latest |

### Third-Party Integrations
| Service | Purpose |
|---------|---------|
| 🔐 **Google OAuth 2.0** | User authentication |
| 💳 **Razorpay** | Payment processing |
| ☁️ **Cloudinary** | Image upload & storage |
| 🤖 **Google Gemini AI** | Chatbot assistant |
| 📍 **Google Maps API** | Customer reviews |

### Development Tools
- ESLint + Prettier (Code quality)
- Nodemon (Hot reload)
- Concurrently (Run multiple processes)
- Git (Version control)

---

## 📥 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v7 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/muh-habeeb/quicktap.git

# Navigate to project directory
cd quicktap
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## ⚙️ Configuration

### 1. Environment Variables

#### Server Configuration (`server/.env`)

| Variable | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| **PORT** | Number | ✅ | Server port | `5000` |
| **NODE_ENV** | String | ✅ | Environment (development/production) | `development` |
| **SERVER_URL** | String | ✅ | Server URL for callbacks | `http://localhost:5000` |
| **DB_URL** | String | ✅ | MongoDB connection string | `mongodb://localhost:27017/quicktap` |
| **JWT_SECRET** | String | ✅ | Secret key for JWT tokens (change in production!) | `your-super-secret-key-here` |
| **JWT_TIMEOUT** | String | ✅ | JWT expiration time | `3d` |
| **GOOGLE_CLIENT_ID** | String | ✅ | Google OAuth Client ID | `xxx-xxx.apps.googleusercontent.com` |
| **GOOGLE_CLIENT_SECRET** | String | ✅ | Google OAuth Client Secret | `GOCSPX-xxxxx` |
| **RAZORPAY_KEY_ID** | String | ✅ | Razorpay API Key ID | `rzp_test_xxxxx` |
| **RAZORPAY_KEY_SECRET** | String | ✅ | Razorpay API Secret | `xxxxx` |
| **CLOUDINARY_CLOUD_NAME** | String | ✅ | Cloudinary cloud name | `your-cloud-name` |
| **CLOUDINARY_API_KEY** | String | ✅ | Cloudinary API Key | `xxxxx` |
| **CLOUDINARY_API_SECRET** | String | ✅ | Cloudinary API Secret | `xxxxx` |
| **VITE_GOOGLE_CLIENT_ID** | String | ✅ | Google Client ID (also used client-side) | `xxx-xxx.apps.googleusercontent.com` |
| **VITE_GOOGLE_GENAI_API_KEY** | String | ✅ | Google Gemini AI API Key | `AIzaSyxxxxx` |
| **VITE_RAZORPAY_KEY_ID** | String | ✅ | Razorpay key (also used client-side) | `rzp_test_xxxxx` |
| **GOOGLE_MAPS_REVIEW_URL** | String | ✅ | Google Maps review link | `https://share.google/cbBjzGYI789EORiyA` |
| **CLIENT_URL** | String | ⚠️ | Client URL (for CORS) | `http://localhost:5173` |

**Complete Server `.env` Template:**
```env
# ============ SERVER CONFIGURATION ============
PORT=5000
NODE_ENV=development
SERVER_URL=http://localhost:5000

# ============ DATABASE CONFIGURATION ============
# Local MongoDB
DB_URL=mongodb://localhost:27017/quicktap

# OR MongoDB Atlas (Cloud)
# DB_URL=mongodb+srv://username:password@cluster.mongodb.net/quicktap?retryWrites=true&w=majority

# ============ JWT AUTHENTICATION ============
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_TIMEOUT=3d

# ============ GOOGLE OAUTH 2.0 ============
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=858522882521-kaolgrmvqpp6q7vvh4njf5qe0g1p6qbe.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# ============ RAZORPAY PAYMENT GATEWAY ============
# Get these from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_RmpLL8qhP2sglB
RAZORPAY_KEY_SECRET=BaYOq3hEzfDn8PORH53N5PcZ

# ============ CLOUDINARY IMAGE UPLOAD ============
# Get these from: https://cloudinary.com/console/settings/api
CLOUDINARY_CLOUD_NAME=dta9j3y0h
CLOUDINARY_API_KEY=234732729581863
CLOUDINARY_API_SECRET=kihv8FXOSsiV1JlZs9lcCu7njEE

# ============ GOOGLE GEMINI AI (Chatbot) ============
# Get this from: https://makersuite.google.com/app/apikey
VITE_GOOGLE_GENAI_API_KEY=AIzaSyCHmgISdV-xtgiuD7iWf_qHn7cShgYlxnE

# ============ CLIENT-SIDE VARIABLES ============
# Used in client build
VITE_GOOGLE_CLIENT_ID=34565640354-hpqh2922cgrnun7vmubq52udnip5jt11.apps.googleusercontent.com
VITE_RAZORPAY_KEY_ID=rzp_test_RmpLL8qhP2sglB
VITE_RAZORPAY_KEY_SECRET=BaYOq3hEzfDn8PORH53N5PcZ

# ============ GOOGLE MAPS REVIEW URL ============
# Get from: https://maps.google.com/ → Share link
GOOGLE_MAPS_REVIEW_URL=https://share.google/cbBjzGYI789EORiyA

# ============ CORS CONFIGURATION (Optional) ============
# CORS_ORIGIN=http://localhost:5173,http://localhost:3000
# CORS_CREDENTIALS=true
```

#### Client Configuration (`client/.env`)

| Variable | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| **VITE_GOOGLE_CLIENT_ID** | String | ✅ | Google OAuth Client ID | `xxx-xxx.apps.googleusercontent.com` |
| **VITE_RAZORPAY_KEY_ID** | String | ✅ | Razorpay Key ID (public) | `rzp_test_xxxxx` |
| **VITE_GOOGLE_GENAI_API_KEY** | String | ✅ | Google Gemini AI API Key | `AIzaSyxxxxx` |
| **VITE_GOOGLE_MAPS_REVIEW_URL** | String | ✅ | Google Maps review link | `https://share.google/xxxxx` |

**Complete Client `.env` Template:**
```env
# ============ AUTHENTICATION ============
# Get from: https://console.cloud.google.com/
VITE_GOOGLE_CLIENT_ID=34565640354-hpqh2922cgrnun7vmubq52udnip5jt11.apps.googleusercontent.com

# ============ PAYMENT GATEWAY ============
# Get from: https://dashboard.razorpay.com/app/keys
VITE_RAZORPAY_KEY_ID=rzp_test_RmpLL8qhP2sglB

# ============ AI ASSISTANT ============
# Get from: https://makersuite.google.com/app/apikey
VITE_GOOGLE_GENAI_API_KEY=AIzaSyCHmgISdV-xtgiuD7iWf_qHn7cShgYlxnE

# ============ GOOGLE MAPS REVIEWS ============
VITE_GOOGLE_MAPS_REVIEW_URL=https://share.google/cbBjzGYI789EORiyA

# NOTE: API URL is AUTO-DETECTED! No need to configure.
# Development: http://localhost:5000
# Network: http://<your-ip>:5000
# Production: https://<your-domain>
```

### 2. Setup Database

Make sure MongoDB is running:

```bash
# Start MongoDB service
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### 3. Create Admin User

```bash
cd server
npm run setup-admin
```

Follow the prompts:
```
Enter admin email: admin@quicktap.com
Enter admin name: Admin User
Admin user created successfully!
```

### 4. Seed Sample Data (Optional)

```bash
cd server
npm run seed
```

This will populate:
- Sample food items
- Test orders
- Demo seat bookings

---

## 🎮 Usage

### Development Mode

#### Option 1: Run Both (Recommended)
```bash
# From root directory
npm run dev
```

This starts:
- Server on `http://localhost:5000`
- Client on `http://localhost:5173`

#### Option 2: Run Separately
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Production Mode

```bash
# Build client
npm run build

# Start production server
npm start
```

Access at: `http://localhost:5000`

### Network Access

1. Start the server (development or production)
2. Check console for network IP:
   ```
   Server running on:
   - Local: http://localhost:5000
   - Network: http://192.168.1.100:5000
   ```
3. Access from any device on the same network using the network IP
4. **No additional configuration needed!**

### Default Credentials

**Admin User:**
- Email: (created during setup)
- Access: `/admin`

**Test Customer:**
- Use Google OAuth to sign in
- Any Google account works

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/auth/google`
Login with Google OAuth code
```javascript
// Request
POST /auth/google?code=<google_auth_code>

// Response
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://..."
  },
  "token": "jwt_token_here"
}
```

#### POST `/auth/google-token`
Exchange Google access token for JWT
```javascript
// Request
POST /auth/google-token
Body: { "access_token": "google_access_token" }

// Response
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

### Food Endpoints

#### GET `/api/foods`
Get all food items
```javascript
// Response
[
  {
    "_id": "...",
    "name": "Margherita Pizza",
    "description": "Classic Italian pizza",
    "price": 299,
    "category": "meals",
    "image": "https://...",
    "isAvailable": true,
    "preparationTime": 20,
    "ingredients": ["Tomato", "Cheese", "Basil"],
    "nutritionalInfo": {
      "calories": 266,
      "protein": 11,
      "carbs": 33,
      "fat": 10
    }
  }
]
```

#### POST `/api/foods` 🔒 Admin Only
Create new food item

#### PUT `/api/foods/:id` 🔒 Admin Only
Update food item

#### DELETE `/api/foods/:id` 🔒 Admin Only
Delete food item

### Order Endpoints

#### GET `/api/orders/user/:userId` 🔒 Auth Required
Get user's order history

#### POST `/api/orders` 🔒 Auth Required
Create new order
```javascript
// Request
POST /api/orders
Headers: { "Authorization": "Bearer <jwt_token>" }
Body: {
  "items": [
    { "foodId": "...", "quantity": 2 }
  ],
  "seatNumbers": [1, 2],
  "totalAmount": 598
}
```

#### PUT `/api/orders/:id/status` 🔒 Admin Only
Update order status

### Seat Booking Endpoints

#### GET `/api/seats/status`
Get real-time seat availability

#### POST `/api/seats/book` 🔒 Auth Required
Create seat booking

#### POST `/api/seats/verify-payment` 🔒 Auth Required
Verify payment and confirm booking

### Payment Endpoints

#### POST `/api/payments/create-order` 🔒 Auth Required
Create Razorpay order

#### POST `/api/payments/verify` 🔒 Auth Required
Verify payment signature

For complete API documentation, see [API_DOCS.md](./API_DOCS.md)

---

## 🚀 Deployment

### Render.com (Recommended)

1. **Create Web Service**
   - Connect GitHub repository
   - Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Add all environment variables

2. **Set Environment Variables**
   - Add all variables from `server/.env`
   - Update `CLIENT_URL` to your Render URL
   - Update `GOOGLE_MAPS_REVIEW_URL` if needed

3. **Configure Google OAuth**
   - Add Render URL to authorized origins
   - Add callback URL: `https://your-app.onrender.com/auth/google/callback`

4. **Deploy**
   - Push to GitHub
   - Render auto-deploys

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Other Platforms

- **Vercel**: See [vercel.md](./docs/vercel.md)
- **Heroku**: See [heroku.md](./docs/heroku.md)
- **AWS**: See [aws.md](./docs/aws.md)
- **Docker**: See [docker.md](./docs/docker.md)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow ESLint rules
- Use TypeScript for new components
- Write meaningful commit messages
- Add comments for complex logic
- Test before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Muhammad Habeeb Rahman** - *Initial work* - [muh-habeeb](https://github.com/muh-habeeb)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Razorpay](https://razorpay.com/) for payment integration
- [Cloudinary](https://cloudinary.com/) for image hosting
- [Google](https://developers.google.com/) for OAuth and Gemini AI
- The open-source community

---

## 📞 Support

- 📧 Email: muhammadhabeebrahmam@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/muh-habeeb/quicktap/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/muh-habeeb/quicktap/discussions)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Table reservation system
- [ ] Kitchen display system (KDS)
- [ ] Multi-language support
- [ ] Loyalty program implementation
- [ ] Advanced analytics dashboard
- [ ] WhatsApp order notifications
- [ ] Invoice generation
- [ ] Inventory management
- [ ] Staff management module

---

<div align="center">

**Made with ❤️ by Muhammad Habeeb Rahman**

⭐ Star this repo if you find it helpful!

</div>
