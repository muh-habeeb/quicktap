# 2. System Architecture & Design

## 📋 Document Information
- **Document Title**: QuickTap - System Architecture & Design Patterns
- **Version**: 1.0
- **Date**: December 2025

---

## 2.1 High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Web Application (React + TypeScript + Vite)             │  │
│  │  ┌─────────────┬──────────────┬──────────────────────┐  │  │
│  │  │   Pages     │  Components  │  Services & Hooks    │  │  │
│  │  ├─────────────┼──────────────┼──────────────────────┤  │  │
│  │  │ • Home      │ • Layout     │ • Auth Service       │  │  │
│  │  │ • Food      │ • Header     │ • Cart Service       │  │  │
│  │  │ • Admin     │ • Sidebar    │ • Payment Service    │  │  │
│  │  │ • Chatbot   │ • Cards      │ • Seat Service       │  │  │
│  │  │ • Community │ • Dialogs    │ • API Client         │  │  │
│  │  └─────────────┴──────────────┴──────────────────────┘  │  │
│  │                                                          │  │
│  │  Styling: TailwindCSS + shadcn/ui Components           │  │
│  │  State Management: React Context + localStorage        │  │
│  │  HTTP Client: Axios                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER TIER (API)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (Node.js)                             │  │
│  │  ┌────────────────┬──────────────┬─────────────────────┐ │  │
│  │  │ Routes Layer   │ Controllers  │ Middleware          │ │  │
│  │  ├────────────────┼──────────────┼─────────────────────┤ │  │
│  │  │ /auth          │ Auth Logic   │ JWT Validation      │ │  │
│  │  │ /api/foods     │ Food Logic   │ Admin Check         │ │  │
│  │  │ /api/orders    │ Order Logic  │ Error Handler       │ │  │
│  │  │ /api/seats     │ Seat Logic   │ CORS                │ │  │
│  │  │ /api/payments  │ Payment      │ Rate Limiting       │ │  │
│  │  │ /api/users     │ User Logic   │ Request Logging     │ │  │
│  │  └────────────────┴──────────────┴─────────────────────┘ │  │
│  │                                                           │  │
│  │  Business Logic Layer:                                   │  │
│  │  ├─ Authentication & Authorization                       │  │
│  │  ├─ Seat Management (Auto-expiry, Blocking)             │  │
│  │  ├─ Payment Verification (Razorpay)                     │  │
│  │  ├─ Order Processing & Status Updates                   │  │
│  │  └─ Image Upload & Management                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS TIER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mongoose ODM + MongoDB Database                         │  │
│  │  ┌──────────────┬──────────────┬──────────────────────┐ │  │
│  │  │ Schemas      │ Indexes      │ Queries              │ │  │
│  │  ├──────────────┼──────────────┼──────────────────────┤ │  │
│  │  │ User         │ email        │ Find by ID           │ │  │
│  │  │ Food         │ category     │ Find by Category     │ │  │
│  │  │ Order        │ userId       │ Find by User         │ │  │
│  │  │ Seat         │ seatNumber   │ Find Available       │ │  │
│  │  │ Payment      │ orderId      │ Find by Status       │ │  │
│  │  │ Post         │ userId       │ Aggregation Queries  │ │  │
│  │  │ Feedback     │ createdAt    │ Sorting & Pagination │ │  │
│  │  └──────────────┴──────────────┴──────────────────────┘ │  │
│  │                                                           │  │
│  │  Data Validation:                                        │  │
│  │  ├─ Schema validation at model level                    │  │
│  │  ├─ Required fields enforcement                         │  │
│  │  ├─ Type checking                                       │  │
│  │  └─ Unique constraints                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
             ┌───────────────┼───────────────┐
             ↓               ↓               ↓
    ┌────────────────┐ ┌──────────┐ ┌──────────────┐
    │ MongoDB Atlas  │ │Cloudinary│ │ Google OAuth │
    │   (Cloud DB)   │ │ (Images) │ │ (Auth) +     │
    │                │ │          │ │ Razorpay     │
    │  Backups       │ │ CDN      │ │ OpenRouter   │
    │  Replication   │ │ Upload   │ │ AI (Chatbot) │
    └────────────────┘ └──────────┘ └──────────────┘
```

---

## 2.2 Architecture Patterns

### 2.2.1 MVC Pattern (Server)
```
Model ←→ Controller ←→ View/Routes
  ↓        ↓           ↓
Schema   Logic       HTTP Endpoints
```

**Example: Food Management**
```
Model (foodModel.js)
  └─ Schema definition
     ├─ Fields: name, price, category, etc.
     └─ Methods: validation, hooks

