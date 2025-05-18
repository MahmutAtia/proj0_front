"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

// --- Child Components (defined in the same file) ---

const SidebarLogo = ({ collapsed }) => (
    <div className={`border-bottom-1 surface-border ${collapsed ? 'justify-content-center' : ''} px-4 flex align-items-center`}>
        <Link href="/main/dashboard" className={styles.logo}>
            <div className={styles.logoIconContainer}>
                <IoSparkles className={styles.logoIcon} />
            </div>
            {!collapsed && <span className={styles.logoText}>CareerFlow</span>}
        </Link>
    </div>
);

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

const SidebarFooter = ({ router, collapsed }) => (
    <div className="mt-auto">
        <Divider className="mb-3 mx-3" />
        <ul className="list-none p-3 m-0">
            <li>
                <button
                    type="button"
                    onClick={() => router.push('/main/settings')}
                    className={`${styles.sidebarLink} p-ripple`}
                    title={collapsed ? "Settings" : ''}
                >
                    <span className={styles.sidebarLinkIcon}><FiSettings /></span>
                    {!collapsed && <span className={styles.sidebarLinkText}>Settings</span>}
                    <Ripple />
                </button>
            </li>
        </ul>
    </div>
);

const TopBar = ({ session, userMenuRef, userMenuItems, sidebarRef, onToggleSidebar, sidebarCollapsed }) => (
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
                tooltip={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                tooltipOptions={{ position: 'bottom' }}
            />

            <div className={`${styles.searchContainer} p-input-icon-left hidden md:block ml-3`}>
                <i className="pi pi-search" />
                <InputText
                    className={`${styles.searchInput}`}
                    placeholder="Search dashboard..."
                />
            </div>
        </div>

        <div className="flex align-items-center gap-3">
            <Button
                icon={<FiBell size={20} />}
                className={`${styles.iconButton} p-button-rounded p-button-text`}
                badge="2"
                badgeClassName="p-badge-danger"
            />
            <div
                className={`${styles.profileButton} flex align-items-center gap-2 cursor-pointer`}
                onClick={(e) => userMenuRef.current.toggle(e)}
            >
                <Avatar
                    image={session?.user?.image || undefined}
                    label={session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    shape="circle"
                    className={styles.profileAvatar}
                    style={{ width: '2.2rem', height: '2.2rem' }}
                />
                <span className="font-medium hidden md:inline">{session?.user?.name || "User"}</span>
                <FiChevronDown className="text-600" />
            </div>
            <Menu model={userMenuItems} popup ref={userMenuRef} id="user_menu" className="shadow-4" />
        </div>
    </div>
);


export default function Layout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const toast = useRef(null);
    const userMenuRef = useRef(null);
    const sidebarRef = useRef(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Placeholder data - replace with actual data fetching
    const [defaultResume, setDefaultResume] = useState({
        title: "Senior Software Engineer",
        lastUpdated: "2025-05-15",
        is_default: true,
        id: '123'
    });
    const [relatedDocuments, setRelatedDocuments] = useState([
        { id: 'doc1', name: 'Cover Letter' }, { id: 'doc2', name: 'Motivation Letter' }
    ]);
    const [recentJobs, setRecentJobs] = useState([
        { id: 1, title: "Frontend Developer", company: "Tech Solutions Inc.", location: "Remote" },
        { id: 2, title: "Product Manager", company: "Innovate Hub", location: "New York, NY" },
        { id: 3, title: "UX Designer", company: "Creative Minds LLC", location: "San Francisco, CA" },
    ]);
    const [scholarships, setScholarships] = useState([
        { id: 1, title: "Future Leaders Scholarship", provider: "Education Foundation", deadline: "2025-08-01" },
        { id: 2, title: "Tech Innovators Grant", provider: "Science & Tech Fund", deadline: "2025-09-15" },
    ]);

    // Load sidebar state from localStorage
    useEffect(() => {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState !== null) {
            setSidebarCollapsed(JSON.parse(storedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    const userMenuItems = [
        { label: 'Profile', icon: 'pi pi-user', command: () => router.push('/main/profile') },
        { label: 'Settings', icon: 'pi pi-cog', command: () => router.push('/main/settings') },
        { separator: true },
        { label: 'Logout', icon: 'pi pi-sign-out', command: () => { router.push('/login'); } }
    ];

    const sidebarNavItems = [
        { label: 'Overview', icon: <FiGrid />, route: '/main' },
        { label: 'Resumes', icon: <FiFileText />, route: '/main/resumes' },
        { label: 'Documents', icon: <FiBriefcase />, route: '/main/documents' },
        { label: 'My Website', icon: <FiGlobe />, route: defaultResume ? `/main/site-editor/${defaultResume.id}` : '/main/site-editor' },
        { label: 'ATS Checker', icon: <FiCheckSquare />, route: '/ats' },
        { label: 'Job Feed', icon: <FiBriefcase />, route: '/main/job-feed' },
        { label: 'Scholarships', icon: <FiAward />, route: '/main/scholarship-feed' },
    ];


    if (status === "loading") {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push('/login');
        return null; // Important to return null or a loader while redirecting
    }

    const handleSetDefaultResume = () => {
        // Placeholder: Implement actual logic to update backend/state
        setDefaultResume(prev => ({ ...prev, is_default: !prev.is_default }));
        toast.current.show({ severity: 'success', summary: 'Success', detail: `Resume ${defaultResume.is_default ? 'unset as' : 'set as'} default.`, life: 3000 });
    };

    return (
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
                        items={sidebarNavItems}
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
    );
};

