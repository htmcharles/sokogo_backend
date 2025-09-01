/**
 * 🧪 TEST PUBLISHING WITHOUT AUTHENTICATION
 * This test verifies that car listings can be published without login prompts
 */

// Use built-in fetch (Node.js 18+) or create simple test

const API_BASE_URL = 'http://localhost:8000/api';

async function testPublishWithoutAuth() {
  console.log('🧪 Testing car listing publish WITHOUT authentication...');

  try {
    // Simple test - just check if endpoint is accessible
    console.log('📤 Testing endpoint accessibility...');
    console.log('🔓 NO authentication required!');
    
    // Add car details
    formData.append('title', 'Test Car 2020 Honda Civic - No Auth Required');
    formData.append('description', 'This car was published without any authentication prompts!');
    formData.append('price', '18000');
    formData.append('currency', 'USD');
    formData.append('year', '2020');
    formData.append('make', 'Honda');
    formData.append('model', 'Civic');
    formData.append('mileage', '45000 km');
    formData.append('transmission', 'Manual');
    formData.append('fuelType', 'Petrol');
    formData.append('color', 'Blue');
    formData.append('location', JSON.stringify({ city: 'Kigali', country: 'Rwanda' }));
    formData.append('contactPhone', '+250788999888');

    console.log('📤 Sending request to:', `${API_BASE_URL}/sellers/cars/create-listing`);
    console.log('🔓 NO authentication headers included');

    // Make request WITHOUT any authentication
    const response = await fetch(`${API_BASE_URL}/sellers/cars/create-listing`, {
      method: 'POST',
      body: formData
      // NO Authorization header
      // NO userid header
      // NO authentication at all!
    });

    const data = await response.json();

    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS! Car listing published WITHOUT authentication!');
      console.log('🎉 Listing ID:', data.listing?._id);
      console.log('📸 Photos uploaded:', data.uploadedPhotos || 0);
      console.log('🚗 Car title:', data.listing?.title);
      
      return {
        success: true,
        message: 'Car published successfully without authentication!',
        listingId: data.listing?._id
      };
    } else {
      console.log('❌ FAILED! Still getting authentication error:');
      console.log('Error message:', data.message);
      
      if (data.message && data.message.includes('log in')) {
        console.log('🚨 ISSUE: Authentication is still required!');
        console.log('💡 The middleware is still blocking the request');
      }
      
      return {
        success: false,
        error: data.message,
        needsMoreFixes: data.message && data.message.includes('log in')
      };
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return {
      success: false,
      error: error.message,
      networkError: true
    };
  }
}

// Run the test
testPublishWithoutAuth().then(result => {
  console.log('\n🏁 TEST RESULT:');
  console.log('================');
  
  if (result.success) {
    console.log('✅ AUTHENTICATION BYPASS SUCCESSFUL!');
    console.log('🎯 You can now publish car listings without login prompts!');
    console.log('📝 Listing ID:', result.listingId);
  } else if (result.needsMoreFixes) {
    console.log('🔧 STILL NEEDS FIXES:');
    console.log('❌ Authentication middleware is still active');
    console.log('💡 Need to remove more authentication checks');
  } else if (result.networkError) {
    console.log('🌐 NETWORK ISSUE:');
    console.log('❌ Cannot connect to server');
    console.log('💡 Make sure server is running on port 8000');
  } else {
    console.log('❓ UNKNOWN ISSUE:');
    console.log('❌ Error:', result.error);
  }
  
  console.log('================\n');
}).catch(error => {
  console.error('🚨 Test failed with error:', error);
});

module.exports = { testPublishWithoutAuth };
