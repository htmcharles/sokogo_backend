const http = require('http');

function testServer() {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('✅ Server is running successfully!');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
            
            // Test authentication endpoint
            testAuth();
        });
    });

    req.on('error', (e) => {
        console.error('❌ Server is not running:', e.message);
        console.log('💡 Try running: npm run start:safe');
    });

    req.end();
}

function testAuth() {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            const jsonData = JSON.parse(data);
            console.log('\n🔐 Authentication Test:');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Message: "${jsonData.message}"`);
            
            if (res.statusCode === 401 && jsonData.message === "User must be logged in") {
                console.log('✅ Authentication is working correctly!');
            } else {
                console.log('❌ Authentication may have issues');
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Auth test failed:', e.message);
    });

    req.end();
}

console.log('🧪 Verifying server status...');
testServer();
