# 4. API Documentation

## 📋 Document Information
- **Document Title**: QuickTap - REST API Documentation
- **Version**: 1.0
- **Date**: December 2025
- **Base URL**: `https://quicktap-s85x.onrender.com` (Production) or `http://localhost:5000` (Development)

---

## 4.1 API Overview

### Request/Response Format
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token (except login endpoints)
- **Error Format**: Standard HTTP status codes + error messages

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### API Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per minute

---

## 4.2 Authentication Endpoints

### POST `/auth/google`
Exchange Google authorization code for JWT token.

**Request**
```http
POST /auth/google?code=<google_auth_code>
Content-Type: application/json
```

**Response** (200 OK)
```json
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (400 Bad Request)
```json
{
  "error": "Invalid authorization code"
}
```

---

### POST `/auth/google-token`
Exchange Google access token for JWT token (Implicit flow).

**Request**
```http
POST /auth/google-token
Content-Type: application/json

{
  "access_token": "ya29.a0AfH6SMBx..."
}
```

**Response** (200 OK)
```json
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "user",
    "_id": "507f1f77bcf86cd799439011"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4.3 Food Endpoints

### GET `/api/foods`
Retrieve all available food items.

**Request**
```http
GET /api/foods?category=meals&limit=10&skip=0
Content-Type: application/json
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (meals, appetizer, dessert, etc.) |
| limit | number | Items per page (default: 20) |
| skip | number | Pagination offset (default: 0) |
| isAvailable | boolean | Filter by availability |

**Response** (200 OK)
```json
{
  "foods": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Margherita Pizza",
      "description": "Classic Italian pizza",
      "price": 299,
      "category": "meals",
      "image": "https://res.cloudinary.com/...",
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
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

---

### GET `/api/foods/:id`
Get details of a specific food item.

**Request**
```http
GET /api/foods/507f1f77bcf86cd799439011
```

**Response** (200 OK)
```json
{
  "food": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Margherita Pizza",
    ...
  }
}
```

---

### POST `/api/foods` 🔒 **Admin Only**
Create a new food item.

**Request**
```http
POST /api/foods
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Veggie Burger",
  "description": "Fresh vegetable burger with lettuce and tomato",
  "price": 199,
  "category": "meals",
  "image": "https://res.cloudinary.com/...",
  "preparationTime": 15,
  "ingredients": ["Bun", "Lettuce", "Tomato", "Patty"],
  "nutritionalInfo": {
    "calories": 350,
    "protein": 15,
    "carbs": 40,
    "fat": 12
  }
}
```

**Response** (201 Created)
```json
{
  "food": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Veggie Burger",
    ...
  }
}
```

---

### PUT `/api/foods/:id` 🔒 **Admin Only**
Update a food item.

**Request**
```http
PUT /api/foods/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 319,
  "preparationTime": 25,
  "isAvailable": true
}
```

**Response** (200 OK)
```json
{
  "food": {
    "_id": "507f1f77bcf86cd799439011",
    "price": 319,
    ...
  }
}
```

---

### DELETE `/api/foods/:id` 🔒 **Admin Only**
Delete a food item.

**Request**
```http
DELETE /api/foods/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response** (200 OK)
```json
{
  "message": "Food item deleted successfully"
}
```

---

## 4.4 Order Endpoints

### GET `/api/orders/user/:userId` 🔒 **Auth Required**
Get user's order history.

**Request**
```http
GET /api/orders/user/507f1f77bcf86cd799439011?status=pending&limit=10
Authorization: Bearer <jwt_token>
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| limit | number | Items per page |
| skip | number | Pagination offset |

**Response** (200 OK)
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439011",
      "items": [
        {
          "foodId": "507f1f77bcf86cd799439011",
          "quantity": 2,
          "price": 299
        }
      ],
      "totalAmount": 598,
      "status": "ready",
      "seatNumbers": [1, 2],
      "createdAt": "2025-12-04T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/orders` 🔒 **Auth Required**
Create a new order.

**Request**
```http
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "foodId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "seatNumbers": [1, 2],
  "totalAmount": 598
}
```

**Response** (201 Created)
```json
{
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439011",
    "items": [...],
    "totalAmount": 598,
    "status": "pending",
    "seatNumbers": [1, 2],
    "createdAt": "2025-12-04T10:00:00Z"
  },
  "message": "Order created successfully"
}
```

---

### PUT `/api/orders/:id/status` 🔒 **Admin Only**
Update order status.

**Request**
```http
PUT /api/orders/507f1f77bcf86cd799439020/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "ready"
}
```

**Valid Status Values**
- pending
- preparing
- ready
- delivered
- cancelled

**Response** (200 OK)
```json
{
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "status": "ready",
    ...
  }
}
```

---

## 4.5 Payment Endpoints

### POST `/api/payments/create-order` 🔒 **Auth Required**
Create Razorpay payment order.

**Request**
```http
POST /api/payments/create-order
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439020",
  "amount": 59800
}
```

**Response** (201 Created)
```json
{
  "id": "order_1Aa00000000001",
  "entity": "order",
  "amount": 59800,
  "amount_paid": 0,
  "amount_due": 59800,
  "currency": "INR",
  "receipt": "receipt#1",
  "status": "created"
}
```

---

### POST `/api/payments/verify` 🔒 **Auth Required**
Verify payment and confirm order.

**Request**
```http
POST /api/payments/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439020",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpayPaymentId": "pay_1Aa00000000001",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a"
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "status": "confirmed"
  }
}
```

**Error Response** (400 Bad Request)
```json
{
  "success": false,
  "message": "Payment verification failed"
}
```

---

## 4.6 Seat Booking Endpoints

### GET `/api/seats/status`
Get real-time seat availability (Public).

**Request**
```http
GET /api/seats/status
```

**Response** (200 OK)
```json
{
  "seats": {
    "1": "available",
    "2": "booked",
    "3": "available",
    "4": "booked",
    "5": "available",
    ...
  },
  "totalSeats": 15,
  "availableSeats": 8,
  "bookedSeats": 7,
  "timestamp": "2025-12-04T10:00:00Z"
}
```

---

### POST `/api/seats/book` 🔒 **Auth Required**
Create a seat booking (30-minute reservation).

**Request**
```http
POST /api/seats/book
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "seatNumbers": [1, 2, 3],
  "orderId": "507f1f77bcf86cd799439020"
}
```

**Response** (201 Created)
```json
{
  "booking": {
    "_id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439011",
    "seatNumbers": [1, 2, 3],
    "status": "pending",
    "expiryTime": "2025-12-04T10:30:00Z",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

### POST `/api/seats/verify-payment` 🔒 **Auth Required**
Verify payment and confirm seat booking.

**Request**
```http
POST /api/seats/verify-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "bookingId": "507f1f77bcf86cd799439030",
  "paymentId": "507f1f77bcf86cd799439040"
}
```

**Response** (200 OK)
```json
{
  "booking": {
    "_id": "507f1f77bcf86cd799439030",
    "status": "confirmed",
    "confirmedAt": "2025-12-04T10:05:00Z"
  }
}
```

---

## 4.7 Community/Posts Endpoints

### GET `/api/posts` 🔒 **Auth Required**
Get all community posts.

**Request**
```http
GET /api/posts?category=announcement&limit=20&skip=0
Authorization: Bearer <jwt_token>
```

**Response** (200 OK)
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "category": "announcement",
      "title": "New Menu Items Available",
      "content": "We've added delicious new items to our menu!",
      "image": "https://res.cloudinary.com/...",
      "likes": 15,
      "comments": [
        {
          "userId": "507f1f77bcf86cd799439012",
          "text": "Great addition!"
        }
      ],
      "createdAt": "2025-12-04T09:00:00Z"
    }
  ]
}
```

