import axios from 'axios';
import React, { useState } from 'react';
import config from './config';

const API_URL = config.getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add Authorization header if token exists in localStorage
api.interceptors.request.use((request) => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
        try {
            const parsed = JSON.parse(userInfo);
            if (parsed.token) {
                request.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (e) {
            console.error('Failed to parse user-info from localStorage:', e);
        }
    }
    return request;
});

// Log API configuration for debugging
console.log('API Configuration:', {
    baseURL: API_URL,
    currentHost: window.location.hostname,
    currentPort: window.location.port,
    fullUrl: window.location.href
});

// Helper function to compress image
const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                }, 'image/jpeg', 0.7);
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

export const googleAuth = async (code: string) => {
    try {
        // Update the endpoint to match your server's route
        const response = await api.get('/auth/google', { params: { code } });
        console.log('Raw server response:', response);
        
        // Check if response is HTML (error case)
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            throw new Error('Server returned HTML instead of JSON. Please check server configuration.');
        }
        
        // Check if response has the expected structure
        if (!response.data || !response.data.user) {
            throw new Error('Invalid response format from server');
        }
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        throw error;
    }
};

// Exchange Google access token for JWT
export const exchangeGoogleToken = async (access_token: string) => {
    try {
        const response = await api.post('/auth/google-token', { access_token });
        console.log('Token exchange response:', response);
        
        // Check if response has the expected structure
        if (!response.data || !response.data.user) {
            throw new Error('Invalid response format from server');
        }
        
        return response;
    } catch (error) {
        console.error('Token Exchange Error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        throw error;
    }
};

// Create a new post with image
export const createPost = async (postData: any, imageFile?: File) => {
    try {
        // Validate required fields
        const requiredFields = ['category', 'title', 'content', 'author'];
        const missingFields = requiredFields.filter(field => !postData[field]);
        
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        console.log('Creating post with data:', {
            ...postData,
            image: postData.image ? 'base64 image data present' : 'no base64 image'
        });
        console.log('Image file:', imageFile ? {
            name: imageFile.name,
            type: imageFile.type,
            size: imageFile.size
        } : 'no file');

        // If there's an image file, handle it
        if (imageFile) {
            console.log('Processing image file:', imageFile.name);
            
            // Compress the image if it's larger than 1MB
            let imageToUpload = imageFile;
            if (imageFile.size > 1024 * 1024) {
                console.log('Compressing image...');
                imageToUpload = await compressImage(imageFile);
                console.log('Compressed image size:', imageToUpload.size);
            }
            
            // Create FormData and append the compressed image
            const formData = new FormData();
            formData.append('image', imageToUpload);
            
            // Append other post data
            Object.keys(postData).forEach(key => {
                if (key !== 'imageFile' && key !== 'image') {
                    formData.append(key, postData[key]);
                }
            });
            
            console.log('Sending FormData with image');
            const response = await api.post('/api/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            console.log('Server response:', response.data);
            return response.data;
        }
        // If there's a base64 image in postData, send it directly
        else if (postData.image && typeof postData.image === 'string' && postData.image.startsWith('data:image')) {
            console.log('Sending base64 image');
            const response = await api.post('/api/posts', postData);
            console.log('Server response:', response.data);
            return response.data;
        }
        // If no image, send the post data as is
        else {
            console.log('Sending post without image');
            const response = await api.post('/api/posts', postData);
            console.log('Server response:', response.data);
            return response.data;
        }
    } catch (error: any) {
        console.error('Error creating post:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            requestData: postData
        });
        
        // If the server sent an error message, use it
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw error;
    }
};

// Get all posts
export const getPosts = async () => {
    try {
        const response = await api.get('/api/posts');
        return response.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

// Like/Unlike a post
export const toggleLike = async (postId: string, userId: string) => {
    try {
        const response = await api.patch(`/api/posts/${postId}/like`, { userId });
        return response.data;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

// Add a comment
export const addComment = async (postId: string, commentData: any) => {
    try {
        const response = await api.post(`/api/posts/${postId}/comments`, commentData);
        return response.data;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

// Delete a post
export const deletePost = async (postId: string) => {
    try {
        const response = await api.delete(`/api/posts/${postId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

// Delete a comment
export const deleteComment = async (postId: string, commentId: string) => {
    try {
        const response = await api.delete(`/api/posts/${postId}/comments/${commentId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}; 