import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';

/**
 * Optimized Seller Image Upload Component
 * Prevents freezing, infinite loops, and excessive re-renders
 * Implements all React performance best practices
 */

// Custom hook for debounced values (prevents excessive API calls)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Custom hook for API calls with caching
const useApiCache = () => {
  const cache = useRef(new Map());
  
  const cachedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (cache.current.has(cacheKey)) {
      return cache.current.get(cacheKey);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache successful responses for 5 minutes
    if (response.ok) {
      cache.current.set(cacheKey, data);
      setTimeout(() => cache.current.delete(cacheKey), 5 * 60 * 1000);
    }
    
    return data;
  }, []);
  
  return cachedFetch;
};

// Memoized Image Preview Component
const ImagePreview = memo(({ src, alt, onRemove }) => {
  return (
    <div className="image-preview">
      <img src={src} alt={alt} style={{ width: 100, height: 100, objectFit: 'cover' }} />
      <button onClick={onRemove} type="button">Remove</button>
    </div>
  );
});

// Main Seller Image Upload Component
const SellerImageUpload = memo(({ productId, userId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const cachedFetch = useApiCache();
  
  // Memoized API configuration
  const apiConfig = useMemo(() => ({
    baseUrl: 'http://localhost:8001',
    headers: {
      'userid': userId
    }
  }), [userId]);
  
  // Memoized file validation
  const validateFile = useCallback((file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
    
    return true;
  }, []);
  
  // Optimized upload function with proper error handling
  const uploadImage = useCallback(async (file) => {
    if (uploading) return; // Prevent multiple simultaneous uploads
    
    try {
      validateFile(file);
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const response = await fetch(
        `${apiConfig.baseUrl}/api/sellers/products/${productId}/upload-image`,
        {
          method: 'POST',
          headers: apiConfig.headers,
          body: formData
        }
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Update uploaded images list
      setUploadedImages(prev => [...prev, {
        id: Date.now(),
        url: result.imageUrl,
        fileName: result.fileName
      }]);
      
      // Call success callback
      onUploadSuccess?.(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploading, validateFile, apiConfig, productId, onUploadSuccess]);
  
  // Memoized drag handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  }, [uploadImage]);
  
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file);
    }
    // Reset input for same file selection
    e.target.value = '';
  }, [uploadImage]);
  
  const removeImage = useCallback((imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);
  
  // Memoized styles to prevent re-renders
  const dropZoneStyle = useMemo(() => ({
    border: `2px dashed ${dragOver ? '#007bff' : '#ccc'}`,
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: dragOver ? '#f8f9fa' : 'transparent',
    transition: 'all 0.3s ease'
  }), [dragOver]);
  
  return (
    <div className="seller-image-upload">
      <h3>Upload Product Images</h3>
      
      {/* Drag & Drop Zone */}
      <div
        style={dropZoneStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div>
            <p>Uploading... {uploadProgress}%</p>
            <progress value={uploadProgress} max="100" />
          </div>
        ) : (
          <div>
            <p>Drag & drop images here or click to select</p>
            <p>Supports: JPEG, PNG, WebP (max 5MB)</p>
          </div>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
      
      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Uploaded Images ({uploadedImages.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {uploadedImages.map(image => (
              <ImagePreview
                key={image.id}
                src={image.url}
                alt={image.fileName}
                onRemove={() => removeImage(image.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default SellerImageUpload;
