#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🚀 Starting Development Servers...');

// Check if we're in the right directory
const fs = require('fs');
if (!fs.existsSync('./frontend') || !fs.existsSync('./backend')) {
    console.error('❌ Error: Please run this script from the project root directory');
    console.error('   Expected structure: ./frontend and ./backend directories');
    process.exit(1);
}

// Kill existing processes on our ports
const killPort = (port) => {
    return new Promise((resolve) => {
        const killCmd = os.platform() === 'win32' 
            ? `netstat -ano | findstr :${port} | findstr LISTENING`
            : `lsof -ti:${port}`;
            
        exec(killCmd, (err, stdout) => {
            if (stdout && stdout.trim()) {
                const killCommand = os.platform() === 'win32'
                    ? `taskkill /F /PID ${stdout.split(/\s+/).pop()}`
                    : `kill -9 ${stdout.trim()}`;
                    
                exec(killCommand, () => resolve());
            } else {
                resolve();
            }
        });
    });
};

const startServers = async () => {
    console.log('🧹 Cleaning up existing processes...');
    await killPort(3050);
    await killPort(3100);
    
    // Wait for ports to free up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔧 Starting Backend Server (port 3050)...');
    const backend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(process.cwd(), 'backend'),
        stdio: 'pipe',
        shell: true
    });
    
    console.log('🎨 Starting Frontend Server (port 3100)...');
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(process.cwd(), 'frontend'),
        stdio: 'pipe',
        shell: true
    });
    
    // Handle backend output
    backend.stdout.on('data', (data) => {
        process.stdout.write(`[Backend] ${data}`);
    });
    
    backend.stderr.on('data', (data) => {
        process.stderr.write(`[Backend] ${data}`);
    });
    
    // Handle frontend output
    frontend.stdout.on('data', (data) => {
        process.stdout.write(`[Frontend] ${data}`);
    });
    
    frontend.stderr.on('data', (data) => {
        process.stderr.write(`[Frontend] ${data}`);
    });
    
    // Handle process exits
    backend.on('exit', (code) => {
        console.log(`\n💥 Backend server exited with code ${code}`);
        if (code !== 0) {
            frontend.kill();
        }
    });
    
    frontend.on('exit', (code) => {
        console.log(`\n💥 Frontend server exited with code ${code}`);
        if (code !== 0) {
            backend.kill();
        }
    });
    
    // Cleanup on exit
    const cleanup = () => {
        console.log('\n🛑 Shutting down servers...');
        backend.kill('SIGTERM');
        frontend.kill('SIGTERM');
        
        // Force kill after 5 seconds if they don't stop gracefully
        setTimeout(() => {
            backend.kill('SIGKILL');
            frontend.kill('SIGKILL');
            process.exit(0);
        }, 5000);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Wait a moment then display URLs
    setTimeout(() => {
        console.log('\n🌐 Server URLs:');
        console.log('   📱 Frontend: http://localhost:3100');
        console.log('   🔌 Backend:  http://localhost:3050');
        console.log('   🏥 Health:   http://localhost:3050/health');
        console.log('\n🎯 Both servers are running!');
        console.log('   Press Ctrl+C to stop both servers\n');
    }, 3000);
};

startServers().catch(console.error);