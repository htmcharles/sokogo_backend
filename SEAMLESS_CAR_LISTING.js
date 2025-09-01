/**
 * 🚗 SEAMLESS CAR LISTING SYSTEM
 * Login once, fill form, add photos, publish - NO re-authentication!
 */

const API_BASE_URL = 'http://localhost:8000/api';

// ✅ 1. LOGIN ONCE - STAY LOGGED IN
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
      // Store for seamless publishing
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user._id);
      
      console.log('✅ Seller logged in successfully!');
      console.log(`Welcome ${data.user.firstName}! You can now publish listings seamlessly.`);
      
      return { 
        success: true, 
        user: data.user, 
        message: 'Login successful - ready to publish!' 
      };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error);
    return { success: false, error: error.message };
  }
};

// ✅ 2. CHECK IF ALREADY LOGGED IN
const isSellerLoggedIn = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'seller') {
        console.log('✅ Seller is already logged in:', userData.firstName);
        return { isLoggedIn: true, user: userData, token };
      }
    } catch (error) {
      localStorage.clear();
    }
  }
  
  return { isLoggedIn: false };
};

// ✅ 3. SEAMLESS CAR LISTING PUBLISH (No re-authentication)
const publishCarListing = async (formData) => {
  console.log('🚗 Publishing car listing...');
  
  const loginStatus = isSellerLoggedIn();
  if (!loginStatus.isLoggedIn) {
    return { success: false, error: 'Please login first' };
  }

  try {
    const multipartData = new FormData();
    
    // Add car details
    multipartData.append('title', formData.title);
    multipartData.append('description', formData.description);
    multipartData.append('price', formData.price);
    multipartData.append('currency', formData.currency || 'Frw');
    
    // Add optional details
    if (formData.year) multipartData.append('year', formData.year);
    if (formData.make) multipartData.append('make', formData.make);
    if (formData.model) multipartData.append('model', formData.model);
    if (formData.mileage) multipartData.append('mileage', formData.mileage);
    if (formData.transmission) multipartData.append('transmission', formData.transmission);
    if (formData.fuelType) multipartData.append('fuelType', formData.fuelType);
    if (formData.color) multipartData.append('color', formData.color);
    if (formData.location) multipartData.append('location', JSON.stringify(formData.location));
    if (formData.contactPhone) multipartData.append('contactPhone', formData.contactPhone);

    // Add photos
    if (formData.photos && formData.photos.length > 0) {
      formData.photos.forEach((photo) => {
        multipartData.append('photos', photo);
      });
      console.log(`📸 Added ${formData.photos.length} photos`);
    }

    // Make request with stored authentication
    const response = await fetch(`${API_BASE_URL}/sellers/cars/create-listing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginStatus.token}`,
        'userid': loginStatus.user._id
      },
      body: multipartData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Car listing published successfully!');
      console.log('Listing ID:', data.listing._id);
      console.log('Photos uploaded:', data.uploadedPhotos || 0);
      
      return {
        success: true,
        listing: data.listing,
        message: 'Car listing published successfully!',
        listingId: data.listing._id,
        photosUploaded: data.uploadedPhotos || 0
      };
    } else {
      console.error('❌ Publishing failed:', data.message);
      return {
        success: false,
        error: data.message || 'Failed to publish listing'
      };
    }

  } catch (error) {
    console.error('❌ Publishing error:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred'
    };
  }
};

