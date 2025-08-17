import axios from 'axios';
import { getSession } from 'next-auth/react';

// --- Reusable Error Handler ---
const handleFeatureLimitError = (error) => {
    // Check for both 403 (Forbidden) and 429 (Too Many Requests) status codes
    if (error.response && (error.response.status === 403 || error.response.status === 429)) {
        const contentType = error.response.headers['content-type'];
        const errorDetail = error.response.data?.detail || error.response.data?.error;

        // This condition checks if the error message indicates a feature/rate limit.
        const isLimitExceeded = errorDetail && (
            errorDetail.includes("Feature limit exceeded") || 
            errorDetail.includes("Rate limit exceeded") ||
            errorDetail.includes("Too Many Requests")
        );

        // Handle Blob responses (e.g., from file downloads)
        if (error.response.data instanceof Blob && contentType && contentType.includes('application/json')) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        if (errorData?.error === "Feature limit exceeded") {
                            if (typeof window !== 'undefined') {
                                window.location.href = '/main/plans';
                            }
                            const newError = new Error("Feature limit exceeded");
                            newError.response = { ...error.response, data: errorData };
                            reject(newError);
                        } else {
                            reject(error);
                        }
                    } catch (e) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(error);
                reader.readAsText(error.response.data);
            });
        } 
        // Handle regular JSON responses
        else if (isLimitExceeded) {
            if (typeof window !== 'undefined') {
                // Redirect the user to the plans page
                window.location.href = '/main/plans';
                // Return a new promise that won't resolve to prevent further .catch() blocks from running
                return new Promise(() => {}); 
            }
        }
    }
    // For all other errors, reject the promise so they can be handled locally
    return Promise.reject(error);
};


const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        const session = await getSession();
        if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Use the reusable error handler for the response interceptor
api.interceptors.response.use(
    (response) => response,
    handleFeatureLimitError
);

export default api;

// Create a separate axios instance for AI service
const aiApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001',
});

// Add request interceptor for AI API (same auth pattern)
aiApi.interceptors.request.use(
    async (config) => {
        const session = await getSession();
        if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Use the same reusable error handler for the AI API
aiApi.interceptors.response.use(
    (response) => response,
    handleFeatureLimitError
);

export { aiApi };