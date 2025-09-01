import { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Enhanced Authentication Hook with JWT Token Support
 * Fixes the "not staying logged in" issue by implementing proper session persistence
 */

// Authentication Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api';

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify token is still valid
          const isValid = await verifyToken(storedToken);
          
          if (isValid) {
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('✅ User session restored from localStorage');
          } else {
            // Token expired or invalid, clear storage
            clearAuthData();
            console.log('⚠️ Stored token expired, user needs to log in again');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Verify token validity
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId'); // For backward compatibility
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user._id); // For backward compatibility

        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);

        console.log('✅ Login successful, session will persist');
        return { success: true, user: data.user };
      } else {
        console.error('❌ Login failed:', data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Logout function
  const logout = useCallback(() => {
    clearAuthData();
    console.log('✅ User logged out successfully');
  }, [clearAuthData]);

  // Get authentication headers for API calls
  const getAuthHeaders = useCallback(() => {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } else if (user?._id) {
      // Fallback to userId for backward compatibility
      return {
        'userid': user._id,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }, [token, user]);

  // Authenticated fetch wrapper
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
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
          console.log('🔄 Token expired, logging out user');
          logout();
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }, [getAuthHeaders, logout]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Update user data if needed
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return true;
      } else {
        // Session invalid, logout user
        logout();
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }, [token, getAuthHeaders, logout, API_BASE_URL]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (isAuthenticated && token) {
      const interval = setInterval(() => {
        refreshSession();
      }, 30 * 60 * 1000); // Refresh every 30 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token, refreshSession]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    getAuthHeaders,
    authenticatedFetch,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Example usage component
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

// Example protected component
export const ProtectedComponent = () => {
  const { user, isAuthenticated, logout, authenticatedFetch } = useAuth();

  const handleApiCall = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/sellers/my-items');
      const data = await response.json();
      console.log('API Response:', data);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to access this content.</div>;
  }

  return (
    <div>
      <h2>Welcome, {user.firstName}!</h2>
      <p>Role: {user.role}</p>
      <button onClick={handleApiCall}>Test API Call</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
