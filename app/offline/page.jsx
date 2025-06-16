'use client';

import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex align-items-center justify-content-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <i className={`pi ${isOnline ? 'pi-wifi' : 'pi-wifi-off'} text-6xl mb-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`}></i>

          <h1 className="text-2xl font-bold mb-3">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </h1>

          <p className="text-gray-600 mb-4">
            {isOnline
              ? 'Your connection has been restored.'
              : 'Check your internet connection and try again.'
            }
          </p>

          <Button
            label={isOnline ? "Reload" : "Retry"}
            icon="pi pi-refresh"
            onClick={retry}
            className="w-full"
          />
        </div>
      </Card>
    </div>
  );
}
