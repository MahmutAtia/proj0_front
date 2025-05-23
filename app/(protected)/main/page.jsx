"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
    FiArchive, FiFileText, FiBriefcase, FiGlobe, FiCheckSquare, FiAward, FiSettings,
    FiLogOut, FiBell, FiSearch, FiChevronDown, FiUser, FiStar, FiEdit,
    FiList, FiFolder, FiInfo, FiMenu, FiChevronLeft, FiChevronRight, FiPlusSquare
} from 'react-icons/fi';
import styles from './Dashboard.module.css';
import JobPostings from './mainComponets/JobPostings';
import ScholarshipList from './mainComponets/ScholarshipList';
import axios from 'axios';
import { Toast } from 'primereact/toast';

import { Dialog } from 'primereact/dialog'; // If not already there for other purposes
import GenerateDocumentDialog from './(pages)/editor/components/GenerateDocumentDialog'; // Adjust path as needed
import CreateResumeFromExistingDialog from './(pages)/editor/components/CreateResumeFromExistingDialog'; // Adjust path as neededimport

// Make sure RESUMES_CACHE_KEY and CACHE_EXPIRY_DURATION are accessible here or re-defined
// Or better, use a shared context/hook for resume data and default resume logic.

const RESUMES_CACHE_KEY_DASHBOARD = 'all_resumes_list_cache'; // Same key as ResumeListPage
const CACHE_EXPIRY_DURATION_DASHBOARD = 15 * 60 * 1000;




const WelcomeBanner = ({ userName }) => (
    <div className="mb-6">
        <h1 className={styles.pageHeader}>Welcome back, {userName || "User"}!</h1>
        <p className={styles.pageSubheader}>Here&apos;s your career dashboard overview.</p>
    </div>
);

const ActionCard = ({ title, icon, description, onClick, route, buttonLabel = "Explore" }) => {
    const router = useRouter();
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (route) {
            router.push(route);
        }
    };

    return (
        <Card className={`${styles.quickActionCard} h-full`}> {/* Ensure h-full for consistent height */}
            <div className="flex flex-column justify-content-between h-full text-center">
                <div className="mb-4 flex align-items-center justify-content-center">
                    <div className={styles.actionIconWrapper}> {/* Wrapper for better icon styling */}
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-2">{title}</h3> {/* Reduced margin */}
                    <p className={`${styles.actionDescription} text-color-secondary mb-4 px-2`}>{description}</p>
                </div>
                <Button
                    label={buttonLabel}
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-primary w-full mt-auto" // Changed to p-button-primary
                    onClick={handleClick}
                />
            </div>
        </Card>
    );
};

