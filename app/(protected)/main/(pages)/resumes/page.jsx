"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { FiFileText, FiEdit, FiPlusSquare, FiArchive, FiAlertCircle, FiStar } from 'react-icons/fi'; // Added more icons
import { Dialog } from 'primereact/dialog';
import ResumeDocumentsDialog from './ResumeDocumentsDialog';
import CreateResumeFromExistingDialog from '../editor/components/CreateResumeFromExistingDialog';
// Replace the old cache logic with the centralized utility
import { getResumesFromCache, setResumesCache, addOrUpdateResumeInCache } from '@/app/utils/resumeCache';

const ResumeListPage = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [layout, setLayout] = useState('grid'); // Default to grid view
    const [isDocumentsDialogVisible, setIsDocumentsDialogVisible] = useState(false);
    const [selectedResumeForDocuments, setSelectedResumeForDocuments] = useState(null);
    // Add state for the create dialog
    const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const loadResumes = useCallback(async (forceRefresh = false) => {
        if (sessionStatus === 'loading') return;
        if (!session) {
            setError("User not authenticated.");
            setLoading(false);
            router.push('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let data = forceRefresh ? null : await getResumesFromCache();
            if (!data) {
                data = await fetchAndCacheResumes(session);
            }
            setResumes(data || []);
        } catch (err) {
            console.error("Failed to fetch resumes:", err);
            let detail = 'Could not load resumes. Please try again later.';
            if (err.message === "Backend URL (NEXT_PUBLIC_BACKEND_URL) is not configured.") {
                detail = err.message;
            } else if (err.code === 'ECONNABORTED') {
                detail = 'The request timed out. Please check your connection or try again.';
            } else if (err.response) {
                detail = `Server Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText || 'Unknown server error'}`;
            } else if (err.request) {
                detail = 'No response from server. Check network connection or backend status.';
            } else {
                detail = err.message || 'An unexpected error occurred.';
            }
            setError(detail);
            toast.current?.show({
                severity: 'error',
                summary: 'Error Loading Resumes',
                detail: detail,
                life: 7000
            });
            setResumes([]);
        } finally {
            setLoading(false);
        }
    }, [session, sessionStatus, router]); // Added router to dependencies

    useEffect(() => {
        loadResumes();
    }, [loadResumes]); // useEffect will call loadResumes

    const handleViewEditResume = (resume) => {
        router.push(`/main/editor/${resume.id}`);
    };

    const handleEditDocument = (docId, e) => {
        e.stopPropagation();
        router.push(`/document_editor/${docId}`);
    };

    const documentTypeDisplay = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const openDocumentsDialog = (resume) => {
        setSelectedResumeForDocuments(resume);
        setIsDocumentsDialogVisible(true);
    };

    const onHideDocumentsDialog = () => {
        setIsDocumentsDialogVisible(false);
        // setSelectedResumeForDocuments(null); // Keep selected in case dialog is re-opened quickly, or clear if preferred
    };

    const resumeItemTemplate = (resume, currentLayout) => {
        if (!resume) return null;

        const displayDate = resume.updated_at || resume.created_at;
        const documents = resume.generated_documents_data || [];

        if (currentLayout === 'list') {
            return (
                <div className="col-12">
                    <div className="p-4 surface-card border-1 surface-border border-round hover:shadow-3 transition-shadow transition-duration-200">
                        <div className="flex flex-column xl:flex-row xl:align-items-start gap-4">
                            <div
                                className="flex-shrink-0 flex justify-content-center align-items-center bg-primary-50 border-round cursor-pointer"
                                style={{ width: '70px', height: '70px' }}
                                onClick={() => handleViewEditResume(resume)}
                            >
                                <i className={`pi ${resume.icon || 'pi-id-card'} text-3xl text-primary-600`}></i>
                            </div>
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-start flex-1 gap-3">
                                <div className="flex flex-column align-items-start gap-1 flex-grow-1 cursor-pointer" onClick={() => handleViewEditResume(resume)}>
                                    <div className="text-lg font-semibold text-900 flex align-items-center">
                                        {resume.title || 'Untitled Resume'}
                                        {resume.is_default && <Tag severity="contrast" value="Default" className="ml-2 text-xs p-tag-rounded" icon={<FiStar className="mr-1"/>}></Tag>}
                                    </div>
                                    <p className="text-sm text-color-secondary mb-1 line-clamp-2" style={{ minHeight: '2.4em' }}>
                                        {resume.about || 'No description available.'}
                                    </p>
                                    <span className="text-xs text-color-secondary">
                                        <i className="pi pi-calendar mr-1"></i>
                                        Updated: {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex flex-column align-items-stretch sm:align-items-end gap-2" style={{minWidth: '180px'}}> {/* Adjusted minWidth */}
                                    <Button
                                        label="Manage Resume"
                                        icon={<FiEdit className="mr-2"/>}
                                        className="p-button-sm p-button-info w-full"
                                        onClick={(e) => { e.stopPropagation(); handleViewEditResume(resume); }}
                                    />
                                    {documents.length > 0 ? (
                                        <Button
                                            label={`View Documents (${documents.length})`}
                                            icon={<FiFileText className="mr-2"/>}
                                            className="p-button-sm p-button-outlined p-button-secondary w-full"
                                            onClick={(e) => { e.stopPropagation(); openDocumentsDialog(resume); }}
                                        />
                                    ) : (
                                        <Button
                                            label="Add Documents"
                                            icon={<FiPlusSquare className="mr-2"/>}
                                            className="p-button-sm p-button-text p-button-secondary w-full"
                                            onClick={(e) => { e.stopPropagation(); handleViewEditResume(resume); }}
                                            tooltip="Open resume to add documents"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentLayout === 'grid') {
            return (
                <div className="col-12 sm:col-6 md:col-4 xl:col-3 p-2">
                    <div className="p-4 border-1 surface-border surface-card border-round h-full flex flex-column justify-content-between cursor-pointer hover:shadow-3 transition-shadow transition-duration-200" onClick={() => handleViewEditResume(resume)}>
                        <div>
                            <div className="flex flex-column align-items-center gap-2 mb-3">
                                <div className="flex-shrink-0 flex justify-content-center align-items-center bg-primary-50 border-round mb-2" style={{ width: '50px', height: '50px' }}>
                                    <i className={`pi ${resume.icon || 'pi-id-card'} text-2xl text-primary-600`}></i>
                                </div>
                                <h4 className="font-semibold text-md mb-0 text-center line-clamp-2" style={{ minHeight: '2.4em' }}>
                                    {resume.title || 'Untitled Resume'}
                                </h4>
                                {resume.is_default && <Tag severity="contrast" value="Default" className="mt-1 text-xs p-tag-rounded" icon={<FiStar className="mr-1"/>}></Tag>}
                                <p className="text-xs text-color-secondary mt-1 text-center line-clamp-2" style={{ minHeight: '2.4em' }}>
                                    {resume.about || 'No description'}
                                </p>
                            </div>
                            <div className="flex flex-column gap-1 text-xs text-center text-color-secondary">
                                <div>
                                    <i className="pi pi-calendar mr-1"></i>
                                    {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                                </div>
                                {documents.length > 0 && (
                                    <div>
                                        <FiFileText className="mr-1 vertical-align-middle" />
                                        {documents.length} document(s)
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-column gap-2"> {/* Changed to flex-column and gap-2 */}
                             <Button
                                label="Manage"
                                icon={<FiEdit className="mr-2"/>}
                                className="p-button-sm p-button-info w-full"
                                onClick={(e) => { e.stopPropagation(); handleViewEditResume(resume); }}
                            />
                            {documents.length > 0 && (
                                <Button
                                    label="Documents" // Shorter label for grid
                                    icon={<FiFileText />}
                                    className="p-button-sm p-button-outlined p-button-secondary w-full"
                                    onClick={(e) => { e.stopPropagation(); openDocumentsDialog(resume); }}
                                    tooltip="View Documents"
                                />
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    };

    const renderDataViewHeader = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center p-4 surface-section border-bottom-1 surface-border">
                <div className="flex align-items-center">
                    <h1 className="m-0 text-xl font-bold text-900">My Resumes</h1>
                    <Button
                        icon={<FiPlusSquare className="mr-2"/>}
                        label="Create New Resume"
                        className="p-button-primary p-button-sm ml-3"
                        onClick={() => setIsCreateDialogVisible(true)} // Open dialog instead of navigating
                    />
                </div>
                <div className="flex align-items-center gap-2 mt-3 md:mt-0">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search Resumes..." className="p-inputtext-sm" style={{minWidth: '180px'}}/>
                    </span>
                    <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
                </div>
            </div>
        );
    };

    const dataviewHeader = renderDataViewHeader();

    if (loading && !resumes.length) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
                <ProgressSpinner strokeWidth="3" style={{ width: '40px', height: '40px' }} />
                <span className="ml-2 text-color-secondary">Loading resumes...</span>
            </div>
        );
    }

    if (error && !resumes.length) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="text-center p-5 surface-card border-round shadow-2">
                    <FiAlertCircle className="text-red-500 text-5xl mb-3"/>
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Resumes</h3>
                    <p className="text-color-secondary mb-4 text-sm">{error}</p>
                    <Button
                        label="Try Again"
                        icon="pi pi-refresh"
                        className="p-button-danger p-button-outlined"
                        onClick={() => {
                            // Use the centralized cache invalidation
                            setResumesCache([]);
                            loadResumes(true);
                        }}
                    />
                </div>
            </div>
        );
    }

    const filteredResumes = resumes.filter(resume => {
        if (!globalFilter) return true;
        const filter = globalFilter.toLowerCase();
        return (resume.title?.toLowerCase().includes(filter) ||
            resume.about?.toLowerCase().includes(filter) ||
            resume.id?.toString().toLowerCase().includes(filter)
        );
    });

    return (
        <div className="p-0">
            <Toast ref={toast} />
            <div className="resume-list-page-card shadow-none border-round-none md:border-round md:shadow-2">
                <DataView
                    value={filteredResumes}
                    itemTemplate={resumeItemTemplate}
                    layout={layout}
                    header={dataviewHeader}
                    paginator
                    rows={layout === 'grid' ? 12 : 5}
                    rowsPerPageOptions={layout === 'grid' ? [12, 24, 36] : [5, 10, 15]}
                    loading={loading}
                    emptyMessage={error ? "Error loading data. Please try again." : "No resumes found. Click 'Create New Resume' to start!"}
                    sortField="updated_at" // Default sort
                    sortOrder={-1}      // Descending
                    pt={{ header: { className: 'p-0 border-none' } }}
                />
            </div>

            {/* Render the Documents Dialog */}
            <ResumeDocumentsDialog
                visible={isDocumentsDialogVisible}
                onHide={onHideDocumentsDialog}
                resume={selectedResumeForDocuments}
                onEditDocument={(docId) => {
                    onHideDocumentsDialog(); // Close dialog before navigating
                    router.push(`/document_editor/${docId}`);
                }}
                onManageResume={(resumeToManage) => { // Renamed for clarity
                    onHideDocumentsDialog();
                    handleViewEditResume(resumeToManage);
                }}
            />

            {/* Add the Create Resume Dialog */}
            <CreateResumeFromExistingDialog
                visible={isCreateDialogVisible}
                onHide={() => setIsCreateDialogVisible(false)}
                availableResumes={resumes.map(r => ({ label: r.title || `Resume ID: ${r.id}`, value: r.id }))}
                onSuccess={(newResumeId) => {
                    setIsCreateDialogVisible(false); // Close the dialog

                    // Refresh the resumes list to include the new resume
                    loadResumes(true); // Force refresh
                    // Navigate to the new resume after a short delay
                }}
            />

            <style jsx global>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .p-tag-rounded {
                    border-radius: 12px !important; /* Or use theme variable */
                }
                .bg-primary-50 { /* Example light primary color */
                    background-color: var(--primary-50, #eef2ff) !important;
                }
                .text-primary-600 { /* Example primary text color */
                    color: var(--primary-600, #4f46e5) !important;
                }
            `}</style>
        </div>
    );
};

export default ResumeListPage;
