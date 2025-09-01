#!/usr/bin/env node

/**
 * Script to kill processes using a specific port
 * Usage: node scripts/kill-port.js [port]
 * Example: node scripts/kill-port.js 8000
 */

const { exec } = require('child_process');
const port = process.argv[2] || '8000';

console.log(`🔍 Checking for processes using port ${port}...`);

// Find processes using the port
exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`✅ Port ${port} is free!`);
        return;
    }

    if (!stdout.trim()) {
        console.log(`✅ Port ${port} is free!`);
        return;
    }

    console.log(`📋 Processes using port ${port}:`);
    console.log(stdout);

    // Extract PIDs from netstat output
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
        console.log(`✅ No processes to kill on port ${port}`);
        return;
    }

    console.log(`💀 Killing ${pids.size} process(es)...`);
    
    pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
            if (killError) {
                console.log(`❌ Failed to kill PID ${pid}: ${killError.message}`);
            } else {
                console.log(`✅ Killed PID ${pid}`);
            }
        });
    });

    setTimeout(() => {
        console.log(`\n🚀 Port ${port} should now be free. You can start your server!`);
    }, 2000);
});
