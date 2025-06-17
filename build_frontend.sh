#!/bin/bash

# Build and deploy React frontend to FastAPI backend
# This script builds the React frontend and copies it to the FastAPI backend
# directory for serving as static files

echo "======================================================================"
echo "             Building and deploying React frontend"
echo "======================================================================"

# Navigate to the frontend directory
cd "$(dirname "$0")/frontend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Build the React app
echo "Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build React app"
    exit 1
fi

# Create directory for static files
cd ..
echo "Creating static files directory..."
mkdir -p frontend/build

# Copy built files to the FastAPI directory
echo "Copying built files to FastAPI directory..."
# No need to copy files since they're already in the right location

echo "======================================================================"
echo "Frontend build complete! The FastAPI server can now serve the React app."
echo "Run the FastAPI server with: python app_fastapi.py"
echo "======================================================================"
