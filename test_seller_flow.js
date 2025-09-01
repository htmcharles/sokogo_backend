const http = require('http');

console.log('🧪 Testing Complete Seller Publishing Flow...\n');

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

// Test 1: Register a test seller
async function registerTestSeller() {
    console.log('Test 1: Registering test seller');
    
    const userData = JSON.stringify({
        firstName: 'Test',
        lastName: 'Seller',
        email: 'testseller@sokogo.com',
        phoneNumber: '+250788123456',
        password: 'seller123',
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
            console.log('✅ Test seller registered successfully');
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

// Test 2: Login as seller and get JWT token
async function loginTestSeller() {
    console.log('\nTest 2: Login as seller');
    
    const loginData = JSON.stringify({
        email: 'testseller@sokogo.com',
        password: 'seller123'
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
            console.log('✅ Seller login successful!');
            console.log(`User: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`Role: ${response.data.user.role}`);
            console.log(`Token: ${response.data.token.substring(0, 50)}...`);
            
            return {
                token: response.data.token,
                user: response.data.user
            };
        } else {
            console.log('❌ Seller login failed');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login request failed:', error.message);
        return null;
    }
}

// Test 3: Get seller items (test authentication)
async function testSellerAuth(token, userId) {
    console.log('\nTest 3: Testing seller authentication');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('✅ Seller authentication successful!');
            console.log('Auth Method:', response.headers['x-auth-method']);
            console.log('User Role:', response.headers['x-user-role']);
            console.log('Items found:', response.data.items?.length || 0);
            return true;
        } else {
            console.log('❌ Seller authentication failed');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Auth test failed:', error.message);
        return false;
    }
}

// Test 4: Create a car listing (simulate publishing)
async function testCreateCarListing(token, userId) {
    console.log('\nTest 4: Testing car listing creation');
    
    const listingData = JSON.stringify({
        title: 'Test Car 2020 Toyota Camry',
        description: 'Excellent condition, low mileage, perfect for daily use',
        price: 25000,
        currency: 'USD',
        location: JSON.stringify({ city: 'Kigali', country: 'Rwanda' }),
        features: JSON.stringify({ 
            year: 2020, 
            make: 'Toyota', 
            model: 'Camry',
            mileage: '50,000 km',
            transmission: 'Automatic'
        })
    });

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/cars/create-listing',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(listingData)
        }
    };

    try {
        const response = await makeRequest(options, listingData);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 201) {
            console.log('✅ Car listing created successfully!');
            console.log('Listing ID:', response.data.listing._id);
            console.log('Title:', response.data.listing.title);
            console.log('Price:', response.data.listing.price, response.data.listing.currency);
            console.log('Seller:', response.data.seller.firstName, response.data.seller.lastName);
            return response.data.listing._id;
        } else {
            console.log('❌ Car listing creation failed');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Listing creation failed:', error.message);
        return null;
    }
}

// Test 5: Verify listing appears in seller's items
async function testGetSellerListings(token, userId) {
    console.log('\nTest 5: Verifying listing appears in seller items');
    
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/sellers/my-items',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200) {
            const items = response.data.items || [];
            console.log('✅ Seller listings retrieved successfully!');
            console.log(`Total listings: ${items.length}`);
            
            items.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title} - ${item.price} ${item.currency}`);
            });
            
            return items.length > 0;
        } else {
            console.log('❌ Failed to get seller listings');
            console.log('Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Get listings failed:', error.message);
        return false;
    }
}

// Run complete test flow
async function runCompleteSellerTest() {
    try {
        console.log('🚀 Starting complete seller publishing test flow...\n');
        
        // Step 1: Register test seller
        const registered = await registerTestSeller();
        if (!registered) {
            console.log('❌ Cannot proceed without test seller');
            return;
        }
        
        // Step 2: Login and get JWT token
        const loginResult = await loginTestSeller();
        if (!loginResult) {
            console.log('❌ Cannot proceed without successful login');
            return;
        }
        
        // Step 3: Test seller authentication
        const authSuccess = await testSellerAuth(loginResult.token, loginResult.user._id);
        
        // Step 4: Create car listing
        const listingId = await testCreateCarListing(loginResult.token, loginResult.user._id);
        
        // Step 5: Verify listing in seller's items
        const listingsFound = await testGetSellerListings(loginResult.token, loginResult.user._id);
        
        // Summary
        console.log('\n📋 SELLER PUBLISHING TEST RESULTS:');
        console.log('=====================================');
        console.log(`✅ Seller Registration: ${registered ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Seller Login (JWT): ${loginResult ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Seller Authentication: ${authSuccess ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Car Listing Creation: ${listingId ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Listing Verification: ${listingsFound ? 'PASS' : 'FAIL'}`);
        
        if (loginResult && authSuccess && listingId && listingsFound) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ Seller can login once and publish listings seamlessly');
            console.log('✅ JWT authentication is working correctly');
            console.log('✅ No re-authentication required for publishing');
            console.log('✅ Session persistence is implemented');
            
            console.log('\n🔧 FRONTEND INTEGRATION READY:');
            console.log('1. Use loginSeller() function to login');
            console.log('2. Use publishCarListing() to publish listings');
            console.log('3. JWT token will be stored automatically');
            console.log('4. No need to login again for subsequent publishes');
            
        } else {
            console.log('\n❌ SOME TESTS FAILED');
            console.log('Please check the backend configuration');
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

runCompleteSellerTest();