Controller (foodController.js)
  ├─ getFoods() - Retrieve all foods
  ├─ createFood() - Create new food
  ├─ updateFood() - Update food item
  └─ deleteFood() - Delete food item

Routes (foodRoutes.js)
  ├─ GET /api/foods
  ├─ POST /api/foods (admin only)
  ├─ PUT /api/foods/:id (admin only)
  └─ DELETE /api/foods/:id (admin only)
```

### 2.2.2 Component-Based Architecture (Client)
```
App
├─ Layout
│  ├─ Header
│  ├─ Sidebar
│  ├─ Content Outlet
│  └─ Footer
├─ Pages
│  ├─ Home (public)
│  ├─ Food (protected)
│  ├─ Admin (admin-protected)
│  └─ Chatbot (protected)
└─ Services
   ├─ API (Axios wrapper)
   ├─ Auth
   ├─ Cart
   └─ Payment
```

### 2.2.3 Service Layer Pattern
Client-side services abstract API calls:
```typescript
// Service
export const exchangeGoogleToken = async (access_token: string) => {
  return await api.post('/auth/google-token', { access_token });
};

// Component Usage
const response = await exchangeGoogleToken(authResult.access_token);
```

### 2.2.4 Middleware Pattern (Server)
```
Request
  ↓
┌─────────────────────────────┐
│ CORS Middleware             │
├─────────────────────────────┤
│ Request Logging Middleware  │
├─────────────────────────────┤
│ JWT Authentication (if needed)
├─────────────────────────────┤
│ Admin Check (if needed)     │
├─────────────────────────────┤
│ Route Handler               │
├─────────────────────────────┤
│ Error Handler               │
└─────────────────────────────┘
  ↓
Response
```

---

## 2.3 Data Flow Diagrams

### 2.3.1 User Authentication Flow
```
┌─────────────┐
│  User       │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       ↓
┌─────────────────────────┐
│ Google OAuth Provider   │
│ (react-oauth/google)    │
└──────┬──────────────────┘
       │
       │ 2. Returns access_token
       ↓
┌─────────────────────────┐
│ Client App              │
│ GoogleLogin.jsx         │
└──────┬──────────────────┘
       │
       │ 3. POST /auth/google-token
       │    { access_token }
       ↓
┌─────────────────────────┐
│ Server (authController) │
│ exchangeGoogleToken()   │
└──────┬──────────────────┘
       │
       │ 4. Verify with Google
       ↓
┌─────────────────────────┐
│ Google API              │
│ (Validate token)        │
└──────┬──────────────────┘
       │
       │ 5. Get user info
       ↓
┌─────────────────────────┐
│ User Model              │
│ Create/Update user      │
└──────┬──────────────────┘
       │
       │ 6. Generate JWT
       ↓
┌─────────────────────────┐
│ Return { user, token }  │
└──────┬──────────────────┘
       │
       │ 7. Store JWT & user
       ↓
┌─────────────┐
│ localStorage│
│ user-info   │
└─────────────┘
```

### 2.3.2 Food Ordering Flow
```
┌──────────────┐
│ Browse Food  │
│ GET /foods   │
└────────┬─────┘
         │
         ↓
┌──────────────────┐
│ Add to Cart      │
│ localStorage     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Select Seats     │
│ GET /seats       │
│ status check     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Checkout         │
│ Review Order     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Create Order     │
│ POST /orders     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Razorpay Payment │
│ POST /payments   │
│ /create-order    │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Payment Flow     │
│ (Razorpay modal) │
└────────┬─────────┘
         │
         ├─ Success ──────────┐
         │                    │
         │ Failed ─────┐      │
         │             │      │
         │             ↓      ↓
         │      ┌──────────────────┐
         │      │ Verify Payment   │
         │      │ POST /verify     │
         │      └────────┬─────────┘
         │               │
         │        ┌──────┴──────┐
         │        │             │
         │ Success│             │ Failed
         │        ↓             ↓
         │   ┌────────┐    ┌─────────┐
         │   │Confirm │    │ Rollback│
         └───┤Order   │    │ Order   │
             │Book    │    │Release  │
             │Seats   │    │Seats    │
             └────────┘    └─────────┘
