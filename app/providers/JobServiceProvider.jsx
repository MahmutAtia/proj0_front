'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useJobService } from '@/hooks/useJobService';

const JobServiceContext = createContext(null);

export const JobServiceProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const jobService = useJobService();

    return (
        <JobServiceContext.Provider value={jobService}>
            {children}
        </JobServiceContext.Provider>
    );
};

export const useJobServiceContext = () => {
    const context = useContext(JobServiceContext);
    if (!context) {
        throw new Error('useJobServiceContext must be used within a JobServiceProvider');
    }
    return context;
};