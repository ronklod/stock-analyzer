#!/bin/bash

echo "Stock Analyzer Web Application Launcher"
echo "======================================"
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

# Check if frontend port is available
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing process or change the port in package.json"
    exit 1
fi

echo "Starting Backend Server (FastAPI)..."
echo "Backend will run on http://localhost:5001"
echo "API Documentation available at http://localhost:5001/docs"
python app_fastapi.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

echo ""
echo "Starting Frontend Server (React)..."
echo "Frontend will run on http://localhost:3000"
cd frontend && npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "======================================"
echo "Both servers are starting..."
echo "Backend: http://localhost:5001"
echo "API Docs: http://localhost:5001/docs"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "======================================"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for both processes
wait 