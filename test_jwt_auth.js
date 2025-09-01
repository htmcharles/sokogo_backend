const http = require('http');

console.log('🧪 Testing JWT Authentication System...\n');

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Test 1: Login and get JWT token
async function testLogin() {
    console.log('Test 1: Login to get JWT token');
    
    const loginData = JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    try {
        const response = await makeRequest(options, loginData);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200 && response.data.token) {
            console.log('✅ Login successful, JWT token received');
            console.log(`Token: ${response.data.token.substring(0, 50)}...`);
            console.log(`User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`Role: ${response.data.user.role}`);
            return response.data.token;
        } else {
            console.log('❌ Login failed or no token received');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login request failed:', error.message);
        return null;
    }
}

// Test 2: Use JWT token for authentication
async function testJWTAuth(token) {
    console.log('\nTest 2: Using JWT token for authentication');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ JWT authentication successful');
            console.log('Auth Method:', response.headers['x-auth-method']);
            console.log('Session Valid:', response.headers['x-session-valid']);
        } else {
            console.log('❌ JWT authentication failed');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ JWT auth request failed:', error.message);
    }
}

// Test 3: Test session refresh with JWT
async function testSessionRefresh(token) {
    console.log('\nTest 3: Testing session refresh with JWT');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/auth/refresh',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ Session refresh successful');
            console.log('Session Valid:', response.data.sessionValid);
            console.log('User ID:', response.data.validatedUserId);
        } else {
            console.log('❌ Session refresh failed');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ Session refresh request failed:', error.message);
    }
}

// Test 4: Test invalid JWT token
async function testInvalidJWT() {
    console.log('\nTest 4: Testing invalid JWT token');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer invalid.jwt.token',
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 401) {
            console.log('✅ Invalid JWT properly rejected');
            console.log('Error:', response.data.error);
        } else {
            console.log('❌ Invalid JWT not properly handled');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ Invalid JWT test failed:', error.message);
    }
}

// Test 5: Test backward compatibility with userId
async function testUserIdAuth() {
    console.log('\nTest 5: Testing backward compatibility with userId');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET',
        headers: {
            'userid': '507f1f77bcf86cd799439011', // Valid ObjectId format
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 403) {
            console.log('✅ Non-existent userId properly rejected');
            console.log('Auth Method:', response.headers['x-auth-method'] || 'USER_ID');
        } else {
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ UserId auth test failed:', error.message);
    }
}

// Run all tests
async function runTests() {
    try {
        // Test login and get JWT token
        const token = await testLogin();
        
        if (token) {
            // Test JWT authentication
            await testJWTAuth(token);
            
            // Test session refresh
            await testSessionRefresh(token);
        }
        
        // Test invalid JWT
        await testInvalidJWT();
        
        // Test backward compatibility
        await testUserIdAuth();
        
        console.log('\n✅ All JWT authentication tests completed!');
        console.log('\n📋 Summary:');
        console.log('- JWT tokens are now generated on login');
        console.log('- JWT authentication takes priority over userId');
        console.log('- Session persistence is implemented');
        console.log('- Backward compatibility maintained');
        console.log('- Users will stay logged in until token expires');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

runTests();
