'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
// Import the class and the utility function
import { JobService, filterJobs } from '@/hooks/useJobService'; 

const JobContext = createContext();

// This is the hook that components will import and use.
export const useJobService = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobService must be used within a JobServiceProvider');
    }
    return context;
};

export const JobServiceProvider = ({ children }) => {
    const { status } = useSession();
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

            const unsubscribe = serviceInstance.subscribe((updatedState) => {
                setJobs(updatedState.jobs);
                setLoading(updatedState.loading);
                setIsServiceRunning(updatedState.isRunning);
                setIsWaitingForKeywords(updatedState.isWaitingForKeywords);
                setHasActiveCycle(updatedState.hasActiveCycle);
            });

            serviceInstance.start();

            const initialState = serviceInstance.getState();
            setJobs(initialState.jobs);
            setLoading(initialState.loading);
            setIsServiceRunning(initialState.isRunning);
            setIsWaitingForKeywords(initialState.isWaitingForKeywords);
            setHasActiveCycle(initialState.hasActiveCycle);

            return () => {
                console.log("JobServiceProvider: Cleaning up service.");
                unsubscribe();
                jobServiceRef.current?.stop();
                jobServiceRef.current = null;
            };
        } else if (status === 'unauthenticated' && jobServiceRef.current) {
            jobServiceRef.current.stop();
            jobServiceRef.current = null;
        }
    }, [status]);

    const value = {
        jobs,
        loading,
        isServiceRunning,
        isWaitingForKeywords,
        hasActiveCycle,
        // Expose the pure filterJobs function through the context
        getFilteredJobs: (options = {}) => {
            return filterJobs(jobs, options);
        },
        refresh: () => {
            if (jobServiceRef.current?.refresh) {
                jobServiceRef.current.refresh();
            }
        },
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};