# Vercel Deployment Guide

## Prerequisites
- Node.js 18+ (specified in .nvmrc)
- npm or yarn package manager

## Environment Variables
Set these in your Vercel dashboard:

1. **REACT_APP_API_URL**: Your Railway backend URL (e.g., `https://your-app.railway.app`)
2. **NODE_ENV**: `production`

## Build Commands
- **Default**: `npm run build`
- **Vercel-specific**: `npm run build:vercel` (ignores CI errors)

## Troubleshooting

### Build Fails with "Command npm run build exited with 1"
1. Check that all dependencies are properly installed
2. Ensure Node.js version is 18+
3. Verify environment variables are set correctly
4. Check Vercel build logs for specific error messages

### Common Issues
1. **Missing environment variables**: Set REACT_APP_API_URL in Vercel dashboard
2. **Node version mismatch**: Ensure .nvmrc specifies Node 18
3. **Build timeout**: The build should complete within Vercel's timeout limits

### Local Testing
Before deploying, test locally:
```bash
npm install
npm run build:vercel
```

### Vercel Configuration
The `vercel.json` file is configured to:
- Use the static build builder
- Set the correct output directory
- Use the Vercel-specific build command
- Handle client-side routing properly

## Support
If issues persist, check:
1. Vercel build logs for specific error messages
2. Node.js version compatibility
3. Environment variable configuration
4. Network connectivity for npm install
