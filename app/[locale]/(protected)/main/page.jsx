"use client";
import React, { useState, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    FiFileText, FiPlusSquare, FiBriefcase, FiGlobe, FiStar, FiEdit,
    FiList, FiFolder, FiArchive
} from 'react-icons/fi';
import styles from './Dashboard.module.css';
import JobPostings from './mainComponets/JobPostings';
import ScholarshipList from './mainComponets/ScholarshipList';
import api from '@/lib/axios'; 

import GenerateDocumentDialog from '../editor/components/GenerateDocumentDialog';
import  CreateResumeFromExistingDialog  from '../editor/components/CreateResumeFromExistingDialog';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useDashboard } from './DashboardContext'; // Import the context hook

// Removed cache constants and related logic from here

const WelcomeBanner = ({ userName }) => {
    const { t } = useTranslation();
    return (
        <div className="mb-6">
            <h1 className={`${styles.pageHeader} text-900`}>{t('dashboard_main.welcomeBanner.title', { userName: userName || t('dashboard_main.welcomeBanner.userFallback') })}</h1>
            <p className={`${styles.pageSubheader} text-600`}>{t('dashboard_main.welcomeBanner.subtitle')}</p>
        </div>
    );
};

const ActionCard = ({ title, icon, description, onClick, route, buttonLabel }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (route) {
            router.push(route);
        }
    };

    return (
        <Card className={`${styles.quickActionCard} h-full surface-card shadow-2 border-1 surface-border`}>
            <div className="flex flex-column justify-content-between h-full text-center">
                <div className="mb-4 flex align-items-center justify-content-center">
                    <div className="bg-primary-100 text-primary-700 p-3 border-round-2xl">
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-2 text-900">{title}</h3>
                    <p className="text-600 mb-4 px-2">{description}</p>
                </div>
                <Button
                    label={buttonLabel || t('dashboard_main.actionCard.explore')}
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-primary w-full mt-auto"
                    onClick={handleClick}
                />
            </div>
        </Card>
    );
};

const QuickActionsGrid = ({ actions }) => ( // Removed router prop as ActionCard handles its own routing/onClick
    <div id="tour-quick-actions" className="grid mb-5">
        {actions.map(action => (
            <div key={action.title} className="col-12 md:col-6 lg:col-3 p-2"> {/* Adjusted padding */}
                <ActionCard {...action} />
            </div>
        ))}
    </div>
);

const DefaultResumeDisplay = ({ resume, onViewAll, router, isLoading }) => {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Card className={`${styles.dashboardCardCompact}`}>
                <div className="flex align-items-center">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
                    <span className="ml-2 text-color-secondary">{t('dashboard_main.defaultResume.loading')}</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`${styles.dashboardCard} surface-card shadow-2 border-1 surface-border`}>
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center">
                <div className="mb-3 md:mb-0">
                    <div className="flex align-items-center mb-1">
                        <FiStar className={`mr-2 ${resume ? 'text-yellow-500' : 'text-400'}`} style={{ fontSize: '1.3rem' }} />
                        <h3 className="text-lg font-bold m-0 text-900">
                            {t('dashboard_main.defaultResume.title')}
                        </h3>
                    </div>
                    {resume ? (
                        <>
                            <p className="text-primary mt-1 mb-0 cursor-pointer hover:underline" onClick={() => router.push(`/editor/${resume.id}`)}>
                                {resume.title}
                            </p>
                            <p className="text-xs text-600 mt-1">
                                {t('dashboard_main.defaultResume.lastUpdated', { date: resume.updated_at ? new Date(resume.updated_at).toLocaleDateString() : 'N/A' })}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-600 mt-1">{t('dashboard_main.defaultResume.noDefaultSelected')}</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 align-self-start md:align-self-center mt-2 md:mt-0">
                    {resume && (
                        <Button
                            icon={<FiEdit />}
                            label={t('common.edit')}
                            className="p-button-sm p-button-outlined"
                            onClick={() => router.push(`/editor/${resume.id}`)}
                            tooltip={t('dashboard_main.defaultResume.tooltipEdit')}
                            tooltipOptions={{ position: 'top' }}
                        />
                    )}
                    <Button
                        label={resume ? t('dashboard_main.defaultResume.changeDefault') : t('dashboard_main.defaultResume.selectDefault')}
                        icon={<FiList />}
                        className="p-button-sm p-button-secondary"
                        onClick={onViewAll} // Navigates to resumes list page
                        tooltip={t('dashboard_main.defaultResume.tooltipViewAll')}
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>
            {!resume && !isLoading && (
                <div className="mt-4 pt-3 border-top-1 surface-border text-center">
                    <Button
                        label={t('dashboard_main.defaultResume.buttonChooseDefault')}
                        className="p-button-primary"
                        onClick={onViewAll}
                    />
                </div>
            )}
        </Card>
    );
};

