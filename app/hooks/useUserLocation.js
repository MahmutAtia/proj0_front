import { useState, useEffect, useCallback } from 'react';

const LOCATION_CACHE_KEY = 'LocationData';
const LOCATION_CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const useUserLocation = () => {
    const [location, setLocation] = useState({ country: '', city: '', currency: '', language: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserLocation = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Try to load from cache first
            const cachedLocationRaw = localStorage.getItem(LOCATION_CACHE_KEY);
            if (cachedLocationRaw) {
                const { data: cachedLocationData, timestamp } = JSON.parse(cachedLocationRaw);
                if ((new Date().getTime() - timestamp) < LOCATION_CACHE_EXPIRY_MS && cachedLocationData) {
                    console.log(`Loaded location from cache: ${cachedLocationData.city}, ${cachedLocationData.country}`);
                    setLocation(cachedLocationData);
                    setLoading(false);
                    return cachedLocationData; // Return for immediate use if needed
                }
            }
        } catch (e) {
            console.warn("Failed to load location from cache or parse error", e);
            // Continue to fetch from API
        }

        // If cache is not valid or not present, fetch from API
        try {
            const apiKey = process.env.NEXT_PUBLIC_IPDATA_API_KEY;
            if (!apiKey) {
                throw new Error("IPDATA_API_KEY is not defined in environment variables.");
            }
            const response = await fetch(`https://api.ipdata.co?api-key=${apiKey}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();

            if (data.message) { // Handle API-specific error messages
                throw new Error(data.message);
            }

            const newLoc = {
                country: data.country_name,
                city: data.city,
                currency: data.currency?.code || '',
                language: data.languages && data.languages.length > 0 ? data.languages[0].code : ''
            };
            localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ data: newLoc, timestamp: new Date().getTime() }));
            console.log(`Fetched and cached location: ${newLoc.city}, ${newLoc.country}`);
            setLocation(newLoc);
            setLoading(false);
            return newLoc; // Return for immediate use if needed
        } catch (err) {
            console.error("Error fetching user location:", err);
            setError(err.message || "Failed to fetch location.");
            setLoading(false);
            // Do not return null here, let the consuming component decide based on error state
            throw err; // Re-throw to allow calling useEffect to catch it
        }
    }, []); // Empty dependency array means this function is memoized and won't change

    useEffect(() => {
        fetchUserLocation().catch(err => {
            // Error is already set by fetchUserLocation, this catch is to prevent unhandled promise rejection
            console.info("Initial location fetch failed, error state is set.");
        });
    }, [fetchUserLocation]); // fetchUserLocation is stable due to useCallback

    return { location, loadingLocation: loading, locationError: error, refetchLocation: fetchUserLocation };
};

export default useUserLocation;
