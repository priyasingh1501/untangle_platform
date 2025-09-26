# 🚀 Untangle Application Deployment Guide

## Quick Deploy Options

### Option 1: Render (Recommended - Easiest)
1. **Sign up** at [render.com](https://render.com)
2. **Connect** your GitHub repository
3. **Import** using the `render.yaml` file
4. **Set environment variables**:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (random secret string)
   - `OPENAI_API_KEY` (your OpenAI API key)
   - `NODE_ENV=production`
5. **Deploy** - Render will automatically build and deploy both services
6. **Cost**: $7/month starter plan

### Option 2: Vercel + Railway (Cost Effective)
- **Frontend**: Vercel (free tier)
- **Backend**: Railway ($5/month)
- **Total Cost**: $5/month

#### Deploy Frontend to Vercel:
1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repository
3. Configure build settings:
   - Root Directory: `./`
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
4. Set environment variable: `REACT_APP_API_URL=https://your-railway-backend-url.railway.app`

#### Deploy Backend to Railway:
1. Go to [railway.app](https://railway.app) and sign up
2. Connect GitHub and select your repository
3. Set environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/untangle`
   - `JWT_SECRET=your_jwt_secret_here`
   - `OPENAI_API_KEY=sk-your_openai_key_here`

### Option 3: Railway (All-in-One)
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect** your GitHub repository
3. **Deploy** - Railway will auto-detect and deploy
4. **Set environment variables** in Railway dashboard
5. **Cost**: $5/month minimum

## Environment Variables Required

```bash
# Production Environment
NODE_ENV=production
PORT=10000 (or your preferred port)

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/untangle

# Security
JWT_SECRET=your_super_secret_jwt_key_here

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here
```

## MongoDB Atlas Setup (Recommended for Production)

1. **Create account** at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. **Create cluster** (free tier available)
3. **Create database user** with read/write permissions
4. **Get connection string** and replace `MONGODB_URI`
5. **Whitelist IP addresses** (0.0.0.0/0 for all IPs)

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection string updated
- [ ] JWT secret generated (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] OpenAI API key valid
- [ ] All dependencies in package.json
- [ ] Build script working locally (`npm run build`)

## Post-deployment

1. **Test API endpoints** at your deployed backend URL
2. **Test frontend** at your deployed frontend URL
3. **Monitor logs** for any errors
4. **Set up custom domain** if needed

## Troubleshooting

### Common Issues:
- **Build failures**: Check Node.js version compatibility
- **Database connection**: Verify MongoDB URI and network access
- **CORS errors**: Ensure frontend URL is whitelisted
- **Environment variables**: Double-check all required variables are set

### Support:
- Check deployment platform logs
- Verify environment variables
- Test locally with production settings
- Check MongoDB connection

## Cost Estimation

- **Render**: $7/month starter plan (no more free tier)
- **Railway**: $5/month minimum
- **Heroku**: $7/month minimum
- **Vercel**: Free tier available
- **MongoDB Atlas**: Free tier available (512MB), $9/month for paid plans

## Security Best Practices

1. **Never commit** `.env` files
2. **Use strong** JWT secrets
3. **Enable HTTPS** (automatic on most platforms)
4. **Regular updates** of dependencies
5. **Monitor** application logs
6. **Backup** database regularly