const RelatedDocumentsList = ({ documents, resumeTitle, onManageDocuments, isLoading, router }) => {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <div className="mt-4">
                <h4 className={`${styles.sectionTitleCompact} mb-2`}>{t('dashboard_main.relatedDocuments.title')}</h4>
                <div className="flex align-items-center">
                    <ProgressSpinner style={{ width: '25px', height: '25px' }} strokeWidth="4" />
                    <span className="ml-2 text-color-secondary text-sm">{t('dashboard_main.relatedDocuments.loading')}</span>
                </div>
            </div>
        );
    }
    if (!resumeTitle && !isLoading) {
        return (
            <div className={`mt-4 ${styles.relatedDocsSection} ${styles.emptyDocsSection}`}>
                <div className="flex justify-content-between align-items-center mb-2">
                    <h4 className={`${styles.sectionTitle} m-0`}>{t('dashboard_main.relatedDocuments.title')}</h4>
                </div>
                <p className="text-sm text-color-secondary p-3 border-round surface-50 text-center">
                    {t('dashboard_main.relatedDocuments.selectDefaultPrompt')}
                </p>
            </div>
        );
    }

    return (
        <div className={`mt-4 ${styles.relatedDocsSection}`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className={`${styles.sectionTitle} m-0`}>
                    {t('dashboard_main.relatedDocuments.documentsFor', { resumeTitle })}
                </h4>
                <Button
                    label={t('dashboard_main.relatedDocuments.manageAll')}
                    icon={<FiFolder />}
                    className="p-button-text p-button-sm p-button-secondary"
                    onClick={onManageDocuments}
                    tooltip={t('dashboard_main.relatedDocuments.tooltipManageAll')}
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
                            <Button label={t('dashboard_main.relatedDocuments.viewMore', { count: documents.length - 3 })} className="p-button-link p-button-sm" onClick={onManageDocuments} />
                        </li>
                    )}
                </ul>
            ) : (
                <div className={`${styles.emptyDocsContent} text-center p-4 border-1 border-dashed surface-border border-round`}>
                    <FiArchive className="text-4xl text-color-secondary mb-2" />
                    <p className="text-sm text-color-secondary m-0">
                        {t('dashboard_main.relatedDocuments.noDocuments')}
                    </p>
                    <Button label={t('dashboard_main.relatedDocuments.addDocument')} icon={<FiPlusSquare />} className="p-button-sm p-button-text mt-2" onClick={() => router.push(`/editor/${defaultResume?.id}`)} />
                </div>
            )}
        </div>
    );
};


