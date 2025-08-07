import { Metadata } from 'next';
import AppConfig from '../../../layout/AppConfig';
import React from 'react';
import { Providers } from '@/contexts/providers'; 


interface ProtectedLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'resume',
    description: 'ai'
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    return (
        <Providers>
            {children}
        </Providers>
    );
}
