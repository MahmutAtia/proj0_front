'use client';
import { useRef, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import "./styles.css";
import LoginForm from "../../components/auth/LoginForm";
const LoginPage = () => {
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status } = useSession();
    const [lastUser, setLastUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('lastUser');
        if (stored) setLastUser(JSON.parse(stored));

        if (status === 'authenticated') {
            localStorage.setItem('lastUser', JSON.stringify({
                name: session?.user?.name,
                image: session?.user?.image
            }));
            // it should redirect to the previous page if there is one else to the dashboard
            // go to past page if there is one
            if (document.referrer) {
                // go to past page if there is one
                router.back();
            } else {
                // else go to dashboard
                router.push('/main');
            }


}
    }, [status, router, session]);

const handleSocialLogin = async (provider) => {
    try {
        await signIn(provider, { callbackUrl: '/main/dashboard' });
    } catch (error) {
        toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to sign in with ${provider}`
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
                                    Welcome back, {lastUser.name}!
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-column gap-3 px-4">
                        <Button
                            label="Sign in with Google"
                            icon="pi pi-google"
                            className="p-button-outlined mb-2 hover:bg-primary-50 transition-colors transition-duration-150"
                            style={{
                                borderRadius: '35px',
                                height: '3.5rem'
                            }}
                            onClick={() => handleSocialLogin('google')}
                        />
                        <Button
                            label="Sign in with LinkedIn"
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
