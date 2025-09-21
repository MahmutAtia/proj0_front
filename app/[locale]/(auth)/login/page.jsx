'use client';
import { useRef, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import "./styles.css";
import { useTranslation } from '@/hooks/useTranslation';

const LoginPage = () => {
    const { t } = useTranslation();
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status } = useSession();
    const [lastUser, setLastUser] = useState(() => {
        if (typeof window !== 'undefined') { // Ensure localStorage is available
            const stored = localStorage.getItem('lastUser');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    });

    // Effect to save authenticated user to localStorage and update state
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const userData = {
                name: session.user.name,
                image: session.user.image
            };
            console.log("Saving authenticated user to localStorage:", userData);
            localStorage.setItem('lastUser', JSON.stringify(userData));
            setLastUser(userData); // Update state immediately
        }
    }, [status, session]); // Depend on status and session

    // Effect for redirection after authentication
    useEffect(() => {
        if (status === 'authenticated') {
            if (document.referrer) {
                router.back();
            } else {
                router.push('/main');
            }
        }
    }, [status, router]); // Depend on status and router

const handleSocialLogin = async (provider) => {
    try {
        await signIn(provider, { callbackUrl: '/main' });
    } catch (error) {
        toast.current?.show({
            severity: 'error',
            summary: t('login.errorSummary'),
            detail: t('login.errorDetail', { provider })
        });
    }
};

if (status === 'loading') {
    return (
        <div className="flex align-items-center justify-content-center min-h-screen">
            <ProgressSpinner />
        </div>
    );
}

return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <Toast ref={toast} />
        <div className="flex flex-column align-items-center justify-content-center">
            <div className="scale-up" style={{
                borderRadius: '56px',
                padding: '0.3rem',
                background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)',
                boxShadow: '0 2px 15px rgba(0,0,0,.08)'
            }}>
                <div className="w-full surface-card py-8 px-5 sm:px-8"
                    style={{
                        borderRadius: '53px',
                        minWidth: '350px'
                    }}>
                    <div className="text-center mb-5">
                        {lastUser && (
                            <div className="mb-4 animation-duration-500 fadein">
                                <Avatar
                                    image={lastUser.image}
                                    size="xlarge"
                                    shape="circle"
                                    className="mb-3 border-2 border-primary-50"
                                />
                                <div className="text-900 text-xl font-medium mb-2">
                                    {t('login.welcomeBack', { name: lastUser.name })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-column gap-3 px-4">
                        <Button
                            label={t('login.signInWithGoogle')}
                            icon="pi pi-google"
                            className="p-button-outlined mb-2 hover:bg-primary-50 transition-colors transition-duration-150"
                            style={{
                                borderRadius: '35px',
                                height: '3.5rem'
                            }}
                            onClick={() => handleSocialLogin('google')}
                        />
                        <Button
                            label={t('login.signInWithLinkedIn')}
                            icon="pi pi-linkedin"
                            className="p-button-outlined p-button-info hover:bg-blue-50 transition-colors transition-duration-150"
                            style={{
                                borderRadius: '35px',
                                height: '3.5rem'
                            }}
                            onClick={() => handleSocialLogin('linkedin')}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default LoginPage;
