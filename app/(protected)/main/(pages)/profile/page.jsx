'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const ProfilePage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [usageData, setUsageData] = useState(null);
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [paymentsData, setPaymentsData] = useState([]);

    useEffect(() => {
        if (session?.accessToken) {
            fetchProfileData();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchProfileData = async () => {
        try {
            const [usageResponse, subscriptionResponse, paymentsResponse] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usage/`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                }).catch(() => ({ data: null })),

                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscription/`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                }).catch(() => ({ data: null })),

                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                }).catch(() => ({ data: [] }))
            ]);

            setUsageData(usageResponse.data);
            setSubscriptionData(subscriptionResponse.data);
            setPaymentsData(paymentsResponse.data);
        } catch (error) {
            console.error('Error fetching profile data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load profile data'
            });
        } finally {
            setLoading(false);
        }
    };

    const getUsageChartData = () => {
        if (!usageData?.usage_stats || usageData.usage_stats.length === 0) return null;

        const labels = usageData.usage_stats.map(stat => stat.feature);
        const usedData = usageData.usage_stats.map(stat => stat.used);
        const limitData = usageData.usage_stats.map(stat =>
            stat.unlimited ? Math.max(stat.used + 5, 10) : stat.limit
        );

        return {
            labels,
            datasets: [
                {
                    label: 'Used',
                    data: usedData,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Limit',
                    data: limitData,
                    backgroundColor: 'rgba(229, 231, 235, 0.6)',
                    borderColor: 'rgba(156, 163, 175, 1)',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        };
    };

    const getSubscriptionStatusSeverity = () => {
        if (!subscriptionData?.has_subscription) return 'secondary';
        if (subscriptionData.is_canceling) return 'warning';
        if (subscriptionData.status === 'active') return 'success';
        return 'info';
    };

    const getStatusBadge = (status) => {
        const severityMap = {
            'confirmed': 'success',
            'waiting': 'warning',
            'rejected': 'danger',
            'error': 'danger'
        };
        return <Badge value={status.toUpperCase()} severity={severityMap[status] || 'info'} />;
    };

    const formatAmount = (rowData) => {
        return `$${rowData.total} ${rowData.currency || 'USD'}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    if (!session?.accessToken) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <Card className="text-center p-6 shadow-3">
                    <i className="pi pi-user text-6xl text-blue-500 mb-4"></i>
                    <h2 className="text-2xl font-bold mb-3">Login Required</h2>
                    <p className="text-600 mb-4">Please log in to view your profile.</p>
                    <Button
                        label="Go to Login"
                        size="large"
                        onClick={() => router.push('/login')}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toast ref={toast} />

            {/* Header */}
            <div className="bg-white shadow-2 border-bottom-1 border-200">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-column md:flex-row align-items-center gap-4">
                        <Avatar
                            label={session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                            size="xlarge"
                            style={{ backgroundColor: '#6366f1', color: '#ffffff', fontSize: '2rem' }}
                        />
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold mb-2">
                                {session?.user?.name || 'User Profile'}
                            </h1>
                            <p className="text-600 text-lg mb-3">{session?.user?.email}</p>
                            <div className="flex flex-wrap justify-content-center md:justify-content-start gap-2">
                                <Badge
                                    value={subscriptionData?.has_subscription ?
                                        (subscriptionData.is_canceling ? 'ENDING SOON' : subscriptionData.status.toUpperCase()) :
                                        'FREE USER'}
                                    severity={getSubscriptionStatusSeverity()}
                                    size="large"
                                />
                                <Badge
                                    value={`Member since ${new Date().getFullYear()}`}
                                    severity="info"
                                    size="large"
                                />
                            </div>
                        </div>
                        <Button
                            label="Edit Profile"
                            icon="pi pi-user-edit"
                            outlined
                            onClick={() => router.push('/main/settings')}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid">

                    {/* Current Subscription */}
                    <div className="col-12 lg:col-8">
                        <Card className="h-full shadow-2">
                            <div className="flex justify-content-between align-items-center mb-4">
                                <h3 className="text-xl font-semibold">Current Subscription</h3>
                                <Badge
                                    value={subscriptionData?.has_subscription ? 'ACTIVE' : 'INACTIVE'}
                                    severity={subscriptionData?.has_subscription ? 'success' : 'secondary'}
                                />
                            </div>

                            {subscriptionData?.has_subscription ? (
                                <div>
                                    <Card className={`${subscriptionData.is_canceling ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} mb-4`}>
                                        <div className="grid align-items-center">
                                            <div className="col-12 md:col-8">
                                                <h4 className="text-2xl font-bold mb-2">
                                                    {subscriptionData.plan?.name}
                                                </h4>
                                                <div className="flex flex-wrap gap-3 text-600">
                                                    <span>
                                                        <i className="pi pi-dollar mr-2"></i>
                                                        ${subscriptionData.plan?.price}/{subscriptionData.plan?.billing_period}
                                                    </span>
                                                    <span>
                                                        <i className="pi pi-calendar mr-2"></i>
                                                        Started: {formatDate(subscriptionData.start_date)}
                                                    </span>
                                                </div>
                                                {subscriptionData.is_canceling && (
                                                    <p className="text-orange-600 mt-2">
                                                        <i className="pi pi-exclamation-triangle mr-2"></i>
                                                        Subscription ends on {formatDate(subscriptionData.end_date)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-12 md:col-4 text-center">
                                                <div className={`text-4xl font-bold mb-2 ${subscriptionData.is_canceling ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {subscriptionData.days_remaining}
                                                </div>
                                                <div className="text-600">
                                                    {subscriptionData.is_canceling ? 'Days Left' : 'Days Remaining'}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            label="Manage Plan"
                                            icon="pi pi-cog"
                                            size="small"
                                            outlined
                                            onClick={() => router.push('/plans')}
                                        />
                                        <Button
                                            label="View Usage"
                                            icon="pi pi-chart-bar"
                                            size="small"
                                            outlined
                                            onClick={() => router.push('/plans/usage')}
                                        />
                                        <Button
                                            label="Payments"
                                            icon="pi pi-history"
                                            size="small"
                                            outlined
                                            onClick={() => router.push('/plans/payments')}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <i className="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
                                    <h4 className="text-xl font-semibold mb-3">No Active Subscription</h4>
                                    <p className="text-600 mb-4">
                                        Unlock premium features with one of our subscription plans
                                    </p>
                                    <Button
                                        label="Explore Plans"
                                        icon="pi pi-arrow-right"
                                        onClick={() => router.push('/plans')}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Quick Stats */}
                    <div className="col-12 lg:col-4">
                        <Card className="h-full shadow-2">
                            <h3 className="text-xl font-semibold mb-4">Account Overview</h3>
                            <div className="grid">
                                <div className="col-6">
                                    <div className="text-center p-3 border-round bg-blue-50">
                                        <div className="text-2xl font-bold text-blue-600 mb-1">
                                            {usageData?.usage_stats?.length || 0}
                                        </div>
                                        <div className="text-600 text-sm">Features</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="text-center p-3 border-round bg-green-50">
                                        <div className="text-2xl font-bold text-green-600 mb-1">
                                            {paymentsData.length}
                                        </div>
                                        <div className="text-600 text-sm">Payments</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="text-center p-3 border-round bg-purple-50">
                                        <div className="text-2xl font-bold text-purple-600 mb-1">
                                            {subscriptionData?.days_remaining || 0}
                                        </div>
                                        <div className="text-600 text-sm">Days Left</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="text-center p-3 border-round bg-orange-50">
                                        <div className="text-2xl font-bold text-orange-600 mb-1">
                                            ${paymentsData.reduce((sum, payment) => sum + (payment.total || 0), 0)}
                                        </div>
                                        <div className="text-600 text-sm">Total Spent</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Feature Usage */}
                    {usageData?.usage_stats && usageData.usage_stats.length > 0 && (
                        <div className="col-12">
                            <Card className="shadow-2">
                                <h3 className="text-xl font-semibold mb-4">Feature Usage</h3>
                                <div className="grid">
                                    {usageData.usage_stats.map((stat) => (
                                        <div key={stat.feature_code} className="col-12 md:col-6 lg:col-4">
                                            <div className="p-4 border-1 border-200 border-round bg-white">
                                                <div className="flex justify-content-between align-items-center mb-3">
                                                    <h5 className="font-semibold mb-0">{stat.feature}</h5>
                                                    {stat.unlimited && (
                                                        <Badge value="∞" severity="success" />
                                                    )}
                                                </div>

                                                {!stat.unlimited ? (
                                                    <>
                                                        <div className="flex justify-content-between text-sm mb-2">
                                                            <span className="text-600">Used: {stat.used}</span>
                                                            <span className="text-600">Limit: {stat.limit}</span>
                                                        </div>
                                                        <ProgressBar
                                                            value={(stat.used / stat.limit) * 100}
                                                            color={stat.remaining > 0 ? '#10b981' : '#ef4444'}
                                                            style={{ height: '8px' }}
                                                        />
                                                        <div className="text-center mt-2">
                                                            <span className={`text-sm font-semibold ${stat.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {stat.remaining} remaining
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="text-green-600 font-semibold mb-2">Unlimited Usage</div>
                                                        <div className="text-600 text-sm">Used: {stat.used}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Usage Chart */}
                    {usageData?.usage_stats && (
                        <div className="col-12 lg:col-8">
                            <Card className="shadow-2">
                                <h3 className="text-xl font-semibold mb-4">Usage Statistics</h3>
                                <Chart
                                    type="bar"
                                    data={getUsageChartData()}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </Card>
                        </div>
                    )}

                    {/* Recent Payments */}
                    <div className="col-12 lg:col-4">
                        <Card className="h-full shadow-2">
                            <h3 className="text-xl font-semibold mb-4">Recent Payments</h3>
                            {paymentsData.length > 0 ? (
                                <DataTable
                                    value={paymentsData.slice(0, 5)}
                                    size="small"
                                    showGridlines
                                >
                                    <Column
                                        field="total"
                                        header="Amount"
                                        body={formatAmount}
                                        style={{ width: '40%' }}
                                    />
                                    <Column
                                        field="status"
                                        header="Status"
                                        body={(rowData) => getStatusBadge(rowData.status)}
                                        style={{ width: '30%' }}
                                    />
                                    <Column
                                        field="created"
                                        header="Date"
                                        body={(rowData) => formatDate(rowData.created)}
                                        style={{ width: '30%' }}
                                    />
                                </DataTable>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="pi pi-credit-card text-4xl text-gray-300 mb-3"></i>
                                    <p className="text-600">No payment history yet</p>
                                </div>
                            )}

                            {paymentsData.length > 5 && (
                                <div className="text-center mt-3">
                                    <Button
                                        label="View All Payments"
                                        size="small"
                                        text
                                        onClick={() => router.push('/plans/payments')}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Quick Actions */}
                <Card className="mt-4 shadow-2">
                    <h4 className="text-lg font-semibold mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            label="Edit Profile"
                            icon="pi pi-user-edit"
                            size="small"
                            outlined
                            onClick={() => router.push('/main/settings')}
                        />
                        <Button
                            label="View Plans"
                            icon="pi pi-shopping-cart"
                            size="small"
                            outlined
                            onClick={() => router.push('/plans')}
                        />
                        <Button
                            label="Usage Details"
                            icon="pi pi-chart-line"
                            size="small"
                            outlined
                            onClick={() => router.push('/plans/usage')}
                        />
                        <Button
                            label="Payment History"
                            icon="pi pi-history"
                            size="small"
                            outlined
                            onClick={() => router.push('/plans/payments')}
                        />
                        <Button
                            label="Download Invoice"
                            icon="pi pi-download"
                            size="small"
                            outlined
                            onClick={() => toast.current?.show({
                                severity: 'info',
                                summary: 'Coming Soon',
                                detail: 'Invoice download will be available soon'
                            })}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
