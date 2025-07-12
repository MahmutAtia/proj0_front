import axios from 'axios';
import { getSession } from 'next-auth/react';

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
    (error) => {
        return Promise.reject(error);
    }
);
// Add a response interceptor to handle global errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            const contentType = error.response.headers['content-type'];
            // Check if the response data is a Blob, which can happen for file downloads
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
                                // We can create a new error object with the parsed data
                                const newError = new Error("Feature limit exceeded");
                                newError.response = { ...error.response, data: errorData };
                                reject(newError);
                            } else {
                                reject(error);
                            }
                        } catch (e) {
                            reject(error); // JSON parsing failed
                        }
                    };
                    reader.onerror = () => {
                        reject(error); // FileReader error
                    };
                    reader.readAsText(error.response.data);
                });
            } else if (error.response.data?.error === "Feature limit exceeded") {
                // This handles regular JSON responses
                if (typeof window !== 'undefined') {
                    window.location.href = '/main/plans';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;