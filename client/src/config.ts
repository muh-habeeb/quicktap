// Configuration for different environments
export const config = {
  // API URL configuration
  getApiUrl: () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Mobile/remote access - use the same hostname but different port
    if (hostname === '172.20.10.2') {
      return 'http://172.20.10.2:5000';
    }
    
    // Fallback for other network IPs
    return `http://${hostname}:5000`;
  },
  
  // Google OAuth configuration
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // App configuration
  appName: 'quick-tap',
  version: '1.0.0'
};

export default config;