// ✅ 4. REACT COMPONENT - COMPLETE CAR LISTING FORM
const CarListingForm = () => {
  const [loginStatus, setLoginStatus] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'Frw',
    year: '',
    make: '',
    model: '',
    mileage: '',
    transmission: 'Manual',
    fuelType: 'Petrol',
    color: '',
    location: { city: '', country: 'Rwanda' },
    contactPhone: '',
    photos: []
  });
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  // Check login status on component mount
  useEffect(() => {
    const status = isSellerLoggedIn();
    setLoginStatus(status);
    
    if (status.isLoggedIn) {
      setFormData(prev => ({
        ...prev,
        contactPhone: status.user.phoneNumber || ''
      }));
    }
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, photos: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPublishing(true);
    setMessage('');

    // Validate required fields
    if (!formData.title || !formData.description || !formData.price) {
      setMessage('Please fill in all required fields');
      setPublishing(false);
      return;
    }

    // Publish the listing
    const result = await publishCarListing(formData);
    
    if (result.success) {
      setMessage(`✅ Success! Your car listing "${formData.title}" has been published with ${result.photosUploaded} photos!`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        currency: 'Frw',
        year: '',
        make: '',
        model: '',
        mileage: '',
        transmission: 'Manual',
        fuelType: 'Petrol',
        color: '',
        location: { city: '', country: 'Rwanda' },
        contactPhone: loginStatus.user.phoneNumber || '',
        photos: []
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } else {
      setMessage(`❌ Error: ${result.error}`);
    }
    
    setPublishing(false);
  };

  // Show login form if not logged in
  if (!loginStatus?.isLoggedIn) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>🚗 Publish Car Listing</h2>
      <p>Welcome back, <strong>{loginStatus.user.firstName}</strong>! Fill out the form below to publish your car listing.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Basic Information */}
        <div>
          <label><strong>Car Title *</strong></label>
          <input
            type="text"
            placeholder="e.g., 2020 Toyota Camry - Excellent Condition"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label><strong>Description *</strong></label>
          <textarea
            placeholder="Describe your car's condition, features, history, etc."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            rows="4"
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        {/* Price */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: '2' }}>
            <label><strong>Price *</strong></label>
            <input
              type="number"
              placeholder="25000"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div style={{ flex: '1' }}>
            <label><strong>Currency</strong></label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
              <option value="Frw">Rwandan Franc (Frw)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
        </div>

        {/* Car Details */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: '1' }}>
            <label><strong>Year</strong></label>
            <input
              type="number"
              placeholder="2020"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div style={{ flex: '1' }}>
            <label><strong>Make</strong></label>
            <input
              type="text"
              placeholder="Toyota"
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div style={{ flex: '1' }}>
            <label><strong>Model</strong></label>
            <input
              type="text"
              placeholder="Camry"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: '1' }}>
            <label><strong>Mileage</strong></label>
            <input
              type="text"
              placeholder="50,000 km"
              value={formData.mileage}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div style={{ flex: '1' }}>
            <label><strong>Transmission</strong></label>
            <select
              value={formData.transmission}
              onChange={(e) => handleInputChange('transmission', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: '1' }}>
            <label><strong>Fuel Type</strong></label>
            <select
              value={formData.fuelType}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
          <div style={{ flex: '1' }}>
            <label><strong>Color</strong></label>
            <input
              type="text"
              placeholder="White"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label><strong>Location</strong></label>
          <input
            type="text"
            placeholder="Kigali"
            value={formData.location.city}
            onChange={(e) => handleInputChange('location.city', e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        {/* Contact */}
        <div>
          <label><strong>Contact Phone</strong></label>
          <input
            type="tel"
            placeholder="+250788123456"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        {/* Photos */}
        <div>
          <label><strong>Photos</strong></label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
          <small style={{ color: '#666' }}>
            Select multiple photos (JPEG, PNG, WebP). Max 10 photos, 5MB each.
          </small>
          {formData.photos.length > 0 && (
            <p style={{ color: '#007bff', marginTop: '5px' }}>
              📸 {formData.photos.length} photo(s) selected
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={publishing}
          style={{
            padding: '15px',
            backgroundColor: publishing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: publishing ? 'not-allowed' : 'pointer',
            marginTop: '20px'
          }}
        >
          {publishing ? '🔄 Publishing...' : '🚗 Publish Car Listing'}
        </button>

        {/* Message */}
        {message && (
          <div style={{
            padding: '10px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

// ✅ 5. LOGIN FORM COMPONENT
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
      alert('✅ Login successful! You can now publish car listings.');
      onLoginSuccess();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>🔐 Seller Login</h2>
      <p>Login once to publish car listings seamlessly!</p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login as Seller'}
        </button>
      </form>
    </div>
  );
};

// Export components
export { CarListingForm, LoginForm, loginSeller, publishCarListing, isSellerLoggedIn };

console.log('🚗 Seamless car listing system loaded! Login once, publish seamlessly!');
