#!/bin/bash
echo "Starting build process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Run build
echo "Running build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    ls -la build/
else
    echo "Build failed!"
    exit 1
fi
