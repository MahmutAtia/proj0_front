"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card'; // Keep for overall page structure if desired
import { Tag } from 'primereact/tag';
import { FiFileText, FiEdit, FiPlusCircle, FiDownload, FiTrash2, FiFilter, FiBriefcase, FiLink2 } from 'react-icons/fi';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview'; // Using DataView for list
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';

import GenerateDocumentDialog from '../editor/components/GenerateDocumentDialog'; // Adjust path

const RESUMES_CACHE_KEY_DOCS = 'all_resumes_list_cache';
const CACHE_EXPIRY_DURATION_DOCS = 15 * 60 * 1000; // 15 minutes

const DocumentsPage = () => {
    const [allResumes, setAllResumes] = useState([]); // To populate resume filter & pass to dialog
    const [allDocuments, setAllDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const [isGenerateDialogVisible, setIsGenerateDialogVisible] = useState(false);
    // When generating globally, no specific resume is pre-selected for the dialog
    const [selectedResumeForDialog, setSelectedResumeForDialog] = useState(null);


    // Filter states
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedResumeFilter, setSelectedResumeFilter] = useState(null);
    const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState(null);

    const fetchResumesData = useCallback(async (forceRefresh = false) => {
        if (sessionStatus === 'loading' || !session) return [];
        setLoading(true);
        try {
            let data = null;
            if (!forceRefresh) {
                const localData = localStorage.getItem(RESUMES_CACHE_KEY_DOCS);
                if (localData) {
                    const parsedCache = JSON.parse(localData);
                    if (parsedCache.data && parsedCache.timestamp && (Date.now() - parsedCache.timestamp < CACHE_EXPIRY_DURATION_DOCS)) {
                        data = parsedCache.data;
                    } else {
                        localStorage.removeItem(RESUMES_CACHE_KEY_DOCS);
                    }
                }
            }
            if (!data) {
                const headers = { 'Content-Type': 'application/json' };
                if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`, { headers });
                data = response.data;
                if (Array.isArray(data)) {
                    localStorage.setItem(RESUMES_CACHE_KEY_DOCS, JSON.stringify({ data, timestamp: Date.now() }));
                } else {
                    throw new Error("Invalid data format from API");
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error("Failed to fetch resumes data:", err);
            setError("Could not load resume data. This affects document listing.");
            toast.current?.show({ severity: 'error', summary: 'Data Error', detail: 'Failed to load underlying resume data.' });
            return [];
        } finally {
            setLoading(false);
        }
    }, [session, sessionStatus]);

    const processAndSetDocuments = useCallback((resumesData) => {
        setAllResumes(resumesData);
        const flatDocs = [];
        resumesData.forEach(resume => {
            if (resume.generated_documents_data && resume.generated_documents_data.length > 0) {
                resume.generated_documents_data.forEach(doc => {
                    flatDocs.push({
                        ...doc,
                        resumeId: resume.id,
                        resumeTitle: resume.title || "Untitled Resume",
                        resumeIsDefault: resume.is_default,
                    });
                });
            }
        });
        setAllDocuments(flatDocs);
        setFilteredDocuments(flatDocs); // Initialize filtered list
    }, []);

    useEffect(() => {
        fetchResumesData().then(resumes => processAndSetDocuments(resumes));
    }, [fetchResumesData, processAndSetDocuments]);


    // Filtering Logic
    useEffect(() => {
        let docs = [...allDocuments];
        if (selectedResumeFilter) {
            docs = docs.filter(doc => doc.resumeId === selectedResumeFilter);
        }
        if (selectedDocTypeFilter) {
            docs = docs.filter(doc => doc.document_type === selectedDocTypeFilter);
        }
        if (globalFilterValue) {
            const filter = globalFilterValue.toLowerCase();
            docs = docs.filter(doc =>
                doc.document_type.toLowerCase().includes(filter) ||
                doc.resumeTitle.toLowerCase().includes(filter) ||
                (doc.json_content?.cover_letter?.body_paragraphs?.join(' ') || '').toLowerCase().includes(filter) // Basic content search
            );
        }
        setFilteredDocuments(docs);
    }, [allDocuments, globalFilterValue, selectedResumeFilter, selectedDocTypeFilter]);


    const resumeFilterOptions = useMemo(() => {
        const uniqueResumes = allResumes
            .filter(resume => allDocuments.some(doc => doc.resumeId === resume.id)) // Only resumes that have docs
            .map(resume => ({ label: resume.title || "Untitled Resume", value: resume.id }));
        return [{ label: 'All Resumes', value: null }, ...uniqueResumes];
    }, [allResumes, allDocuments]);

    const docTypeFilterOptions = useMemo(() => {
        const uniqueTypes = [...new Set(allDocuments.map(doc => doc.document_type))];
        const options = uniqueTypes.map(type => ({
            label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: type
        }));
        return [{ label: 'All Types', value: null }, ...options];
    }, [allDocuments]);


    const handleOpenGlobalGenerateDialog = () => {
        setSelectedResumeForDialog(null); // No resume pre-selected
        setIsGenerateDialogVisible(true);
    };

    const onDocumentGeneratedOrUpdated = () => { // Renamed for clarity
        toast.current?.show({ severity: 'info', summary: 'Refreshing Data', detail: 'Document list will refresh shortly.', life: 2000 });
        setTimeout(() => {
            fetchResumesData(true).then(resumes => processAndSetDocuments(resumes)); // Force refresh
        }, 500);
    };

    const handleDeleteDocument = async (documentUuid, resumeId) => {
        // ... (delete logic from previous version - ensure it updates allDocuments and cache correctly)
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/document/${documentUuid}/`, { headers });
            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Document deleted successfully.' });

            // Refresh data from source
            fetchResumesData(true).then(resumes => processAndSetDocuments(resumes));

        } catch (err) {
            console.error("Error deleting document:", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not delete document.' });
        }
    };

    const confirmDelete = (documentUuid, resumeId) => {
        confirmDialog({
            message: 'Are you sure you want to delete this document?',
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => handleDeleteDocument(documentUuid, resumeId),
        });
    };

    const handleDownloadDocument = (documentUuid, documentType) => {
        toast.current?.show({ severity: 'info', summary: 'Download', detail: `Download for ${documentType} (ID: ${documentUuid}) - (Implement actual download)`, life: 3000 });
        // Example: window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/document/${documentUuid}/pdf/`, '_blank');
    };

    const documentItemTemplate = (doc) => {
        if (!doc) return null;
        return (
            <div className="col-12">
                <div className="p-3 mb-3 surface-card border-round shadow-1 hover:shadow-2 transition-shadow">
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between">
                        <div className="flex align-items-center mb-2 md:mb-0">
                            <FiFileText className="text-2xl text-primary mr-3" />
                            <div>
                                <h4 className="font-semibold text-lg mb-0">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                                <p className="text-sm text-color-secondary mt-0 mb-1">
                                    Created: {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-color-secondary mb-2 md:mb-0 md:ml-4 flex align-items-center">
                            <FiLink2 className="mr-1" />
                            Related to: <strong className="ml-1 hover:underline cursor-pointer" onClick={() => router.push(`/main/editor/${doc.resumeId}`)}>{doc.resumeTitle}</strong>
                            {doc.resumeIsDefault && <Tag severity="info" value="Master" className="ml-2 text-xs"></Tag>}
                        </div>
                        <div className="flex gap-2 justify-content-start md:justify-content-end">
                            <Button icon={<FiDownload />} className="p-button-sm p-button-text" tooltip="Download" tooltipOptions={{position: 'top'}} onClick={() => handleDownloadDocument(doc.unique_id, doc.document_type)} />
                            <Button icon={<FiEdit />} className="p-button-sm p-button-text p-button-info" tooltip="Edit Document" tooltipOptions={{position: 'top'}} onClick={() => router.push(`/document_editor/${doc.unique_id}`)} />
                            <Button icon={<FiTrash2 />} className="p-button-sm p-button-text p-button-danger" tooltip="Delete Document" tooltipOptions={{position: 'top'}} onClick={() => confirmDelete(doc.unique_id, doc.resumeId)} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const toolbarLeftTemplate = (
        <div className="flex flex-wrap gap-2 align-items-center">
            <Dropdown
                value={selectedResumeFilter}
                options={resumeFilterOptions}
                onChange={(e) => setSelectedResumeFilter(e.value)}
                placeholder="Filter by Resume"
                showClear
                className="w-full md:w-14rem"
            />
            <Dropdown
                value={selectedDocTypeFilter}
                options={docTypeFilterOptions}
                onChange={(e) => setSelectedDocTypeFilter(e.value)}
                placeholder="Filter by Type"
                showClear
                className="w-full md:w-14rem"
            />
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilterValue}
                    onChange={(e) => setGlobalFilterValue(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full md:w-14rem"
                />
            </span>
        </div>
    );

    const toolbarRightTemplate = (
        <Button
            label="Generate Document"
            icon={<FiPlusCircle className="mr-2"/>}
            onClick={handleOpenGlobalGenerateDialog}
            className="p-button-primary"
        />
    );


    if (loading && allDocuments.length === 0) { // Show main loader only on initial load
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
                <ProgressSpinner /> <span className="ml-2">Loading documents...</span>
            </div>
        );
    }

    if (error && allDocuments.length === 0) {
        return (
            <Card className="m-4">
                <div className="p-text-center p-5">
                    <i className="pi pi-exclamation-circle text-red-500 text-5xl mb-3"></i>
                    <h3 className="text-xl">Error Loading Documents</h3>
                    <p>{error}</p>
                    <Button label="Retry" icon="pi pi-refresh" onClick={() => fetchResumesData(true).then(resumes => processAndSetDocuments(resumes))} />
                </div>
            </Card>
        );
    }

    return (
        <div className="p-0 md:p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <Card>
                <Toolbar
                    left={toolbarLeftTemplate}
                    right={toolbarRightTemplate}
                    className="mb-4 p-3"
                />

                {loading && <ProgressSpinner style={{width: '30px', height: '30px'}} className="block mx-auto my-3" />}

                <DataView
                    value={filteredDocuments}
                    itemTemplate={documentItemTemplate}
                    layout="list" // Force list layout
                    paginator
                    rows={10}
                    emptyMessage={allDocuments.length > 0 ? "No documents match your filters." : "No documents found. Generate one to get started!"}
                    pt={{ header: { className: 'hidden' } }} // Hide default DataView header if not used
                />

                {!loading && allDocuments.length === 0 && !error && (
                     <div className="text-center p-5">
                        <FiFileText className="text-6xl text-color-secondary mb-3" />
                        <p className="text-xl">You haven't created any documents yet.</p>
                        <p className="text-color-secondary mb-3">Click "Generate Document" to create your first one.</p>
                        <Button label="Go to Resumes" icon={<FiBriefcase />} onClick={() => router.push('/main/resumes')} className="p-button-outlined mr-2" />
                        <Button label="Generate Document" icon={<FiPlusCircle />} onClick={handleOpenGlobalGenerateDialog} className="p-button-primary" />
                    </div>
                )}
            </Card>

            <GenerateDocumentDialog
                visible={isGenerateDialogVisible}
                onHide={() => setIsGenerateDialogVisible(false)}
                resumeId={selectedResumeForDialog} // This will be null for global add
                availableResumes={allResumes.map(r => ({ label: r.title || "Untitled Resume", value: r.id }))} // Pass all resumes
                onGenerationSuccess={onDocumentGeneratedOrUpdated} // Callback to refresh list
            />
        </div>
    );
};

export default DocumentsPage;
