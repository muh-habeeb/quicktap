# 5. Deployment & Infrastructure Guide

## 📋 Document Information
- **Document Title**: QuickTap - Deployment & Infrastructure Guide
- **Version**: 1.0
- **Date**: December 2025

---

## 5.1 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           Development Environment               │
│  Localhost development with hot reload          │
│  Local MongoDB connection                       │
└────────────────────┬────────────────────────────┘
                     │
                     │ Push to GitHub
                     ↓
┌─────────────────────────────────────────────────┐
│        GitHub Repository (main branch)          │
│  https://github.com/Anandhuuu07/quicktap        │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
        ↓                        ↓
┌──────────────────┐    ┌──────────────────┐
│   Production     │    │ Staging (future) │
│ Render.com       │    │ Branch: develop  │
│ URL: quicktap-   │    │                  │
│ s85x.onrender.com│    │                  │
└──────────────────┘    └──────────────────┘
```

---

## 5.2 Current Deployment: Render.com

### 5.2.1 Why Render.com?

| Feature | Render | Heroku | AWS | Azure |
|---------|--------|--------|-----|-------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Cost | 💰 Free tier | 💰💰 | 💰💰💰 | 💰💰 |
| Auto-scaling | ✅ | ❌ | ✅ | ✅ |
| Uptime | 99.5% | 99.9% | 99.9%+ | 99.95% |
| GitHub Integration | ✅ | ✅ | Manual | Manual |
| Cold starts | ❌ | ⚠️ Yes | ❌ | ⚠️ |

### 5.2.2 Render Deployment Configuration

**Current Live URL**: https://quicktap-s85x.onrender.com

**Build Settings**:
```yaml
Build Command:
  cd client && npm install && npm run build && cd ../server && npm install

Start Command:
  cd server && npm start

