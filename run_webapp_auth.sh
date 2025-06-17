#!/bin/bash

# filepath: /Users/ronklod/ron_test_code/stock-analyzer/run_webapp_auth.sh

echo "Stock Analyzer Web Application with Authentication"
echo "================================================"
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

# Check for Google OAuth credentials
if grep -q "your-google-client-id" .env; then
    echo "⚠️  Google OAuth is not configured. Please update the .env file with your Google credentials"
    echo "   You can still use email/password authentication."
fi

# Install required dependencies
echo "Installing dependencies..."
pip install "passlib[bcrypt]" "python-jose[cryptography]" python-multipart authlib requests-oauthlib python-dotenv
cd frontend && npm install react-google-login && cd ..

echo "Creating database tables..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

echo "Starting Backend Server (FastAPI)..."
echo "Backend will run on http://localhost:5001"
echo "API Documentation available at http://localhost:5001/docs"
python app_fastapi.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

echo ""
echo "Starting Frontend Dev Server (React)..."
echo "Frontend will run on http://localhost:3000"
cd frontend && npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "================================================"
echo "Both servers are starting..."
echo "Backend: http://localhost:5001"
echo "API Docs: http://localhost:5001/docs"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================================"

# Setup trap to kill both processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

trap cleanup INT
wait
