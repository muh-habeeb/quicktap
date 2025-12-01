import axios from 'axios';

const API_URL = 'http://localhost:5000/auth/';

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true,
});

export const googleAuth = (code) => api.get(`google?code=${code}`);

// Exchange Google access token for JWT
export const exchangeGoogleToken = (access_token) => api.post(`google-token`, { access_token });
