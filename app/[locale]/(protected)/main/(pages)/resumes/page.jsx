"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { Tag } from 'primereact/tag';
import { FiFileText, FiEdit, FiPlusSquare, FiArchive, FiAlertCircle, FiStar } from 'react-icons/fi';
import { Dialog } from 'primereact/dialog';
import ResumeDocumentsDialog from './ResumeDocumentsDialog';
import CreateResumeFromExistingDialog from '../editor/components/CreateResumeFromExistingDialog';
import { getResumesFromCache, setResumesCache, addOrUpdateResumeInCache } from '@/app/utils/resumeCache';
import { useTranslation } from '@/hooks/useTranslation';

async function fetchAndCacheResumes(session) {
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
        throw new Error("Backend URL (NEXT_PUBLIC_BACKEND_URL) is not configured.");
    }
    const headers = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await api.get('/api/resumes/', { timeout: 15000 });

    if (Array.isArray(response.data)) {
        setResumesCache(response.data);
        return response.data;
    } else {
        console.error("Invalid data format received from backend. Expected an array.", response.data);
        throw new Error("Invalid data format received from backend.");
    }
}

const ResumeListPage = () => {
    const { t, locale, isRTL } = useTranslation();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [layout, setLayout] = useState('grid');
    const [isDocumentsDialogVisible, setIsDocumentsDialogVisible] = useState(false);
    const [selectedResumeForDocuments, setSelectedResumeForDocuments] = useState(null);
    const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const loadResumes = useCallback(async (forceRefresh = false) => {
        if (sessionStatus === 'loading') return;
        if (!session) {
            setError(t('errors.userNotAuthenticated'));
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
            let detail = t('errors.couldNotLoadResumes');

            if (err.message === "Backend URL (NEXT_PUBLIC_BACKEND_URL) is not configured.") {
                detail = t('errors.backendUrlNotConfigured');
            } else if (err.code === 'ECONNABORTED') {
                detail = t('errors.requestTimeout');
            } else if (err.response) {
                detail = t('errors.serverError', {
                    status: err.response.status,
                    message: err.response.data?.message || err.response.statusText || t('errors.unexpectedError')
                });
            } else if (err.request) {
                detail = t('errors.noResponse');
            } else {
                detail = err.message || t('errors.unexpectedError');
            }

            setError(detail);
            toast.current?.show({
                severity: 'error',
                summary: t('resumes.failedToLoad'),
                detail: detail,
                life: 7000
            });
            setResumes([]);
        } finally {
            setLoading(false);
        }
    }, [session, sessionStatus, router, t]);

    useEffect(() => {
        loadResumes();
    }, [loadResumes]);

    const handleViewEditResume = (resume) => {
        router.push(`/editor/${resume.id}`);
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
    };

    const resumeItemTemplate = (resume, currentLayout) => {
        if (!resume) return null;

        const displayDate = resume.updated_at || resume.created_at;
        const documents = resume.generated_documents_data || [];

        if (currentLayout === 'list') {
            return (
                <div className="col-12">
                    <div className="p-4 surface-card border-1 surface-border border-round hover:shadow-3 transition-shadow transition-duration-200">
                        <div className={`flex flex-column xl:flex-row xl:align-items-start gap-4 ${isRTL ? 'xl:flex-row-reverse' : ''}`}>
                            <div
                                className="flex-shrink-0 flex justify-content-center align-items-center bg-primary-50 border-round cursor-pointer"
                                style={{ width: '70px', height: '70px' }}
                                onClick={() => handleViewEditResume(resume)}
                            >
                                <i className={`pi ${resume.icon || 'pi-id-card'} text-3xl text-primary-600`}></i>
                            </div>
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-start flex-1 gap-3">
                                <div className={`flex flex-column align-items-start gap-1 flex-grow-1 cursor-pointer ${isRTL ? 'align-items-end' : ''}`} onClick={() => handleViewEditResume(resume)}>
                                    <div className="text-lg font-semibold text-900 flex align-items-center">
                                        {resume.title || t('resumes.untitledResume')}
                                        {resume.is_default && <Tag severity="contrast" value={t('resumes.defaultTag')} className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs p-tag-rounded`} icon={<FiStar className={isRTL ? 'ml-1' : 'mr-1'}/>}></Tag>}
                                    </div>
                                    <p className={`text-sm text-color-secondary mb-1 line-clamp-2 ${isRTL ? 'text-right' : ''}`} style={{ minHeight: '2.4em' }}>
                                        {resume.about || t('resumes.noDescription')}
                                    </p>
                                    <span className="text-xs text-color-secondary">
                                        <i className={`pi pi-calendar ${isRTL ? 'ml-1' : 'mr-1'}`}></i>
                                        {t('resumes.updated', { date: displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A' })}
                                    </span>
                                </div>
                                <div className="flex flex-column align-items-stretch sm:align-items-end gap-2" style={{minWidth: '180px'}}>
                                    <Button
                                        label={t('resumes.manageResume')}
                                        icon={<FiEdit className={isRTL ? 'ml-2' : 'mr-2'}/>}
                                        className="p-button-sm p-button-info w-full"
                                        onClick={(e) => { e.stopPropagation(); handleViewEditResume(resume); }}
                                    />
                                    {documents.length > 0 ? (
                                        <Button
                                            label={t('resumes.viewDocuments', { count: documents.length })}
                                            icon={<FiFileText className={isRTL ? 'ml-2' : 'mr-2'}/>}
                                            className="p-button-sm p-button-outlined p-button-secondary w-full"
                                            onClick={(e) => { e.stopPropagation(); openDocumentsDialog(resume); }}
                                        />
                                    ) : (
                                        <Button
                                            label={t('resumes.addDocuments')}
                                            icon={<FiPlusSquare className={isRTL ? 'ml-2' : 'mr-2'}/>}
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
                                    {resume.title || t('resumes.untitledResume')}
                                </h4>
                                {resume.is_default && <Tag severity="contrast" value={t('resumes.defaultTag')} className="mt-1 text-xs p-tag-rounded" icon={<FiStar className={isRTL ? 'ml-1' : 'mr-1'}/>}></Tag>}
                                <p className="text-xs text-color-secondary mt-1 text-center line-clamp-2" style={{ minHeight: '2.4em' }}>
                                    {resume.about || t('resumes.noDescription')}
                                </p>
                            </div>
                            <div className="flex flex-column gap-1 text-xs text-center text-color-secondary">
                                <div>
                                    <i className={`pi pi-calendar ${isRTL ? 'ml-1' : 'mr-1'}`}></i>
                                    {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                                </div>
                                {documents.length > 0 && (
                                    <div>
                                        <FiFileText className={`${isRTL ? 'ml-1' : 'mr-1'} vertical-align-middle`} />
                                        {t('resumes.documentsCount', { count: documents.length })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-column gap-2">
                             <Button
                                label={t('common.edit')}
                                icon={<FiEdit className={isRTL ? 'ml-2' : 'mr-2'}/>}
                                className="p-button-sm p-button-info w-full"
                                onClick={(e) => { e.stopPropagation(); handleViewEditResume(resume); }}
                            />
                            {documents.length > 0 && (
                                <Button
                                    label={t('common.documents')}
                                    icon={<FiFileText />}
                                    className="p-button-sm p-button-outlined p-button-secondary w-full"
                                    onClick={(e) => { e.stopPropagation(); openDocumentsDialog(resume); }}
                                    tooltip={t('resumes.viewDocuments', { count: documents.length })}
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
            <div className={`flex flex-column md:flex-row md:justify-content-between md:align-items-center p-4 surface-section border-bottom-1 surface-border ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex align-items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h1 className="m-0 text-xl font-bold text-900">{t('resumes.title')}</h1>
                    <Button
                        icon={<FiPlusSquare className={isRTL ? 'ml-2' : 'mr-2'}/>}
                        label={t('resumes.createNew')}
                        className={`p-button-primary p-button-sm ${isRTL ? 'mr-3' : 'ml-3'}`}
                        onClick={() => setIsCreateDialogVisible(true)}
                    />
                </div>
                <div className="flex align-items-center gap-2 mt-3 md:mt-0">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder={t('resumes.searchPlaceholder')}
                            className="p-inputtext-sm"
                            style={{minWidth: '180px'}}
                        />
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
                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-color-secondary`}>{t('resumes.loadingResumes')}</span>
            </div>
        );
    }

    if (error && !resumes.length) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="text-center p-5 surface-card border-round shadow-2">
                    <FiAlertCircle className="text-red-500 text-5xl mb-3"/>
                    <h3 className="text-lg font-semibold mb-2">{t('resumes.failedToLoad')}</h3>
                    <p className="text-color-secondary mb-4 text-sm">{error}</p>
                    <Button
                        label={t('common.tryAgain')}
                        icon="pi pi-refresh"
                        className="p-button-danger p-button-outlined"
                        onClick={() => {
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
                    emptyMessage={error ? t('errors.couldNotLoadResumes') : t('resumes.noResumesFound')}
                    sortField="updated_at"
                    sortOrder={-1}
                    pt={{ header: { className: 'p-0 border-none' } }}
                />
            </div>

            <ResumeDocumentsDialog
                visible={isDocumentsDialogVisible}
                onHide={onHideDocumentsDialog}
                resume={selectedResumeForDocuments}
                onEditDocument={(docId) => {
                    onHideDocumentsDialog();
                    router.push(`/document_editor/${docId}`);
                }}
                onManageResume={(resumeToManage) => {
                    onHideDocumentsDialog();
                    handleViewEditResume(resumeToManage);
                }}
            />

            <CreateResumeFromExistingDialog
                visible={isCreateDialogVisible}
                onHide={() => setIsCreateDialogVisible(false)}
                availableResumes={resumes.map(r => ({ label: r.title || `Resume ID: ${r.id}`, value: r.id }))}
                onSuccess={(newResumeId) => {
                    setIsCreateDialogVisible(false);
                    loadResumes(true);
                }}
            />

            {/* RTL-aware styles */}
            <style jsx global>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .p-tag-rounded {
                    border-radius: 12px !important;
                }
                .bg-primary-50 {
                    background-color: var(--primary-50, #eef2ff) !important;
                }
                .text-primary-600 {
                    color: var(--primary-600, #4f46e5) !important;
                }

                /* RTL-specific styles */
                html[dir="rtl"] .md:flex-row-reverse {
                    flex-direction: row-reverse;
                }

                html[dir="rtl"] .flex-row-reverse {
                    flex-direction: row-reverse;
                }

                html[dir="rtl"] .xl:flex-row-reverse {
                    flex-direction: row-reverse;
                }

                html[dir="rtl"] .ml-1 {
                    margin-left: 0;
                    margin-right: 0.25rem;
                }

                html[dir="rtl"] .mr-1 {
                    margin-right: 0;
                    margin-left: 0.25rem;
                }

                html[dir="rtl"] .ml-2 {
                    margin-left: 0;
                    margin-right: 0.5rem;
                }

                html[dir="rtl"] .mr-2 {
                    margin-right: 0;
                    margin-left: 0.5rem;
                }

                html[dir="rtl"] .mr-3 {
                    margin-right: 0;
                    margin-left: 1rem;
                }

                html[dir="rtl"] .ml-3 {
                    margin-left: 0;
                    margin-right: 1rem;
                }

                html[dir="rtl"] .text-right {
                    text-align: right;
                }

                html[dir="rtl"] .align-items-end {
                    align-items: flex-end;
                }
            `}</style>
        </div>
    );
};

export default ResumeListPage;