---

### POST `/api/posts` 🔒 **Auth Required**
Create a new post.

**Request**
```http
POST /api/posts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "category": "review",
  "title": "Excellent Service",
  "content": "Had a wonderful dining experience!",
  "image": "https://res.cloudinary.com/..."
}
```

**Response** (201 Created)
```json
{
  "post": {
    "_id": "507f1f77bcf86cd799439050",
    ...
  }
}
```

---

## 4.8 User Endpoints

### GET `/api/users/profile` 🔒 **Auth Required**
Get current user profile.

**Request**
```http
GET /api/users/profile
Authorization: Bearer <jwt_token>
```

**Response** (200 OK)
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "role": "user",
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

---

## 4.8 Chatbot (AI Assistant)

### Overview
The chatbot is powered by **OpenRouter AI** and runs entirely on the client-side. It provides intelligent responses about food items, dietary preferences, recommendations, and restaurant services.

### Implementation Details
- **Location**: `client/src/pages/Chatbot.tsx`
- **API Provider**: OpenRouter (https://openrouter.ai)
- **Model**: `openrouter/auto` (intelligent model routing)
- **Authentication**: Bearer token via `VITE_OPENROUTER_API_KEY`
- **Type**: Client-side REST API call (no backend involved)

### Chatbot Request Format

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request Headers**
```http
Content-Type: application/json
Authorization: Bearer sk-or-v1-YOUR_API_KEY
HTTP-Referer: https://your-domain.com
X-Title: QuickTap Chatbot
```

**Request Body**
```json
{
  "model": "openrouter/auto",
  "messages": [
    {
      "role": "system",
      "content": "You are a friendly and helpful food assistant chatbot..."
    },
    {
      "role": "user",
      "content": "Tell me about dietary options"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### Chatbot Response Format

**Response** (200 OK)
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "We have excellent dietary options including vegan, gluten-free, and keto-friendly meals..."
      },
      "finish_reason": "stop"
    }
  ],
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

### Error Handling

**429 Rate Limit**
```json
{
  "error": {
    "message": "You have exceeded your rate limit",
    "code": 429,
    "status": "RATE_LIMIT_EXCEEDED"
  }
}
```

**401 Unauthorized**
```json
{
  "error": {
    "message": "Invalid API key",
    "code": 401,
    "status": "UNAUTHORIZED"
  }
}
```

### Chatbot Features
- ✅ Menu-related queries
- ✅ Dietary preferences (vegan, gluten-free, keto, etc.)
- ✅ Nutritional information
- ✅ Food recommendations
- ✅ Restaurant services information
- ✅ Smart fallback responses on quota exhaustion

### Getting OpenRouter API Key
1. Visit [openrouter.ai](https://openrouter.ai)
2. Create a free account
3. Navigate to **Settings → API Keys**
4. Generate a new API key
5. Add to `client/.env`: `VITE_OPENROUTER_API_KEY=sk-or-v1-...`

### Usage in Frontend
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'QuickTap Chatbot',
  },
  body: JSON.stringify({
    model: 'openrouter/auto',
    messages: [...],
    temperature: 0.7,
    max_tokens: 500,
  }),
});

const data = await response.json();
const aiResponse = data.choices[0].message.content;
```

---

## 4.9 User Profile

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Errors

| Status | Code | Message |
|--------|------|---------|
| 400 | BAD_REQUEST | Invalid request parameters |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Permission denied (not admin) |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 500 | SERVER_ERROR | Internal server error |

### Example Error Response
```json
{
  "error": "Invalid food ID",
  "code": "INVALID_FOOD_ID",
  "statusCode": 404
}
```

---

## 4.10 Rate Limiting

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1733318400
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## 4.11 Pagination

### Query Parameters
```http
GET /api/foods?limit=20&skip=0
```

### Response
```json
{
  "items": [...],
  "total": 150,
  "limit": 20,
  "skip": 0,
  "pages": 8,
  "currentPage": 1
}
```

---

## Summary

The QuickTap API provides:
- ✅ **RESTful design** following HTTP standards
- ✅ **JWT authentication** for security
- ✅ **Role-based access control** (user/admin)
- ✅ **Comprehensive error handling**
- ✅ **Pagination support** for large datasets
- ✅ **Rate limiting** for API protection
- ✅ **Standard JSON responses** for easy integration

All endpoints are documented with request/response examples for easy integration.

---

**Next Document**: [5-DEPLOYMENT-GUIDE.md](./5-DEPLOYMENT-GUIDE.md)
