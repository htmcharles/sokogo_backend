/**
 * 🚀 COMPLETE SELLER PUBLISH SOLUTION
 * Login once, publish listings seamlessly without re-authentication
 */

const API_BASE_URL = 'http://localhost:8000/api';

// ✅ 1. ENHANCED LOGIN FUNCTION (Stores JWT token properly)
const loginSeller = async (email, password) => {
  console.log('🔐 Logging in seller...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token && data.user) {
      // Store authentication data for persistent session
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user._id);
      
      console.log('✅ Seller logged in successfully!');
      console.log(`Welcome ${data.user.firstName} ${data.user.lastName}`);
      console.log(`Role: ${data.user.role}`);
      console.log('🔑 JWT Token stored for seamless publishing');
      
      return { 
        success: true, 
        user: data.user, 
        token: data.token,
        message: 'Login successful - you can now publish listings!' 
      };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error);
    return { 
      success: false, 
      error: error.message || 'Login failed' 
    };
  }
};

// ✅ 2. GET AUTHENTICATION HEADERS (JWT + UserId for compatibility)
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  if (!token || !userId) {
    throw new Error('Not logged in. Please login first.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'userid': userId, // For backward compatibility
    'Accept': 'application/json'
  };
};

// ✅ 3. PUBLISH CAR LISTING (Complete function)
const publishCarListing = async (listingData, photos = []) => {
  console.log('🚗 Publishing car listing...');
  
  try {
    // Check authentication
    const authHeaders = getAuthHeaders();
    
    // Prepare form data
    const formData = new FormData();
    
    // Add listing data
    formData.append('title', listingData.title);
    formData.append('description', listingData.description);
    formData.append('price', listingData.price);
    formData.append('currency', listingData.currency || 'Frw');
    
    // Add optional fields
    if (listingData.location) {
      formData.append('location', JSON.stringify(listingData.location));
    }
    if (listingData.features) {
      formData.append('features', JSON.stringify(listingData.features));
    }
    if (listingData.contactInfo) {
      formData.append('contactInfo', JSON.stringify(listingData.contactInfo));
    }

    // Add photos
    if (photos && photos.length > 0) {
      photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
      console.log(`📸 Added ${photos.length} photos to listing`);
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}/sellers/cars/create-listing`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        // Don't set Content-Type for FormData - browser sets it automatically
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Car listing published successfully!');
      console.log('Listing ID:', data.listing._id);
      console.log('Photos uploaded:', data.uploadedPhotos);
      
      return {
        success: true,
        listing: data.listing,
        message: 'Car listing published successfully!',
        listingId: data.listing._id,
        photosUploaded: data.uploadedPhotos
      };
    } else {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 Session expired, please login again');
        localStorage.clear();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(data.message || 'Failed to publish listing');
    }

  } catch (error) {
    console.error('❌ Failed to publish car listing:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish listing'
    };
  }
};

// ✅ 4. PUBLISH GENERAL PRODUCT (With images)
const publishProduct = async (productData, images = []) => {
  console.log('📦 Publishing product...');
  
  try {
    const authHeaders = getAuthHeaders();
    
    const formData = new FormData();
    
    // Add product data
    formData.append('title', productData.title);
    formData.append('description', productData.description);
    formData.append('price', productData.price);
    formData.append('category', productData.category || 'GENERAL');
    formData.append('subcategory', productData.subcategory || 'OTHER');
    formData.append('currency', productData.currency || 'Frw');
    
    // Add optional fields
    if (productData.location) {
      formData.append('location', JSON.stringify(productData.location));
    }
    if (productData.features) {
      formData.append('features', JSON.stringify(productData.features));
    }
    if (productData.contactInfo) {
      formData.append('contactInfo', JSON.stringify(productData.contactInfo));
    }

    // Add images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
      console.log(`📸 Added ${images.length} images to product`);
    }

    const response = await fetch(`${API_BASE_URL}/products/create-with-images`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Product published successfully!');
      console.log('Product ID:', data.product._id);
      
      return {
        success: true,
        product: data.product,
        message: 'Product published successfully!',
        productId: data.product._id
      };
    } else {
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(data.message || 'Failed to publish product');
    }

  } catch (error) {
    console.error('❌ Failed to publish product:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish product'
    };
  }
};

// ✅ 5. GET MY LISTINGS (Check what you've published)
const getMyListings = async () => {
  console.log('📋 Fetching my listings...');
  
  try {
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/sellers/my-items`, {
      method: 'GET',
      headers: authHeaders
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Listings fetched successfully!');
      console.log(`Found ${data.items?.length || 0} listings`);
      
      return {
        success: true,
        items: data.items || [],
        count: data.items?.length || 0
      };
    } else {
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(data.message || 'Failed to fetch listings');
    }

  } catch (error) {
    console.error('❌ Failed to fetch listings:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch listings'
    };
  }
};

