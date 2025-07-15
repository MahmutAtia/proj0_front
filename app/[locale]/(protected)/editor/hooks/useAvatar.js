"use client";
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export const useAvatar = () => {
    const [avatar, setAvatar] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load avatar on hook initialization
    useEffect(() => {
        loadAvatar();
    }, []);

    const loadAvatar = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get('/api/user/avatar/');
            setAvatar(response.data.avatar);
            console.log('Avatar loaded successfully');
        } catch (err) {
            console.error('Error loading avatar:', err);
            if (err.response?.status === 401) {
                setError('Authentication required to load avatar');
            } else if (err.response?.status === 404) {
                // No avatar found is not an error
                setAvatar(null);
                console.log('No avatar found for user');
            } else {
                setError('Failed to load avatar');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const uploadAvatar = useCallback(async (avatarData) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Log avatar size for debugging
            const sizeKB = Math.round((avatarData.length * 3/4) / 1024); // Rough base64 to bytes conversion
            console.log(`Uploading avatar: ~${sizeKB}KB`);
            
            const response = await api.post('/api/user/avatar/upload/', {
                avatar: avatarData
            });
            
            if (response.status === 200) {
                setAvatar(avatarData);
                console.log('Avatar uploaded successfully');
                return { success: true, data: response.data };
            }
        } catch (err) {
            setError('Failed to upload avatar');
            console.error('Error uploading avatar:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to upload avatar' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeAvatar = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.delete('/api/user/avatar/remove/');
            
            if (response.status === 200) {
                setAvatar(null);
                return { success: true };
            }
        } catch (err) {
            setError('Failed to remove avatar');
            console.error('Error removing avatar:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to remove avatar' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        avatar,
        isLoading,
        error,
        loadAvatar,
        uploadAvatar,
        removeAvatar,
        hasAvatar: Boolean(avatar)
    };
};
