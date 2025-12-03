// Configuration for different environments
export const config = {
  // API URL configuration
  getApiUrl: () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol; // Get current protocol (http: or https:)
    const port = window.location.port;
    
    // Development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Mobile/remote access - use the same hostname but different port
    if (hostname === '172.20.10.2') {
      return 'http://172.20.10.2:5000';
    }
    
    // Production environment (HTTPS) - use same protocol and no port
    if (protocol === 'https:') {
      return `https://${hostname}`;
    }
    
    // Staging/development HTTP with port
    if (port && port !== '80' && port !== '443') {
      return `http://${hostname}:5000`;
    }
    
    // Fallback
    return `${protocol}//${hostname}:5000`;
  },

  // Get origin URL for OAuth redirect URIs
  getOriginUrl: () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Don't include port for standard ports (80 for http, 443 for https)
    if ((protocol === 'https:' && port === '443') || (protocol === 'http:' && port === '80')) {
      return `${protocol}//${hostname}`;
    }
    
    if (port) {
      return `${protocol}//${hostname}:${port}`;
    }
    
    return `${protocol}//${hostname}`;
  },
  
  // Google OAuth configuration
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // App configuration
  appName: 'quick-tap',
  version: '1.0.0'
};

export default config;