const QuickActionsGrid = ({ actions }) => ( // Removed router prop as ActionCard handles its own routing/onClick
    <div className="grid mb-5">
        {actions.map(action => (
            <div key={action.title} className="col-12 md:col-6 lg:col-3 p-2"> {/* Adjusted padding */}
                <ActionCard {...action} />
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
        <Card className={`${styles.dashboardCard} ${!resume ? styles.noDefaultResumeCard : ''}`}>
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center">
                <div className="mb-3 md:mb-0">
                    <div className="flex align-items-center mb-1">
                        <FiStar className={`mr-2 ${resume ? 'text-yellow-500' : 'text-gray-400'}`} style={{ fontSize: '1.3rem' }} />
                        <h3 className="text-lg font-bold m-0">
                            Default Resume
                        </h3>
                    </div>
                    {resume ? (
                        <>
                            <p className={`${styles.defaultResumeTitle} text-primary mt-1 mb-0 cursor-pointer hover:underline`} onClick={() => router.push(`/main/editor/${resume.id}`)}>
                                {resume.title}
                            </p>
                            <p className="text-xs text-color-secondary mt-1">
                                Last updated: {resume.updated_at ? new Date(resume.updated_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-color-secondary mt-1">No default resume selected. Choose one to personalize your dashboard.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 align-self-start md:align-self-center mt-2 md:mt-0">
                    {resume && (
                        <Button
                            icon={<FiEdit />}
                            label="Edit"
                            className="p-button-sm p-button-outlined"
                            onClick={() => router.push(`/main/editor/${resume.id}`)}
                            tooltip="Edit Default Resume"
                            tooltipOptions={{ position: 'top' }}
                        />
                    )}
                    <Button
                        label={resume ? "Change Default" : "Select Default"}
                        icon={<FiList />}
                        className="p-button-sm p-button-secondary"
                        onClick={onViewAll} // Navigates to resumes list page
                        tooltip="View all resumes to select or change default"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>
            {!resume && !isLoading && (
                <div className="mt-4 pt-3 border-top-1 surface-border text-center">
                    <Button
                        label="Choose Your Default Resume"
                        className="p-button-primary"
                        onClick={onViewAll}
                    />
                </div>
            )}
        </Card>
    );
};

const RelatedDocumentsList = ({ documents, resumeTitle, onManageDocuments, isLoading, router }) => {
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
    if (!resumeTitle && !isLoading) {
        return (
            <div className={`mt-4 ${styles.relatedDocsSection} ${styles.emptyDocsSection}`}>
                <div className="flex justify-content-between align-items-center mb-2">
                    <h4 className={`${styles.sectionTitle} m-0`}>Linked Documents</h4>
                </div>
                <p className="text-sm text-color-secondary p-3 border-round surface-50 text-center">
                    Select a default resume to see its linked documents here.
                </p>
            </div>
        );
    }

    return (
        <div className={`mt-4 ${styles.relatedDocsSection}`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className={`${styles.sectionTitle} m-0`}>
                    Documents for <span className="text-primary font-semibold">{'"' + resumeTitle + '"'}</span>
                </h4>
                <Button
                    label="Manage All"
                    icon={<FiFolder />}
                    className="p-button-text p-button-sm p-button-secondary"
                    onClick={onManageDocuments}
                    tooltip="Go to Documents Page"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
            {documents && documents.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {documents.slice(0, 3).map(doc => (
                        <li
                            key={doc.unique_id || doc.id}
                            className={`${styles.documentItem} p-3 mb-2 border-round surface-card border-1 surface-border flex align-items-center justify-content-between cursor-pointer hover:shadow-2 transition-shadow`}
                            onClick={() => router.push(`/document_editor/${doc.unique_id}`)}
                            title={`Edit ${doc.document_type.replace(/_/g, ' ')}`}
                        >
                            <div className="flex align-items-center">
                                <FiFileText className="text-primary mr-3" style={{ fontSize: '1.2rem' }} />
                                <span className="text-sm font-medium text-color">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                            <span className="text-xs text-color-secondary">
                                {new Date(doc.created_at).toISOString().split('T')[0]}                             </span>
                        </li>
                    ))}
                    {documents.length > 3 && (
                        <li className="text-center mt-2">
                            <Button label={`View ${documents.length - 3} more...`} className="p-button-link p-button-sm" onClick={onManageDocuments} />
                        </li>
                    )}
                </ul>
            ) : (
                <div className={`${styles.emptyDocsContent} text-center p-4 border-1 border-dashed surface-border border-round`}>
                    <FiArchive className="text-4xl text-color-secondary mb-2" />
                    <p className="text-sm text-color-secondary m-0">
                        No documents linked to this resume yet.
                    </p>
                    <Button label="Add Document" icon={<FiPlusSquare />} className="p-button-sm p-button-text mt-2" onClick={() => router.push(`/main/editor/${defaultResume?.id}`)} />
                </div>
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
    const [isGenerateDocDialogVisible, setIsGenerateDocDialogVisible] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

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

    const transformedResumesForDialog = useMemo(() => {
        return allResumes.map(resume => {
            const docTypesObject = {};
            if (resume.generated_documents_data && Array.isArray(resume.generated_documents_data)) {
                resume.generated_documents_data.forEach(doc => {
                    if (doc.document_type) {
                        // The dialog only needs to know *that* a document type exists.
                        // Storing 'true' or a minimal object is sufficient.
                        docTypesObject[doc.document_type] = true;
                    }
                });
            }
            return {
                id: resume.id, // Ensure 'id' is used consistently
                // title: resume.title, // Not strictly needed by the dialog's cache logic but good for debugging
                json_content: docTypesObject // This structure is expected by GenerateDocumentDialog
            };
        });
    }, [allResumes]);
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

    const getQuickActions = (currentDefaultResume) => [
        {
            title: "Create New Document",
            icon: <FiFileText size={28} className={styles.actionIconForeground} />, // Enhanced icon
            description: "Generate a cover letter, recommendation, or other professional document.",
            onClick: () => {
                if (allResumes.length === 0) {
                    toast.current?.show({ severity: 'warn', summary: 'No Resumes', detail: 'Please create a resume first before generating documents.', life: 4000 });
                    return;
                }
                setIsGenerateDocDialogVisible(true);
            },
            buttonLabel: "Generate Now"
        },
        {
            title: "New Resume",
            icon: <FiPlusSquare size={28} className={styles.actionIconForeground} />, // Changed icon for consistency
            description: "Craft a new standout resume from scratch or a template.",
            onClick: () => {
                if (allResumes.length === 0) {
                    toast.current?.show({ severity: 'warn', summary: 'No Resumes', detail: 'Please create a resume first before generating documents.', life: 4000 });
                    return;
                }
                setShowCreateDialog(true);
            },
            buttonLabel: "Create Resume"
        },
        {
            title: "My Portfolio",
            icon: <FiGlobe size={28} className={styles.actionIconForeground} />,
            description: "Manage and publish your personal career website.",
            route: currentDefaultResume ? `/main/site-editor/${currentDefaultResume.personal_website_uuid || currentDefaultResume.id}` : '/main/site-editor',
            buttonLabel: "Edit Site"
        },
        {
            title: "Job Search",
            icon: <FiBriefcase size={28} className={styles.actionIconForeground} />,
            description: "Discover and track relevant job opportunities.",
            route: '/main/job-feed',
            buttonLabel: "Find Jobs"
        },
    ];

    const quickActions = getQuickActions(defaultResume);

    const handleCreationSuccess = (newResumeId) => {
        console.log("New resume created with ID:", newResumeId);
        // Optionally, navigate to the new resume or refresh data
        // router.push(`/main/editor/${newResumeId}`);
        setShowCreateDialog(false);
        // Refresh resume list
    };

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
            <QuickActionsGrid actions={quickActions} />

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
            <GenerateDocumentDialog
                visible={isGenerateDocDialogVisible}
                onHide={() => setIsGenerateDocDialogVisible(false)}
                initialResumeId={null}
                availableResumes={allResumes.map(r => ({ label: r.title || `Resume ID: ${r.id}`, value: r.id }))}
                allResumesListCache={transformedResumesForDialog} // Pass the transformed data
                onGenerationSuccess={(genDetails) => {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Document Generation Started',
                        detail: `Your document is being generated.`,
                        life: 3000
                    });
                    setIsGenerateDocDialogVisible(false);
                    if (defaultResume && genDetails.resume_id_used === defaultResume.id) {
                        // Consider a more targeted refresh or update if loadInitialData is heavy
                        // For now, assuming loadInitialData can be called to refresh
                        // loadInitialData(true); // You might need to adapt loadInitialData to accept forceRefresh
                    }
                    router.push(`/document_editor/${genDetails.document_uuid}`);
                }}
            />
            <CreateResumeFromExistingDialog
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                availableResumes={allResumes.map(r => ({ label: r.title || `Resume ID: ${r.id}`, value: r.id }))}
                onSuccess={handleCreationSuccess}
            // initialResumeId can be passed if a specific resume is pre-selected
            />
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
