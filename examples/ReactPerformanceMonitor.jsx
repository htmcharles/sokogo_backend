import React, { Profiler, useState, useEffect, useCallback } from 'react';

/**
 * React Performance Monitor Component
 * Helps identify performance issues, infinite loops, and excessive re-renders
 */

// Performance monitoring hook
const usePerformanceMonitor = (componentName) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const [averageRenderTime, setAverageRenderTime] = useState(0);
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  const onRender = useCallback((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    setLastRenderTime(actualDuration);
    setAverageRenderTime(prev => (prev + actualDuration) / 2);
    
    // Warn about performance issues
    if (actualDuration > 16) { // 60fps = 16ms per frame
      console.warn(`⚠️ Slow render in ${componentName}: ${actualDuration.toFixed(2)}ms`);
    }
    
    if (renderCount > 10 && actualDuration > 5) {
      console.warn(`⚠️ Excessive re-renders in ${componentName}: ${renderCount} renders`);
    }
  }, [componentName, renderCount]);
  
  return { renderCount, lastRenderTime, averageRenderTime, onRender };
};

// Performance wrapper component
const PerformanceWrapper = ({ children, name }) => {
  const { renderCount, lastRenderTime, averageRenderTime, onRender } = usePerformanceMonitor(name);
  
  return (
    <Profiler id={name} onRender={onRender}>
      <div>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999
          }}>
            <div>{name} Performance:</div>
            <div>Renders: {renderCount}</div>
            <div>Last: {lastRenderTime.toFixed(2)}ms</div>
            <div>Avg: {averageRenderTime.toFixed(2)}ms</div>
          </div>
        )}
        {children}
      </div>
    </Profiler>
  );
};

// Optimized Seller Dashboard Example
const OptimizedSellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [sessionValid, setSessionValid] = useState(true);
  
  // Memoized API base URL
  const apiBaseUrl = useMemo(() => 'http://localhost:8000/api', []);
  
  // Memoized headers
  const authHeaders = useMemo(() => ({
    'userid': userId,
    'Content-Type': 'application/json'
  }), [userId]);
  
  // Optimized fetch function with error handling
  const fetchSellerItems = useCallback(async () => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/sellers/my-items`, {
        method: 'GET',
        headers: authHeaders
      });
      
      if (response.status === 401 || response.status === 403) {
        setSessionValid(false);
        localStorage.removeItem('userId');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || []);
        setSessionValid(true);
        
        // Cache validated userId from response
        if (data.validatedUserId) {
          localStorage.setItem('userId', data.validatedUserId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch seller items:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, loading, apiBaseUrl, authHeaders]);
  
  // Fetch data on mount and userId change
  useEffect(() => {
    if (userId && sessionValid) {
      fetchSellerItems();
    }
  }, [fetchSellerItems, userId, sessionValid]);
  
  // Optimized image upload handler
  const handleImageUpload = useCallback(async (file, productId) => {
    if (!userId || !sessionValid) {
      alert('Please log in to upload images');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`${apiBaseUrl}/sellers/products/${productId}/upload-image`, {
        method: 'POST',
        headers: { 'userid': userId },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update product in state without refetching all
        setProducts(prev => prev.map(product => 
          product._id === productId 
            ? { ...product, images: [...(product.images || []), result.imageUrl] }
            : product
        ));
        
        return result;
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  }, [userId, sessionValid, apiBaseUrl]);
  
  // Memoized product list to prevent unnecessary re-renders
  const productList = useMemo(() => {
    return products.map(product => (
      <ProductCard 
        key={product._id} 
        product={product} 
        onImageUpload={(file) => handleImageUpload(file, product._id)}
      />
    ));
  }, [products, handleImageUpload]);
  
  if (!sessionValid) {
    return <div>Please log in as a seller to view your products.</div>;
  }
  
  return (
    <PerformanceWrapper name="SellerDashboard">
      <div>
        <h2>My Products</h2>
        {loading ? (
          <div>Loading products...</div>
        ) : (
          <div className="products-grid">
            {productList}
          </div>
        )}
      </div>
    </PerformanceWrapper>
  );
};

// Memoized Product Card Component
const ProductCard = memo(({ product, onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file && !uploading) {
      setUploading(true);
      await onImageUpload(file);
      setUploading(false);
    }
  }, [onImageUpload, uploading]);
  
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <p>{product.price} {product.currency}</p>
      
      {/* Image Gallery */}
      <div className="image-gallery">
        {product.images?.map((imageUrl, index) => (
          <img 
            key={index} 
            src={imageUrl} 
            alt={`${product.title} ${index + 1}`}
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ))}
      </div>
      
      {/* Upload Button */}
      <div>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
          id={`upload-${product._id}`}
        />
        <label htmlFor={`upload-${product._id}`}>
          <button type="button" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Add Image'}
          </button>
        </label>
      </div>
    </div>
  );
});

export { OptimizedSellerDashboard, PerformanceWrapper, usePerformanceMonitor };
