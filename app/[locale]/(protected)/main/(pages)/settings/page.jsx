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
                    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscription/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    }).catch(err => ({ data: null })),

                    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    }).catch(err => ({ data: null })),

                    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    }).catch(err => ({ data: [] })),

                    axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile/`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    }).catch(err => ({ data: null }))
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
                    setUserProfile(prev => ({
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
                const response = await axios.put(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile/`,
                    userProfile,
                    {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    }
                );
                
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
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast('success', 'Success', 'Password changed successfully');
                setSecurity(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
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
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                        responseType: 'blob', // Important for file download
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
                <div className="bg-white shadow-1 border-bottom-1 border-200">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-content-between align-items-center">
                            <div className="flex align-items-center gap-3">
                                <Avatar
                                    label={getUserInitials()}
                                    size="large"
                                    style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
                                />
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">Account Settings</h1>
                                    <p className="text-600 text-sm">Manage your account preferences and security</p>
                                </div>
                            </div>
                            <Button
                                label="Back to Dashboard"
                                icon="pi pi-arrow-left"
                                outlined
                                onClick={() => router.push('/main')}
                            />
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
                                    <TabPanel header="Profile" leftIcon="pi pi-user mr-2">
                                        <div className="grid">
                                            <div className="col-12 lg:col-8">
                                                <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                                                <div className="grid">
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="firstName" className="font-medium">First Name</label>
                                                            <InputText
                                                                id="firstName"
                                                                value={userProfile.first_name}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, first_name: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your first name"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="lastName" className="font-medium">Last Name</label>
                                                            <InputText
                                                                id="lastName"
                                                                value={userProfile.last_name}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, last_name: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your last name"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="email" className="font-medium">Email Address</label>
                                                            <InputText
                                                                id="email"
                                                                value={userProfile.email}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your email"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="phone" className="font-medium">Phone Number</label>
                                                            <InputText
                                                                id="phone"
                                                                value={userProfile.phone}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your phone number"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="company" className="font-medium">Company</label>
                                                            <InputText
                                                                id="company"
                                                                value={userProfile.company}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your company"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="jobTitle" className="font-medium">Job Title</label>
                                                            <InputText
                                                                id="jobTitle"
                                                                value={userProfile.job_title}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, job_title: e.target.value }))}
                                                                className="w-full"
                                                                placeholder="Enter your job title"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="timezone" className="font-medium">Timezone</label>
                                                            <Dropdown
                                                                id="timezone"
                                                                value={userProfile.timezone}
                                                                options={timezones}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, timezone: e.value }))}
                                                                className="w-full"
                                                                placeholder="Select timezone"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12 md:col-6">
                                                        <div className="field">
                                                            <label htmlFor="language" className="font-medium">Language</label>
                                                            <Dropdown
                                                                id="language"
                                                                value={userProfile.language}
                                                                options={languages}
                                                                onChange={(e) => setUserProfile(prev => ({ ...prev, language: e.value }))}
                                                                className="w-full"
                                                                placeholder="Select language"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    label="Save Changes"
                                                    icon="pi pi-save"
                                                    loading={isUpdatingProfile}
                                                    onClick={handleSaveProfile}
                                                    className="mt-3"
                                                />
                                            </div>

                                            <div className="col-12 lg:col-4">
                                                <div className="bg-blue-50 border-round p-4">
                                                    <h4 className="text-blue-800 mb-3">Profile Tips</h4>
                                                    <ul className="list-none p-0 text-blue-700">
                                                        <li className="mb-2"><i className="pi pi-check-circle mr-2"></i>Keep your email updated for important notifications</li>
                                                        <li className="mb-2"><i className="pi pi-check-circle mr-2"></i>Add your company info for better networking</li>
                                                        <li className="mb-2"><i className="pi pi-check-circle mr-2"></i>Set your timezone for accurate scheduling</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* Subscription Tab */}
                                    <TabPanel header="Subscription" leftIcon="pi pi-credit-card mr-2">
                                        <div className="grid">
                                            <div className="col-12 lg:col-8">
                                                {currentSubscription?.has_subscription ? (
                                                    <div>
                                                        <div className="flex justify-content-between align-items-start mb-4">
                                                            <div>
                                                                <h3 className="text-xl font-semibold mb-2">Current Plan</h3>
                                                                <p className="text-600">Manage your subscription and billing</p>
                                                            </div>
                                                            <Badge
                                                                value={currentSubscription.is_canceling ? 'ENDING SOON' : currentSubscription.status?.toUpperCase() || 'ACTIVE'}
                                                                severity={getSubscriptionStatusSeverity()}
                                                                size="large"
                                                            />
                                                        </div>

                                                        <Card className={`${currentSubscription.is_canceling ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} mb-4`}>
                                                            <div className="grid align-items-center">
                                                                <div className="col-12 md:col-8">
                                                                    <h4 className="text-xl font-bold mb-2">{currentSubscription.plan?.name || 'Current Plan'}</h4>
                                                                    <p className="text-600 mb-2">
                                                                        <i className="pi pi-dollar mr-2"></i>
                                                                        ${currentSubscription.plan?.price || '0'} per {currentSubscription.plan?.billing_period || 'month'}
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
                                                                            {currentSubscription.is_canceling ?
                                                                                `Ends on ${new Date(currentSubscription.end_date).toLocaleDateString()}` :
                                                                                `Next billing: ${new Date(currentSubscription.end_date).toLocaleDateString()}`
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="col-12 md:col-4 text-center">
                                                                    <div className={`text-3xl font-bold ${currentSubscription.is_canceling ? 'text-orange-600' : 'text-green-600'} mb-2`}>
                                                                        {currentSubscription.days_remaining || 0}
                                                                    </div>
                                                                    <div className="text-600">
                                                                        {currentSubscription.is_canceling ? 'Days Left' : 'Days Remaining'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card>

                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                label="Change Plan"
                                                                icon="pi pi-refresh"
                                                                outlined
                                                                onClick={() => router.push('/main/plans')}
                                                            />
                                                            <Button
                                                                label="View Usage"
                                                                icon="pi pi-chart-bar"
                                                                outlined
                                                                onClick={() => router.push('/main/plans/usage')}
                                                            />

                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <i className="pi pi-shopping-cart text-6xl text-blue-300 mb-4"></i>
                                                        <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
                                                        <p className="text-600 mb-4">Subscribe to a plan to unlock premium features and boost your career</p>
                                                        <Button
                                                            label="Explore Plans"
                                                            icon="pi pi-arrow-right"
                                                            size="large"
                                                            onClick={() => router.push('/plans')}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-12 lg:col-4">
                                                <div className="bg-purple-50 border-round p-4">
                                                    <h4 className="text-purple-800 mb-3">Quick Stats</h4>
                                                    <div className="grid">
                                                        <div className="col-6">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                                                    {paymentHistory?.length || 0}
                                                                </div>
                                                                <div className="text-purple-700 text-sm">Payments</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                                                    {usageData?.usage_stats?.length || 0}
                                                                </div>
                                                                <div className="text-purple-700 text-sm">Features</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* Security Tab */}
                                    <TabPanel header="Security" leftIcon="pi pi-shield mr-2">
                                        <div className="p-4">
                                            <div className="text-center py-8">
                                                <i className="pi pi-clock text-6xl text-primary mb-4"></i>
                                                <h3 className="text-xl font-semibold mb-2 text-900">Coming Soon</h3>
                                                <p className="text-600">Security settings will be available in a future update.</p>
                                            </div>
                                        </div>
                                    </TabPanel>
                                    
                                    {/* Notifications Tab */}
                                    <TabPanel header="Notifications" leftIcon="pi pi-bell mr-2">
                                        <div className="p-4">
                                            <div className="text-center py-8">
                                                <i className="pi pi-clock text-6xl text-primary mb-4"></i>
                                                <h3 className="text-xl font-semibold mb-2 text-900">Coming Soon</h3>
                                                <p className="text-600">Notification settings will be available in a future update.</p>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* Privacy Tab */}
                                    <TabPanel header="Privacy" leftIcon="pi pi-lock mr-2">
                                        <div className="grid">
                                            <div className="col-12 lg:col-8">
                                                <h3 className="text-xl font-semibold mb-4">Data Management</h3>

                                                <Card className="mb-4">
                                                    <h4 className="text-lg font-semibold mb-3">
                                                        <i className="pi pi-download mr-2 text-blue-500"></i>
                                                        Export Your Data
                                                    </h4>
                                                    <p className="text-600 mb-3">
                                                        Download a copy of all your data including profile information,
                                                        subscription history, and usage statistics.
                                                    </p>
                                                    <Button
                                                        label="Export Data"
                                                        icon="pi pi-download"
                                                        outlined
                                                        onClick={() => setExportDialog(true)}
                                                    />
                                                </Card>

                                                <Card className="border-red-200">
                                                    <h4 className="text-lg font-semibold mb-3 text-red-600">
                                                        <i className="pi pi-trash mr-2"></i>
                                                        Delete Account
                                                    </h4>
                                                    <p className="text-600 mb-3">
                                                        Permanently delete your account and all associated data.
                                                        This action cannot be undone.
                                                    </p>
                                                    <Button
                                                        label="Delete Account"
                                                        icon="pi pi-trash"
                                                        severity="danger"
                                                        outlined
                                                        onClick={() => setDeleteDialog(true)}
                                                    />
                                                </Card>
                                            </div>

                                            <div className="col-12 lg:col-4">
                                                <div className="bg-yellow-50 border-round p-4">
                                                    <h4 className="text-yellow-800 mb-3">Privacy Information</h4>
                                                    <ul className="list-none p-0 text-yellow-700">
                                                        <li className="mb-2"><i className="pi pi-info-circle mr-2"></i>We never sell your data</li>
                                                        <li className="mb-2"><i className="pi pi-info-circle mr-2"></i>Data is encrypted at rest</li>
                                                        <li className="mb-2"><i className="pi pi-info-circle mr-2"></i>You control your information</li>
                                                        <li className="mb-2"><i className="pi pi-info-circle mr-2"></i>GDPR compliant</li>
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
                <Dialog
                    header="Export Your Data"
                    visible={exportDialog}
                    onHide={() => setExportDialog(false)}
                    style={{ width: '500px' }}
                    modal
                    className="p-fluid"
                >
                    <div className="text-center mb-4">
                        <i className="pi pi-download text-blue-500 text-4xl mb-3"></i>
                        <h4 className="mb-3">Download Your Data</h4>
                        <p className="text-600 mb-4">
                            This will create a ZIP file containing all your account data:
                        </p>
                    </div>

                    <div className="bg-blue-50 border-round p-3 mb-4">
                        <ul className="list-none p-0 m-0">
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Profile information</li>
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Resume data</li>
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Generated documents</li>
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Subscription history</li>
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Payment records</li>
                            <li className="mb-2"><i className="pi pi-check text-green-500 mr-2"></i>Usage statistics</li>
                        </ul>
                    </div>

                    <div className="bg-orange-50 border-round p-3 mb-4">
                        <p className="text-orange-700 text-sm mb-0">
                            <i className="pi pi-info-circle mr-2"></i>
                            The export may take a few moments to prepare. Please don't close this window.
                        </p>
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancel"
                            outlined
                            onClick={() => setExportDialog(false)}
                            disabled={exportLoading}
                        />
                        <Button
                            label={exportLoading ? "Preparing..." : "Download"}
                            icon={exportLoading ? "pi pi-spin pi-spinner" : "pi pi-download"}
                            onClick={handleExportData}
                            loading={exportLoading}
                        />
                    </div>
                </Dialog>

                {/* Delete Account Dialog - Step 1 */}
                <Dialog
                    header="Delete Account"
                    visible={deleteDialog}
                    onHide={() => setDeleteDialog(false)}
                    style={{ width: '500px' }}
                    modal
                >
                    <div className="text-center mb-4">
                        <i className="pi pi-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                        <h4 className="text-red-600 mb-3">Are you absolutely sure?</h4>
                        <p className="text-600 mb-4">
                            This action <strong>cannot be undone</strong>. This will permanently delete your
                            account and remove all your data from our servers.
                        </p>
                    </div>

                    <div className="bg-red-50 border-round p-3 mb-4">
                        <h5 className="text-red-700 mb-2">This will permanently delete:</h5>
                        <ul className="list-none p-0 m-0 text-red-600">
                            <li className="mb-1"><i className="pi pi-times mr-2"></i>Your profile and account</li>
                            <li className="mb-1"><i className="pi pi-times mr-2"></i>All your resumes and documents</li>
                            <li className="mb-1"><i className="pi pi-times mr-2"></i>Subscription and payment history</li>
                            <li className="mb-1"><i className="pi pi-times mr-2"></i>Generated websites and documents</li>
                            <li className="mb-1"><i className="pi pi-times mr-2"></i>All usage data and preferences</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 border-round p-3 mb-4">
                        <p className="text-blue-700 text-sm mb-0">
                            <i className="pi pi-lightbulb mr-2"></i>
                            Consider exporting your data first if you want to keep a copy.
                        </p>
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancel"
                            outlined
                            onClick={() => setDeleteDialog(false)}
                        />
                        <Button
                            label="I Want to Export Data First"
                            icon="pi pi-download"
                            outlined
                            onClick={() => {
                                setDeleteDialog(false);
                                setExportDialog(true);
                            }}
                        />
                        <Button
                            label="Continue to Delete"
                            severity="danger"
                            icon="pi pi-arrow-right"
                            onClick={proceedToConfirmation}
                        />
                    </div>
                </Dialog>

                {/* Delete Account Dialog - Step 2 (Confirmation) */}
                <Dialog
                    header="Confirm Account Deletion"
                    visible={deleteConfirmDialog}
                    onHide={() => setDeleteConfirmDialog(false)}
                    style={{ width: '500px' }}
                    modal
                >
                    <div className="text-center mb-4">
                        <i className="pi pi-shield text-red-500 text-4xl mb-3"></i>
                        <h4 className="text-red-600 mb-3">Final Confirmation Required</h4>
                        <p className="text-600 mb-4">
                            Please confirm your identity and intention to delete your account.
                        </p>
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="deletePassword" className="font-medium text-900">
                            Enter your password to confirm:
                        </label>
                        <Password
                            id="deletePassword"
                            value={deleteForm.password}
                            onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full"
                            placeholder="Enter your current password"
                            feedback={false}
                            toggleMask
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="deleteConfirmText" className="font-medium text-900">
                            Type "delete my account" to confirm:
                        </label>
                        <InputText
                            id="deleteConfirmText"
                            value={deleteForm.confirmationText}
                            onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmationText: e.target.value }))}
                            className="w-full"
                            placeholder="delete my account"
                        />
                    </div>

                    <div className="bg-orange-50 border-round p-3 mb-4">
                        <p className="text-orange-700 text-sm mb-0">
                            <i className="pi pi-info-circle mr-2"></i>
                            We will send a confirmation email to <strong>{session?.user?.email}</strong> to complete the deletion process.
                        </p>
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancel"
                            outlined
                            onClick={() => setDeleteConfirmDialog(false)}
                            disabled={deleteLoading}
                        />
                        <Button
                            label={deleteLoading ? "Processing..." : "Send Confirmation Email"}
                            severity="danger"
                            icon={deleteLoading ? "pi pi-spin pi-spinner" : "pi pi-send"}
                            onClick={handleDeleteAccount}
                            loading={deleteLoading}
                        />
                    </div>
                </Dialog>
            </div>
        );
    };

    export default SettingsPage;
