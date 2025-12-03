# 7. Testing, Troubleshooting & Maintenance

## 📋 Document Information
- **Document Title**: QuickTap - Testing, Troubleshooting & Maintenance Guide
- **Version**: 1.0
- **Date**: December 2025

---

## 7.1 Testing Strategy

### 7.1.1 Testing Pyramid

```
        △
       /|\
      / | \
     /  |  \  E2E Tests (UI)
    /   |   \
   /────┼────\ Integration Tests
  /     |     \
 /──────┼──────\ Unit Tests (40%)
```

### Test Distribution
- **Unit Tests**: 40% - Component logic, utilities
- **Integration Tests**: 35% - API, database interactions
- **E2E Tests**: 25% - Full user workflows

---

## 7.2 Manual Testing Guide

### 7.2.1 Authentication Flow

**Test Scenario**: Google Login
```
1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Select/enter Google account
4. Verify: Redirected to /home
5. Verify: user-info in localStorage
6. Verify: JWT token present
7. Verify: Can access protected pages
8. Test logout: Token cleared
```

**Expected Behavior**:
- ✅ Login redirects to /home
- ✅ Token stored in localStorage
- ✅ Protected routes accessible
- ✅ Logout clears authentication
- ✅ Unauthorized access redirects to login

**Failure Cases**:
```
Error 400: redirect_uri_mismatch
├─ Solution: Add domain to Google Console OAuth settings

Error 401: Invalid token
├─ Solution: Clear localStorage, login again

CORS error
├─ Solution: Check CORS_ORIGIN in server .env
```

---

### 7.2.2 Food Ordering Flow

**Test Scenario**: Complete Order
```
1. Login with Google account
2. Navigate to /food
3. Verify: Food items load in categories
4. Select category (meals, appetizers, etc.)
5. Click add to cart on multiple items
6. Verify: Cart updates count
7. Click checkout
8. Select seats (1, 2, 3)
9. Verify: Seat status shows reserved
10. Proceed to payment
11. Use Razorpay test card: 4111 1111 1111 1111
12. Verify: Order created successfully
13. Check: Order status shows in order history
```

**Test Data**:
```
Razorpay Test Cards:
├─ Visa Success: 4111 1111 1111 1111
├─ Visa Failed: 4222 2222 2222 2222
├─ Mastercard: 5555 5555 5555 4444
├─ Expiry: Any future date (MM/YY)
└─ CVV: Any 3 digits
```

**Expected Results**:
- ✅ Foods display correctly
- ✅ Cart maintains state
- ✅ Seat selection works
- ✅ Payment modal opens
- ✅ Order confirmed after payment
- ✅ Seats marked as booked

---

### 7.2.3 Seat Booking Flow

**Test Scenario**: Seat Reservation
```
1. From Food page, proceed to checkout
2. Click "Select Seats"
3. Click available seat (green)
4. Verify: Seat turns blue (selected)
5. Select multiple seats (e.g., 1, 2, 3)
6. Verify: Count shows "3 seats selected"
7. Click confirm booking
8. Verify: Booking shows in active bookings
9. Verify: Timer shows 30 minutes
10. Wait 30 minutes OR manually trigger payment
11. Verify: Booking expires or confirms
```

**Seat Status**:
- 🟢 Green: Available
- 🔴 Red: Booked/Blocked
- 🔵 Blue: Selected
- ⚪ Grey: Expiring (timer running)

---

### 7.2.4 Payment Integration

**Test Scenario**: Razorpay Payment
```
1. Add items to cart and proceed to checkout
2. Select seats
3. Click "Pay Now"
4. Razorpay modal opens
5. Enter test card: 4111 1111 1111 1111
6. Enter future expiry date
7. Enter any 3-digit CVV
8. Click Pay
9. Verify: Redirect to success page
10. Check: Order status = confirmed
11. Check: Payment status = verified
12. Check: Seats = confirmed
```

**Failed Payment Test**:
```
1. Use failed test card: 4222 2222 2222 2222
2. Verify: Payment fails
3. Verify: Order status = cancelled
4. Verify: Seats released
5. Verify: Can retry booking
```

---

### 7.2.5 Admin Dashboard

**Test Scenario**: Admin Features
```
1. Login with admin account
2. Navigate to /admin
3. Verify: Dashboard loads
4. Check: Statistics display correctly
5. Test Food Management:
   ├─ Add new food
   ├─ Edit existing food
   └─ Delete food
6. Test Order Management:
   ├─ View all orders
   ├─ Update order status
   └─ View order details
7. Test Seat Management:
   ├─ View active bookings
   ├─ View expired bookings
   └─ Manual expire booking
8. Test Payment Tracking:
   ├─ View all payments
   ├─ Filter by status
   └─ View transaction details
```

---

## 7.3 Automated Testing (Future)

### 7.3.1 Unit Test Example