```

### 2.3.3 Seat Booking Flow
```
┌──────────────────────┐
│ GET /seats/status    │
│ Fetch available      │
│ seat list            │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ Display Seat Grid    │
│ Show availability    │
│ 15 seats total       │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ User Selects Seats   │
│ Update UI            │
│ Mark as selected     │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ POST /seats/book     │
│ Create temp booking  │
│ (30 min reservation) │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ Booking Created      │
│ Status: PENDING      │
│ Expiry: +30 mins     │
└────────┬─────────────┘
         │
         ├─ Payment Made ──────┐
         │                     │
         │ Payment Failed ──┐   │
         │                 │   │
         │                 ↓   ↓
         │        ┌────────────────┐
         │        │POST/verify-pay │
         │        └────────┬───────┘
         │                 │
         │          ┌──────┴──────┐
         │          │             │
         │ Verified │             │ Not Verified
         │          ↓             ↓
         │   ┌──────────┐   ┌──────────┐
         └───┤CONFIRMED │   │CANCELLED │
             │SEATS     │   │SEATS     │
             │AUTO-EXPIRE  (EXPIRED)  │
             │after event │ 30 mins   │
             └───────────┘ └──────────┘
```

---

## 2.4 Component Architecture (Client)

### Directory Structure
```
client/src/
├── pages/
│   ├── Home.tsx           (Landing page)
│   ├── Food.tsx           (Main ordering interface)
│   ├── Admin.tsx          (Admin dashboard)
│   ├── Chatbot.tsx        (AI assistant)
│   ├── Community.tsx      (Social features)
│   ├── Loyalty.tsx        (Rewards program)
│   ├── GoogleLogin.jsx    (Auth page)
│   └── NotFound.tsx       (404 page)
├── components/
│   ├── layout/
│   │   ├── DefaultLayout.tsx
│   │   ├── SiteHeader.tsx
│   │   └── SiteFooter.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (shadcn/ui components)
│   ├── QRCodeScanner.tsx
│   ├── SeatAdminDashboard.tsx
│   ├── SeatManagement.tsx
│   └── AdminRoute.tsx
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── services/
│   ├── api.ts
│   ├── cartService.ts
│   ├── seatService.ts
│   ├── paymentService.ts
│   └── feedbackService.ts
├── types/
│   └── google-genai.d.ts
├── utils/
│   └── hateDetection.ts
├── lib/
│   └── utils.ts
├── config.ts           (Configuration)
├── main.tsx            (Entry point)
└── App.tsx             (Root component)
```

### Component Hierarchy
```
App
├─ BrowserRouter
│  ├─ GoogleOAuthProvider
│  └─ Routes
│     ├─ Route "/" → GoogleLogin
│     ├─ Route "/home" → Home
│     ├─ Route "/food" → PrivateRoute(Food)
│     ├─ Route "/admin" → AdminRoute(Admin)
│     ├─ Route "/chatbot" → PrivateRoute(Chatbot)
│     ├─ Route "/community" → PrivateRoute(Community)
│     ├─ Route "/loyalty" → PrivateRoute(Loyalty)
│     ├─ Route "/scan-qr" → PrivateRoute(QRCodeScanner)
│     └─ Route "*" → NotFound
│
├─ Home
│   ├─ DefaultLayout
│   │  ├─ SiteHeader
│   │  ├─ Feature Cards
│   │  └─ SiteFooter
│   └─ Floating Action Buttons
│
├─ Food
│   ├─ DefaultLayout
│   ├─ Menu Categories
│   ├─ Food Cards
│   ├─ Cart Sidebar
│   └─ Checkout Modal
│
└─ Admin
    ├─ AdminRoute (Protected)
    ├─ Sidebar Navigation
    ├─ Dashboard Widgets
    ├─ Food Management
    ├─ Order Management
    ├─ Seat Management
    └─ Payment Tracking
