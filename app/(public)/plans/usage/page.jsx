'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const UsageStatsPage = () => {
    const { data: session } = useSession();
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
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans/usage/`, {
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
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    if (!session?.accessToken) {
        return (
            <div className="container mx-auto p-4">
                <Card className="text-center">
                    <h2>Login Required</h2>
                    <p>Please log in to view your usage statistics.</p>
                    <Button label="Go to Login" onClick={() => window.location.href = '/login'} />
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-6">
                <h1 className="text-3xl font-bold">Usage Statistics</h1>
                <Button
                    label="Back to Plans"
                    outlined
                    onClick={() => window.location.href = '/plans'}
                />
            </div>

            {usageData ? (
                <>
                    <Card className="mb-4">
                        <h3 className="text-xl font-semibold mb-2">Current Plan: {usageData.plan}</h3>
                    </Card>

                    <div className="grid">
                        {usageData.usage_stats.map((stat) => (
                            <div key={stat.feature_code} className="col-12 md:col-6 lg:col-4 p-3">
                                <Card>
                                    <div className="text-center mb-3">
                                        <h4 className="font-semibold">{stat.feature}</h4>
                                    </div>

                                    {stat.unlimited ? (
                                        <div className="text-center">
                                            <Badge value="UNLIMITED" severity="success" size="large" />
                                            <p className="text-500 mt-2">Used: {stat.used}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-content-between mb-2">
                                                <span>Used: {stat.used}</span>
                                                <span>Limit: {stat.limit}</span>
                                            </div>
                                            <ProgressBar
                                                value={(stat.used / stat.limit) * 100}
                                                color={stat.remaining > 0 ? '#22c55e' : '#ef4444'}
                                            />
                                            <p className="text-center mt-2 text-sm">
                                                {stat.remaining} remaining
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
                    <Button label="View Plans" onClick={() => window.location.href = '/plans'} />
                </Card>
            )}
        </div>
    );
};

export default UsageStatsPage;
