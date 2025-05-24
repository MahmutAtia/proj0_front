'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
// import AuthProvider from './providers/AuthProvider';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import AuthProvider from './providers/AuthProvider';
import { useEffect } from 'react';
interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    useEffect(() => {
        // Direct test for a specific NEXT_PUBLIC_ variable
        console.log('Direct test in layout - NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
        console.log('Direct test in layout - NEXT_PUBLIC_AI_API_URL:', process.env.NEXT_PUBLIC_AI_API_URL);
        console.log('Direct test in layout - NEXT_PUBLIC_IPDATA_API_KEY:', process.env.NEXT_PUBLIC_IPDATA_API_KEY);
    }, []);
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet"></link>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link> {/* Adjust path if your icons are elsewhere */}
                <meta name="theme-color" content="#000000" /> {/* You can change this color */}
            </head>
            <body>
                <AuthProvider>
                    <PrimeReactProvider>
                        <LayoutProvider>
                            {children}
                        </LayoutProvider>
                    </PrimeReactProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
