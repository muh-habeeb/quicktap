# 3. Database Design & Schema

## 📋 Document Information
- **Document Title**: QuickTap - Database Design & Schema Documentation
- **Version**: 1.0
- **Date**: December 2025

---

## 3.1 Database Overview

**Database System**: MongoDB (NoSQL, Document-based)
**ODM Framework**: Mongoose 8.x
**Connection**: MongoDB Atlas (Cloud) / Local MongoDB

### Database Benefits
- ✅ Flexible schema (easy to add fields)
- ✅ Document-based (matches JavaScript objects)
- ✅ Horizontal scalability
- ✅ Built-in replication & backups
- ✅ Aggregation pipeline for complex queries

---

## 3.2 Entity-Relationship Diagram (ERD)

```
┌─────────────────────┐
│      User           │
├─────────────────────┤
│ _id (PK)            │
│ email (Unique)      │◄───┐
│ name                │    │
│ image               │    │
│ googleId            │    │ 1:N
│ role (user/admin)   │    │
│ createdAt           │    │
│ updatedAt           │    │
└─────────────────────┘    │
        │                  │
        │ 1:N              │
        │                  │
        ▼                  │
┌─────────────────────┐    │
│     Order           │────┘
├─────────────────────┤
│ _id (PK)            │
│ userId (FK)         │
│ items (Subdoc)      │
│ totalAmount         │
│ status              │
│ paymentId (FK)      │
│ createdAt           │
└─────────────────────┘
        │
        │ 1:N
        │
        ▼
┌─────────────────────┐
│     OrderItem       │
├─────────────────────┤
│ foodId (FK)         │
│ quantity            │
│ price               │
└─────────────────────┘


┌─────────────────────┐
│      Food           │
├─────────────────────┤
│ _id (PK)            │◄───┐
│ name                │    │
│ description         │    │
│ price               │    │
│ category            │    │ 1:N
│ image               │    │
│ preparationTime     │    │
│ isAvailable         │    │
│ ingredients         │    │
│ nutritionalInfo     │    │
│ createdAt           │    │
└─────────────────────┘    │
                           │
                      ┌────┴────────┐
                      │             │
                      ▼             ▼
              ┌──────────────┐  ┌─────────────┐
              │    Order     │  │    Cart     │
              │   Items      │  │    Items    │
              └──────────────┘  └─────────────┘


┌──────────────────────┐
│   SeatBooking        │
├──────────────────────┤
│ _id (PK)             │
│ userId (FK)          │
│ seatNumbers (Array)  │
│ status               │
│ orderId (FK)         │
│ createdAt            │
│ expiryTime           │
└──────────────────────┘


┌──────────────────────┐
│    Payment           │
├──────────────────────┤
│ _id (PK)             │
│ orderId (FK)         │
│ userId (FK)          │
│ razorpayOrderId      │
│ razorpayPaymentId    │
│ amount               │
│ status               │
│ signature            │
│ createdAt            │
└──────────────────────┘


┌──────────────────────┐
│      Post            │
├──────────────────────┤
│ _id (PK)             │
│ userId (FK)          │
│ category             │
│ title                │
│ content              │
│ image                │
│ comments (Subdoc)    │
│ likes (Array)        │
│ createdAt            │
└──────────────────────┘
```

---

## 3.3 Collection Schemas

### 3.3.1 Users Collection

```javascript
// userModel.js
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
```

**Sample Document**
```json
{
  "_id": "ObjectId('xxx')",
  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://example.com/photo.jpg",
  "googleId": "google_id_xxx",
  "role": "user",
  "createdAt": "2025-12-04T10:00:00Z",
  "updatedAt": "2025-12-04T10:00:00Z"
}
```

---

### 3.3.2 Foods Collection

```javascript
// foodModel.js
const foodSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['meals', 'appetizer', 'dessert', 'cooldrink', 'main'],
    required: true,
    index: true
  },
  image: {
    type: String,
    required: true
  },
  imageData: {
    url: String,
    public_id: String
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  preparationTime: {
    type: Number,
    default: 15
  },
  ingredients: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
foodSchema.index({ category: 1, isAvailable: 1 });
foodSchema.index({ name: 'text', description: 'text' }); // Text search
```

**Sample Document**
```json
{
  "_id": "ObjectId('xxx')",
  "name": "Margherita Pizza",
  "description": "Classic Italian pizza with tomato, cheese, and basil",
  "price": 299,
  "category": "meals",
  "image": "https://res.cloudinary.com/xxx/image.jpg",
  "imageData": {
    "url": "https://res.cloudinary.com/xxx/image.jpg",
    "public_id": "quick-tap/image_id"
  },
  "isAvailable": true,
  "preparationTime": 20,
  "ingredients": ["Tomato", "Cheese", "Basil", "Olive Oil"],
  "nutritionalInfo": {
    "calories": 266,
    "protein": 11,
    "carbs": 33,
    "fat": 10
  },
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-04T10:00:00Z"
}
```

