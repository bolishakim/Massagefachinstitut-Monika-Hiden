# 🚀 Development Server Startup Options

Multiple ways to start your development servers with ease!

## 🎯 Quick Start (Recommended)

### Option 1: Simple Command
```bash
npm run dev
```
**What it does:** Starts both servers in a single terminal with colored output

### Option 2: VS Code Command Palette
1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Tasks: Run Task"
3. Select "Start Dev Servers"

## 🔧 All Available Options

| Method | Command | Description | Best For |
|--------|---------|-------------|----------|
| **Node.js Script** | `npm run dev` | Both servers in one terminal | Quick development |
| **Simple Shell** | `npm run dev:simple` | Background servers with logs | Terminal users |
| **VS Code Split** | `npm run dev:split` | Attempts split terminals in VS Code | VS Code users |
| **VS Code Tasks** | Command Palette → "Start Dev Servers" | VS Code integrated | VS Code workflows |
| **Manual Split** | See instructions below | Full control over terminals | Advanced users |

## 📱 Server URLs

Once started, your servers will be available at:

- **🎨 Frontend**: http://localhost:3100
- **🔌 Backend**: http://localhost:3050  
- **🏥 Health Check**: http://localhost:3050/health

## 🖥️ Manual Split Terminal Setup

If you prefer manual control:

### In VS Code:
1. Open terminal: `Cmd+Shift+`` ` (macOS) or `Ctrl+Shift+`` ` (Windows)
2. Split terminal: `Cmd+\` (macOS) or `Ctrl+Shift+5` (Windows)
3. **First Terminal** (Backend):
   ```bash
   cd backend && npm run dev
   ```
4. **Second Terminal** (Frontend):
   ```bash
   cd frontend && npm run dev
   ```

### In External Terminal:
Open two terminal windows/tabs and run the commands above.

## 🛠️ Troubleshooting

### Port Already in Use
The scripts automatically kill existing processes, but if you get port errors:

```bash
# Kill specific ports manually
lsof -ti:3050 | xargs kill -9  # Backend
lsof -ti:3100 | xargs kill -9  # Frontend
```

### Servers Won't Start
1. Check that you're in the project root directory
2. Ensure both `./frontend` and `./backend` directories exist
3. Verify `package.json` exists in both subdirectories:
   ```bash
   ls frontend/package.json backend/package.json
   ```

### VS Code Split Not Working
The auto-split feature uses AppleScript on macOS and may not work on all systems. Use the manual method instead.

## 🎨 Output Colors

The Node.js script (`npm run dev`) prefixes all output:
- `[Backend]` - Backend server output in one color
- `[Frontend]` - Frontend server output in another color

## ⚡ Quick Tips

- **Stop servers**: `Ctrl+C` in any of the running terminals
- **Restart**: Just run the start command again (auto-cleanup included)
- **Single server**: Use `npm run dev` in the specific `frontend/` or `backend/` directory
- **Background mode**: Use `npm run dev:simple` to run in background with log files

## 📋 What Each Script Does

### `start-dev.js` (npm run dev)
- ✅ Cross-platform Node.js solution
- ✅ Colored/prefixed output
- ✅ Auto port cleanup
- ✅ Graceful shutdown
- ✅ Single terminal

### `start-dev.sh` (npm run dev:simple) 
- ✅ Background execution
- ✅ Log files (`backend.log`, `frontend.log`)
- ✅ Live log tailing
- ✅ Process management

### `start-dev-vscode.sh` (npm run dev:split)
- ✅ Attempts VS Code automation (macOS)
- ✅ Fallback instructions
- ✅ Temporary helper scripts
- ⚠️  Platform dependent

Choose the option that works best for your workflow! 🎉