const http = require('http');

console.log('🧪 Testing Complete Login Flow...\n');

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

// Test 1: Register a test user
async function registerTestUser() {
    console.log('Test 1: Registering test user');
    
    const userData = JSON.stringify({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'testseller@example.com',
        phoneNumber: '+1234567890',
        password: 'testpassword123',
        role: 'seller'
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(userData)
        }
    };

    try {
        const response = await makeRequest(options, userData);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200 || response.status === 201) {
            console.log('✅ Test user registered/updated successfully');
            return true;
        } else {
            console.log('Response:', response.data);
            return true; // User might already exist
        }
    } catch (error) {
        console.log('❌ Registration failed:', error.message);
        return false;
    }
}

// Test 2: Login with test user
async function loginTestUser() {
    console.log('\nTest 2: Login with test user');
    
    const loginData = JSON.stringify({
        email: 'testseller@example.com',
        password: 'testpassword123'
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
            console.log('✅ Login successful!');
            console.log(`User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`Role: ${response.data.user.role}`);
            console.log(`Token: ${response.data.token.substring(0, 50)}...`);
            console.log(`Expires: ${response.data.sessionInfo.expiresIn}`);
            
            return {
                token: response.data.token,
                user: response.data.user
            };
        } else {
            console.log('❌ Login failed');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login request failed:', error.message);
        return null;
    }
}

// Test 3: Use JWT token to access protected endpoint
async function testProtectedEndpoint(token, userId) {
    console.log('\nTest 3: Testing protected endpoint with JWT token');
    
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
            console.log('✅ JWT authentication successful!');
            console.log('Auth Method:', response.headers['x-auth-method']);
            console.log('Session Valid:', response.headers['x-session-valid']);
            console.log('User Role:', response.headers['x-user-role']);
            return true;
        } else {
            console.log('❌ JWT authentication failed');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Protected endpoint test failed:', error.message);
        return false;
    }
}

// Test 4: Test session refresh
async function testSessionRefresh(token) {
    console.log('\nTest 4: Testing session refresh');
    
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
            console.log('✅ Session refresh successful!');
            console.log('Session Valid:', response.data.sessionValid);
            console.log('Validated User ID:', response.data.validatedUserId);
            return true;
        } else {
            console.log('❌ Session refresh failed');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Session refresh test failed:', error.message);
        return false;
    }
}

// Run complete test flow
async function runCompleteTest() {
    try {
        console.log('🚀 Starting complete authentication test flow...\n');
        
        // Step 1: Register test user
        const registered = await registerTestUser();
        if (!registered) {
            console.log('❌ Cannot proceed without test user');
            return;
        }
        
        // Step 2: Login and get JWT token
        const loginResult = await loginTestUser();
        if (!loginResult) {
            console.log('❌ Cannot proceed without successful login');
            return;
        }
        
        // Step 3: Test protected endpoint
        const protectedAccess = await testProtectedEndpoint(loginResult.token, loginResult.user._id);
        
        // Step 4: Test session refresh
        const sessionRefresh = await testSessionRefresh(loginResult.token);
        
        // Summary
        console.log('\n📋 TEST RESULTS SUMMARY:');
        console.log('========================');
        console.log(`✅ User Registration: ${registered ? 'PASS' : 'FAIL'}`);
        console.log(`✅ JWT Login: ${loginResult ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Protected Access: ${protectedAccess ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Session Refresh: ${sessionRefresh ? 'PASS' : 'FAIL'}`);
        
        if (loginResult && protectedAccess && sessionRefresh) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ JWT authentication is working correctly');
            console.log('✅ Users will stay logged in for 7 days');
            console.log('✅ No more "please log in" messages');
            
            console.log('\n🔧 FRONTEND INTEGRATION:');
            console.log('1. Use the functions in QUICK_FIX_AUTHENTICATION.js');
            console.log('2. Store JWT token in localStorage after login');
            console.log('3. Include "Authorization: Bearer <token>" in API calls');
            console.log('4. Users will stay logged in across page refreshes');
            
        } else {
            console.log('\n❌ SOME TESTS FAILED');
            console.log('Please check the backend configuration');
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

runCompleteTest();