Environment: Node.js 18
Region: US
```

**Environment Variables on Render**:
```
PORT=5000
NODE_ENV=production
DB_URL=mongodb+srv://...
JWT_SECRET=****
GOOGLE_CLIENT_ID=****
GOOGLE_CLIENT_SECRET=****
RAZORPAY_KEY_ID=****
RAZORPAY_KEY_SECRET=****
CLOUDINARY_CLOUD_NAME=****
CLOUDINARY_API_KEY=****
CLOUDINARY_API_SECRET=****
VITE_GOOGLE_CLIENT_ID=****
VITE_GOOGLE_GENAI_API_KEY=****
VITE_RAZORPAY_KEY_ID=****
GOOGLE_MAPS_REVIEW_URL=****
```

---

### 5.2.3 Deployment Steps on Render

#### Step 1: Connect GitHub Repository
1. Go to https://render.com/
2. Click "New+" → "Web Service"
3. Select "Connect a repository"
4. Authorize GitHub
5. Select `quicktap` repository
6. Choose `main` branch

#### Step 2: Configure Build & Start Commands
```
Environment: Node
Build Command: cd client && npm install && npm run build && cd ../server && npm install
Start Command: cd server && npm start
```

#### Step 3: Add Environment Variables
1. Go to Service Settings → Environment
2. Add all variables from `server/.env`
3. Click "Save and Deploy"

#### Step 4: Configure Google OAuth
1. Go to Google Cloud Console
2. Update "Authorized JavaScript origins":
   ```
   https://quicktap-s85x.onrender.com
   ```
3. Update "Authorized redirect URIs":
   ```
   https://quicktap-s85x.onrender.com
   ```

#### Step 5: Verify Deployment
1. Wait for build to complete (5-10 minutes)
2. Check logs for errors
3. Visit https://quicktap-s85x.onrender.com
4. Test login functionality

---

## 5.3 Database Setup: MongoDB Atlas

### 5.3.1 MongoDB Atlas Configuration

**Cluster Details**:
- **Cluster Name**: Cluster0
- **Provider**: AWS
- **Region**: US (N. Virginia)
- **Tier**: Shared (free tier with 512MB limit)

### 5.3.2 Connection String

```
mongodb+srv://username:password@cluster0.wkhtnns.mongodb.net/quicktap?retryWrites=true&w=majority
```

**In `.env`:
```
DB_URL=mongodb+srv://anandhua0079_db_user:aNECET39wirQy2SE@cluster0.wkhtnns.mongodb.net/quicktap?appName=Cluster0
```

### 5.3.3 Database Backup & Recovery

**Automatic Backups**:
- ✅ Enabled by default on Atlas
- ✅ Daily backups retained for 30 days
- ✅ Restore point-in-time recovery available

**Manual Backup Steps**:
1. MongoDB Atlas Dashboard
2. Select Cluster → Backup
3. Click "Backup now"
4. Name the backup
5. Backup completes within minutes

---

## 5.4 CDN & Static Assets

### 5.4.1 Cloudinary Configuration

**Purpose**: Image upload and storage

**Current Setup**:
```
Cloud Name: dta9j3y0h
API Key: 234732729581863
API Secret: kihv8FXOSsiV1JlZs9lcCu7njEE
```

**Upload Widget Implementation**:
```javascript
// Upload with Cloudinary Widget
const result = await uploadToCloudinary(file);
const imageUrl = result.secure_url;
```

---

## 5.5 SSL/TLS Certificate

**Current**: Automatically provided by Render
- ✅ Automatic renewal
- ✅ Let's Encrypt certificates
- ✅ HTTPS enforced

**Custom Domain** (if using):
1. Update DNS records to Render CNAME
2. Certificate auto-generates within 24 hours

---

## 5.6 Monitoring & Logging

### 5.6.1 Render Monitoring

**Access Logs**:
1. Render Dashboard → Service
2. Logs tab
3. Real-time log streaming

**Common Log Patterns**:
```
Server running on: http://localhost:5000 ✅
Database connected ✅
JWT_SECRET not set ❌
CORS error ❌
```

### 5.6.2 Alerts & Notifications

**Setup Email Alerts**:
1. Render Dashboard → Notifications
2. Add email address
3. Enable deployment alerts
4. Enable failure alerts

---

## 5.7 Performance Optimization for Production

### 5.7.1 Frontend Optimization

**Built assets**:
```
npm run build
# Output in client/dist/
```

**Optimization techniques**:
1. **Code Splitting**: Vite automatic
2. **Minification**: Vite automatic
3. **Asset Compression**: gzip enabled
4. **Lazy Loading**: Route-based
5. **Image Optimization**: Cloudinary CDN

### 5.7.2 Backend Optimization

**Database**:
- ✅ Indexes on frequently queried fields
- ✅ Query optimization
- ✅ Connection pooling

**Caching** (future):
- Redis for session cache
- API response caching

---

## 5.8 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Code reviewed and merged to main
- [ ] Version number updated

### Deployment
- [ ] Push to GitHub main branch
- [ ] Monitor Render build logs
- [ ] Verify all endpoints working
- [ ] Check Google OAuth login
- [ ] Test payment flow
- [ ] Verify seat booking

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test from mobile devices
- [ ] Collect user feedback

---

## 5.9 Rollback Procedure

**If deployment fails**:

1. **Immediate Action**:
   ```bash
   # Render automatically keeps previous builds
   # Go to Render Dashboard → Deployments
   # Select previous working build
   # Click "Redeploy"
   ```

2. **Manual Rollback**:
   ```bash
   git revert <commit_hash>
   git push origin main
   # Render auto-redeploys
   ```

3. **Database Rollback**:
   ```
   MongoDB Atlas → Backup → Restore
   ```

---

## 5.10 Scaling Strategy

### Current Capacity
- **Render**: 2 GB RAM, 1 CPU (shared)
- **MongoDB**: 512 MB (free tier)
- **Concurrent Users**: ~100-500

### Scaling Plan

**Phase 1** (500-5000 users):
- Upgrade to Render Pro ($12/month)
- Upgrade MongoDB to M10 ($57/month)
- Add Redis cache

**Phase 2** (5000-50000 users):
- Multiple Render instances + Load balancer
- MongoDB M30 cluster
- Advanced caching strategy

**Phase 3** (50000+ users):
- Kubernetes orchestration
- Multi-region deployment
- Database sharding

---

## 5.11 Alternative Deployment Options

### 5.11.1 Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy both client and server
COPY client ./client
COPY server ./server

# Build client
WORKDIR /app/client
RUN npm install && npm run build

# Setup server
WORKDIR /app/server
RUN npm install

EXPOSE 5000

CMD ["npm", "start"]
```