// ✅ 6. ADD PHOTO TO EXISTING LISTING
const addPhotoToListing = async (listingId, photo) => {
  console.log('📸 Adding photo to listing:', listingId);
  
  try {
    const authHeaders = getAuthHeaders();
    
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await fetch(`${API_BASE_URL}/sellers/cars/${listingId}/upload-photo`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Photo added successfully!');
      return {
        success: true,
        imageUrl: data.filePath,
        message: 'Photo added successfully!'
      };
    } else {
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(data.message || 'Failed to add photo');
    }

  } catch (error) {
    console.error('❌ Failed to add photo:', error);
    return {
      success: false,
      error: error.message || 'Failed to add photo'
    };
  }
};

// ✅ 7. CHECK LOGIN STATUS
const checkLoginStatus = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      console.log('✅ User is logged in:', userData.firstName);
      console.log('Role:', userData.role);
      
      return {
        isLoggedIn: true,
        user: userData,
        token: token,
        isSeller: userData.role === 'seller'
      };
    } catch (error) {
      console.error('❌ Invalid user data');
      localStorage.clear();
      return { isLoggedIn: false };
    }
  }
  
  console.log('❌ User is not logged in');
  return { isLoggedIn: false };
};

// ✅ 8. LOGOUT FUNCTION
const logoutSeller = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  console.log('✅ Seller logged out successfully');
};

// Export all functions
export {
  loginSeller,
  publishCarListing,
  publishProduct,
  getMyListings,
  addPhotoToListing,
  checkLoginStatus,
  logoutSeller
};

/**
 * 🚀 USAGE EXAMPLE:
 * 
 * // 1. Login once
 * const loginResult = await loginSeller('seller@example.com', 'password');
 * if (loginResult.success) {
 *   console.log('Logged in successfully!');
 * }
 * 
 * // 2. Publish car listing (no re-login needed!)
 * const carData = {
 *   title: '2020 Toyota Camry',
 *   description: 'Excellent condition, low mileage',
 *   price: 25000,
 *   currency: 'USD'
 * };
 * const photos = [file1, file2]; // File objects from input
 * const result = await publishCarListing(carData, photos);
 * 
 * // 3. Check your listings
 * const myListings = await getMyListings();
 * console.log('My listings:', myListings.items);
 */

// ✅ 9. REACT COMPONENT EXAMPLE
const SellerDashboard = () => {
  const [loginStatus, setLoginStatus] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check login status on component mount
  useEffect(() => {
    const status = checkLoginStatus();
    setLoginStatus(status);

    if (status.isLoggedIn && status.isSeller) {
      loadMyListings();
    }
  }, []);

  const loadMyListings = async () => {
    const result = await getMyListings();
    if (result.success) {
      setListings(result.items);
    }
  };

  const handlePublishCar = async (carData, photos) => {
    setLoading(true);
    const result = await publishCarListing(carData, photos);

    if (result.success) {
      alert('Car listing published successfully!');
      loadMyListings(); // Refresh listings
    } else {
      alert('Failed to publish: ' + result.error);
    }
    setLoading(false);
  };

  if (!loginStatus?.isLoggedIn) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  if (!loginStatus.isSeller) {
    return <div>You need a seller account to publish listings.</div>;
  }

  return (
    <div>
      <h2>Welcome, {loginStatus.user.firstName}!</h2>
      <p>Role: {loginStatus.user.role}</p>

      <PublishCarForm onSubmit={handlePublishCar} loading={loading} />

      <h3>My Listings ({listings.length})</h3>
      <ListingsGrid listings={listings} />

      <button onClick={logoutSeller}>Logout</button>
    </div>
  );
};

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginSeller(email, password);

    if (result.success) {
      alert('Login successful! You can now publish listings.');
      onLoginSuccess();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Seller Login</h2>
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
        {loading ? 'Logging in...' : 'Login as Seller'}
      </button>
    </form>
  );
};

const PublishCarForm = ({ onSubmit, loading }) => {
  const [carData, setCarData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'Frw'
  });
  const [photos, setPhotos] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(carData, photos);

    // Reset form
    setCarData({ title: '', description: '', price: '', currency: 'Frw' });
    setPhotos([]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Publish Car Listing</h3>
      <input
        type="text"
        placeholder="Car Title"
        value={carData.title}
        onChange={(e) => setCarData({...carData, title: e.target.value})}
        required
      />
      <textarea
        placeholder="Description"
        value={carData.description}
        onChange={(e) => setCarData({...carData, description: e.target.value})}
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={carData.price}
        onChange={(e) => setCarData({...carData, price: e.target.value})}
        required
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setPhotos(Array.from(e.target.files))}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Publishing...' : 'Publish Car Listing'}
      </button>
    </form>
  );
};

console.log('🚀 Seller publish solution loaded. Login once, publish seamlessly!');
