"use client";
import React, { useState, useRef, useEffect } from 'react'; // Removed cloneElement
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { Ripple } from 'primereact/ripple';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { IoSparkles } from "react-icons/io5";
import {
    FiGrid, FiFileText, FiBriefcase, FiGlobe, FiCheckSquare, FiAward, FiSettings,
    FiLogOut, FiBell, FiSearch, FiChevronDown, FiUser, FiStar, FiEdit,
    FiList, FiFolder, FiInfo, FiMenu, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaQuestionCircle } from "react-icons/fa"; // Import tour icon
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import styles from './Dashboard.module.css';
import { useTranslation } from '../../../../hooks/useTranslation';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import TaskNotificationBell from './mainComponets/TaskNotificationBell';
import DashboardContext from './DashboardContext'; // Import the context
import api from '@/lib/axios';


const RESUMES_CACHE_KEY_DASHBOARD = 'all_resumes_list_cache'; // Same key as ResumeListPage
const CACHE_EXPIRY_DURATION_DASHBOARD = 15 * 60 * 1000;

// --- Child Components (defined in the same file) ---

const SidebarLogo = ({ collapsed }) => {
    const { t } = useTranslation();
    return (
        <div className={`border-bottom-1 surface-border ${collapsed ? 'justify-content-center' : ''} px-4 flex align-items-center`}>
            <Link href="/main" className={styles.logo}>
                <div className={styles.logoIconContainer}>
                    <IoSparkles className={styles.logoIcon} />
                </div>
                {!collapsed && <span className={styles.logoText}>{t('dashboard_layout.logo')}</span>}
            </Link>
        </div>
    );
};

const SidebarNav = ({ items, currentPath, router, collapsed }) => (
    <div>
        <ul className="list-none p-3 m-0">
            {items.map(item => (
                <li key={item.label}>
                    <button
                        type="button"
                        onClick={() => router.push(item.route)}
                        className={`${styles.sidebarLink} p-ripple ${currentPath === item.route ? styles.sidebarItemActive : ''}`}
                        title={collapsed ? item.label : ''}
                    >
                        <span className={styles.sidebarLinkIcon}>{item.icon}</span>
                        {!collapsed && <span className={styles.sidebarLinkText}>{item.label}</span>}
                        <Ripple />
                    </button>
                </li>
            ))}
        </ul>
    </div>
);

const SidebarFooter = ({ router, collapsed }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-auto">
            <Divider className="mb-3 mx-3" />
            <ul className="list-none p-3 m-0">
                <li>
                    <button
                        type="button"
                        onClick={() => router.push('/main/settings')}
                        className={`${styles.sidebarLink} p-ripple`}
                        title={collapsed ? t('dashboard_layout.sidebar.settings') : ''}
                    >
                        <span className={styles.sidebarLinkIcon}><FiSettings /></span>
                        {!collapsed && <span className={styles.sidebarLinkText}>{t('dashboard_layout.sidebar.settings')}</span>}
                        <Ripple />
                    </button>
                </li>
            </ul>
        </div>
    );
};