```

---

## 2.5 Server Architecture

### Route Organization
```
server/
├── routes/
│   ├── authRoutes.js         (/auth/*)
│   ├── foodRoutes.js         (/api/foods/*)
│   ├── orderRoutes.js        (/api/orders/*)
│   ├── seatRoutes.js         (/api/seats/*)
│   ├── paymentRoutes.js      (/api/payments/*)
│   ├── feedbackRoutes.js     (/api/feedback/*)
│   ├── cartRoutes.js         (/api/cart/*)
│   └── announcementRoutes.js (/api/announcements/*)
├── controllers/
│   ├── authController.js
│   ├── foodController.js
│   ├── orderController.js
│   ├── seatController.js
│   ├── paymentController.js
│   └── ...
├── models/
│   ├── userModel.js
│   ├── foodModel.js
│   ├── orderModel.js
│   ├── seatBooking.js
│   ├── paymentModel.js
│   ├── Post.js
│   ├── feedback.js
│   ├── cartModel.js
│   └── announcement.js
├── middleware/
│   ├── auth.js              (JWT validation)
│   ├── adminAuth.js         (Admin check)
│   └── errorHandler.js      (Error handling)
├── services/
│   ├── autoSeatBlocking.js  (Seat expiry)
│   ├── googleClient.js      (OAuth)
│   └── ...
├── utils/
│   ├── cloudinary.js        (Image upload)
│   ├── googleClient.js
│   ├── seatCleanup.js
│   └── ...
└── index.js                 (Entry point)
```

### Middleware Stack
```javascript
app.use(cors())                    // CORS
app.use(express.json())            // Body parser
app.use(express.urlencoded())      // URL encoded
app.use(requestLogger)             // Logging
app.use('/auth', authRoutes)       // Auth (no JWT required)
app.use('/api', authenticateToken) // JWT required
app.use(errorHandler)              // Error handling
app.use(notFoundHandler)           // 404 handler
```

---

## 2.6 Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────┐
│       Render.com (Hosting Platform)         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Node.js Application Container      │   │
│  │  ├─ Express Server                  │   │
│  │  │  ├─ Listens on PORT 5000         │   │
│  │  │  ├─ Serves built React frontend  │   │
│  │  │  └─ API endpoints (/api/*)       │   │
│  │  │                                  │   │
│  │  ├─ Environment Variables           │   │
│  │  │  ├─ MongoDB URI                  │   │
│  │  │  ├─ JWT_SECRET                   │   │
│  │  │  ├─ OAuth credentials            │   │
│  │  │  └─ Payment keys                 │   │
│  │  │                                  │   │
│  │  └─ Auto-scaling                    │   │
│  │     └─ Based on CPU/Memory          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Build Process                      │   │
│  │  1. Install dependencies            │   │
│  │  2. Build React frontend (dist/)    │   │
│  │  3. Start Node server               │   │
│  │  4. Serve frontend + API            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
           │
           ├─────────────────────────────┐
           ↓                             ↓
    ┌────────────────┐          ┌──────────────┐
    │ MongoDB Atlas  │          │ External API │
    │   (Cloud DB)   │          │              │
    │ Cluster: xxxxx │          ├─ Google OAuth
    │ Backups: Daily │          ├─ Razorpay
    └────────────────┘          ├─ Cloudinary
                                └─ OpenRouter AI
```

---

## 2.7 Technology Rationale

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend Framework | React 18 | Component reusability, large ecosystem |
| Build Tool | Vite | Fast build times, modern ES modules |
| Styling | TailwindCSS | Utility-first, responsive design |
| UI Components | shadcn/ui | Customizable, accessible components |
| State Management | React Context | Sufficient for current needs |
| HTTP Client | Axios | Promise-based, interceptor support |
| Backend | Express.js | Lightweight, flexible, event-driven |
| Database | MongoDB | Document-based, flexible schema |
| ODM | Mongoose | Schema validation, middleware support |
| Authentication | JWT + OAuth | Stateless, secure, industry standard |
| Hosting | Render.com | Easy deployment, auto-scaling |

---

## 2.8 Scalability Considerations

### Current Bottlenecks
1. Database queries (need indexing)
2. Image processing (handled by Cloudinary)
3. Payment processing (Razorpay handles)
4. Real-time updates (WebSocket needed for v2)

### Scaling Strategy
1. **Database**: Add read replicas, implement caching (Redis)
2. **API**: Horizontal scaling (load balancer)
3. **Frontend**: CDN for static assets
4. **Images**: Already using Cloudinary CDN
5. **Real-time**: Implement WebSocket for live updates

---

## 2.9 Security Architecture

### Authentication Flow
```
User Login → Google OAuth → Exchange Token → Generate JWT → Store in localStorage
```

### Authorization Layers
```
Public Routes: No auth required
Protected Routes: JWT required
Admin Routes: JWT + Admin role required
```

### Data Protection
```
├─ HTTPS/SSL encryption (in transit)
├─ Password: OAuth only (no password storage)
├─ JWT: Signed with SECRET
├─ CORS: Whitelist domains
└─ Rate limiting: Per IP/User
```

---

## Summary

The QuickTap architecture follows modern full-stack web application best practices:
- **Component-based** frontend for reusability
- **Service-oriented** backend for maintainability
- **Document-based** database for flexibility
- **API-first** design for scalability
- **Security-focused** authentication & authorization

This architecture supports current requirements while providing a foundation for future enhancements and scaling.

---

**Next Document**: [3-DATABASE-DESIGN.md](./3-DATABASE-DESIGN.md)
