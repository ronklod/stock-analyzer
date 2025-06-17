#!/bin/bash

echo "Stock Analyzer Web Application - Production Mode"
echo "==============================================="
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Check if backend port is available
if check_port 5001; then
    echo "⚠️  Port 5001 is already in use. Please stop the existing process or change the port in app_fastapi.py"
    exit 1
fi

# Build the React frontend
echo "Building React frontend..."
./build_frontend.sh

# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "⚠️  Frontend build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "Starting Server in Production Mode (FastAPI)..."
echo "App will run on http://localhost:5001"
echo "API Documentation available at http://localhost:5001/docs"
echo ""

python app_fastapi.py

echo ""
echo "Server stopped."
