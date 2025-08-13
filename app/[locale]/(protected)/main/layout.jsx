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

const TopBar = ({ session, userMenuRef, userMenuItems, sidebarRef, onToggleSidebar, sidebarCollapsed }) => {
    const { t } = useTranslation();
    return (
        <div className={`${styles.topbar} flex justify-content-between align-items-center sticky top-0 z-5`}>
            <div className="flex align-items-center gap-3">
                <Button
                    icon={<FiMenu size={20} />}
                    className="p-button-rounded p-button-text p-button-plain mr-2 lg:hidden"
                    onClick={() => {
                        const sidebar = sidebarRef.current;
                        if (sidebar) {
                            sidebar.classList.toggle('hidden');
                            sidebar.classList.toggle(styles.sidebarMobileOverlay);
                        }
                    }}
                />
                <Button
                    icon={sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                    className={`${styles.toggleButton} p-button-text hidden lg:inline-flex`}
                    onClick={onToggleSidebar}
                    tooltip={sidebarCollapsed ? t('dashboard_layout.topbar.expandSidebar') : t('dashboard_layout.topbar.collapseSidebar')}
                    tooltipOptions={{ position: 'bottom' }}
                />

                <div className={`${styles.searchContainer} p-input-icon-left hidden md:block ml-3`}>
                    <i className="pi pi-search" />
                    <InputText
                        className={`${styles.searchInput}`}
                        placeholder={t('dashboard_layout.topbar.searchPlaceholder')}
                    />
                </div>
            </div>

            <div className="flex align-items-center gap-3">
                <LanguageSwitcher />
                <TaskNotificationBell /> 
                <div
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { t } = useTranslation(); // Use translation hook

        // --- State moved from page.jsx to layout.jsx ---
    const [allResumes, setAllResumes] = useState([]);
    const [defaultResume, setDefaultResume] = useState(null);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [loadingResumes, setLoadingResumes] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            if (status === 'loading' || !session) return;

            setLoadingResumes(true);
            try {
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

                if (!resumesData) {
                    const response = await api.get(`/api/resumes/`);
                    resumesData = response.data;
                    localStorage.setItem(RESUMES_CACHE_KEY_DASHBOARD, JSON.stringify({ data: resumesData, timestamp: Date.now() }));
                }

                setAllResumes(resumesData || []);
                const currentDefault = (resumesData || []).find(r => r.is_default);
                setDefaultResume(currentDefault || null);
                if (currentDefault) {
                    setRelatedDocuments(currentDefault.generated_documents_data || []);
                } else {
                    setRelatedDocuments([]);
                }

            } catch (err) {
                console.error("Error fetching resumes for dashboard:", err);
                toast.current?.show({ severity: 'error', summary: t('common.error'), detail: t('dashboard_main.toast.loadError') });
                setAllResumes([]);
                setDefaultResume(null);
                setRelatedDocuments([]);
            } finally {
                setLoadingResumes(false);
            }
        };
        loadInitialData();
    }, [session, status, t]);



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
                { label: t('dashboard_layout.sidebar.atsChecker'), icon: <FiCheckSquare />, route: '/ats' },
                { label: t('dashboard_layout.sidebar.jobFeed'), icon: <FiBriefcase />, route: '/main/job-feed' },
                { label: t('dashboard_layout.sidebar.scholarships'), icon: <FiAward />, route: '/main/scholarship-feed' },
            ];
        };


    if (status === "loading") {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
    }

    // If unauthenticated, the useEffect will handle the redirect.
    // We still need to prevent rendering the rest of the layout for unauthenticated users.
    if (status === "unauthenticated") {
        // Optionally, render a loading spinner or null while redirecting
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
        // Or simply: return null;
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
            <div className={`${styles.dashboardLayout}`}>
                <Toast ref={toast} />

                {/* Sidebar */}
                <div
                    ref={sidebarRef}
                    className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} shadow-2 flex-shrink-0 hidden lg:flex lg:flex-column`}
                    style={{ width: sidebarCollapsed ? '80px' : '280px' }}
                >
                    <SidebarLogo collapsed={sidebarCollapsed} />

                    {/* Scrollable sidebar nav area */}
                    <div className={`${styles.sidebarNavContainer} ${styles.sidebarScrollbar}`}>
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
                    className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentExpanded : ''} flex flex-column flex-grow-1`}
                >
                    <TopBar
                        session={session}
                        userMenuRef={userMenuRef}
                        userMenuItems={userMenuItems}
                        sidebarRef={sidebarRef}
                        onToggleSidebar={toggleSidebar}
                        sidebarCollapsed={sidebarCollapsed}
                    />

                    {/* This is the ONLY scrollable main area */}
                    <div className={`${styles.mainScrollArea} ${styles.mainScrollbar}`}>
                        {children}
                    </div>
                </div>
            </div>
        </DashboardContext.Provider>
    );
};