```javascript
// models/Food.test.js
describe('Food Model', () => {
  it('should create a food item', async () => {
    const food = await Food.create({
      name: 'Pizza',
      price: 299,
      category: 'meals'
    });
    
    expect(food._id).toBeDefined();
    expect(food.name).toBe('Pizza');
  });

  it('should validate required fields', async () => {
    try {
      await Food.create({ price: 299 });
      fail('Should throw error');
    } catch (error) {
      expect(error.message).toContain('required');
    }
  });
});
```

### 7.3.2 API Test Example

```javascript
// routes/food.test.js
describe('Food API', () => {
  it('GET /api/foods should return all foods', async () => {
    const response = await request(app)
      .get('/api/foods')
      .expect(200);
    
    expect(Array.isArray(response.body.foods)).toBe(true);
  });

  it('POST /api/foods should create food (admin only)', async () => {
    const response = await request(app)
      .post('/api/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Burger',
        price: 199,
        category: 'meals'
      })
      .expect(201);
    
    expect(response.body.food._id).toBeDefined();
  });
});
```

---

## 7.4 Troubleshooting Guide

### 7.4.1 Login Issues

**Problem**: Google login not working
```
Error: "redirect_uri_mismatch"
or
"This app's request is invalid"
```

**Debugging Steps**:
1. Check browser console for errors (F12)
2. Check VITE_GOOGLE_CLIENT_ID in client .env
3. Verify domain in Google Cloud Console:
   - Authorized JavaScript origins
   - Authorized redirect URIs
4. Check if using correct Google Client ID
5. Clear localStorage and try again

**Solution**:
```javascript
// 1. Go to Google Cloud Console
// 2. APIs & Services → Credentials
// 3. Find your OAuth 2.0 Client ID
// 4. Add authorized origins:
https://quicktap-s85x.onrender.com
https://localhost:5173
http://localhost:5173
// 5. Save and wait 5-10 minutes
```

---

**Problem**: "Unauthorized" after login
```
Error 401: Invalid token or missing authorization
```

**Debugging Steps**:
1. Check if token in localStorage: `localStorage.getItem('user-info')`
2. Verify token format (should have 3 parts with dots)
3. Check JWT_SECRET matches on server
4. Check token not expired

**Solution**:
```bash
# Clear and retry
localStorage.clear()
# Then login again
```

---

### 7.4.2 Payment Issues

**Problem**: "Payment failed" or "Payment verification failed"
```
Error: Error 400: Invalid payment ID
```

**Debugging Steps**:
1. Check Razorpay test mode is active
2. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
3. Use correct test card: 4111 1111 1111 1111
4. Check payment signature verification

**Solution**:
```javascript
// server/config/config.js
// Verify these are set correctly:
RAZORPAY_KEY_ID: "rzp_test_xxxxx"
RAZORPAY_KEY_SECRET: "xxxxx"

// Use test card for testing:
// 4111 1111 1111 1111
// Any future date
// Any 3-digit CVV
```

---

**Problem**: Razorpay modal not opening
```
Error: Razorpay object not found
or
Error: Invalid API key
```

**Solution**:
```html
<!-- Check index.html has Razorpay script -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

<!-- Verify VITE_RAZORPAY_KEY_ID is set in client .env -->
```

---

### 7.4.3 Database Issues

**Problem**: "Cannot connect to database"
```
Error: MongoNetworkError: Failed to connect to database
```

**Debugging Steps**:
1. Verify MongoDB is running: `mongod` or MongoDB Atlas connection
2. Check DB_URL in server .env
3. Verify username/password in connection string
4. Check IP whitelist in MongoDB Atlas
5. Test connection: `mongo "mongodb://localhost:27017"`

**Solution**:
```bash
# For local MongoDB
mongod &

# For MongoDB Atlas, get connection string:
# 1. Go to MongoDB Atlas Dashboard
# 2. Cluster → Connect → Copy connection string
# 3. Add to DB_URL in .env
# 4. Whitelist your IP address
```

---

**Problem**: Database query timeout
```
Error: Query timed out after 10000ms
```

**Solution**:
```javascript
// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });

// Optimize queries
Order.find({ userId })
  .select('items totalAmount status createdAt')
  .limit(10);
```

---

### 7.4.4 CORS Issues

**Problem**: CORS error in browser console
```
Error: Access to XMLHttpRequest at 'http://localhost:5000/api/foods'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**:
```javascript
// server/index.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://quicktap-s85x.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
```

---

### 7.4.5 Port Conflicts

**Problem**: "Port 5000 already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000
# or on Windows
netstat -ano | findstr :5000

# Kill process
kill -9 <PID>
# or change port in .env
PORT=5001
```

---

### 7.4.6 Environment Variable Issues

**Problem**: "Variable is undefined"
```
Error: Cannot read property 'xxx' of undefined
TypeError: process.env.VARIABLE is undefined
```

**Debugging**:
```bash
# Check .env file exists
ls -la server/.env

# Verify variable is set
grep VARIABLE server/.env

# Verify file is loaded on startup
# Should see: "Environment variables loaded" in logs
```

**Solution**:
```bash
# Restart server after changing .env
# Kill current process
Ctrl+C

# Restart
npm run dev
```

---

## 7.5 Performance Troubleshooting

### 7.5.1 Slow Page Load

