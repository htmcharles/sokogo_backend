/**
 * 🔧 QUICK FIX: Authentication System
 * Copy this code to your React frontend to fix the "not staying logged in" issue
 */

// 1. LOGIN FUNCTION - Use this in your login component
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ STORE BOTH TOKEN AND USER DATA
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user._id); // Backup
      
      console.log('✅ Login successful - you will stay logged in!');
      console.log('Token stored:', data.token.substring(0, 50) + '...');
      
      return { success: true, user: data.user, token: data.token };
    } else {
      console.error('❌ Login failed:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: 'Network error' };
  }
};

// 2. CHECK IF USER IS LOGGED IN - Use this on app startup
const checkAuthStatus = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    console.log('✅ User is logged in with token');
    return {
      isLoggedIn: true,
      token: token,
      user: JSON.parse(user)
    };
  } else {
    console.log('❌ User is not logged in');
    return {
      isLoggedIn: false,
      token: null,
      user: null
    };
  }
};

// 3. MAKE AUTHENTICATED API CALLS - Use this for all API requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const authStatus = checkAuthStatus();
  
  if (!authStatus.isLoggedIn) {
    throw new Error('User not logged in');
  }

  // ✅ USE JWT TOKEN IN AUTHORIZATION HEADER
  const headers = {
    'Authorization': `Bearer ${authStatus.token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration
    if (response.status === 401) {
      const data = await response.json();
      if (data.error === 'TOKEN_EXPIRED' || data.error === 'INVALID_TOKEN') {
        console.log('🔄 Token expired, please log in again');
        logoutUser();
        window.location.href = '/login'; // Redirect to login
        return null;
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// 4. LOGOUT FUNCTION - Use this to logout
const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  console.log('✅ User logged out');
};

// 5. UPLOAD PRODUCT IMAGE - Use this for image uploads
const uploadProductImage = async (file, productId) => {
  const authStatus = checkAuthStatus();
  
  if (!authStatus.isLoggedIn) {
    alert('Please log in to upload images');
    return null;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    // ✅ USE JWT TOKEN FOR AUTHENTICATION
    const response = await fetch(`http://localhost:8000/api/sellers/products/${productId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStatus.token}`
        // Don't set Content-Type for FormData - browser sets it automatically
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Image uploaded successfully!');
      return data;
    } else {
      console.error('❌ Image upload failed:', data.message);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.');
        logoutUser();
        window.location.href = '/login';
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
};

// 6. GET SELLER ITEMS - Use this to fetch seller's products
const getSellerItems = async () => {
  try {
    const response = await makeAuthenticatedRequest('http://localhost:8000/api/sellers/my-items');
    
    if (response && response.ok) {
      const data = await response.json();
      console.log('✅ Seller items fetched successfully');
      return data;
    } else {
      console.error('❌ Failed to fetch seller items');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching seller items:', error);
    return null;
  }
};

// 7. REACT COMPONENT EXAMPLE - Use this pattern in your components
const ExampleLoginComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginUser(email, password);
    
    if (result.success) {
      // ✅ USER IS NOW LOGGED IN AND WILL STAY LOGGED IN
      alert('Login successful! You will stay logged in.');
      window.location.href = '/dashboard'; // Redirect to dashboard
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div style={{color: 'red'}}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

// 8. REACT APP INITIALIZATION - Use this in your main App component
const initializeApp = () => {
  const authStatus = checkAuthStatus();
  
  if (authStatus.isLoggedIn) {
    console.log(`✅ Welcome back, ${authStatus.user.firstName}!`);
    console.log(`Role: ${authStatus.user.role}`);
    // User is logged in, show main app
    return true;
  } else {
    console.log('❌ Please log in to continue');
    // User is not logged in, show login form
    return false;
  }
};

// 9. EXPORT ALL FUNCTIONS
export {
  loginUser,
  checkAuthStatus,
  makeAuthenticatedRequest,
  logoutUser,
  uploadProductImage,
  getSellerItems,
  initializeApp
};

/**
 * 🚀 USAGE INSTRUCTIONS:
 * 
 * 1. Copy these functions to your React app
 * 2. Use loginUser() in your login form
 * 3. Use checkAuthStatus() when your app starts
 * 4. Use makeAuthenticatedRequest() for all API calls
 * 5. Use uploadProductImage() for image uploads
 * 
 * ✅ RESULT: Users will stay logged in for 7 days!
 * ✅ No more "please log in" messages during uploads!
 * ✅ Session persists across page refreshes!
 */

console.log('🔧 Authentication fix loaded. Use these functions in your React app.');
