# 6. Development Guide & Setup

## 📋 Document Information
- **Document Title**: QuickTap - Development Setup & Contribution Guide
- **Version**: 1.0
- **Date**: December 2025

---

## 6.1 Development Environment Setup

### 6.1.1 Prerequisites

**Required Software**:
- Node.js 18.x or higher ([Download](https://nodejs.org))
- npm 9.x or yarn 3.x
- Git 2.30+ ([Download](https://git-scm.com))
- MongoDB 7.x (Local) or MongoDB Atlas account
- Visual Studio Code (Recommended)

**Verify Installations**:
```bash
node --version     # v18.x.x
npm --version      # 9.x.x
git --version      # 2.30+
mongod --version   # v7.x.x (if using local)
```

---

### 6.1.2 Clone Repository

```bash
# Clone the repository
git clone https://github.com/Anandhuuu07/quicktap.git
cd quicktap

# Verify structure
ls -la
# Should see: client/, server/, package.json, README.md
```

---

### 6.1.3 Install Dependencies

```bash
# Install root dependencies (for concurrently)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Verify installations
npm ls --depth=0  # Check all installed packages
```

---

## 6.2 Environment Configuration

### 6.2.1 Server Configuration

**Create `server/.env`**:
```bash
cd server
cp env.example .env
# Edit .env with your credentials
```

**File**: `server/.env`
```env
# ============ SERVER CONFIGURATION ============
PORT=5000
NODE_ENV=development
SERVER_URL=http://localhost:5000

# ============ DATABASE ============
DB_URL=mongodb://localhost:27017/quicktap
# OR for MongoDB Atlas
# DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/quicktap

# ============ JWT ============
JWT_SECRET=development_secret_key_change_in_production
JWT_TIMEOUT=3d

# ============ GOOGLE OAUTH ============
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# ============ RAZORPAY ============
RAZORPAY_KEY_ID=rzp_test_key
RAZORPAY_KEY_SECRET=rzp_test_secret

# ============ CLOUDINARY ============
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ============ OPENROUTER AI (CHATBOT) ============
VITE_OPENROUTER_API_KEY=your-openrouter-key

# ============ CLIENT-SIDE VARIABLES ============
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_RAZORPAY_KEY_ID=rzp_test_key

# ============ GOOGLE MAPS ============
GOOGLE_MAPS_REVIEW_URL=https://share.google/...
```

### 6.2.2 Client Configuration

**Create `client/.env`**:
```bash
cd client
cp .env.example .env
# Edit .env with your credentials
```

**File**: `client/.env`
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id

# Razorpay Payment
VITE_RAZORPAY_KEY_ID=rzp_test_key

# OpenRouter AI (Chatbot)
VITE_OPENROUTER_API_KEY=your-openrouter-api-key

# Google Maps Reviews
VITE_GOOGLE_MAPS_REVIEW_URL=https://share.google/...

# Note: API URL is auto-detected, no need to configure
```

---

## 6.3 Getting API Credentials

### 6.3.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credential (Web application)
5. Add authorized origins:
   ```
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   http://127.0.0.1:3000
   ```
6. Add authorized redirect URIs:
   ```
   http://localhost:5000/auth/google
   http://localhost:5000/auth/google/callback
   ```
7. Copy Client ID and Client Secret

### 6.3.2 Razorpay

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Signup/Login
3. Navigate to Settings → API Keys
4. Copy Test Key ID and Test Secret

### 6.3.3 Cloudinary

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Signup/Login
3. Find your Cloud Name in dashboard
4. Go to Settings → API Keys
5. Copy API Key and API Secret

### 6.3.4 OpenRouter AI (Chatbot)

1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Copy the generated API key
6. Add to `client/.env` as `VITE_OPENROUTER_API_KEY`

**Features:**
- Free tier available with request limits
- Automatic model routing via `openrouter/auto`
- Fallback handling for quota limits
- Cost-effective alternative to direct Google/OpenAI APIs

---

## 6.4 Database Setup

### 6.4.1 Using Local MongoDB

```bash
# Start MongoDB service
mongod

# In another terminal, test connection
mongo

# Inside mongo shell
use quicktap
db.users.find()
```

### 6.4.2 Using MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account
3. Create cluster (free tier available)
4. Get connection string
5. Add to `.env` as `DB_URL`

### 6.4.3 Create Admin User

```bash
cd server
npm run setup-admin

# Follow prompts:
# Enter admin email: admin@quicktap.com
# Enter admin name: Admin User
```

---

## 6.5 Running Development Server

### 6.5.1 Option 1: Run Both Services

```bash
# From root directory
npm run dev

# This starts:
# - Server: http://localhost:5000
# - Client: http://localhost:5173
```

### 6.5.2 Option 2: Run Separately

**Terminal 1 - Server**:
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Client**:
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

### 6.5.3 Verify Services

**Server Check**:
```bash
curl http://localhost:5000/health
# Should return 200 OK
```

**Client Check**:
```
Open http://localhost:5173 in browser
Should load without errors
```

---

## 6.6 Project Structure Understanding

### Client Structure
```
client/src/
├── pages/          → Full page components (routed)
├── components/     → Reusable UI components
├── services/       → API calls & business logic
├── hooks/          → Custom React hooks
├── utils/          → Helper functions
├── types/          → TypeScript definitions
├── assets/         → Images, fonts
├── App.tsx         → Root component
└── main.tsx        → Entry point
```

### Server Structure
```
server/
├── routes/         → API endpoint definitions
├── controllers/    → Business logic per route
├── models/         → Mongoose schemas
├── middleware/     → Express middleware
├── services/       → Helper services
├── utils/          → Utility functions
├── config/         → Configuration files
└── index.js        → Entry point
```

---

## 6.7 Code Style & Best Practices

### 6.7.1 Naming Conventions

**Files**:
```
Components:  MyComponent.tsx (PascalCase)
Utilities:   myFunction.ts   (camelCase)
Constants:   MY_CONSTANT     (UPPER_SNAKE_CASE)
```

**Variables**:
```typescript
// Good
const userName = "John";
const getUserById = (id) => {};
let isLoading = false;

// Avoid
const user_name = "John";
const get_user = (id) => {};
let loading = false;
```

### 6.7.2 Component Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface Props {
  title: string;
  onClick: () => void;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({
  title,
  onClick
}) => {
  // 4. State
  const [count, setCount] = useState(0);

  // 5. Effects
  useEffect(() => {
    // setup
  }, []);

  // 6. Handlers
  const handleClick = () => {
    onClick();
  };

  // 7. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>
        Count: {count}
      </Button>
    </div>
  );
};
```

### 6.7.3 TypeScript Usage

```typescript
// Always use types
interface User {
  id: string;
  name: string;
  email: string;
}

// Type function parameters
const getUser = (userId: string): User => {
  // implementation
};

// Type component props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

### 6.7.4 Error Handling

```javascript
// Good: Specific error handling
try {
  const response = await api.post('/orders', data);
  return response.data;
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Order not found');
  } else if (error.response?.status === 500) {
    console.error('Server error');
  } else {
    console.error('Unknown error:', error);
  }
  throw error;
}

// Avoid: Generic catch-all
try {
  // something
} catch (error) {
  console.log('Error'); // Not helpful
}
```

---

## 6.8 Common Development Tasks

### 6.8.1 Add New API Endpoint

1. **Create Model** (if needed):
   ```javascript
   // server/models/newModel.js
   const schema = new Schema({ ... });
   module.exports = mongoose.model('NewModel', schema);
   ```

2. **Create Controller**:
   ```javascript
   // server/controllers/newController.js
   exports.create = async (req, res) => {
     try {
       // Business logic
       res.json({ data });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Create Routes**:
   ```javascript
   // server/routes/newRoutes.js
   router.post('/new', authenticateToken, newController.create);
   module.exports = router;
   ```

4. **Register Routes**:
   ```javascript
   // server/index.js
   app.use('/api/new', require('./routes/newRoutes'));
   ```

### 6.8.2 Add New Component

1. **Create Component**:
   ```tsx
   // client/src/components/MyComponent.tsx
   export const MyComponent = () => {
     return <div>Component</div>;
   };
   ```

2. **Export from index** (if using index.ts):
   ```typescript
   export * from './MyComponent';
   ```

3. **Use in Page**:
   ```tsx
   import { MyComponent } from '@/components';
   // Use in JSX
   ```

### 6.8.3 Create Database Query

```javascript
// Query with filtering
const orders = await Order.find({
  userId: userId,
  status: 'pending'
})
  .populate('items.foodId')
  .sort({ createdAt: -1 })
  .limit(10);

// Aggregation pipeline
const stats = await Order.aggregate([
  { $match: { status: 'delivered' } },
  { $group: {
      _id: '$userId',
      totalSpent: { $sum: '$totalAmount' }
    }
  },
  { $sort: { totalSpent: -1 } }
]);
```

---

## 6.9 Debugging

### 6.9.1 Browser DevTools

```javascript
// Console logging
console.log('Value:', value);
console.error('Error:', error);
console.warn('Warning:', warning);
console.table(arrayOfObjects);

// Debugger breakpoint
debugger;

// React DevTools
// Install React DevTools extension in browser
```

### 6.9.2 Server Debugging

**VS Code Debugger**:
1. Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/server/index.js",
         "restart": true,
         "console": "integratedTerminal"
       }
     ]
   }
   ```
2. Press F5 to debug

### 6.9.3 API Testing

**Using cURL**:
```bash
# GET request
curl http://localhost:5000/api/foods

# POST request
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"items": [...]}'
```

**Using Postman** (Recommended):
1. Download [Postman](https://www.postman.com/downloads/)
2. Import API endpoints
3. Test with different payloads

---

## 6.10 Testing

### 6.10.1 Manual Testing Checklist

**Authentication**:
- [ ] Google OAuth login works
- [ ] JWT token stored in localStorage
- [ ] Token used in API requests
- [ ] Logout clears token

**Food Ordering**:
- [ ] Browse foods by category
- [ ] Add to cart works
- [ ] Cart persists in localStorage
- [ ] Remove from cart works

**Seat Booking**:
- [ ] Seat status loads correctly
- [ ] Selecting seats works
- [ ] Unselecting seats works
- [ ] Seat reservation shows timer

**Payment**:
- [ ] Razorpay modal opens
- [ ] Payment verification works
- [ ] Order status updates after payment
- [ ] Seat booking confirmed

### 6.10.2 Browser Testing

**Desktop**:
- Chrome/Chromium
- Firefox
- Safari
- Edge

**Mobile**:
- iPhone (Safari)
- Android (Chrome)
- Test responsive design

---

## 6.11 Performance Optimization

### 6.11.1 Frontend Optimization

```typescript
// Lazy load routes
const Food = lazy(() => import('./pages/Food'));
const Admin = lazy(() => import('./pages/Admin'));

// Memoize expensive components
const MemoizedComponent = memo(ExpensiveComponent);

// Use useCallback for functions
const handleClick = useCallback(() => {
  // handler
}, []);

// Use useMemo for expensive calculations
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);
```

### 6.11.2 Backend Optimization

```javascript
// Add indexes for frequently queried fields
collection.createIndex({ userId: 1, createdAt: -1 });

