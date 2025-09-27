# Environment Variables Setup Guide

## Quick Start

### 1. Generate Required Secrets
```bash
# Run the secret generator
node scripts/generate-secrets.js
```

### 2. Set Up Local Environment
```bash
# Copy example file
cp backend/env.example backend/.env

# Edit with your values
nano backend/.env
```

### 3. Set Up Production Environment

#### Railway (Backend)
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend project
3. Go to "Variables" tab
4. Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `MONGODB_URI` | Your MongoDB connection string | ✅ |
| `JWT_SECRET` | Generated secret (64 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Generated secret (64 chars) | ✅ |
| `ENCRYPTION_KEY` | Generated key (32 chars) | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `OPENAI_API_KEY` | Your OpenAI API key | ❌ |
| `USDA_API_KEY` | Your USDA API key | ❌ |

#### Vercel (Web App)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your web project
3. Go to "Settings" → "Environment Variables"
4. Add these variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-backend-url.railway.app` |
| `CI` | `false` |

## Detailed Setup

### MongoDB Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free account
3. Create new cluster
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for Railway)
6. Get connection string

### OpenAI Setup (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account
3. Go to "API Keys"
4. Create new secret key
5. Copy the key (starts with `sk-`)

### USDA API Setup (Optional)
1. Go to [USDA API](https://fdc.nal.usda.gov/api-guide.html)
2. Sign up for free
3. Get API key
4. Use for food nutrition data

## Environment File Template

Create `backend/.env` with this template:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Configuration (Generate these!)
JWT_SECRET=your-generated-jwt-secret-64-characters
JWT_REFRESH_SECRET=your-generated-jwt-refresh-secret-64-characters

# Encryption Configuration (Generate this!)
ENCRYPTION_KEY=your-generated-encryption-key-32-characters

# CSRF Protection (Generate this!)
CSRF_SECRET=your-generated-csrf-secret-32-characters

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# OpenAI API Key (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# USDA API Key (Optional)
USDA_API_KEY=your-usda-api-key

# Razorpay Keys (Optional)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-secret
```

## Security Best Practices

### ✅ Do:
- Use strong, random secrets
- Keep secrets secure
- Use different secrets for different environments
- Rotate secrets regularly
- Use environment-specific values

### ❌ Don't:
- Use simple passwords
- Commit secrets to version control
- Share secrets in plain text
- Use the same secrets everywhere
- Use production secrets in development

## Testing Your Setup

### 1. Test Local Environment
```bash
cd backend
npm run dev
```

Check if server starts without errors.

### 2. Test Production Environment
1. Deploy to Railway
2. Check health endpoint: `https://your-app.railway.app/api/health`
3. Verify all services are working

### 3. Test Web App
1. Deploy to Vercel
2. Check if web app loads
3. Test authentication
4. Verify API connectivity

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check if all required variables are set
   - Verify variable names are correct
   - Check for typos

2. **"MongoDB connection failed"**
   - Verify MongoDB URI is correct
   - Check if IP is whitelisted
   - Verify username/password

3. **"JWT verification failed"**
   - Check if JWT secrets are set
   - Verify secrets are different
   - Check token expiration

4. **"CORS error"**
   - Update CORS_ORIGIN with correct URLs
   - Check if frontend URL is included

### Getting Help

1. Check logs in Railway/Vercel dashboard
2. Verify environment variables are set
3. Test locally first
4. Check network connectivity

---

*This guide should help you set up all environment variables correctly!*
