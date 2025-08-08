#!/bin/bash

# VS Code Split Terminal Development Server Startup Script
# This script opens split terminals in VS Code and starts both servers

echo "🚀 Starting Development Servers in VS Code Split Terminals..."

# Check if we're in VS Code
if [[ -z "$VSCODE_IPC_HOOK" ]]; then
    echo "⚠️  Warning: This script is optimized for VS Code but can run anywhere"
fi

# Function to check if we're in the right directory
if [[ ! -d "frontend" || ! -d "backend" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure: ./frontend and ./backend directories"
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
lsof -ti:3050 | xargs kill -9 2>/dev/null || true
sleep 2

# Create a temporary script for the backend
cat > /tmp/start-backend.sh << 'EOF'
#!/bin/bash
echo "🔧 Starting Backend Server..."
echo "📂 Working directory: $(pwd)/backend"
echo "🌐 Server will be available at: http://localhost:3050"
echo "🏥 Health check: http://localhost:3050/health"
echo ""
cd backend && npm run dev
EOF

# Create a temporary script for the frontend  
cat > /tmp/start-frontend.sh << 'EOF'
#!/bin/bash
echo "🎨 Starting Frontend Server..."
echo "📂 Working directory: $(pwd)/frontend" 
echo "🌐 Server will be available at: http://localhost:3100"
echo ""
cd frontend && npm run dev
EOF

chmod +x /tmp/start-backend.sh /tmp/start-frontend.sh

# Get current directory for the commands
CURRENT_DIR=$(pwd)

echo "📱 Opening split terminals..."
echo ""
echo "🔧 Terminal 1: Backend Server (http://localhost:3050)"
echo "🎨 Terminal 2: Frontend Server (http://localhost:3100)"
echo ""

# For VS Code, we'll use osascript to send commands if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Use AppleScript to send commands to VS Code
    osascript -e "
    tell application \"Visual Studio Code\"
        activate
    end tell
    " 2>/dev/null || true
    
    # Wait a moment
    sleep 1
    
    # Send keyboard shortcut to split terminal (Cmd+Shift+5 is common for split)
    osascript -e "
    tell application \"System Events\"
        tell process \"Code\"
            keystroke \"j\" using {command down, shift down}
        end tell
    end tell
    " 2>/dev/null || true
    
    sleep 1
    
    # Type backend start command
    osascript -e "
    tell application \"System Events\"
        tell process \"Code\"
            keystroke \"cd '$CURRENT_DIR' && bash /tmp/start-backend.sh\"
            keystroke return
        end tell
    end tell
    " 2>/dev/null || true
    
    sleep 2
    
    # Split the terminal
    osascript -e "
    tell application \"System Events\"
        tell process \"Code\"
            keystroke \"\\\\\" using {command down}
        end tell
    end tell
    " 2>/dev/null || true
    
    sleep 1
    
    # Type frontend start command  
    osascript -e "
    tell application \"System Events\"
        tell process \"Code\"
            keystroke \"cd '$CURRENT_DIR' && bash /tmp/start-frontend.sh\"
            keystroke return
        end tell
    end tell
    " 2>/dev/null || true
    
    echo "✅ Commands sent to VS Code terminals!"
    echo ""
    echo "If the terminals didn't open automatically, you can:"
    echo "1. Open VS Code terminal (Cmd+Shift+` or Ctrl+Shift+`)"
    echo "2. Split the terminal (Cmd+\\ or Ctrl+Shift+5)"
    echo "3. Run these commands manually:"
    echo ""
    echo "   Terminal 1 (Backend):"
    echo "   cd '$CURRENT_DIR' && bash /tmp/start-backend.sh"
    echo ""
    echo "   Terminal 2 (Frontend):" 
    echo "   cd '$CURRENT_DIR' && bash /tmp/start-frontend.sh"
    
else
    # Non-macOS systems - just provide instructions
    echo "📋 Manual setup required for your system:"
    echo ""
    echo "1. Open VS Code terminal (Ctrl+Shift+\` or View > Terminal)"
    echo "2. Split the terminal (Ctrl+Shift+5 or click the split icon)"
    echo "3. In the first terminal, run:"
    echo "   cd '$CURRENT_DIR' && bash /tmp/start-backend.sh"
    echo ""
    echo "4. In the second terminal, run:"
    echo "   cd '$CURRENT_DIR' && bash /tmp/start-frontend.sh"
fi

echo ""
echo "🎯 Servers will be available at:"
echo "   🔌 Backend:  http://localhost:3050"
echo "   📱 Frontend: http://localhost:3100"
echo ""
echo "💡 Tip: You can also run the simple version with:"
echo "   ./start-dev.sh"