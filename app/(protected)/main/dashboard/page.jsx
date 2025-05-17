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
    <div className={`flex align-items-center ${collapsed ? 'justify-content-center' : ''} px-4 py-5`}>
        <Link href="/main/dashboard" className={styles.logo}>
            <div className={styles.logoIconContainer}>
                <IoSparkles className={styles.logoIcon} />
            </div>
            {!collapsed && <span className={styles.logoText}>CareerFlow</span>}
        </Link>
    </div>
);

const SidebarNav = ({ items, currentPath, router, collapsed }) => (
    <div className="overflow-y-auto">
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
    <div className={`${styles.topbar} surface-card shadow-1 p-3 flex justify-content-between align-items-center sticky top-0 z-5`}>
        <div className="flex align-items-center">
            <Button
                icon={<FiMenu size={20} />}
                className="p-button-rounded p-button-text p-button-plain mr-3 lg:hidden"
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
                className={`${styles.toggleButton} p-button-rounded p-button-text p-button-plain hidden lg:inline-flex`}
                onClick={onToggleSidebar}
                tooltip={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                tooltipOptions={{ position: 'bottom' }}
            />
            
            <div className="p-input-icon-left w-full max-w-30rem hidden md:block ml-3">
                <i className="pi pi-search" />
                <InputText className="w-full" placeholder="Search dashboard..." />
            </div>
        </div>
        
        <div className="flex align-items-center gap-3">
            <Button 
                icon={<FiBell size={20} />} 
                className="p-button-rounded p-button-text p-button-plain"
                badge="2" 
                badgeClassName="p-badge-danger"
            />
            <div className="flex align-items-center gap-2 cursor-pointer p-3 border-round hover:surface-100 transition-colors transition-duration-150" onClick={(e) => userMenuRef.current.toggle(e)}>
                <Avatar 
                    image={session?.user?.image || undefined}
                    label={session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"} 
                    shape="circle" 
                    className="bg-primary" 
                />
                <span className="font-medium hidden md:inline">{session?.user?.name || "User"}</span>
                <FiChevronDown className="text-600" />
            </div>
            <Menu model={userMenuItems} popup ref={userMenuRef} id="user_menu" />
        </div>
    </div>
);

const WelcomeBanner = ({ userName }) => (
    <div className="mb-6">
        <h1 className={styles.pageHeader}>Welcome back, {userName || "User"}!</h1>
        <p className={styles.pageSubheader}>Here's your career dashboard overview.</p>
    </div>
);

const ActionCard = ({ title, icon, description, onClick, buttonLabel = "Explore" }) => (
    <Card className={`${styles.quickActionCard}`}>
        <div className="flex flex-column justify-content-between h-full text-center">
            <div className="mb-4 flex align-items-center justify-content-center">
                <div className={styles.actionIcon}>
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-color-secondary mb-4 px-2">{description}</p>
            </div>
            <Button label={buttonLabel} icon="pi pi-arrow-right" iconPos="right" className="p-button-raised w-full mt-auto" onClick={onClick} />
        </div>
    </Card>
);

const QuickActionsGrid = ({ actions, router }) => (
    <div className="grid mb-5">
        {actions.map(action => (
            <div key={action.title} className="col-12 md:col-6 lg:col-3 p-3">
                <ActionCard {...action} onClick={() => router.push(action.route)} />
            </div>
        ))}
    </div>
);

const DefaultResumeDisplay = ({ resume, onSetDefault, onEdit, onViewAll, router }) => (
    <Card className={`${styles.dashboardCard} h-full`}>
        <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="text-xl font-bold m-0">Master Resume</h2>
            {resume && (
                <Button
                    label={resume.is_default ? "Default" : "Set as Default"}
                    icon={<FiStar className={resume.is_default ? 'text-yellow-500' : ''} />}
                    className={`p-button-sm ${resume.is_default ? 'p-button-success p-button-outlined' : 'p-button-outlined'}`}
                    onClick={onSetDefault}
                />
            )}
        </div>
        
        {resume ? (
            <div>
                <div className="mb-3">
                    <h3 className="text-lg font-semibold m-0">{resume.title}</h3>
                    <p className="text-sm text-color-secondary mt-2">Last updated: {resume.lastUpdated}</p>
                </div>
                <p className="text-color-secondary mb-4">This resume is used for quick actions like website generation and targeted applications.</p>
                <div className="flex flex-wrap gap-2">
                    <Button label="Edit Resume" icon={<FiEdit />} className="p-button-raised" onClick={() => onEdit(resume.id)} />
                    <Button label="All Resumes" icon={<FiList />} className="p-button-outlined" onClick={onViewAll} />
                </div>
            </div>
        ) : (
            <div className="text-center p-3">
                <div className="flex align-items-center justify-content-center mb-3">
                    <div className="p-3 bg-blue-50 border-round-xl">
                        <FiInfo className="text-4xl text-primary" />
                    </div>
                </div>
                <p className="text-lg font-medium mb-2">No default resume selected.</p>
                <p className="text-sm text-color-secondary mb-4">Please select or create a resume to set as default.</p>
                <Button label="Go to Resumes" className="p-button-primary" onClick={onViewAll} />
            </div>
        )}
    </Card>
);

const RelatedDocumentsList = ({ documents, resumeTitle, onManageDocuments }) => (
    <>
        <Divider />
        <h4 className={`${styles.sectionTitle} mb-2`}>Linked Documents</h4>
        {documents && documents.length > 0 ? (
            <ul className="list-none p-0 m-0 text-color-secondary">
                {documents.map(doc => (
                    <li key={doc.id} className="py-1 flex align-items-center">
                        <div className="p-2 surface-200 border-round mr-2">
                            <FiFileText className="text-primary" />
                        </div>
                        <span>{doc.name} for {resumeTitle || "Selected Position"}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-color-secondary">No documents linked to this resume yet.</p>
        )}
        <Button label="Manage All Documents" icon={<FiFolder />} className="p-button-text p-button-sm mt-3" onClick={onManageDocuments} />
    </>
);

const FeedCard = ({ title, items, viewAllLink, router, emptyMessage = "No items to display." }) => (
    <Card className={`${styles.dashboardCard} h-full`}>
        <div className="flex justify-content-between align-items-center mb-3">
            <h3 className="text-xl font-bold m-0">{title}</h3>
            {viewAllLink && <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" onClick={() => router.push(viewAllLink)} />}
        </div>
        
        {items.length > 0 ? (
            <ul className="list-none p-0 m-0">
                {items.map(item => (
                    <li key={item.id} className={`${styles.feedItem} p-2 border-round cursor-pointer`}>
                        <div className={styles.feedItemTitle}>{item.title}</div>
                        <div className={styles.feedItemSubtitle}>
                            {item.company || item.provider} {item.location && `- ${item.location}`} {item.deadline && `- Deadline: ${item.deadline}`}
                        </div>
                    </li>
                ))}
            </ul>
        ) : <p className="text-color-secondary">{emptyMessage}</p>}
    </Card>
);

// --- Main Dashboard Page Component ---
const DashboardPage = () => {
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
        { label: 'Overview', icon: <FiGrid />, route: '/main/dashboard' },
        { label: 'Resumes', icon: <FiFileText />, route: '/main/resumes' },
        { label: 'Documents', icon: <FiBriefcase />, route: '/main/documents' },
        { label: 'My Website', icon: <FiGlobe />, route: defaultResume ? `/main/site-editor/${defaultResume.id}` : '/main/site-editor' },
        { label: 'ATS Checker', icon: <FiCheckSquare />, route: '/main/ats-checker' },
        { label: 'Job Feed', icon: <FiBriefcase />, route: '/main/job-feed' },
        { label: 'Scholarships', icon: <FiAward />, route: '/main/scholarship-feed' },
    ];

    const quickActions = [
        { title: "ATS Checker", icon: <FiCheckSquare />, description: "Optimize your resume for Applicant Tracking Systems.", route: '/main/ats-checker', buttonLabel: "Scan Resume" },
        { title: "New Resume", icon: <FiFileText />, description: "Craft a new standout resume from scratch or a template.", route: '/main/resumes/new', buttonLabel: "Create Now" },
        { title: "My Portfolio", icon: <FiGlobe />, description: "Manage and publish your personal career website.", route: defaultResume ? `/main/site-editor/${defaultResume.id}` : '/main/site-editor', buttonLabel: "Edit Site" },
        { title: "Job Search", icon: <FiBriefcase />, description: "Discover and track relevant job opportunities.", route: '/main/job-feed', buttonLabel: "Find Jobs" },
    ];

    if (status === "loading") {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" animationDuration=".5s" />
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
        <div className={`${styles.dashboardLayout} flex min-h-screen`}>
            <Toast ref={toast} />

            {/* Sidebar */}
            <div 
                ref={sidebarRef} 
                className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} shadow-2 flex-shrink-0 hidden lg:flex lg:flex-column fixed lg:sticky`} 
                style={{ width: sidebarCollapsed ? '80px' : '280px', top: '0', height: '100vh' }}
            >
                <SidebarLogo collapsed={sidebarCollapsed} />
                <SidebarNav 
                    items={sidebarNavItems} 
                    currentPath={router.pathname} 
                    router={router} 
                    collapsed={sidebarCollapsed} 
                />
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

                <main className="flex-grow-1 overflow-y-auto p-4 lg:p-6">
                    <WelcomeBanner userName={session?.user?.name} />
                    <QuickActionsGrid actions={quickActions} router={router} />

                    <div className="grid mt-5">
                        <div className="col-12 lg:col-7 xl:col-8 p-3">
                            <DefaultResumeDisplay
                                resume={defaultResume}
                                onSetDefault={handleSetDefaultResume}
                                onEdit={(id) => router.push(`/main/editor/${id}`)}
                                onViewAll={() => router.push('/main/resumes')}
                                router={router}
                            />
                            {defaultResume && (
                                <div className="mt-4">
                                    <RelatedDocumentsList
                                        documents={relatedDocuments}
                                        resumeTitle={defaultResume.title}
                                        onManageDocuments={() => router.push('/main/documents')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="col-12 lg:col-5 xl:col-4 p-3">
                            <div className="flex flex-column gap-4">
                                <FeedCard
                                    title="Latest Job Postings"
                                    items={recentJobs}
                                    viewAllLink="/main/job-feed"
                                    router={router}
                                    emptyMessage="No new job postings found."
                                />
                                <FeedCard
                                    title="Scholarship Opportunities"
                                    items={scholarships}
                                    viewAllLink="/main/scholarship-feed"
                                    router={router}
                                    emptyMessage="No scholarships available right now."
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
