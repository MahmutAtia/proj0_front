import { Metadata } from 'next';
import AppConfig from '../../../layout/AppConfig';
import React from 'react';
import AppBar from '../../components/AppBar';
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
            {/* <AppBar /> */}

            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
