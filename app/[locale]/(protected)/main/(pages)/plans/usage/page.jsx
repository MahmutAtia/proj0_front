'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const UsageStatsPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.accessToken) {
            fetchUsageStats();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchUsageStats = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usage/`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setUsageData(response.data);
        } catch (error) {
            console.error('Error fetching usage stats:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load usage statistics'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    if (!session?.accessToken) {
        return (
            <div className="card">
                <div className="text-center">
                    <h2>Login Required</h2>
                    <p>Please log in to view your usage statistics.</p>
                    <Button label="Go to Login" onClick={() => router.push('/login')} />
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-900 mb-2">Usage Statistics</h1>
                    <p className="text-600">Track your feature usage and limits</p>
                </div>
                <Button
                    label="Back to Plans"
                    icon="pi pi-arrow-left"
                    outlined
                    onClick={() => router.push('/main/plans')}
                />
            </div>

            {usageData ? (
                <>
                    <div className="mb-4">
                        <Card>
                            <h3 className="text-xl font-semibold mb-2 text-900">Current Plan: {usageData.plan}</h3>
                        </Card>
                    </div>

                    <div className="grid">
                        {usageData.usage_stats.map((stat) => (
                            <div key={stat.feature_code} className="col-12 md:col-6 lg:col-4">
                                <Card className="h-full">
                                    <div className="text-center mb-3">
                                        <h4 className="font-semibold text-900">{stat.feature}</h4>
                                    </div>

                                    {stat.unlimited || stat.limit === -1 ? (
                                        <div className="text-center">
                                            <Badge value="UNLIMITED" severity="success" size="large" />
                                            <p className="text-600 mt-2">Used: {stat.used}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-content-between mb-2">
                                                <span className="text-600">Used: {stat.used}</span>
                                                <span className="text-600">Limit: {stat.limit}</span>
                                            </div>
                                            <ProgressBar
                                                value={(stat.used / stat.limit) * 100}
                                                color={stat.remaining > 0 ? '#22c55e' : '#ef4444'}
                                            />
                                            <p className="text-center mt-2 text-sm">
                                                <span className={stat.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {stat.remaining} remaining
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <Card className="text-center">
                    <h3>No Usage Data</h3>
                    <p>No active subscription found. Please subscribe to a plan first.</p>
                    <Button label="View Plans" onClick={() => router.push('/main/plans')} />
                </Card>
            )}
        </div>
    );
};

export default UsageStatsPage;