---

### 3.3.3 Orders Collection

```javascript
// orderModel.js
const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [
    {
      foodId: {
        type: Schema.Types.ObjectId,
        ref: 'Food',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  seatNumbers: [Number],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveredAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentId: 1 });
```

**Sample Document**
```json
{
  "_id": "ObjectId('xxx')",
  "userId": "ObjectId('user_xxx')",
  "items": [
    {
      "foodId": "ObjectId('food_xxx')",
      "quantity": 2,
      "price": 299
    }
  ],
  "totalAmount": 598,
  "status": "ready",
  "paymentId": "ObjectId('payment_xxx')",
  "seatNumbers": [1, 2],
  "notes": "Extra cheese on pizza",
  "createdAt": "2025-12-04T10:00:00Z",
  "deliveredAt": "2025-12-04T10:25:00Z",
  "updatedAt": "2025-12-04T10:25:00Z"
}
```

---

### 3.3.4 SeatBooking Collection

```javascript
// seatBooking.js
const seatBookingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seatNumbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.every(seat => seat >= 1 && seat <= 15);
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  expiryTime: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  confirmedAt: Date,
  updatedAt: Date
});

// TTL Index for auto-expiry
seatBookingSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 });
```

**Sample Document**
```json
{
  "_id": "ObjectId('xxx')",
  "userId": "ObjectId('user_xxx')",
  "seatNumbers": [1, 2, 3],
  "status": "confirmed",
  "orderId": "ObjectId('order_xxx')",
  "expiryTime": "2025-12-04T10:30:00Z",
  "createdAt": "2025-12-04T10:00:00Z",
  "confirmedAt": "2025-12-04T10:05:00Z",
  "updatedAt": "2025-12-04T10:05:00Z"
}
```

---

### 3.3.5 Payments Collection

```javascript
// paymentModel.js
const paymentSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  razorpayOrderId: {
    type: String,
    unique: true,
    index: true
  },
  razorpayPaymentId: String,
  razorpaySignature: String,
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  verifiedAt: Date,
  updatedAt: Date
});

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
```

**Sample Document**
```json
{
  "_id": "ObjectId('xxx')",
  "orderId": "ObjectId('order_xxx')",
  "userId": "ObjectId('user_xxx')",
  "amount": 598,
  "currency": "INR",
  "status": "verified",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "sig_xxx",
  "createdAt": "2025-12-04T10:00:00Z",
  "verifiedAt": "2025-12-04T10:02:00Z",
  "updatedAt": "2025-12-04T10:02:00Z"
}
```

---

### 3.3.6 Posts Collection

```javascript
// Post.js
const postSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['announcement', 'review', 'story', 'question'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: String,
  comments: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: Date
});

// Indexes
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ category: 1 });
```

---

### 3.3.7 Feedback Collection

```javascript
// feedback.js
const feedbackSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
```

---

### 3.3.8 Cart Collection (Client-side only)

**Note**: Cart is stored in `localStorage`, not in database for now.

```javascript
// cartService.ts (Client-side)
interface CartItem {
  _id: string;        // foodId
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// Stored as JSON in localStorage
localStorage.setItem('cart', JSON.stringify({
  items: CartItem[],
  totalAmount: number,
  lastUpdated: timestamp
}));
```

---

## 3.4 Indexing Strategy

### Current Indexes

| Collection | Fields | Type | Purpose |
|-----------|--------|------|---------|
| users | email | Unique | Fast user lookup by email |
| users | googleId | Unique | Fast lookup by Google ID |
| foods | category, isAvailable | Compound | Quick availability checks |
| foods | name, description | Text | Full-text search |
| orders | userId, createdAt | Compound | User order history |
| orders | status | Simple | Filter by status |
| payments | userId, createdAt | Compound | User payment history |
| payments | status | Simple | Payment status tracking |
| seatBooking | userId | Simple | Booking lookups |
| seatBooking | expiryTime | TTL | Auto-cleanup of expired bookings |
| posts | userId, createdAt | Compound | User posts with sorting |

### Index Query Performance Impact
```
Without Index:  Collection Scan O(n)
With Index:     Binary Search O(log n)
```

---

## 3.5 Data Flow Patterns

