const http = require('http');

// Test function to make HTTP GET requests
function testEndpoint(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        message: jsonData.message,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        message: data,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

// Test function to make HTTP POST requests
function testEndpointPost(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        message: jsonData.message,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        message: data,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Authentication System...\n');

    try {
        // Test 1: No authentication headers
        console.log('Test 1: No authentication headers');
        const test1 = await testEndpoint('/api/sellers/my-items');
        console.log(`Status: ${test1.statusCode}, Message: "${test1.message}"\n`);

        // Test 2: Invalid/temporary userId
        console.log('Test 2: Temporary userId (temp123)');
        const test2 = await testEndpoint('/api/sellers/my-items', { 'userid': 'temp123' });
        console.log(`Status: ${test2.statusCode}, Message: "${test2.message}"\n`);

        // Test 3: Invalid ObjectId format
        console.log('Test 3: Invalid ObjectId format');
        const test3 = await testEndpoint('/api/sellers/my-items', { 'userid': 'invalid123' });
        console.log(`Status: ${test3.statusCode}, Message: "${test3.message}"\n`);

        // Test 4: Valid ObjectId but non-existent user
        console.log('Test 4: Valid ObjectId but non-existent user');
        const test4 = await testEndpoint('/api/sellers/my-items', { 'userid': '507f1f77bcf86cd799439011' });
        console.log(`Status: ${test4.statusCode}, Message: "${test4.message}"\n`);

        // Test 5: Photo upload without auth
        console.log('Test 5: Photo upload without authentication');
        const test5 = await testEndpoint('/api/products/123/photo');
        console.log(`Status: ${test5.statusCode}, Message: "${test5.message}"\n`);

        // Test 6: Refresh endpoint without auth (POST method)
        console.log('Test 6: Refresh endpoint without authentication');
        const test6 = await testEndpointPost('/api/auth/refresh');
        console.log(`Status: ${test6.statusCode}, Message: "${test6.message}"\n`);

        console.log('✅ All authentication tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();
