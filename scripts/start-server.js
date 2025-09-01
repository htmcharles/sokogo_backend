#!/usr/bin/env node

/**
 * Smart server startup script that handles port conflicts
 * Usage: node scripts/start-server.js [port]
 */

const { exec, spawn } = require('child_process');
const path = require('path');

const requestedPort = process.argv[2] || process.env.PORT || process.env.port || 8000;
let currentPort = requestedPort;

console.log(`🚀 Starting Sokogo Backend Server...`);

function checkPort(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(true); // Port is free
            } else {
                resolve(false); // Port is in use
            }
        });
    });
}

function killPortProcesses(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve();
                return;
            }

            const lines = stdout.trim().split('\n');
            const pids = new Set();
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && !isNaN(pid)) {
                    pids.add(pid);
                }
            });

            if (pids.size === 0) {
                resolve();
                return;
            }

            console.log(`💀 Killing ${pids.size} process(es) on port ${port}...`);
            
            let killed = 0;
            pids.forEach(pid => {
                exec(`taskkill /PID ${pid} /F`, (killError) => {
                    killed++;
                    if (!killError) {
                        console.log(`✅ Killed PID ${pid}`);
                    }
                    if (killed === pids.size) {
                        setTimeout(resolve, 1000); // Wait a bit for processes to fully terminate
                    }
                });
            });
        });
    });
}

async function findAvailablePort(startPort) {
    for (let port = startPort; port <= startPort + 10; port++) {
        const isAvailable = await checkPort(port);
        if (isAvailable) {
            return port;
        }
    }
    return null;
}

async function startServer() {
    try {
        // First, try to free up the requested port
        console.log(`🔍 Checking port ${currentPort}...`);
        const isPortFree = await checkPort(currentPort);
        
        if (!isPortFree) {
            console.log(`⚠️  Port ${currentPort} is in use. Attempting to free it...`);
            await killPortProcesses(currentPort);
            
            // Check again after killing processes
            const isNowFree = await checkPort(currentPort);
            if (!isNowFree) {
                console.log(`❌ Could not free port ${currentPort}. Finding alternative...`);
                const alternativePort = await findAvailablePort(parseInt(currentPort) + 1);
                if (alternativePort) {
                    currentPort = alternativePort;
                    console.log(`✅ Using alternative port ${currentPort}`);
                } else {
                    console.error(`❌ No available ports found between ${currentPort} and ${parseInt(currentPort) + 10}`);
                    process.exit(1);
                }
            }
        }

        // Set the port environment variable
        process.env.PORT = currentPort;
        
        console.log(`🚀 Starting server on port ${currentPort}...`);
        
        // Start the main server
        const serverProcess = spawn('node', ['index.js'], {
            stdio: 'inherit',
            env: { ...process.env, PORT: currentPort }
        });

        serverProcess.on('error', (err) => {
            console.error('❌ Failed to start server:', err.message);
            process.exit(1);
        });

        serverProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Server exited with code ${code}`);
                process.exit(code);
            }
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGINT');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error starting server:', error.message);
        process.exit(1);
    }
}

startServer();
