# Deployment Guide

## Overview

After the refactor, the deployment structure has been updated. Here's how to deploy each component:

## Backend Deployment (Railway)

### Configuration
- **File**: `backend/railway.json` ✅ (Already correct)
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

### Environment Variables Required
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-encryption-key
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

### Deploy Steps
1. Push changes to main branch
2. Railway will automatically deploy from `backend/` directory
3. Health check will verify deployment at `/api/health`

## Web App Deployment (Vercel)

### Configuration
- **File**: `vercel.json` ✅ (Updated)
- **Build Directory**: `web/client/build`
- **API URL**: Points to Railway backend

### Deploy Steps
1. Push changes to main branch
2. Vercel will build from `web/client/` directory
3. Static files will be served from `build/` directory

## Mobile App Deployment (Expo)

### Configuration
- **Directory**: `mobile/mobile/`
- **Platform**: Expo managed workflow

### Deploy Steps
1. Update `mobile/mobile/app.json` with correct API URL
2. Run `expo build` for production builds
3. Submit to app stores

## Environment Variables

### Backend (Railway)
```env
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-encryption-key

# Optional
OPENAI_API_KEY=your-openai-key
USDA_API_KEY=your-usda-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_SECRET=your-razorpay-secret
NODE_ENV=production
PORT=5000
```

### Web App (Vercel)
```env
REACT_APP_API_URL=https://untangle-production.up.railway.app
CI=false
```

## Health Checks

### Backend Health Check
- **URL**: `https://your-backend-url.railway.app/api/health`
- **Expected Response**: 
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "port": 5000,
  "environment": "production",
  "mongodb": "connected",
  "uptime": 123.456
}
```

## Deployment Checklist

### Before Deployment
- [ ] All environment variables are set
- [ ] Database is accessible
- [ ] Tests are passing (`npm run ci`)
- [ ] Build is successful (`npm run build`)

### After Deployment
- [ ] Health check passes
- [ ] API endpoints respond correctly
- [ ] Web app loads and connects to backend
- [ ] Mobile app can authenticate
- [ ] Error handling works correctly

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**
   - Verify environment variables
   - Check database connection
   - Review logs for specific errors

3. **CORS Issues**
   - Update CORS origin in backend config
   - Verify API URL in frontend

4. **Authentication Issues**
   - Check JWT secrets are set
   - Verify token expiration settings
   - Check user model validation

### Logs

- **Railway**: Check Railway dashboard for backend logs
- **Vercel**: Check Vercel dashboard for build logs
- **Expo**: Check Expo dashboard for build logs

## Rollback Plan

### Backend Rollback
1. Revert to previous commit in Railway
2. Verify health check passes
3. Test critical functionality

### Frontend Rollback
1. Revert to previous commit in Vercel
2. Verify web app loads
3. Test API connectivity

## Monitoring

### Key Metrics
- Response times
- Error rates
- Database connection status
- Memory usage
- CPU usage

### Alerts
- Health check failures
- High error rates
- Database connection issues
- Memory/CPU thresholds

---

*This deployment guide should be updated as the system evolves.*
