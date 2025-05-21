"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Ripple } from 'primereact/ripple';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { IoSparkles } from "react-icons/io5";
import {
    FiGrid, FiFileText, FiBriefcase, FiGlobe, FiCheckSquare, FiAward, FiSettings,
    FiLogOut, FiBell, FiSearch, FiChevronDown, FiUser, FiStar, FiEdit,
    FiList, FiFolder, FiInfo, FiMenu, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import styles from './Dashboard.module.css';
import JobPostings from './mainComponets/JobPostings';
import ScholarshipList from './mainComponets/ScholarshipList';
import axios from 'axios';
import { Toast } from 'primereact/toast';


// Make sure RESUMES_CACHE_KEY and CACHE_EXPIRY_DURATION are accessible here or re-defined
// Or better, use a shared context/hook for resume data and default resume logic.

const RESUMES_CACHE_KEY_DASHBOARD = 'all_resumes_list_cache'; // Same key as ResumeListPage
const CACHE_EXPIRY_DURATION_DASHBOARD = 15 * 60 * 1000;


// --- Child Components (Updated) ---

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

const WelcomeBanner = ({ userName }) => (
    <div className="mb-6">
        <h1 className={styles.pageHeader}>Welcome back, {userName || "User"}!</h1>
        <p className={styles.pageSubheader}>Here&apos;s your career dashboard overview.</p>
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

const DefaultResumeDisplay = ({ resume, onViewAll, router, isLoading }) => {
    if (isLoading) {
        return (
            <Card className={`${styles.dashboardCardCompact}`}>
                <div className="flex align-items-center">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
                    <span className="ml-2 text-color-secondary">Loading Default Resume...</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`${styles.dashboardCardCompact} ${!resume ? styles.noResumeCard : ''}`}>
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center">
                <div className="mb-3 md:mb-0">
                    <h3 className="text-lg font-bold m-0 flex align-items-center">
                        <FiStar className="mr-2 text-yellow-500" />
                        Default Resume
                    </h3>
                    {resume ? (
                        <>
                            <p className="text-md text-primary mt-1 mb-0">{resume.title}</p>
                            <p className="text-xs text-color-secondary mt-1">
                                Last updated: {resume.updated_at ? new Date(resume.updated_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-color-secondary mt-1">No default resume selected.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 align-self-start md:align-self-center">
                    {resume && (
                        <>
                            <Button
                                icon={<FiEdit />}
                                label="Edit"
                                className="p-button-sm"
                                onClick={() => router.push(`/main/editor/${resume.id}`)}
                                tooltip="Edit Resume"
                                tooltipOptions={{position: 'top'}}
                            />
                        </>
                    )}
                    <Button
                        label="All Resumes"
                        icon={<FiList />}
                        className="p-button-sm p-button-text"
                        onClick={onViewAll}
                        tooltip="View All Resumes"
                        tooltipOptions={{position: 'top'}}
                    />
                </div>
            </div>
            {!resume && (
                <div className="mt-3 text-center">
                    <Button
                        label="Select a Default Resume"
                        className="p-button-primary p-button-sm"
                        onClick={onViewAll}
                    />
                </div>
            )}
        </Card>
    );
};

const RelatedDocumentsList = ({ documents, resumeTitle, onManageDocuments, isLoading }) => {
    if (isLoading) {
        return (
            <div className="mt-4">
                <h4 className={`${styles.sectionTitleCompact} mb-2`}>Linked Documents</h4>
                 <div className="flex align-items-center">
                    <ProgressSpinner style={{ width: '25px', height: '25px' }} strokeWidth="4" />
                    <span className="ml-2 text-color-secondary text-sm">Loading documents...</span>
                </div>
            </div>
        );
    }
    if (!resumeTitle) { // No default resume, so no related documents to show here
        return null;
    }

    return (
        <div className={`mt-4 ${styles.relatedDocsSection}`}>
            <div className="flex justify-content-between align-items-center mb-2">
                <h4 className={`${styles.sectionTitleCompact} m-0`}>
                    Documents for <span className="text-primary">{'"' + resumeTitle + '"'}</span>
                </h4>
                <Button
                    label="Manage All"
                    icon={<FiFolder />}
                    className="p-button-text p-button-sm"
                    onClick={onManageDocuments}
                    tooltip="Go to Documents Page"
                    tooltipOptions={{position: 'top'}}
                />
            </div>
            {documents && documents.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {documents.slice(0, 3).map(doc => ( // Show max 3
                        <li key={doc.unique_id || doc.id} className={`${styles.documentItem} p-2 mb-1 border-round surface-100 flex align-items-center justify-content-between`}>
                            <div className="flex align-items-center">
                                <FiFileText className="text-primary mr-2" />
                                <span className="text-sm text-color">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                            <span className="text-xs text-color-secondary">
                                Created: {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                        </li>
                    ))}
                    {documents.length > 3 && (
                        <li className="text-center mt-2">
                            <Button label={`View ${documents.length - 3} more...`} className="p-button-link p-button-sm" onClick={onManageDocuments} />
                        </li>
                    )}
                </ul>
            ) : (
                <p className="text-sm text-color-secondary p-2 border-round surface-50 text-center">
                    No documents linked to this resume yet.
                </p>
            )}
        </div>
    );
};


// --- Main Dashboard Page Component (Updated) ---
const DashboardPage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const toast = useRef(null);

    const [allResumes, setAllResumes] = useState([]);
    const [defaultResume, setDefaultResume] = useState(null);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [loadingResumes, setLoadingResumes] = useState(true);

    // Fetch all resumes and identify default
    useEffect(() => {
        const loadInitialData = async () => {
            if (sessionStatus === 'loading' || !session) return;

            setLoadingResumes(true);
            try {
                // Use caching logic similar to ResumeListPage
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
                    const headers = { 'Content-Type': 'application/json' };
                    if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`, { headers });
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
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load resume data.' });
                setAllResumes([]);
                setDefaultResume(null);
                setRelatedDocuments([]);
            } finally {
                setLoadingResumes(false);
            }
        };
        loadInitialData();
    }, [session, sessionStatus]);


    const handleSetDefaultResume = async () => {
        if (!defaultResume && allResumes.length > 0) {
            // If no default is set, and there are resumes, prompt to select one or go to resumes page
            toast.current?.show({ severity: 'info', summary: 'Action Required', detail: 'Please select a resume to set as default from the "All Resumes" page.' });
            router.push('/main/resumes'); // Or open a dialog to select
            return;
        }
        if (!defaultResume) {
             toast.current?.show({ severity: 'warn', summary: 'No Resume', detail: 'No resume selected to change default status.' });
            return;
        }


        const newDefaultState = !defaultResume.is_default;
        // Optimistic UI update
        const oldDefaultResume = { ...defaultResume };
        const oldAllResumes = [...allResumes];

        setDefaultResume(prev => prev ? { ...prev, is_default: newDefaultState } : null);
        setAllResumes(prevResumes => prevResumes.map(r => {
            if (r.id === defaultResume.id) return { ...r, is_default: newDefaultState };
            if (newDefaultState && r.is_default) return { ...r, is_default: false }; // Unset other defaults
            return r;
        }));


        try {
            // API call to update the default status
            const headers = { 'Content-Type': 'application/json' };
            if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
            // This endpoint should handle setting one resume as default and unsetting others.
            // If your backend doesn't do that, you might need two calls or a more specific endpoint.
            await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/${defaultResume.id}/`,
                { is_default: newDefaultState },
                { headers }
            );

            // Update cache
            const updatedCacheResumes = allResumes.map(r => {
                 if (r.id === defaultResume.id) return { ...r, is_default: newDefaultState };
                 if (newDefaultState && r.is_default && r.id !== defaultResume.id) return { ...r, is_default: false };
                 return r;
            });
            localStorage.setItem(RESUMES_CACHE_KEY_DASHBOARD, JSON.stringify({ data: updatedCacheResumes, timestamp: Date.now() }));

            toast.current?.show({ severity: 'success', summary: 'Success', detail: `Master resume status updated.` });
        } catch (err) {
            console.error("Error setting default resume:", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not update master resume status.' });
            // Revert optimistic update
            setDefaultResume(oldDefaultResume);
            setAllResumes(oldAllResumes);
        }
    };

    const quickActions = [
        { title: "ATS Checker", icon: <FiCheckSquare />, description: "Optimize your resume for Applicant Tracking Systems.", route: '/ats', buttonLabel: "Scan Resume" },
        { title: "New Resume", icon: <FiFileText />, description: "Craft a new standout resume from scratch or a template.", route: '/main/resumes/new', buttonLabel: "Create Now" },
        { title: "My Portfolio", icon: <FiGlobe />, description: "Manage and publish your personal career website.", route: defaultResume ? `/main/site-editor/${defaultResume.personal_website_uuid || defaultResume.id}` : '/main/site-editor', buttonLabel: "Edit Site" }, // Use personal_website_uuid if available
        { title: "Job Search", icon: <FiBriefcase />, description: "Discover and track relevant job opportunities.", route: '/main/job-feed', buttonLabel: "Find Jobs" },
    ];

    if (sessionStatus === "loading") {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen surface-ground">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
            </div>
        );
    }

    if (sessionStatus === "unauthenticated") {
        router.push('/login');
        return null;
    }

    return (
        <>
            <Toast ref={toast} />
            <WelcomeBanner userName={session?.user?.name} />
            <QuickActionsGrid actions={quickActions} router={router} />

            <div className="grid mt-5">
                <div className="col-12 lg:col-7 xl:col-8 p-3">
                    {/* Master Resume Section */}
                    <DefaultResumeDisplay
                        resume={defaultResume}
                        onViewAll={() => router.push('/main/resumes')}
                        router={router}
                        isLoading={loadingResumes}
                    />
                    {/* Related Documents for Master Resume */}
                    {!loadingResumes && defaultResume && (
                        <RelatedDocumentsList
                            documents={relatedDocuments}
                            resumeTitle={defaultResume.title}
                            onManageDocuments={() => router.push('/main/documents')}
                            isLoading={loadingResumes}
                        />
                    )}
                </div>

                <div className="col-12 lg:col-5 xl:col-4 p-3">
                    <div className="flex flex-column gap-4">
                        <JobPostings router={router} defaultResume={defaultResume} />
                        <ScholarshipList router={router} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardPage;

// Add to your Dashboard.module.css:
/*
.dashboardCardCompact {
    // Standard card styles, maybe less padding if needed
}
.noResumeCard {
    border: 2px dashed var(--surface-400); // Example style for no resume
    background-color: var(--surface-50);
}
.sectionTitleCompact {
    font-size: 1.1rem; // Slightly smaller title
    font-weight: 600;
    color: var(--text-color-secondary);
}
.relatedDocsSection {
    padding: 1rem;
    background-color: var(--surface-ground); // Slightly different background
    border-radius: var(--border-radius);
    margin-top: 1rem; // Ensure spacing
}
.documentItem {
    transition: background-color 0.2s;
}
.documentItem:hover {
    background-color: var(--surface-200) !important;
}
*/
