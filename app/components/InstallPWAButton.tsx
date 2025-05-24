'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const event = e as BeforeInstallPromptEvent;
            // Prevent the mini-infobar from appearing on mobile
            event.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(event);
            // Update UI notify the user they can install the PWA
            setSupportsPWA(true);
            console.log("'beforeinstallprompt' event fired.");
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for the appinstalled event
        const appInstalledHandler = () => {
            console.log('PWA was installed');
            // Hide the install button
            setSupportsPWA(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', appInstalledHandler);


        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            console.log('Deferred prompt not available');
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        // Hide the install button
        setSupportsPWA(false);
    };

    // if (!supportsPWA || !deferredPrompt) {
    //     return null; // Don't render the button if PWA is not supported/installable or already installed
    // }

    return (
        <button
            id="installPwa"
            onClick={handleInstallClick}
            style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                margin: '10px' // Example styling
            }}
        >
            Install App
        </button>
    );
};

export default InstallPWAButton;