const TopBar = ({ session, userMenuRef, userMenuItems, onToggleSidebar, onToggleMobileSidebar, sidebarCollapsed, mobileToggleButtonRef, onStartTour }) => {
    const { t } = useTranslation();
    return (
        <div className={`${styles.topbar} flex justify-content-between align-items-center sticky top-0 z-5`}>
            <div className="flex align-items-center gap-3">
                <Button
                    ref={mobileToggleButtonRef}
                    icon={<FiMenu size={20} />}
                    className="p-button-rounded p-button-text p-button-plain mr-2 lg:hidden"
                    onClick={onToggleMobileSidebar}
                />
                <Button
                    id="tour-toggle-sidebar"
                    icon={sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                    className={`${styles.toggleButton} p-button-text hidden lg:inline-flex`}
                    onClick={onToggleSidebar}
                    tooltip={sidebarCollapsed ? t('dashboard_layout.topbar.expandSidebar') : t('dashboard_layout.topbar.collapseSidebar')}
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>

            <div className="flex align-items-center gap-3">
                <Button 
                    icon={<FaQuestionCircle />} 
                    className="p-button-rounded p-button-text p-button-plain" 
                    onClick={onStartTour} 
                    tooltip={t('dashboard_layout.topbar.startTour')}
                    tooltipOptions={{ position: 'bottom' }}
                />
                <div id="tour-language-switcher">
                    <LanguageSwitcher />
                </div>
                <div id="tour-notifications">
                    <TaskNotificationBell /> 
                </div>
                <div
                    id="tour-profile-menu"
                    className={`${styles.profileButton} flex align-items-center gap-2 cursor-pointer`}
                    onClick={(event) => userMenuRef.current.toggle(event)}
                    aria-controls="popup_menu_right"
                    aria-haspopup
                >
                    <Avatar
                        image={session?.user?.image || undefined}
                        label={session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                        shape="circle"
                        className={styles.profileAvatar}
                        style={{ width: '2.2rem', height: '2.2rem' }}
                    />
                    {/* TODO: Fix white text issue on dark mode */}
                    <span className="font-medium hidden md:inline">{session?.user?.name || t('dashboard_layout.topbar.userFallback')}</span>
                    <FiChevronDown className="text-600" />
                </div>
                <Menu model={userMenuItems} popup ref={userMenuRef} id="popup_menu_right" popupAlignment="right" />
            </div>
        </div>
    );
};


export default function Layout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const userMenuRef = useRef(null);
    const sidebarRef = useRef(null);
    const mobileToggleButtonRef = useRef(null); // Ref for the mobile toggle button
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false); // State for mobile sidebar
    const { t } = useTranslation(); // Use translation hook

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#tour-sidebar', popover: { title: t('tour.sidebar.title'), description: t('tour.sidebar.description'), side: "right", align: 'start' } },
                { element: '#tour-toggle-sidebar', popover: { title: t('tour.toggleSidebar.title'), description: t('tour.toggleSidebar.description'), side: "bottom", align: 'center' } },
                { element: '#tour-language-switcher', popover: { title: t('tour.language.title'), description: t('tour.language.description'), side: "bottom", align: 'end' } },
                { element: '#tour-notifications', popover: { title: t('tour.notifications.title'), description: t('tour.notifications.description'), side: "bottom", align: 'end' } },
                { element: '#tour-profile-menu', popover: { title: t('tour.profile.title'), description: t('tour.profile.description'), side: "bottom", align: 'end' } },
                { element: '#tour-main-content', popover: { title: t('tour.mainContent.title'), description: t('tour.mainContent.description'), side: "top", align: 'center' } },
                { element: '#tour-quick-actions', popover: { title: t('tour.actionButtons.title'), description: t('tour.actionButtons.description'), side: "top", align: 'center' } }
            ]
        });

        driverObj.drive();
    };

        // --- State moved from page.jsx to layout.jsx ---
    const [allResumes, setAllResumes] = useState([]);
    const [defaultResume, setDefaultResume] = useState(null);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [isDataValid, setIsDataValid] = useState(false);
    useEffect(() => {
        console.log("NEXT_PUBLIC_BACKEND_URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
        console.log("NEXT_PUBLIC_AI_API_URL:", process.env.NEXT_PUBLIC_AI_API_URL);
        console.log("NEXT_PUBLIC_IPDATA_API_KEY:", process.env.NEXT_PUBLIC_IPDATA_API_KEY);
    }, []);
    useEffect(() => {
        const loadInitialData = async () => {
            if (status !== 'authenticated') {
                setLoadingResumes(false);
                return;
            }

            setLoadingResumes(true);
            setIsDataValid(false); // Always reset validity check on load

            try {
                // Your cache logic is fine, but we'll re-validate the content of the cache.
                const localData = localStorage.getItem(RESUMES_CACHE_KEY_DASHBOARD);
                let resumesData = null;
                if (localData) {
                    const parsedCache = JSON.parse(localData);
                    if (parsedCache.data && parsedCache.timestamp && (Date.now() - parsedCache.timestamp < CACHE_EXPIRY_DURATION_DASHBOARD)) {
                        resumesData = parsedCache.data;
                    } else {
                        localStorage.removeItem(RESUMES_CACHE_KEY_DASHBOARD);
                    }
                }

                // If cache is invalid or empty, fetch from API
                if (!resumesData) {
                    const response = await api.get(`/api/resumes/`);
                    resumesData = response.data;
                    // Cache the new data regardless of whether it's empty or not
                    localStorage.setItem(RESUMES_CACHE_KEY_DASHBOARD, JSON.stringify({ data: resumesData, timestamp: Date.now() }));
                }

                // --- CRITICAL CHECK ---
                // Now, check if the final resumesData (from cache or API) is empty.
                if (!resumesData || resumesData.length === 0) {
                    router.push('/ats');
                    // IMPORTANT: Do not proceed. The loading spinner will show until redirect completes.
                    return; 
                }

                // If we reach here, data is valid and not empty.
                setAllResumes(resumesData);
                const currentDefault = resumesData.find(r => r.is_default) || resumesData[0];
                setDefaultResume(currentDefault);
                if (currentDefault) {
                    setRelatedDocuments(currentDefault.generated_documents_data || []);
                }
                setIsDataValid(true); // Grant permission to render the dashboard

            } catch (err) {
                console.error("Error fetching resumes for dashboard:", err);
                toast.current?.show({ severity: 'error', summary: t('common.error'), detail: t('dashboard_main.toast.loadError') });
                // In case of an error, we can also redirect to a safe page or show an error state
                // For now, we'll just stop the loading spinner and let the user see an empty/error state.
            } finally {
                setLoadingResumes(false);
            }
        };

        loadInitialData();
    }, [session, status, t, router]); // Added router to dependency array


    // Effect to handle clicks outside the mobile sidebar to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the click is on the toggle button, do nothing.
            if (mobileToggleButtonRef.current && mobileToggleButtonRef.current.contains(event.target)) {
                return;
            }

            if (mobileSidebarVisible && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setMobileSidebarVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mobileSidebarVisible]); // Only re-run if mobileSidebarVisible changes


    // Effect to hide mobile sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 992) { // Corresponds to lg breakpoint
                setMobileSidebarVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Load sidebar state from localStorage
    useEffect(() => {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState !== null) {
            setSidebarCollapsed(JSON.parse(storedState));
        }
    }, []);

    // Effect for handling unauthenticated status and session errors
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
        }
        if (session?.error === "RefreshAccessTokenError") {
            signOut({ callbackUrl: '/login' });
        }
    }, [status, session, router]);


    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    const toggleMobileSidebar = () => {
        setMobileSidebarVisible(prev => !prev);
    };

    const userMenuItems = [
        { label: t('dashboard_layout.userMenu.profile'), icon: 'pi pi-user', command: () => router.push('/main/profile') },
        { label: t('dashboard_layout.userMenu.settings'), icon: 'pi pi-cog', command: () => router.push('/main/settings') },
        { separator: true },
        { label: t('dashboard_layout.userMenu.logout'), icon: 'pi pi-sign-out', command: () => signOut({ callbackUrl: '/login' }) }
    ];

    const getSidebarNavItems = (resume) => {
            let websiteRoute = '/site-editor'; // Default if no resume
            if (resume) {
                if (resume.personal_website_uuid) {
                    websiteRoute = `/site-editor/${resume.personal_website_uuid}`;
                } else {
                    // Use the locale from the useTranslation hook
                    websiteRoute = `/generate_site_yaml/${resume.id}`;
                }
            }

            return [
                { label: t('dashboard_layout.sidebar.overview'), icon: <FiGrid />, route: '/main' },
                { label: t('dashboard_layout.sidebar.resumes'), icon: <FiFileText />, route: '/main/resumes' },
                { label: t('dashboard_layout.sidebar.myWebsite'), icon: <FiGlobe />, route: websiteRoute },
                { label: t('dashboard_layout.sidebar.jobFeed'), icon: <FiBriefcase />, route: '/main/job-feed' },
                { label: t('dashboard_layout.sidebar.scholarships'), icon: <FiAward />, route: '/main/scholarship-feed' },
            ];
        };


    // If session is loading or user is unauthenticated, show a full-page spinner.
    if (status === "loading") {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
    }
    if (status === "unauthenticated") {
        // The useEffect hook will handle the redirect, but we can show a spinner in the meantime.
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
    }

    const handleSetDefaultResume = () => {
        // Placeholder: Implement actual logic to update backend/state
        setDefaultResume(prev => ({ ...prev, is_default: !prev.is_default }));
        const summary = t('common.success');
        const detail = defaultResume.is_default
            ? t('dashboard_layout.toast.unsetDefault')
            : t('dashboard_layout.toast.setDefault');
        toast.current.show({ severity: 'success', summary, detail, life: 3000 });
    };

    // Create the value object to pass to the provider
    const contextValue = {
        allResumes,
        setAllResumes,
        defaultResume,
        setDefaultResume,
        relatedDocuments,
        setRelatedDocuments,
        loadingResumes,
        toast,
    };

    return (
        <DashboardContext.Provider value={contextValue}>
            <div className={`${styles.dashboardLayout} bg-primary-50`}>
                <Toast ref={toast} />

                {/* Sidebar */}
                <div
                    id="tour-sidebar"
                    ref={sidebarRef}
                    className={`${styles.sidebar} surface-card shadow-3 border-right-1 surface-border ${sidebarCollapsed ? styles.sidebarCollapsed : ''} flex-shrink-0 lg:flex lg:flex-column ${mobileSidebarVisible ? styles.sidebarMobileOverlay : 'hidden'}`}
                    style={{ 
                        width: sidebarCollapsed ? '80px' : '280px',
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }}
                >
                    <SidebarLogo collapsed={sidebarCollapsed} />

                    {/* Scrollable sidebar nav area */}
                    <div id="tour-step-4-main-nav" className={`${styles.sidebarNavContainer} ${styles.sidebarScrollbar}`}>
                        <SidebarNav
                            items={getSidebarNavItems(defaultResume)}
                            currentPath={router.pathname}
                            router={router}
                            collapsed={sidebarCollapsed}
                        />
                    </div>

                    <SidebarFooter router={router} collapsed={sidebarCollapsed} />
                </div>

                {/* Main Content */}
                <div
                    className={`${styles.mainContent} bg-primary-50 ${sidebarCollapsed ? styles.mainContentExpanded : ''} flex flex-column flex-grow-1`}
                >
                    <TopBar
                        session={session}
                        userMenuRef={userMenuRef}
                        userMenuItems={userMenuItems}
                        onToggleSidebar={toggleSidebar}
                        onToggleMobileSidebar={toggleMobileSidebar}
                        sidebarCollapsed={sidebarCollapsed}
                        mobileToggleButtonRef={mobileToggleButtonRef}
                        onStartTour={startTour}
                    />

                    <div id="tour-main-content" className={`${styles.mainScrollArea} bg-gray-50`}>
                        {loadingResumes || !isDataValid ? (
                             <div className="flex justify-content-center align-items-center h-full">
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </div>
            </div>
        </DashboardContext.Provider>
    );
};


