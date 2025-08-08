#!/bin/bash

# Development Server Startup Script
# This script starts both frontend and backend servers

echo "🚀 Starting Development Servers..."

# Check if we're in the right directory
if [[ ! -d "frontend" || ! -d "backend" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure: ./frontend and ./backend directories"
    exit 1
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        return 0
    fi
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
lsof -ti:3050 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to free up
sleep 2

# Check if required files exist
if [[ ! -f "backend/package.json" ]]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

if [[ ! -f "frontend/package.json" ]]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Start backend server in background
echo "🔧 Starting Backend Server (port 3050)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo "🎨 Starting Frontend Server (port 3100)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for both to start
sleep 3

# Check if processes are running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend Server started (PID: $BACKEND_PID)"
else
    echo "❌ Backend Server failed to start"
    echo "📋 Backend log:"
    tail -n 10 backend.log
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend Server started (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend Server failed to start"
    echo "📋 Frontend log:"
    tail -n 10 frontend.log
fi

# Display server URLs
echo ""
echo "🌐 Server URLs:"
echo "   📱 Frontend: http://localhost:3100"
echo "   🔌 Backend:  http://localhost:3050"
echo "   🏥 Health:   http://localhost:3050/health"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM EXIT

echo "🎯 Both servers are running!"
echo "   Press Ctrl+C to stop both servers"
echo "   Log files: backend.log and frontend.log"
echo ""

# Tail both log files
echo "📋 Live logs (Ctrl+C to stop):"
tail -f backend.log frontend.log