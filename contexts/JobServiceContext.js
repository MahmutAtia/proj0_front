'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { JobService } from '@/hooks/useJobService'; // We will import the class directly

const JobContext = createContext();

export const useJobServiceContext = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobServiceContext must be used within a JobServiceProvider');
    }
    return context;
};

export const JobServiceProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const jobServiceRef = useRef(null);

    // State that components will subscribe to
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isServiceRunning, setIsServiceRunning] = useState(false);
    const [isWaitingForKeywords, setIsWaitingForKeywords] = useState(false);
    const [hasActiveCycle, setHasActiveCycle] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && !jobServiceRef.current) {
            console.log("JobServiceProvider: Initializing JobService for the first time.");
            const serviceInstance = new JobService();
            jobServiceRef.current = serviceInstance;

            // The subscription now updates all relevant states
            const unsubscribe = serviceInstance.subscribe((updatedState) => {
                setJobs(updatedState.jobs);
                setLoading(updatedState.loading);
                setIsServiceRunning(updatedState.isRunning);
                setIsWaitingForKeywords(updatedState.isWaitingForKeywords);
                setHasActiveCycle(updatedState.hasActiveCycle);
            });

            serviceInstance.start();

            // Set initial state for the UI from the service
            const initialState = serviceInstance.getState();
            setJobs(initialState.jobs);
            setLoading(initialState.loading);
            setIsServiceRunning(initialState.isRunning);
            setIsWaitingForKeywords(initialState.isWaitingForKeywords);
            setHasActiveCycle(initialState.hasActiveCycle);

            // This cleanup function is now more important than ever
            return () => {
                console.log("JobServiceProvider: Cleaning up service.");
                unsubscribe();
                jobServiceRef.current?.stop(); // Call the new stop method
                jobServiceRef.current = null;
            };
        } else if (status === 'unauthenticated' && jobServiceRef.current) {
            // Also stop the service if the user logs out
            jobServiceRef.current.stop();
            jobServiceRef.current = null;
        }
    }, [status]);

    // Create the value object with safe fallbacks
    const value = {
        jobs,
        loading,
        isServiceRunning,
        isWaitingForKeywords,
        hasActiveCycle,
        // Safe fallback functions that check if service exists
        getFilteredJobs: (options = {}) => {
            if (jobServiceRef.current && jobServiceRef.current.getFilteredJobs) {
                return jobServiceRef.current.getFilteredJobs(options);
            }
            return [];
        },
        refresh: () => {
            if (jobServiceRef.current && jobServiceRef.current.refresh) {
                jobServiceRef.current.refresh();
            }
        },
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};