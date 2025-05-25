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

    useEffect(() => {
        fetchPlans();
        if (session?.accessToken) {
            fetchCurrentSubscription();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plans/api/plans/`);
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
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plans/subscription/`, {
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

    const handleSubscribe = async (planId) => {
        if (!session?.accessToken) {
            showToast('warn', 'Authentication Required', 'Please log in to subscribe to a plan');
            return;
        }

        setSubscribing(planId);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plans/subscribe/`, {
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
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plans/cancel/`, {
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
        if (!currentSubscription?.has_subscription) return null;

        if (currentSubscription.is_canceling) {
            return (
                <small className="text-orange-600">
                    Subscription ends on {new Date(currentSubscription.end_date).toLocaleDateString()}
                    {currentSubscription.days_remaining > 0 && ` (${currentSubscription.days_remaining} days remaining)`}
                </small>
            );
        }

        return (
            <small className="text-green-500">
                Active since {new Date(currentSubscription.start_date).toLocaleDateString()}
                {currentSubscription.days_remaining > 0 && ` • ${currentSubscription.days_remaining} days remaining`}
            </small>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Toast ref={toast} />

            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
                <p className="text-xl text-600">Select the perfect plan for your career journey</p>
            </div>

            {/* Current Subscription Info */}
            {currentSubscription?.has_subscription && (
                <Card className={`mb-6 ${currentSubscription.is_canceling ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h3 className={`mb-2 ${currentSubscription.is_canceling ? 'text-orange-800' : 'text-green-800'}`}>
                                {currentSubscription.is_canceling ? 'Subscription Ending' : 'Current Subscription'}
                            </h3>
                            <p className={currentSubscription.is_canceling ? 'text-orange-600' : 'text-green-600'}>
                                <strong>{currentSubscription.plan.name}</strong> - ${currentSubscription.plan.price}/{currentSubscription.plan.billing_period}
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
            )}

            {/* No subscription message for logged in users */}
            {session?.accessToken && !currentSubscription?.has_subscription && (
                <Card className="mb-6 bg-blue-50 border-blue-200">
                    <div className="text-center">
                        <h3 className="text-blue-800 mb-2">No Active Subscription</h3>
                        <p className="text-blue-600">
                            Choose a plan below to unlock premium features and boost your career
                        </p>
                    </div>
                </Card>
            )}

            {/* Login prompt for non-authenticated users */}
            {!session?.accessToken && (
                <Card className="mb-6 bg-blue-50 border-blue-200">
                    <div className="text-center">
                        <h3 className="text-blue-800 mb-2">Login Required</h3>
                        <p className="text-blue-600 mb-3">
                            Please log in to subscribe to a plan and manage your subscription
                        </p>
                        <Button
                            label="Go to Login"
                            onClick={() => router.push('/login')}
                        />
                    </div>
                </Card>
            )}

            {/* Plans Grid */}
            <div className="grid">
                {plans.map((plan) => (
                    <div key={plan.id} className="col-12 md:col-6 lg:col-4 p-3">
                        <Card
                            className={`h-full relative ${plan.is_popular ? 'border-primary-500 border-2' : ''} ${isCurrentPlan(plan.id) ? 'bg-primary-50' : ''}`}
                        >
                            {plan.is_popular && (
                                <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-sm font-semibold"
                                    style={{ borderBottomLeftRadius: '8px' }}>
                                    POPULAR
                                </div>
                            )}

                            <div className="text-center mb-4">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-600 mb-4">{plan.description}</p>

                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-primary">${plan.price}</span>
                                    <span className="text-600">/{plan.billing_period}</span>
                                </div>
                            </div>

                            <Divider />

                            <div className="mb-4">
                                <h4 className="font-semibold mb-3">Features:</h4>
                                <ul className="list-none p-0">
                                    {plan.features && plan.features.length > 0 ? (
                                        plan.features.map((feature, index) => (
                                            <li key={index} className="flex align-items-center mb-2">
                                                <i className="pi pi-check text-green-500 mr-2"></i>
                                                <span>{feature}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-500">No features listed</li>
                                    )}
                                </ul>
                            </div>

                            <div className="mt-auto">
                                {isCurrentPlan(plan.id) && !currentSubscription?.is_canceling ? (
                                    <Button
                                        label="Current Plan"
                                        className="w-full"
                                        severity="success"
                                        disabled
                                    />
                                ) : !session?.accessToken ? (
                                    <Button
                                        label="Login to Subscribe"
                                        className="w-full"
                                        severity="secondary"
                                        onClick={() => router.push('/login')}
                                    />
                                ) : (
                                    <Button
                                        label={subscribing === plan.id ? 'Processing...' :
                                               (isCurrentPlan(plan.id) && currentSubscription?.is_canceling ? 'Reactivate' : 'Subscribe')}
                                        className="w-full"
                                        severity={plan.is_popular ? 'info' : 'secondary'}
                                        loading={subscribing === plan.id}
                                        onClick={() => handleSubscribe(plan.id)}
                                    />
                                )}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Cancel Subscription Dialog */}
            <Dialog
                header="Cancel Subscription"
                visible={cancelDialog}
                onHide={() => setCancelDialog(false)}
                style={{ width: '450px' }}
                modal
            >
                <div className="text-center mb-4">
                    <i className="pi pi-exclamation-triangle text-orange-500 text-4xl mb-3"></i>
                    <h4 className="mb-2">Are you sure you want to cancel?</h4>
                    <p className="text-600">
                        Choose how you'd like to cancel your subscription:
                    </p>
                </div>

                <div className="flex flex-column gap-3">
                    <Button
                        label="Cancel at End of Billing Period"
                        className="w-full"
                        severity="warning"
                        loading={canceling}
                        onClick={() => handleCancelSubscription(false)}
                    />
                    <Button
                        label="Cancel Immediately"
                        className="w-full"
                        severity="danger"
                        loading={canceling}
                        onClick={() => handleCancelSubscription(true)}
                    />
                    <Button
                        label="Keep Subscription"
                        className="w-full"
                        severity="secondary"
                        outlined
                        onClick={() => setCancelDialog(false)}
                    />
                </div>

                <div className="text-center mt-3">
                    <small className="text-600">
                        You can reactivate your subscription anytime before it expires.
                    </small>
                </div>
            </Dialog>

            {/* Quick Actions for subscribed users */}
            {session?.accessToken && currentSubscription?.has_subscription && (
                <Card className="mt-6 bg-gray-50">
                    <h4 className="text-gray-800 mb-3">Manage Your Subscription</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            label="View Usage Stats"
                            size="small"
                            outlined
                            onClick={() => router.push('/plans/usage')}
                        />
                        <Button
                            label="Payment History"
                            size="small"
                            outlined
                            onClick={() => router.push('/plans/payments')}
                        />
                        <Button
                            label="Download Invoice"
                            size="small"
                            outlined
                            onClick={() => showToast('info', 'Coming Soon', 'Invoice download will be available soon')}
                        />
                    </div>
                </Card>
            )}

            {/* Empty state if no plans */}
            {plans.length === 0 && (
                <Card className="text-center">
                    <h3 className="text-600 mb-2">No Plans Available</h3>
                    <p className="text-500">
                        Plans are currently being configured. Please check back later.
                    </p>
                </Card>
            )}
        </div>
    );
};

export default PlansPage;