// Limit fields returned
Model.find({}).select('field1 field2');

// Pagination
Model.find({})
  .skip((page - 1) * limit)
  .limit(limit);

// Connection pooling
mongoose.connect(url, {
  maxPoolSize: 10
});
```

---

## 6.12 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` |
| Port already in use | Change PORT in `.env` or kill process |
| Database connection fails | Check `DB_URL` and MongoDB running |
| CORS errors | Check CORS origins in `server/index.js` |
| Google OAuth fails | Verify Client ID and authorized origins |
| Env variables undefined | Check `.env` file exists and loaded |
| Build errors | Clear `node_modules` and `npm install` again |

### Debug Checklist

- [ ] All environment variables set
- [ ] Database is running
- [ ] No port conflicts
- [ ] Dependencies installed
- [ ] Browser cache cleared
- [ ] Check console for errors
- [ ] Network tab shows requests

---

## 6.13 Commits & Version Control

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:
```
feat(auth): add Google OAuth login
fix(food): correct category filtering
docs(api): update endpoint documentation
style(components): format button styling
refactor(models): simplify user schema
test(orders): add order creation tests
chore(deps): update dependencies
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat(feature): description"

# Push to GitHub
git push origin feature/my-feature

# Create Pull Request
# Go to GitHub → Create PR → Wait for review

# After merge, delete branch
git branch -d feature/my-feature
```

---

## Summary

**Development Workflow**:
1. Clone repository
2. Setup environment variables
3. Install dependencies
4. Start local servers
5. Make changes
6. Test locally
7. Commit and push
8. Create pull request

**Key Commands**:
```bash
npm install          # Install dependencies
npm run dev          # Run both services
npm run build        # Build for production
npm start            # Start production
npm run setup-admin  # Create admin user
```

---

**Next Document**: [7-TESTING-AND-TROUBLESHOOTING.md](./7-TESTING-AND-TROUBLESHOOTING.md)