// --- Main Dashboard Page Component (Updated) ---
const DashboardPage = () => {
    // Get all data from the context provided by layout.jsx
    const {
        allResumes,
        defaultResume,
        relatedDocuments,
        loadingResumes,
        toast
    } = useDashboard();

    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { t } = useTranslation();

    const [isGenerateDocDialogVisible, setIsGenerateDocDialogVisible] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const transformedResumesForDialog = useMemo(() => {
        return (allResumes || []).map(resume => {
            const docTypesObject = {};
            if (resume.generated_documents_data && Array.isArray(resume.generated_documents_data)) {
                resume.generated_documents_data.forEach(doc => {
                    if (doc.document_type) {
                        docTypesObject[doc.document_type] = true;
                    }
                });
            }
            return {
                id: resume.id,
                json_content: docTypesObject,
                resume: resume.resume,         // <-- Add this line
                about: resume.about || "",     // <-- And this line
            };
        });
    }, [allResumes]);


    const getQuickActions = (currentDefaultResume) => {
        let portfolioRoute = '/site-editor'; // Fallback route
        const locale = router.locale;

        if (currentDefaultResume) {
            // If a site UUID exists, go to the editor for that site
            if (currentDefaultResume.personal_website_uuid) {
                portfolioRoute = `/site-editor/${currentDefaultResume.personal_website_uuid}`;
            } else {
                // Otherwise, go to the page to generate a new site for the resume
                portfolioRoute = `/generate_site_yaml/${currentDefaultResume.id}`;
            }
        }

        return [

            {
                title: t('dashboard_main.quickActions.newResume.title'),
                icon: <FiPlusSquare size={28} className={styles.actionIconForeground} />, // Changed icon for consistency
                description: t('dashboard_main.quickActions.newResume.description'),
                onClick: () => {
                    if (allResumes.length === 0) {
                        toast.current?.show({ severity: 'warn', summary: t('dashboard_main.toast.noResumeSummary'), detail: t('dashboard_main.toast.noResumeForDoc'), life: 4000 });
                        return;
                    }
                    setShowCreateDialog(true);
                },
                buttonLabel: t('dashboard_main.quickActions.newResume.button')
            },
            {
                title: t('dashboard_main.quickActions.createDocument.title'),
                icon: <FiFileText size={28} className={styles.actionIconForeground} />, // Enhanced icon
                description: t('dashboard_main.quickActions.createDocument.description'),
                onClick: () => {
                    if (allResumes.length === 0) {
                        toast.current?.show({ severity: 'warn', summary: t('dashboard_main.toast.noResumeSummary'), detail: t('dashboard_main.toast.noResumeForDoc'), life: 4000 });
                        return;
                    }
                    setIsGenerateDocDialogVisible(true);
                },
                buttonLabel: t('dashboard_main.quickActions.createDocument.button')
            },
            {
                title: t('dashboard_main.quickActions.myPortfolio.title'),
                icon: <FiGlobe size={28} className={styles.actionIconForeground} />,
                description: t('dashboard_main.quickActions.myPortfolio.description'),
                route: portfolioRoute, // Use the dynamically determined route
                buttonLabel: t('dashboard_main.quickActions.myPortfolio.button')
            },
            {
                title: t('dashboard_main.quickActions.jobSearch.title'),
                icon: <FiBriefcase size={28} className={styles.actionIconForeground} />,
                description: t('dashboard_main.quickActions.jobSearch.description'),
                route: '/main/job-feed',
                buttonLabel: t('dashboard_main.quickActions.jobSearch.button')
            },
        ];
    };

    const quickActions = getQuickActions(defaultResume);

    const handleCreationSuccess = (newResumeId) => {
        // To refresh data, we might need to reload or use a more advanced state management
        setShowCreateDialog(false);

    };

    if (sessionStatus === "unauthenticated") {
        router.push('/login');
        return null;
    }

    return (
        <>
            {/* Toast is now rendered in the layout, so we can remove it from here if we want */}
            {/* <Toast ref={toast} /> */}
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
                availableResumes={allResumes.map(r => ({ label: r.title || t('dashboard_main.dialog.resumeIdLabel', { id: r.id }), value: r.id }))}
                allResumesListCache={transformedResumesForDialog} // Pass the transformed data
                onGenerationSuccess={(genDetails) => {
                    toast.current?.show({
                        severity: 'success',
                        summary: t('dashboard_main.toast.generationStartedSummary'),
                        detail: t('dashboard_main.toast.generationStartedDetail'),
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
                availableResumes={allResumes.map(r => ({ label: r.title || t('dashboard_main.dialog.resumeIdLabel', { id: r.id }), value: r.id }))}
                onSuccess={handleCreationSuccess}
            // initialResumeId can be passed if a specific resume is pre-selected
            />
        </>
    );
};

export default DashboardPage;

// CSS comments remain the same
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
// .documentItem:hover {
    background-color: var(--surface-200) !important;
}
*/
