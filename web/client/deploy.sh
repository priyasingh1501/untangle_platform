#!/bin/bash

echo "🚀 Starting manual deployment to Vercel..."

# Clean install
echo "📦 Installing dependencies..."
npm ci

# Build locally to verify
echo "🔨 Building project..."
npm run vercel-build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Deploying to Vercel..."
    
    # Deploy to Vercel
    npx vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
    else
        echo "❌ Vercel deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