**Diagnosis**:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check which requests are slow
5. Check response sizes

**Common Causes**:
- Large unoptimized images
- Multiple API calls on page load
- Missing indexes on database queries
- Unminified JavaScript in production

**Solutions**:
```javascript
// 1. Optimize images - use Cloudinary
// 2. Lazy load images
<img loading="lazy" src="..." />

// 3. Implement request caching
const cache = new Map();
const getCachedData = (key) => {
  if (cache.has(key)) return cache.get(key);
};

// 4. Add database indexes
collection.createIndex({ userId: 1 });

// 5. Use production build
npm run build
npm start
```

---

### 7.5.2 High CPU Usage

**Diagnosis**:
1. Check server logs
2. Monitor with: `top` or Task Manager
3. Look for infinite loops
4. Check database queries

**Solution**:
```javascript
// Add timeout to queries
Model.find({}).maxTime(10000); // 10 second timeout

// Paginate results
Model.find({})
  .skip((page - 1) * limit)
  .limit(limit);

// Add rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

---

## 7.6 Maintenance Tasks

### 7.6.1 Daily

- [ ] Check error logs
- [ ] Monitor uptime (99.5% target)
- [ ] Verify backups completed

### 7.6.2 Weekly

- [ ] Review performance metrics
- [ ] Check for security vulnerabilities
- [ ] Update critical dependencies
- [ ] Test payment processing

### 7.6.3 Monthly

- [ ] Update all dependencies
  ```bash
  npm outdated
  npm update
  ```
- [ ] Database optimization
- [ ] Review and delete old logs
- [ ] Performance profiling
- [ ] Security audit

### 7.6.4 Quarterly

- [ ] Full backup restore test
- [ ] Disaster recovery drill
- [ ] Feature compatibility review
- [ ] User feedback analysis

---

## 7.7 Monitoring & Logging

### 7.7.1 Enable Logging

```javascript
// server/index.js
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
};

app.use(requestLogger);
```

### 7.7.2 Log Levels

```javascript
console.log('INFO: Normal operation');
console.warn('WARNING: Potential issue');
console.error('ERROR: Operation failed');
console.debug('DEBUG: Detailed information');
```

### 7.7.3 Error Tracking

**Recommended Services**:
- Sentry (Error tracking)
- LogRocket (Session replay)
- New Relic (Performance monitoring)

---

## 7.8 Incident Response

### Incident Template

```
INCIDENT REPORT
===============
Date/Time: 2025-12-04 10:30 UTC
Severity: [Critical/High/Medium/Low]
Status: [Investigating/Resolved/Monitoring]
Impact: [Affecting X users, Y% of traffic]

DESCRIPTION:
[What happened]

ROOT CAUSE:
[Why it happened]

TIMELINE:
- 10:30: Issue detected
- 10:35: Investigation started
- 10:50: Solution deployed
- 11:00: Resolved

RESOLUTION:
[What was done]

PREVENTION:
[How to prevent in future]
```

---

## 7.9 Disaster Recovery

### Backup Verification

**Weekly Test**:
```bash
# 1. Verify backup exists
# MongoDB Atlas Dashboard → Backups

# 2. Test restore procedure
# Create test cluster and restore

# 3. Verify data integrity
# Check critical data present

# 4. Document restore time
# Record RTO (Recovery Time Objective)
```

---

## Summary

**Testing Components**:
- ✅ Manual testing procedures
- ✅ Test scenarios for each feature
- ✅ Razorpay payment testing
- ✅ Admin functionality testing

**Troubleshooting**:
- ✅ Common errors documented
- ✅ Debugging procedures
- ✅ Performance optimization
- ✅ Incident response

**Maintenance**:
- ✅ Daily/weekly/monthly tasks
- ✅ Monitoring setup
- ✅ Backup procedures
- ✅ Disaster recovery

---

## End of Documentation

**All 7 documents complete:**
1. ✅ [PROJECT-OVERVIEW](./1-PROJECT-OVERVIEW.md) - Vision, objectives, features
2. ✅ [SYSTEM-ARCHITECTURE](./2-SYSTEM-ARCHITECTURE.md) - Design, patterns, data flows
3. ✅ [DATABASE-DESIGN](./3-DATABASE-DESIGN.md) - Schema, models, queries
4. ✅ [API-DOCUMENTATION](./4-API-DOCUMENTATION.md) - Endpoints, requests, responses
5. ✅ [DEPLOYMENT-GUIDE](./5-DEPLOYMENT-GUIDE.md) - Infrastructure, monitoring, scaling
6. ✅ [DEVELOPMENT-GUIDE](./6-DEVELOPMENT-GUIDE.md) - Setup, coding standards, tasks
7. ✅ [TESTING-AND-TROUBLESHOOTING](./7-TESTING-AND-TROUBLESHOOTING.md) - Testing, debugging, maintenance

**Quick Links**:
- GitHub: https://github.com/Anandhuuu07/quicktap
- Live Demo: https://quicktap-s85x.onrender.com
- Contact: anandhua0079@gmail.com

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Status**: Complete & Ready for Production
