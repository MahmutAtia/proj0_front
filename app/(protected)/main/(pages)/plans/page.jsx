'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const PlansPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null);
    const [cancelDialog, setCancelDialog] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchPlans();
        if (session?.accessToken) {
            fetchCurrentSubscription();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans/`);
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast('error', 'Error', 'Failed to load plans');
        }
    };

    const fetchCurrentSubscription = async () => {
        if (!session?.accessToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscription/`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setCurrentSubscription(response.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            if (error.response?.status !== 404) {
                showToast('error', 'Error', 'Failed to load subscription data');
            }
        } finally {
            setLoading(false);
        }
    };

    const showToast = (severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail });
    };

    const formatDate = (dateString) => {
        if (!mounted || !dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return '';
        }
    };

    const handleSubscribe = async (planId) => {
        if (!session?.accessToken) {
            showToast('warn', 'Authentication Required', 'Please log in to subscribe to a plan');
            return;
        }

        setSubscribing(planId);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscribe/`, {
                plan_id: planId,
                variant: 'dummy'
            }, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (response.data.success) {
                let severity = 'success';
                let summary = 'Success';
                let detail = response.data.message;

                if (response.data.already_subscribed) {
                    severity = 'info';
                    summary = 'Already Subscribed';
                } else if (response.data.reactivated) {
                    severity = 'success';
                    summary = 'Reactivated';
                    detail = 'Your subscription has been reactivated without additional charge!';
                }

                showToast(severity, summary, detail);
                fetchCurrentSubscription();
            } else {
                showToast('error', 'Subscription Failed', response.data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            showToast('error', 'Subscription Failed', error.response?.data?.error || 'Network error occurred');
        } finally {
            setSubscribing(null);
        }
    };

    const handleCancelSubscription = async (immediate = false) => {
        if (!session?.accessToken) return;

        setCanceling(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cancel/`, {
                immediate: immediate
            }, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (response.data.success) {
                const message = immediate
                    ? 'Subscription canceled immediately'
                    : 'Subscription will end at the current billing period';

                showToast('success', 'Subscription Canceled', message);
                fetchCurrentSubscription();
                setCancelDialog(false);
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            showToast('error', 'Cancellation Failed', error.response?.data?.error || 'Failed to cancel subscription');
        } finally {
            setCanceling(false);
        }
    };

    const isCurrentPlan = (planId) => {
        return currentSubscription?.has_subscription &&
            currentSubscription?.plan?.id === planId;
    };

    const getSubscriptionStatusBadge = () => {
        if (!currentSubscription?.has_subscription) return null;

        if (currentSubscription.is_canceling) {
            return <Badge value="ENDING SOON" severity="warning" size="large" />;
        }

        if (currentSubscription.status === 'active') {
            return <Badge value="ACTIVE" severity="success" size="large" />;
        }

        return <Badge value={currentSubscription.status.toUpperCase()} severity="info" size="large" />;
    };

    const getSubscriptionMessage = () => {
        if (!currentSubscription?.has_subscription || !mounted) return null;

        if (currentSubscription.is_canceling) {
            return (
                <small className="text-orange-600">
                    Subscription ends on {formatDate(currentSubscription.end_date)}
                    {currentSubscription.days_remaining > 0 && ` (${currentSubscription.days_remaining} days remaining)`}
                </small>
            );
        }

        return (
            <small className="text-green-500">
                Active since {formatDate(currentSubscription.start_date)}
                {currentSubscription.days_remaining > 0 && ` • ${currentSubscription.days_remaining} days remaining`}
            </small>
        );
    };

    const getPlanFeatures = (plan) => {
        if (!plan.features || plan.features.length === 0) {
            return ['No features listed'];
        }

        return plan.features.map(featureItem => {
            if (typeof featureItem === 'string') {
                return featureItem;
            }

            // Handle the nested structure from your API
            if (featureItem.feature && featureItem.feature.name) {
                const featureName = featureItem.feature.name;
                const limit = featureItem.limit;

                // Check if limit is -1 (unlimited) or null/undefined
                if (limit === -1 || limit === null || limit === undefined) {
                    return `${featureName} - Unlimited`;
                } else {
                    return `${featureName} - ${limit} per ${plan.billing_period}`;
                }
            }

            return 'Feature details unavailable';
        });
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />

            {/* Header */}
            <div className="flex justify-content-between align-items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-900 mb-2">Subscription Plans</h1>
                    <p className="text-600 text-lg">Choose the perfect plan for your career journey</p>
                </div>
                <Button
                    label="Back to Dashboard"
                    icon="pi pi-arrow-left"
                    outlined
                    onClick={() => router.push('/main')}
                />
            </div>

            {/* Current Subscription Info */}
            {currentSubscription?.has_subscription && (
                <div className="mb-6">
                    <Card className={`${currentSubscription.is_canceling ? 'surface-200' : 'surface-100'} border-left-3 ${currentSubscription.is_canceling ? 'border-orange-500' : 'border-green-500'}`}>
                        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2 text-900">
                                    {currentSubscription.is_canceling ? 'Subscription Ending' : 'Current Subscription'}
                                </h3>
                                <p className="mb-2 text-700">
                                    <strong>{currentSubscription.plan?.name}</strong> - ${currentSubscription.plan?.price}/{currentSubscription.plan?.billing_period}
                                </p>
                                {getSubscriptionMessage()}
                            </div>
                            <div className="flex align-items-center gap-3">
                                {getSubscriptionStatusBadge()}
                                {currentSubscription.is_canceling ? (
                                    <Button
                                        label="Reactivate"
                                        severity="success"
                                        size="small"
                                        onClick={() => handleSubscribe(currentSubscription.plan.id)}
                                    />
                                ) : (
                                    <Button
                                        label="Cancel"
                                        severity="danger"
                                        size="small"
                                        outlined
                                        onClick={() => setCancelDialog(true)}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* No subscription message for logged in users */}
            {session?.accessToken && !currentSubscription?.has_subscription && (
                <div className="mb-6">
                    <Card className="surface-100 border-left-3 border-blue-500">
                        <div className="text-center">
                            <i className="pi pi-info-circle text-blue-500 text-4xl mb-3"></i>
                            <h3 className="text-blue-800 mb-2">No Active Subscription</h3>
                            <p className="text-600">
                                Choose a plan below to unlock premium features and boost your career
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid">
                {plans.map((plan) => {
                    const planFeatures = getPlanFeatures(plan);
                    const isPopular = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
                    const isFree = plan.is_free || parseFloat(plan.price) === 0;

                    return (
                        <div key={plan.id} className="col-12 lg:col-4 md:col-6">
                            <Card
                                className={`h-full relative ${
                                    isPopular ? 'border-primary border-2' : ''
                                } ${
                                    isCurrentPlan(plan.id) ? 'surface-100 border-primary border-2' : ''
                                } hover:shadow-3 transition-all transition-duration-300`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-2 left-50 transform -translate-x-50 z-1">
                                        <Badge value="MOST POPULAR" severity="info" />
                                    </div>
                                )}

                                {isFree && (
                                    <div className="absolute -top-2 right-3 z-1">
                                        <Badge value="FREE" severity="success" />
                                    </div>
                                )}

                                <div className="text-center mb-4">
                                    <h3 className="text-2xl font-bold mb-2 text-primary">{plan.name}</h3>
                                    <p className="text-600 mb-4">{plan.description}</p>

                                    <div className="mb-4">
                                        <div className="flex align-items-baseline justify-content-center gap-1 mb-2">
                                            <span className="text-4xl font-bold text-900">${plan.price}</span>
                                            <span className="text-600">/{plan.billing_period}</span>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <div className="mb-4" style={{ minHeight: '200px' }}>
                                    <h4 className="font-semibold mb-3 text-center text-900">Features Included:</h4>
                                    <ul className="list-none p-0 m-0">
                                        {planFeatures.map((feature, index) => (
                                            <li key={index} className="flex align-items-start mb-2">
                                                <i className="pi pi-check text-green-500 mr-2 mt-1 text-sm"></i>
                                                <span className="text-700 text-sm line-height-3">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-auto">
                                    {isCurrentPlan(plan.id) && !currentSubscription?.is_canceling ? (
                                        <Button
                                            label="Current Plan"
                                            icon="pi pi-check"
                                            className="w-full"
                                            severity="success"
                                            disabled
                                        />
                                    ) : !session?.accessToken ? (
                                        <Button
                                            label="Login to Subscribe"
                                            icon="pi pi-sign-in"
                                            className="w-full"
                                            severity="secondary"
                                            onClick={() => router.push('/login')}
                                        />
                                    ) : (
                                        <Button
                                            label={
                                                subscribing === plan.id ? 'Processing...' :
                                                (isCurrentPlan(plan.id) && currentSubscription?.is_canceling ? 'Reactivate Plan' :
                                                 isFree ? 'Get Started Free' : 'Subscribe Now')
                                            }
                                            icon={subscribing === plan.id ? 'pi pi-spin pi-spinner' :
                                                  (isFree ? 'pi pi-play' : 'pi pi-credit-card')}
                                            className="w-full"
                                            severity={isPopular ? 'info' : (isFree ? 'success' : 'primary')}
                                            loading={subscribing === plan.id}
                                            onClick={() => handleSubscribe(plan.id)}
                                        />
                                    )}
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Management Actions */}
            {session?.accessToken && currentSubscription?.has_subscription && (
                <div className="mt-6">
                    <Card>
                        <h4 className="text-900 mb-4">
                            <i className="pi pi-cog mr-2 text-primary"></i>
                            Manage Your Subscription
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                label="Usage Statistics"
                                icon="pi pi-chart-bar"
                                size="small"
                                outlined
                                onClick={() => router.push('/main/plans/usage')}
                            />
                            <Button
                                label="Payment History"
                                icon="pi pi-history"
                                size="small"
                                outlined
                                onClick={() => router.push('/main/plans/payments')}
                            />
                            <Button
                                label="Account Settings"
                                icon="pi pi-user"
                                size="small"
                                outlined
                                onClick={() => router.push('/main/settings')}
                            />
                            <Button
                                label="Download Invoice"
                                icon="pi pi-download"
                                size="small"
                                outlined
                                onClick={() => showToast('info', 'Coming Soon', 'Invoice download will be available soon')}
                            />
                        </div>
                    </Card>
                </div>
            )}

            {/* Empty state */}
            {plans.length === 0 && (
                <div className="text-center py-8">
                    <Card>
                        <i className="pi pi-inbox text-6xl text-400 mb-4"></i>
                        <h3 className="text-600 mb-2">No Plans Available</h3>
                        <p className="text-500">
                            Plans are currently being configured. Please check back later.
                        </p>
                    </Card>
                </div>
            )}

            {/* Features Comparison */}
            {plans.length > 0 && (
                <div className="mt-6">
                    <Card>
                        <h3 className="text-center text-2xl font-bold mb-4 text-900">Why Choose Our Plans?</h3>
                        <div className="grid">
                            <div className="col-12 md:col-4 text-center p-4">
                                <i className="pi pi-shield text-4xl text-blue-500 mb-3"></i>
                                <h4 className="font-semibold mb-2 text-900">Secure & Reliable</h4>
                                <p className="text-600">Your data is encrypted and backed up securely</p>
                            </div>
                            <div className="col-12 md:col-4 text-center p-4">
                                <i className="pi pi-mobile text-4xl text-green-500 mb-3"></i>
                                <h4 className="font-semibold mb-2 text-900">Mobile Friendly</h4>
                                <p className="text-600">Access your account from anywhere, anytime</p>
                            </div>
                            <div className="col-12 md:col-4 text-center p-4">
                                <i className="pi pi-headphones text-4xl text-purple-500 mb-3"></i>
                                <h4 className="font-semibold mb-2 text-900">24/7 Support</h4>
                                <p className="text-600">Get help whenever you need it from our support team</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Cancel Subscription Dialog */}
            <Dialog
                header="Cancel Subscription"
                visible={cancelDialog}
                onHide={() => setCancelDialog(false)}
                style={{ width: '500px' }}
                modal
            >
                <div className="text-center mb-4">
                    <i className="pi pi-exclamation-triangle text-orange-500 text-6xl mb-4"></i>
                    <h4 className="text-xl mb-3">Cancel Your Subscription?</h4>
                    <p className="text-600 line-height-3">
                        Choose how you'd like to cancel your subscription. You can always reactivate it later.
                    </p>
                </div>

                <div className="flex flex-column gap-3">
                    <Button
                        label="Cancel at Period End"
                        icon="pi pi-calendar"
                        className="w-full"
                        severity="warning"
                        loading={canceling}
                        onClick={() => handleCancelSubscription(false)}
                    />
                    <Button
                        label="Cancel Immediately"
                        icon="pi pi-times"
                        className="w-full"
                        severity="danger"
                        loading={canceling}
                        onClick={() => handleCancelSubscription(true)}
                    />
                    <Button
                        label="Keep My Subscription"
                        icon="pi pi-heart"
                        className="w-full"
                        severity="secondary"
                        outlined
                        onClick={() => setCancelDialog(false)}
                    />
                </div>

                <div className="text-center mt-4">
                    <small className="text-600">
                        💡 You can reactivate your subscription anytime before it expires without any additional charges.
                    </small>
                </div>
            </Dialog>
        </div>
    );
};

export default PlansPage;
