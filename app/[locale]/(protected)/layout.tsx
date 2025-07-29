import { Metadata } from 'next';
import AppConfig from '../../../layout/AppConfig';
import React from 'react';
import { JobServiceProvider } from '@/contexts/JobServiceContext';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'resume',
    description: 'ai'
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            <JobServiceProvider> 

            {children}
            <AppConfig simple />
            </JobServiceProvider>
        </React.Fragment>
    );
}