**Build & Run**:
```bash
docker build -t quicktap .
docker run -p 5000:5000 -e DB_URL=... quicktap
```

### 5.11.2 Heroku Deployment

**Procfile**:
```
web: cd server && npm start
release: npm run setup-admin
```

**Deploy**:
```bash
heroku create quicktap
heroku config:set DB_URL=...
git push heroku main
```

### 5.11.3 AWS Deployment

**Using Elastic Beanstalk**:
```bash
eb init -p node.js-18 quicktap
eb create quicktap-env
eb deploy
```

---

## 5.12 Security Best Practices

### 5.12.1 Environment Secrets

**Render Secrets** (not in code):
```
✅ JWT_SECRET
✅ GOOGLE_CLIENT_SECRET
✅ RAZORPAY_KEY_SECRET
✅ CLOUDINARY_API_SECRET
✅ DB_URL (connection string)
```

**Never commit** to GitHub:
- .env files
- API keys
- Secrets

### 5.12.2 HTTPS/SSL
- ✅ Enforced on all endpoints
- ✅ Auto-renewing certificates
- ✅ HSTS headers enabled

### 5.12.3 CORS Configuration

**Allowed Origins**:
```javascript
const allowedOrigins = [
  'https://quicktap-s85x.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## 5.13 Maintenance & Updates

### Regular Maintenance
- **Daily**: Monitor logs and performance
- **Weekly**: Review error rates
- **Monthly**: Update dependencies
- **Quarterly**: Database optimization

### Dependency Updates

**Safe update process**:
```bash
# Check for updates
npm outdated

# Update with caution
npm update

# Test locally
npm run dev

# Commit and push
git add package.json package-lock.json
git commit -m "deps: update dependencies"
git push origin main
```

---

## 5.14 Disaster Recovery Plan

### Failure Scenarios

| Scenario | Impact | Recovery Time |
|----------|--------|----------------|
| App crash | Critical | 5-10 mins (auto-restart) |
| Database down | Critical | 30+ mins (restore backup) |
| Render service down | Critical | 1+ hour (manual intervention) |
| Memory leak | High | Auto-restart before crash |
| DNS issues | High | 1-24 hours (provider) |

### Recovery Steps

1. **Service Down**:
   - Check Render status page
   - Review error logs
   - Contact Render support if needed

2. **Database Issues**:
   - Restore from latest backup
   - Verify data integrity
   - Update connection string if needed

3. **Performance Degradation**:
   - Scale up resources
   - Clear caches
   - Optimize queries

---

## Summary

**Current Setup**:
- ✅ Render.com for hosting
- ✅ MongoDB Atlas for database
- ✅ Cloudinary for image CDN
- ✅ GitHub for version control
- ✅ SSL/TLS encryption
- ✅ Auto-scaling capabilities
- ✅ Automated backups

**Production URL**: https://quicktap-s85x.onrender.com

The deployment is production-ready with automatic scaling, monitoring, and backup capabilities.

---

**Next Document**: [6-DEVELOPMENT-GUIDE.md](./6-DEVELOPMENT-GUIDE.md)