### 3.5.1 Order Creation Flow
```
1. User adds food items to cart
   cart = {
     items: [{foodId, quantity}, ...],
     totalAmount: calculated_sum
   }

2. User selects seats
   selectedSeats = [1, 2, 3]

3. POST /api/orders
   Request: {
     items: [{foodId, quantity}, ...],
     totalAmount,
     seatNumbers
   }

4. Server creates Order document
   Order: {
     userId,
     items: [{foodId, quantity, price}, ...],
     totalAmount,
     status: 'pending',
     seatNumbers
   }

5. SeatBooking created (30 min reservation)
   SeatBooking: {
     userId,
     seatNumbers,
     status: 'pending',
     expiryTime: now + 30min
   }

6. Response with orderId to client

7. Payment initiated using orderId
```

### 3.5.2 Payment Verification Flow
```
1. POST /api/payments/verify
   Request: {
     orderId,
     razorpayOrderId,
     razorpayPaymentId,
     razorpaySignature
   }

2. Server verifies signature using Razorpay

3. If verified:
   - Update Order status to 'confirmed'
   - Update Payment status to 'verified'
   - Update SeatBooking status to 'confirmed'
   - Response: success

4. If failed:
   - Update Order status to 'cancelled'
   - Update Payment status to 'failed'
   - Update SeatBooking status to 'cancelled'
   - Release seats
   - Response: error
```

---

## 3.6 Database Relationships

### One-to-Many (1:N)
```
User ──1──→ N── Orders
User ──1──→ N── Posts
User ──1──→ N── SeatBookings
User ──1──→ N── Payments
Food ──1──→ N── OrderItems
```

### Foreign Key References
```javascript
// In Order document
{
  userId: ObjectId (reference to User._id)
  items: [
    {
      foodId: ObjectId (reference to Food._id)
    }
  ]
  paymentId: ObjectId (reference to Payment._id)
}
```

---

## 3.7 Query Examples

### Common Queries

#### 1. Get user's order history
```javascript
Order.find({ userId: user_id })
  .sort({ createdAt: -1 })
  .limit(10)
  .populate('items.foodId')
  .populate('userId');
```

#### 2. Get available foods by category
```javascript
Food.find({
  category: 'meals',
  isAvailable: true
})
.sort({ createdAt: -1 });
```

#### 3. Get active seat bookings
```javascript
SeatBooking.find({
  status: 'confirmed',
  expiryTime: { $gt: new Date() }
})
.populate('userId');
```

#### 4. Get payment history with order details
```javascript
Payment.find({ userId: user_id })
  .populate('orderId')
  .sort({ createdAt: -1 });
```

#### 5. Get trending foods (most ordered)
```javascript
Order.aggregate([
  { $unwind: '$items' },
  { $group: {
      _id: '$items.foodId',
      count: { $sum: '$items.quantity' }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
  { $lookup: {
      from: 'foods',
      localField: '_id',
      foreignField: '_id',
      as: 'food'
    }
  }
]);
```

---

## 3.8 Data Validation

### Schema-level Validation
```javascript
// Required fields
name: { type: String, required: true }

// Enum validation
status: { type: String, enum: ['pending', 'confirmed', ...] }

// Numeric range validation
rating: { type: Number, min: 1, max: 5 }

// Unique constraints
email: { type: String, unique: true }

// Custom validators
seatNumbers: {
  validate: {
    validator: function(v) {
      return v.every(seat => seat >= 1 && seat <= 15);
    }
  }
}
```

---

## 3.9 Backup & Disaster Recovery

### Backup Strategy
- **Frequency**: Daily automated backups
- **Location**: MongoDB Atlas cloud backups
- **Retention**: 30 days
- **Type**: Full snapshots + incremental

### Recovery Procedures
```
Database Failure
  ↓
1. Detect via monitoring alerts
  ↓
2. Restore from latest backup (< 24 hrs)
  ↓
3. Verify data integrity
  ↓
4. Switch to restored instance
  ↓
5. Update connection string
  ↓
6. Verify all services
```

---

## 3.10 Performance Optimization

### Query Optimization Tips
1. **Use indexes** for frequently queried fields
2. **Limit fields** returned using projection
3. **Batch operations** instead of single operations
4. **Use aggregation pipeline** for complex queries
5. **Paginate results** for large datasets

### Example - Optimized Query
```javascript
// Bad: Returns all fields
Order.find({ userId: id });

// Good: Returns only needed fields + index usage
Order.find({ userId: id })
  .select('items totalAmount status createdAt')
  .sort({ createdAt: -1 })
  .limit(10);
```

---

## Summary

The QuickTap database design:
- ✅ **Normalized structure** for data integrity
- ✅ **Strategic indexes** for query performance
- ✅ **Document flexibility** for future enhancements
- ✅ **Referential integrity** through Mongoose
- ✅ **Automatic cleanup** with TTL indexes
- ✅ **Scalable design** with partitioning ready

The schema supports all current features while maintaining the flexibility to add new features without major restructuring.

---

**Next Document**: [4-API-DOCUMENTATION.md](./4-API-DOCUMENTATION.md)
