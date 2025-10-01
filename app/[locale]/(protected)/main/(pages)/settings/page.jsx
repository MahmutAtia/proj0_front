'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import axios from 'axios';

const SettingsPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const { t, isRTL } = useTranslation();

    // Real data states
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [usageData, setUsageData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);

    // Form states
    const [userProfile, setUserProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        timezone: 'UTC',
        language: 'en'
    });

    const [notifications, setNotifications] = useState({
        emailUpdates: true,
        planExpiry: true,
        usageAlerts: true,
        promotions: false,
        weeklyReports: true
    });

    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false
    });
    // Add new states for deletion
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteForm, setDeleteForm] = useState({
        password: '',
        confirmationText: ''
    });

    // Add missing state for export loading
    const [exportDialog, setExportDialog] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const timezones = [
        { label: 'UTC', value: 'UTC' },
        { label: 'US/Eastern', value: 'US/Eastern' },
        { label: 'US/Central', value: 'US/Central' },
        { label: 'US/Mountain', value: 'US/Mountain' },
        { label: 'US/Pacific', value: 'US/Pacific' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'Europe/Paris', value: 'Europe/Paris' },
        { label: 'Asia/Tokyo', value: 'Asia/Tokyo' }
    ];

    const languages = [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' }
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && session?.accessToken) {
            fetchAllData();
        } else if (mounted) {
            setLoading(false);
        }
    }, [session, mounted]);

    const fetchAllData = async () => {
        try {
            const [subscriptionResponse, usageResponse, paymentsResponse, userProfileResponse] = await Promise.all([
                axios
                    .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscription/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    })
                    .catch((err) => ({ data: null })),

                axios
                    .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    })
                    .catch((err) => ({ data: null })),

                axios
                    .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    })
                    .catch((err) => ({ data: [] })),

                axios
                    .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    })
                    .catch((err) => ({ data: null }))
            ]);

            setCurrentSubscription(subscriptionResponse.data);
            setUsageData(usageResponse.data);
            setPaymentHistory(paymentsResponse.data);

            // Initialize user profile with backend data if available
            if (userProfileResponse.data) {
                setUserProfile({
                    first_name: userProfileResponse.data.user?.first_name || '',
                    last_name: userProfileResponse.data.user?.last_name || '',
                    email: userProfileResponse.data.user?.email || '',
                    phone: userProfileResponse.data.phone || '',
                    company: userProfileResponse.data.company || '',
                    job_title: userProfileResponse.data.job_title || '',
                    timezone: userProfileResponse.data.timezone || 'UTC',
                    language: userProfileResponse.data.language || 'en'
                });
            } else if (session?.user) {
                setUserProfile((prev) => ({
                    ...prev,
                    first_name: session.user.name?.split(' ')[0] || '',
                    last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
                    email: session.user.email || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('error', 'Error', 'Failed to load settings data');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (severity, summary, detail) => {
        if (toast.current) {
            toast.current.show({ severity, summary, detail });
        }
    };

    const handleSaveProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile/`, userProfile, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            // INFO:
            //  TODO: change to use translations or not ?
            showToast('success', 'Success', 'Profile updated successfully');
        } catch (error) {
            showToast('error', 'Error', 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (security.newPassword !== security.confirmPassword) {
            showToast('error', 'Error', 'Passwords do not match');
            return;
        }

        if (security.newPassword.length < 8) {
            showToast('error', 'Error', 'Password must be at least 8 characters long');
            return;
        }

        setSaving(true);
        try {
            // Simulate API call - replace with actual endpoint when available
            await new Promise((resolve) => setTimeout(resolve, 1000));
            showToast('success', 'Success', 'Password changed successfully');
            setSecurity((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error) {
            showToast('error', 'Error', 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const getSubscriptionStatusSeverity = () => {
        if (!currentSubscription?.has_subscription) return 'secondary';
        if (currentSubscription.is_canceling) return 'warning';
        if (currentSubscription.status === 'active') return 'success';
        return 'info';
    };

    const getUserInitials = () => {
        if (userProfile.first_name && userProfile.last_name) {
            return userProfile.first_name.charAt(0) + userProfile.last_name.charAt(0);
        }
        if (session?.user?.name) {
            return session.user.name.charAt(0);
        }
        if (session?.user?.email) {
            return session.user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getDisplayName = () => {
        if (userProfile.first_name && userProfile.last_name) {
            return `${userProfile.first_name} ${userProfile.last_name}`;
        }
        return session?.user?.name || session?.user?.email || 'User';
    };

    const handleDeleteAccount = async () => {
        // Validate form
        if (!deleteForm.password) {
            showToast('error', 'Error', 'Please enter your password');
            return;
        }

        if (deleteForm.confirmationText.toLowerCase() !== 'delete my account') {
            showToast('error', 'Error', 'Please type "delete my account" to confirm');
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/delete/request/`,
                {
                    password: deleteForm.password,
                    confirmation_text: deleteForm.confirmationText
                },
                {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                }
            );

            showToast('success', 'Confirmation Email Sent', response.data.detail);
            setDeleteDialog(false);
            setDeleteConfirmDialog(false);

            // Reset form
            setDeleteForm({
                password: '',
                confirmationText: ''
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to process deletion request';
            showToast('error', 'Error', errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    const proceedToConfirmation = () => {
        setDeleteDialog(false);
        setDeleteConfirmDialog(true);
    };

    const handleExportData = async () => {
        setExportLoading(true);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/export/`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    },
                    responseType: 'blob' // Important for file download
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from response headers or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'carerflow_data_export.zip';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast('success', 'Export Complete', 'Your data has been downloaded successfully');
            setExportDialog(false);
        } catch (error) {
            console.error('Export error:', error);
            showToast('error', 'Export Failed', 'Failed to export your data. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    if (!mounted) {
        return null; // Prevent SSR hydration issues
    }

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
                    <i className="pi pi-lock text-6xl text-blue-500 mb-4"></i>
                    <h2 className="text-2xl font-bold mb-3">Authentication Required</h2>
                    <p className="text-600 mb-4">Please log in to access your settings.</p>
                    <Button label="Go to Login" size="large" onClick={() => router.push('/login')} />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toast ref={toast} />

            {/* Header */}
            <div className="bg-white shadow-1 border-bottom-1 border-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex align-items-center gap-3">
                            <Avatar label={getUserInitials()} size="large" style={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
                            <div>
                                <h1 className="text-2xl font-bold mb-1">{t('settings.title')}</h1>
                                <p className="text-600 text-sm">{t('settings.subtitle')}</p>
                            </div>
                        </div>
                        <Button label="Back to Dashboard" icon="pi pi-arrow-left" outlined onClick={() => router.push('/main')} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid">
                    <div className="col-12">
                        <Card className="shadow-2">
                            <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                                {/* Profile Tab */}
                                <TabPanel header={t('settings.Profile.title')} leftIcon="pi pi-user mr-2">
                                    <div className="grid">
                                        <div className="col-12 lg:col-8">
                                            <h3 className="text-xl font-semibold mb-4">{t('settings.Profile.subtitle')}</h3>
                                            <div className="grid">
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="firstName" className="font-medium">
                                                            {t('settings.Profile.firstName')}
                                                        </label>
                                                        <InputText
                                                            id="firstName"
                                                            value={userProfile.first_name}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, first_name: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.firstNamePlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="lastName" className="font-medium">
                                                            {t('settings.Profile.lastName')}
                                                        </label>
                                                        <InputText
                                                            id="lastName"
                                                            value={userProfile.last_name}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, last_name: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.lastNamePlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="email" className="font-medium">
                                                            {t('settings.Profile.email')}
                                                        </label>
                                                        <InputText
                                                            id="email"
                                                            value={userProfile.email}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, email: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.emailPlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="phone" className="font-medium">
                                                            {t('settings.Profile.phone')}
                                                        </label>
                                                        <InputText
                                                            id="phone"
                                                            value={userProfile.phone}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, phone: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.phonePlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="company" className="font-medium">
                                                            {t('settings.Profile.company')}
                                                        </label>
                                                        <InputText
                                                            id="company"
                                                            value={userProfile.company}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, company: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.companyPlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="jobTitle" className="font-medium">
                                                            {t('settings.Profile.jobTitle')}
                                                        </label>
                                                        <InputText
                                                            id="jobTitle"
                                                            value={userProfile.job_title}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, job_title: e.target.value }))}
                                                            className="w-full"
                                                            placeholder={t('settings.Profile.jobTitlePlaceholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="timezone" className="font-medium">
                                                            {t('settings.Profile.timezone')}
                                                        </label>
                                                        <Dropdown
                                                            id="timezone"
                                                            value={userProfile.timezone}
                                                            options={timezones}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, timezone: e.value }))}
                                                            className="w-full"
                                                            placeholder="Select timezone"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="field">
                                                        <label htmlFor="language" className="font-medium">
                                                            {t('settings.Profile.language')}
                                                        </label>
                                                        <Dropdown
                                                            id="language"
                                                            value={userProfile.language}
                                                            options={languages}
                                                            onChange={(e) => setUserProfile((prev) => ({ ...prev, language: e.value }))}
                                                            className="w-full"
                                                            placeholder="Select language"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button label={t('settings.Profile.save')} icon="pi pi-save" loading={isUpdatingProfile} onClick={handleSaveProfile} className="mt-3" />
                                        </div>

                                        <div className="col-12 lg:col-4">
                                            <div className="bg-blue-50 border-round p-4">
                                                <h4 className="text-blue-800 mb-3">{t('settings.Profile.tips')}</h4>
                                                <ul className="list-none p-0 text-blue-700">
                                                    <li className="mb-2">
                                                        <i className="pi pi-check-circle mr-2"></i> {t('settings.Profile.tipsKeepEmail')}
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="pi pi-check-circle mr-2"></i> {t('settings.Profile.tipsAddCompany')}
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="pi pi-check-circle mr-2"></i> {t('settings.Profile.tipsSetTimezone')}
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>

                                {/* Subscription Tab */}
                                <TabPanel header={t('settings.Subscription.title')} leftIcon="pi pi-credit-card mr-2">
                                    <div className="grid">
                                        <div className="col-12 lg:col-8">
                                            {currentSubscription?.has_subscription ? (
                                                <div>
                                                    <div className="flex justify-content-between align-items-start mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-semibold mb-2">Current Plan</h3>
                                                            <p className="text-600">{t('settings.Subscription.manage')}</p>
                                                        </div>
                                                        <Badge
                                                            value={currentSubscription.is_canceling ? t('settings.Subscription.endingSoon') : currentSubscription.status?.toUpperCase() || t('settings.Subscription.active')}
                                                            severity={getSubscriptionStatusSeverity()}
                                                            size="large"
                                                        />
                                                    </div>

                                                    <Card className={`${currentSubscription.is_canceling ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} mb-4`}>
                                                        <div className="grid align-items-center">
                                                            <div className="col-12 md:col-8">
                                                                <h4 className="text-xl font-bold mb-2">{currentSubscription.plan?.name || 'Current Plan'}</h4>
                                                                <p className="text-600 mb-2">
                                                                    <i className="pi pi-dollar mr-2"></i>${currentSubscription.plan?.price || '0'} per {currentSubscription.plan?.billing_period || 'month'}
                                                                </p>
                                                                {currentSubscription.start_date && (
                                                                    <p className="text-600 mb-2">
                                                                        <i className="pi pi-calendar mr-2"></i>
                                                                        Started: {new Date(currentSubscription.start_date).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                                {currentSubscription.end_date && (
                                                                    <p className="text-600">
                                                                        <i className="pi pi-clock mr-2"></i>
                                                                        {currentSubscription.is_canceling
                                                                            ? `Ends on ${new Date(currentSubscription.end_date).toLocaleDateString()}`
                                                                            : `Next billing: ${new Date(currentSubscription.end_date).toLocaleDateString()}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="col-12 md:col-4 text-center">
                                                                <div className={`text-3xl font-bold ${currentSubscription.is_canceling ? 'text-orange-600' : 'text-green-600'} mb-2`}>{currentSubscription.days_remaining || 0}</div>
                                                                <div className="text-600">{currentSubscription.is_canceling ? 'Days Left' : 'Days Remaining'}</div>
                                                            </div>
                                                        </div>
                                                    </Card>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Button label="Change Plan" icon="pi pi-refresh" outlined onClick={() => router.push('/main/plans')} />
                                                        <Button label="View Usage" icon="pi pi-chart-bar" outlined onClick={() => router.push('/main/plans/usage')} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <i className="pi pi-shopping-cart text-6xl text-blue-300 mb-4"></i>
                                                    <h3 className="text-xl font-semibold mb-2">{t('settings.Subscription.noActive')}</h3>
                                                    <p className="text-600 mb-4"> {t('settings.Subscription.noActiveDescription')}</p>
                                                    <Button label={t('settings.Subscription.explore')} icon="pi pi-arrow-right" size="large" onClick={() => router.push('/plans')} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-12 lg:col-4">
                                            <div className="bg-purple-50 border-round p-4">
                                                <h4 className="text-purple-800 mb-3">{t('settings.Subscription.quickStats')}</h4>
                                                <div className="grid">
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-purple-600 mb-1">{paymentHistory?.length || 0}</div>
                                                            <div className="text-purple-700 text-sm">{t('settings.Subscription.payments')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-purple-600 mb-1">{usageData?.usage_stats?.length || 0}</div>
                                                            <div className="text-purple-700 text-sm">{t('settings.Subscription.features')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>

                                {/* Security Tab */}
                                <TabPanel header={t('settings.Security.title')} leftIcon="pi pi-shield mr-2">
                                    <div className="p-4">
                                        <div className="text-center py-8">
                                            <i className="pi pi-clock text-6xl text-primary mb-4"></i>
                                            <h3 className="text-xl font-semibold mb-2 text-900">Coming Soon</h3>
                                            <p className="text-600">{t('settings.Security.subtitle')}</p>
                                        </div>
                                    </div>
                                </TabPanel>

                                {/* Notifications Tab */}
                                <TabPanel header={t('settings.Notifications.title')} leftIcon="pi pi-bell mr-2">
                                    <div className="p-4">
                                        <div className="text-center py-8">
                                            <i className="pi pi-clock text-6xl text-primary mb-4"></i>
                                            <h3 className="text-xl font-semibold mb-2 text-900">Coming Soon</h3>
                                            <p className="text-600">{t('settings.Notifications.subtitle')}</p>
                                        </div>
                                    </div>
                                </TabPanel>

                                {/* Privacy Tab */}
                                <TabPanel header={t('settings.Privacy.title')} leftIcon="pi pi-lock mr-2">
                                    <div className="grid">
                                        <div className="col-12 lg:col-8">
                                            <h3 className="text-xl font-semibold mb-4">{t('settings.Privacy.subtitle')}</h3>

                                            <Card className="mb-4">
                                                <h4 className="text-lg font-semibold mb-3">
                                                    <i className="pi pi-download mr-2 text-blue-500"></i>
                                                    {t('settings.Privacy.exportyourdata')}
                                                </h4>
                                                <p className="text-600 mb-3">{t('settings.Privacy.exportyourdataDescription')}</p>
                                                <Button label={t('settings.Privacy.export')} icon="pi pi-download" outlined onClick={() => setExportDialog(true)} />
                                            </Card>

                                            <Card className="border-red-200">
                                                <h4 className="text-lg font-semibold mb-3 text-red-600">
                                                    <i className="pi pi-trash mr-2"></i>
                                                    {t('settings.Privacy.deleteaccount')}
                                                </h4>
                                                <p className="text-600 mb-3">{t('settings.Privacy.deleteaccountDescription')}</p>
                                                <Button label={t('settings.Privacy.deleteaccount')} icon="pi pi-trash" severity="danger" outlined onClick={() => setDeleteDialog(true)} />
                                            </Card>
                                        </div>

                                        <div className="col-12 lg:col-4">
                                            <div className="bg-yellow-50 border-round p-4">
                                                <h4 className="text-yellow-800 mb-3">{t('settings.Privacy.info')}</h4>
                                                <ul className="list-none p-0 text-yellow-700">
                                                    <li className="mb-2">
                                                        <i className="pi pi-info-circle mr-2"></i> {t('settings.Privacy.infosell')}
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="pi pi-info-circle mr-2"></i> {t('settings.Privacy.infoenrypted')}
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="pi pi-info-circle mr-2"></i> {t('settings.Privacy.infocontrol')}
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="pi pi-info-circle mr-2"></i> {t('settings.Privacy.infogdpr')}
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Export Data Dialog */}
            <Dialog header={t('settings.Privacy.exportyourdata')} visible={exportDialog} onHide={() => setExportDialog(false)} style={{ width: '500px' }} modal className="p-fluid">
                <div className="text-center mb-4">
                    <i className="pi pi-download text-blue-500 text-4xl mb-3"></i>
                    <h4 className="mb-3">{t('settings.Privacy.downloadedata')}</h4>
                    <p className="text-600 mb-4">{t('settings.Privacy.downloadedataDescription')}</p>
                </div>

                <div className="bg-blue-50 border-round p-3 mb-4">
                    <ul className="list-none p-0 m-0">
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataProfile')}
                        </li>
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataResume')}
                        </li>
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataDocuments')}
                        </li>
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataSubscription')}
                        </li>
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataPayment')}
                        </li>
                        <li className="mb-2">
                            <i className="pi pi-check text-green-500 mr-2"></i>
                            {t('settings.Privacy.downloadedataUsage')}
                        </li>
                    </ul>
                </div>

                <div className="bg-orange-50 border-round p-3 mb-4">
                    <p className="text-orange-700 text-sm mb-0">
                        <i className="pi pi-info-circle mr-2"></i>
                        {t('settings.Privacy.exportyourdataDescriptioninfo')}
                    </p>
                </div>

                <div className="flex justify-content-end gap-2">
                    <Button label={t('common.cancel')} outlined onClick={() => setExportDialog(false)} disabled={exportLoading} />
                    <Button label={exportLoading ? t('common.loading') : t('common.download')} icon={exportLoading ? 'pi pi-spin pi-spinner' : 'pi pi-download'} onClick={handleExportData} loading={exportLoading} />
                </div>
            </Dialog>

            {/* Delete Account Dialog - Step 1 */}
            <Dialog header={t('settings.Privacy.deleteaccount')} visible={deleteDialog} onHide={() => setDeleteDialog(false)} style={{ width: '500px' }} modal>
                <div className="text-center mb-4">
                    <i className="pi pi-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                    <h4 className="text-red-600 mb-3">{t('settings.Privacy.deleteaccountConfirm')}</h4>
                    <p className="text-600 mb-4">{t('settings.Privacy.deleteaccountConfirmDescription')}</p>
                </div>

                <div className="bg-red-50 border-round p-3 mb-4">
                    <h5 className="text-red-700 mb-2">{t('settings.Privacy.deleteaccountConfirmData')}</h5>
                    <ul className="list-none p-0 m-0 text-red-600">
                        <li className="mb-1">
                            <i className="pi pi-times mr-2"></i> {t('settings.Privacy.deleteaccountConfirmDataProfile')}
                        </li>
                        <li className="mb-1">
                            <i className="pi pi-times mr-2"></i> {t('settings.Privacy.deleteaccountConfirmDataResume')}
                        </li>
                        <li className="mb-1">
                            <i className="pi pi-times mr-2"></i> {t('settings.Privacy.deleteaccountConfirmDataDocuments')}
                        </li>
                        <li className="mb-1">
                            <i className="pi pi-times mr-2"></i> {t('settings.Privacy.deleteaccountConfirmDataSubscription')}
                        </li>
                        <li className="mb-1">
                            <i className="pi pi-times mr-2"></i> {t('settings.Privacy.deleteaccountConfirmDataPayment')}
                        </li>
                    </ul>
                </div>

                <div className="bg-blue-50 border-round p-3 mb-4">
                    <p className="text-blue-700 text-sm mb-0">
                        <i className="pi pi-lightbulb mr-2"></i>
                        {t('settings.Privacy.deleteaccountConfirmDataExport')}
                    </p>
                </div>

                <div className="flex justify-content-end gap-2">
                    <Button label={t('common.cancel')} outlined onClick={() => setDeleteDialog(false)} />
                    <Button
                        label={t('settings.Privacy.deleteaccountConfirmwantExport')}
                        icon="pi pi-download"
                        outlined
                        onClick={() => {
                            setDeleteDialog(false);
                            setExportDialog(true);
                        }}
                    />
                    <Button label={t('common.delete')} severity="danger" icon="pi pi-arrow-right" onClick={proceedToConfirmation} />
                </div>
            </Dialog>

            {/* Delete Account Dialog - Step 2 (Confirmation) */}
            <Dialog header="Confirm Account Deletion" visible={deleteConfirmDialog} onHide={() => setDeleteConfirmDialog(false)} style={{ width: '500px' }} modal>
                <div className="text-center mb-4">
                    <i className="pi pi-shield text-red-500 text-4xl mb-3"></i>
                    <h4 className="text-red-600 mb-3">Final Confirmation Required</h4>
                    <p className="text-600 mb-4">Please confirm your identity and intention to delete your account.</p>
                </div>

                <div className="field mb-4">
                    <label htmlFor="deletePassword" className="font-medium text-900">
                        Enter your password to confirm:
                    </label>
                    <Password
                        id="deletePassword"
                        value={deleteForm.password}
                        onChange={(e) => setDeleteForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full"
                        placeholder="Enter your current password"
                        feedback={false}
                        toggleMask
                    />
                </div>

                <div className="field mb-4">
                    <label htmlFor="deleteConfirmText" className="font-medium text-900">
                        Type &ldquo;delete my account&rdquo; to confirm:
                    </label>
                    <InputText id="deleteConfirmText" value={deleteForm.confirmationText} onChange={(e) => setDeleteForm((prev) => ({ ...prev, confirmationText: e.target.value }))} className="w-full" placeholder="delete my account" />
                </div>

                <div className="bg-orange-50 border-round p-3 mb-4">
                    <p className="text-orange-700 text-sm mb-0">
                        <i className="pi pi-info-circle mr-2"></i>
                        We will send a confirmation email to <strong>{session?.user?.email}</strong> to complete the deletion process.
                    </p>
                </div>

                <div className="flex justify-content-end gap-2">
                    <Button label="Cancel" outlined onClick={() => setDeleteConfirmDialog(false)} disabled={deleteLoading} />
                    <Button label={deleteLoading ? 'Processing...' : 'Send Confirmation Email'} severity="danger" icon={deleteLoading ? 'pi pi-spin pi-spinner' : 'pi pi-send'} onClick={handleDeleteAccount} loading={deleteLoading} />
                </div>
            </Dialog>
        </div>
    );
};

export default SettingsPage;
