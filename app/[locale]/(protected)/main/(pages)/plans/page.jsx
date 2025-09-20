'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { PolarEmbedCheckout } from '@polar-sh/checkout/embed';


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
    const [reactivating, setReactivating] = useState(false);
    
    // States for plan change confirmation dialog
    const [planChangeDialog, setPlanChangeDialog] = useState(false);
    const [targetPlan, setTargetPlan] = useState(null);
    
    // New states for the cancellation flow
    const [cancelStep, setCancelStep] = useState(1);
    const [cancelReason, setCancelReason] = useState(null);
    const [cancelComment, setCancelComment] = useState('');

    const cancellationReasons = [
        { label: 'It\'s too expensive', value: 'too_expensive' },
        { label: 'I\'m missing some features', value: 'missing_features' },
        { label: 'I switched to another service', value: 'switched_service' },
        { label: 'I\'m not using it enough', value: 'unused' },
        { label: 'I\'m not happy with the quality', value: 'low_quality' },
        { label: 'It\'s too complicated to use', value: 'too_complex' },
        { label: 'Other', value: 'other' },
    ];

    useEffect(() => {
        setMounted(true);
        PolarEmbedCheckout.init();
        fetchPlans();
        if (session?.accessToken) {
            fetchCurrentSubscription();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchPlans = async () => {
        try {
            const response = await api.get(`/api/plans/`);
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
            const response = await api.get(`/api/subscription/`);
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

    const performPlanAction = async (planId) => {
        if (!session?.accessToken) {
            showToast('warn', 'Authentication Required', 'Please log in to manage plans');
            return;
        }
    
        setSubscribing(planId);
    
        try {
            const isCurrentlyOnPaidPlan = currentSubscription?.has_subscription && !currentSubscription?.plan?.is_free;

            // Case 1: User is on a PAID plan and is changing to a DIFFERENT plan
            if (isCurrentlyOnPaidPlan && !isCurrentPlan(planId)) {
                const response = await api.post(`/api/update-plan/`, { new_plan_id: planId });
                showToast('success', 'Plan Updated', response.data.message);
                fetchCurrentSubscription();
            }
            // Case 2: User has a canceling PAID subscription and is reactivating it
            else if (currentSubscription?.is_canceling && isCurrentPlan(planId)) {
                await handleReactivateSubscription();
            }
            // Case 3: User has no subscription OR is on a free plan. Go to checkout.
            else {
                const response = await api.post(`/api/polar/create-checkout/`, { plan_id: planId });
    
                if (response.data.checkout_url) {
                    const checkout = await PolarEmbedCheckout.create(response.data.checkout_url, 'light');
                    checkout.addEventListener('success', () => {
                        showToast('success', 'Purchase Successful', 'Your subscription is now active!');
                        fetchCurrentSubscription();
                    });
                } else {
                    showToast('error', 'Subscription Failed', response.data.error || 'Could not process subscription.');
                }
            }
        } catch (error) {
            console.error('Error performing plan action:', error);
            showToast('error', 'Action Failed', error.response?.data?.error || 'A network error occurred.');
        } finally {
            setSubscribing(null);
        }
    };

    const handlePlanAction = (planId, planName) => {
        const isCurrentlyOnPaidPlan = currentSubscription?.has_subscription && !currentSubscription?.plan?.is_free;

        // Only show confirmation if user is on a PAID plan and switching to another plan.
        if (isCurrentlyOnPaidPlan && !isCurrentPlan(planId)) {
            setTargetPlan({ id: planId, name: planName });
            setPlanChangeDialog(true);
        } else {
            // For new subscriptions or upgrades from free, proceed immediately to checkout.
            performPlanAction(planId);
        }
    };

    const handleReactivateSubscription = async () => {
        if (!session?.accessToken) return;

        setReactivating(true);
        try {
            const response = await api.post(`/api/reactivate/`);
            if (response.data.success) {
                showToast('success', 'Subscription Reactivated', 'Your subscription will now auto-renew.');
                fetchCurrentSubscription(); // Refresh subscription state
            }
        } catch (error) {
            console.error('Error reactivating subscription:', error);
            showToast('error', 'Reactivation Failed', error.response?.data?.error || 'Failed to reactivate subscription');
        } finally {
            setReactivating(false);
        }
    };

    const handleCancelSubscription = async (immediate = false) => {
        if (!session?.accessToken) return;

        setCanceling(true);

        try {
            const response = await api.post(`/api/cancel/`, {
                immediate: immediate,
                reason: cancelReason,
                comment: cancelComment,
            });

            if (response.data.success) {
                showToast('success', 'Subscription Canceled', response.data.message);
                fetchCurrentSubscription();
                closeCancelDialog();
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            showToast('error', 'Cancellation Failed', error.response?.data?.error || 'Failed to cancel subscription');
        } finally {
            setCanceling(false);
        }
    };

    const closeCancelDialog = () => {
        setCancelDialog(false);
        // Reset state for next time
        setTimeout(() => {
            setCancelStep(1);
            setCancelReason(null);
            setCancelComment('');
        }, 300);
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
            <div className="flex justify-content-center align-items-center min-h-screen">
                <div className="text-center">
                    <ProgressSpinner style={{ width: '60px', height: '60px' }} strokeWidth="3" />
                    <p className="mt-3 text-600">Loading subscription plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />
            
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex align-items-center gap-2 bg-primary-50 text-primary border-round-3xl px-4 py-2 mb-4">
                        <i className="pi pi-star-fill text-xs"></i>
                        <span className="text-sm font-medium">Choose Your Career Path</span>
                    </div>
                    <h1 className="text-5xl font-bold text-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Subscription Plans
                    </h1>
                    <p className="text-xl text-600 max-w-2xl mx-auto leading-relaxed">
                        Unlock your potential with our carefully crafted plans designed to accelerate your career growth
                    </p>
                </div>

                {/* Current Subscription Status */}
                {currentSubscription?.has_subscription && (
                    <div className="mb-8">
                        <div className={`relative overflow-hidden border-round-2xl p-6 ${
                            currentSubscription.is_canceling 
                                ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200' 
                                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                        }`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 border-circle transform translate-x-16 -translate-y-16"></div>
                            <div className="relative z-1">
                                <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex align-items-center gap-3 mb-3">
                                            <div className={`w-3rem h-3rem border-circle flex align-items-center justify-content-center ${
                                                currentSubscription.is_canceling ? 'bg-orange-100' : 'bg-green-100'
                                            }`}>
                                                <i className={`pi ${currentSubscription.is_canceling ? 'pi-clock' : 'pi-check'} text-xl ${
                                                    currentSubscription.is_canceling ? 'text-orange-600' : 'text-green-600'
                                                }`}></i>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold mb-1 text-900">
                                                    {currentSubscription.is_canceling ? 'Subscription Ending' : 'Active Subscription'}
                                                </h3>
                                                {getSubscriptionStatusBadge()}
                                            </div>
                                        </div>
                                        <div className="bg-white bg-opacity-70 border-round-xl p-4">
                                            <p className="text-lg font-semibold mb-2 text-900">
                                                {currentSubscription.plan?.name} Plan
                                            </p>
                                            <p className="text-600 mb-2">
                                                ${currentSubscription.plan?.price}/{currentSubscription.plan?.billing_period}
                                            </p>
                                            {getSubscriptionMessage()}
                                        </div>
                                    </div>
                                    <div className="flex align-items-center gap-3">
                                        {currentSubscription.is_canceling ? (
                                            <Button
                                                label="Reactivate Subscription"
                                                icon="pi pi-refresh"
                                                className="bg-green-500 hover:bg-green-600 border-none px-6 py-3"
                                                loading={reactivating}
                                                onClick={handleReactivateSubscription}
                                            />
                                        ) : (
                                            <Button
                                                label="Manage Subscription"
                                                icon="pi pi-cog"
                                                severity="secondary"
                                                outlined
                                                className="px-6 py-3"
                                                onClick={() => setCancelDialog(true)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Subscription CTA */}
                {session?.accessToken && !currentSubscription?.has_subscription && (
                    <div className="mb-8">
                        <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 border-round-2xl p-8 text-center text-white">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <div className="absolute top-4 left-4 w-16 h-16 border-circle bg-white"></div>
                                <div className="absolute bottom-4 right-4 w-24 h-24 border-circle bg-white"></div>
                                <div className="absolute top-1/2 right-8 w-8 h-8 border-circle bg-white"></div>
                            </div>
                            <div className="relative z-1">
                                <i className="pi pi-star text-6xl mb-4 opacity-90"></i>
                                <h3 className="text-3xl font-bold mb-3">Ready to Elevate Your Career?</h3>
                                <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
                                    Join thousands of professionals who have transformed their careers with our premium features
                                </p>
                                <div className="flex justify-content-center gap-3">
                                    <div className="flex align-items-center gap-2 bg-white bg-opacity-20 border-round-xl px-4 py-2">
                                        <i className="pi pi-check text-sm"></i>
                                        <span>AI-Powered Tools</span>
                                    </div>
                                    <div className="flex align-items-center gap-2 bg-white bg-opacity-20 border-round-xl px-4 py-2">
                                        <i className="pi pi-check text-sm"></i>
                                        <span>Expert Guidance</span>
                                    </div>
                                    <div className="flex align-items-center gap-2 bg-white bg-opacity-20 border-round-xl px-4 py-2">
                                        <i className="pi pi-check text-sm"></i>
                                        <span>Career Analytics</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>



            {/* Plans Grid */}
            <div className="grid -mt-3">
                {plans.map((plan) => {
                    const planFeatures = getPlanFeatures(plan);
                    const isPopular = plan.is_popular;
                    const isFree = plan.is_free || parseFloat(plan.price) === 0;
                    const isCurrent = isCurrentPlan(plan.id);

                    return (
                        <div key={plan.id} className="col-12 md:col-6 lg:col-4 p-3">
                            <div
                                className={`h-full flex flex-column border-round-xl shadow-1 transition-all transition-duration-300 hover:shadow-3 ${
                                    isCurrent ? 'border-2 border-primary' : 'surface-card'
                                } ${isPopular && !isCurrent ? 'border-2 border-primary-500' : ''}`}
                            >
                                {isPopular && (
                                    <div className="bg-primary text-center p-2 border-round-top-lg">
                                        <h5 className="font-bold text-white m-0">MOST POPULAR</h5>
                                    </div>
                                )}

                                <div className="p-4 flex flex-column flex-grow-1">
                                    <div className="text-center mb-4">
                                        <h3 className="text-2xl font-bold mb-2 text-900">{plan.name}</h3>
                                        <p className="text-600 mb-4 h-3rem">{plan.description}</p>
                                        <div className="flex align-items-baseline justify-content-center gap-2">
                                            {isFree ? (
                                                <span className="text-5xl font-bold text-green-500">Free</span>
                                            ) : (
                                                <>
                                                    <span className="text-5xl font-bold text-900">${plan.price}</span>
                                                    <span className="text-600 text-lg">/ {plan.billing_period}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <Divider className="my-4" />

                                    <div className="mb-5 flex-grow-1">
                                        <h4 className="font-semibold mb-4 text-center text-800">What&apos;s Included:</h4>
                                        <ul className="list-none p-0 m-0">
                                            {planFeatures.map((feature, index) => (
                                                <li key={index} className="flex align-items-start mb-3">
                                                    <i className="pi pi-check-circle text-green-500 mr-3 mt-1 text-lg"></i>
                                                    <span className="text-700 line-height-3">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto pt-3">
                                        {isCurrent && !currentSubscription?.is_canceling ? (
                                            <Button
                                                label="Your Current Plan"
                                                icon="pi pi-check-circle"
                                                className="w-full p-button-success"
                                                disabled
                                            />
                                        ) : !session?.accessToken ? (
                                            <Button
                                                label="Login to Subscribe"
                                                icon="pi pi-sign-in"
                                                className="w-full p-button-secondary"
                                                onClick={() => router.push('/login')}
                                            />
                                        ) : (
                                            <Button
                                                label={
                                                    subscribing === plan.id ? 'Processing...' :
                                                    (isCurrent && currentSubscription?.is_canceling ? 'Reactivate Plan' :
                                                     isFree ? 'Get Started for Free' : 'Choose Plan')
                                                }
                                                icon={subscribing === plan.id ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'}
                                                iconPos="right"
                                                className={`w-full ${isPopular ? 'p-button-primary' : 'p-button-outlined p-button-primary'}`}
                                                loading={subscribing === plan.id}
                                                onClick={() => handlePlanAction(plan.id, plan.name)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Management Actions */}
            {session?.accessToken && currentSubscription?.has_subscription && (
                <div className="mt-6">
                    <Card className="border-round-xl">
                        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between">
                            <div className="mb-4 md:mb-0">
                                <h4 className="text-xl font-bold text-900 m-0 mb-1">Manage Your Subscription</h4>
                                <p className="text-600 m-0">Access usage, history, and account settings.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    label="Usage"
                                    icon="pi pi-chart-bar"
                                    className="p-button-secondary p-button-outlined"
                                    onClick={() => router.push('/main/plans/usage')}
                                />
                                <Button
                                    label="Settings"
                                    icon="pi pi-user"
                                    className="p-button-secondary p-button-outlined"
                                    onClick={() => router.push('/main/settings')}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Empty state */}
            {plans.length === 0 && !loading && (
                <div className="text-center py-8 mt-6">
                    <div className="surface-card p-5 border-round-xl border-1 border-dashed surface-border">
                        <i className="pi pi-inbox text-6xl text-400 mb-4"></i>
                        <h3 className="text-xl font-bold text-800 mb-2">No Plans Available Right Now</h3>
                        <p className="text-600 max-w-30rem mx-auto">
                            We are currently updating our subscription plans. Please check back in a little while.
                        </p>
                    </div>
                </div>
            )}


            {/* Cancel Subscription Dialog */}
            <Dialog
                header="Cancel Subscription"
                visible={cancelDialog}
                onHide={closeCancelDialog}
                style={{ width: '500px' }}
                modal
                footer={
                    cancelStep === 2 ? (
                        <div>
                            <Button label="Back" icon="pi pi-arrow-left" text onClick={() => setCancelStep(1)} />
                            <Button 
                                label="Confirm Cancellation" 
                                icon="pi pi-check" 
                                severity="warning" 
                                loading={canceling}
                                onClick={() => handleCancelSubscription(false)} 
                                disabled={!cancelReason}
                            />
                        </div>
                    ) : null
                }
            >
                {cancelStep === 1 && (
                    <div>
                        <div className="text-center mb-4">
                            <i className="pi pi-exclamation-triangle text-orange-500 text-6xl mb-4"></i>
                            <h4 className="text-xl mb-3">Are you sure?</h4>
                            <p className="text-600 line-height-3">
                                How would you like to proceed with your cancellation?
                            </p>
                        </div>
                        <div className="flex flex-column gap-3">
                            <Button
                                label="Cancel at Period End"
                                tooltip="We'll ask for brief feedback on the next step."
                                tooltipOptions={{ position: 'bottom' }}
                                icon="pi pi-calendar"
                                className="w-full"
                                severity="warning"
                                onClick={() => setCancelStep(2)}
                            />
                            <Button
                                label="Nevermind, Keep My Plan"
                                icon="pi pi-heart"
                                className="w-full"
                                severity="secondary"
                                outlined
                                onClick={closeCancelDialog}
                            />
                        </div>
                    </div>
                )}

                {cancelStep === 2 && (
                    <div>
                        <div className="text-center mb-4">
                            <i className="pi pi-comment text-blue-500 text-5xl mb-4"></i>
                            <h4 className="text-xl mb-3">We&apos;re sad to see you go!</h4>
                            <p className="text-600 line-height-3">
                                Please share why you&apos;re canceling. Your feedback is vital for us to improve.
                            </p>
                        </div>
                        <div className="flex flex-column gap-4">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="cancelReason">Primary reason for canceling</label>
                                <Dropdown
                                    id="cancelReason"
                                    value={cancelReason}
                                    options={cancellationReasons}
                                    onChange={(e) => setCancelReason(e.value)}
                                    placeholder="Select a reason"
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="cancelComment">Any other feedback? (Optional)</label>
                                <InputTextarea
                                    id="cancelComment"
                                    value={cancelComment}
                                    onChange={(e) => setCancelComment(e.target.value)}
                                    rows={3}
                                    className="w-full"
                                    autoResize
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Plan Change Confirmation Dialog */}
            <Dialog
                header="Confirm Plan Change"
                visible={planChangeDialog}
                style={{ width: '450px' }}
                modal
                onHide={() => setPlanChangeDialog(false)}
                footer={
                    <div>
                        <Button label="Cancel" icon="pi pi-times" onClick={() => setPlanChangeDialog(false)} className="p-button-text" />
                        <Button
                            label="Confirm Switch"
                            icon="pi pi-check"
                            loading={subscribing === targetPlan?.id}
                            onClick={() => {
                                performPlanAction(targetPlan.id);
                                setPlanChangeDialog(false);
                            }}
                            autoFocus
                        />
                    </div>
                }
            >
                <div className="flex align-items-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to switch to the <strong>{targetPlan?.name}</strong> plan?</span>
                </div>
            </Dialog>
        </div>
    );
};

export default PlansPage;
