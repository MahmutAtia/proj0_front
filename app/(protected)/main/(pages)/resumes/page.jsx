"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext'; // For global filter
import { DataView, DataViewLayoutOptions } from 'primereact/dataview'; // Import DataView
import { Tag } from 'primereact/tag'; // Optional: For displaying status or other tags

const RESUMES_CACHE_KEY = 'all_resumes_list_cache';
const CACHE_EXPIRY_DURATION = 15 * 60 * 1000; // 15 minutes

// Helper function (ideally in a separate utils file or custom hook)
async function getCachedResumes(session) {
    const localData = localStorage.getItem(RESUMES_CACHE_KEY);
    if (localData) {
        try {
            const parsedCache = JSON.parse(localData);
            if (parsedCache.data && parsedCache.timestamp && (Date.now() - parsedCache.timestamp < CACHE_EXPIRY_DURATION)) {
                console.log("Loaded resumes from valid cache.");
                return parsedCache.data;
            } else {
                console.log("Cache expired or invalid.");
                localStorage.removeItem(RESUMES_CACHE_KEY);
            }
        } catch (e) {
            console.error(`Error parsing local storage data from key ${RESUMES_CACHE_KEY}:`, e);
            localStorage.removeItem(RESUMES_CACHE_KEY);
        }
    }
    return null; // No valid cache
}

async function fetchAndCacheResumes(session) {
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
        throw new Error("Backend URL (NEXT_PUBLIC_BACKEND_URL) is not configured.");
    }
    const headers = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`,
        { headers, timeout: 15000 }
    );

    if (Array.isArray(response.data)) {
        localStorage.setItem(RESUMES_CACHE_KEY, JSON.stringify({ data: response.data, timestamp: Date.now() }));
        console.log("Fetched resumes from API and updated cache.");
        return response.data;
    } else {
        console.error("Invalid data format received from backend. Expected an array.", response.data);
        throw new Error("Invalid data format received from backend.");
    }
}


const ResumeListPage = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
        const loadResumes = async () => {
            if (sessionStatus === 'loading') return;
            if (!session) {
                setError("User not authenticated.");
                setLoading(false);
                router.push('/login'); // Or handle appropriately
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let data = await getCachedResumes(session);
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
                    life: 7000 // Longer life for critical errors
                });
                setResumes([]); // Clear resumes on error
            } finally {
                setLoading(false);
            }
        };

        loadResumes();
    }, [session, sessionStatus, router]); // Add router to dependencies

    const handleSetDefault = async (resumeId, newDefaultState) => {
        setLoading(true);
        try {
            // API call to update the default status
            // Example: await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/${resumeId}/set-default/`, { is_default: newDefaultState }, { headers: ... });

            // On success, update local state and cache
            const updatedResumes = resumes.map(r => {
                if (r.id === resumeId) return { ...r, is_default: newDefaultState };
                if (newDefaultState && r.is_default) return { ...r, is_default: false }; // Unset other defaults
                return r;
            });
            setResumes(updatedResumes);
            localStorage.setItem(RESUMES_CACHE_KEY, JSON.stringify({ data: updatedResumes, timestamp: Date.now() }));
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `Resume ${newDefaultState ? 'set as' : 'unset from'} default.` });
        } catch (err) {
            console.error("Error setting default resume:", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not update default status.' });
        } finally {
            setLoading(false);
        }
    };

    const resumeItemTemplate = (resume, currentLayout) => {
        if (!resume) return null;

        const displayDate = resume.updated_at || resume.created_at;

        if (currentLayout === 'list') {
            return (
                <div className="col-12 cursor-pointer hover:surface-hover p-3 border-bottom-1 surface-border" onClick={() => handleViewEdit(resume)}>
                    <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                        <i className={`pi ${resume.icon || 'pi-file-edit'} text-6xl text-primary`}></i>
                        <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                            <div className="flex flex-column align-items-center sm:align-items-start gap-3">
                                <div className="text-xl font-bold text-900">{resume.title || 'Untitled Resume'} {resume.is_default && <Tag severity="success" value="Default" className="ml-2"></Tag>}</div>
                                <div className="text-sm text-color-secondary">{resume.about ? (resume.about.substring(0, 100) + (resume.about.length > 100 ? '...' : '')) : 'No description'}</div>
                                <div className="flex align-items-center gap-3">
                                    <span className="flex align-items-center gap-2">
                                        <i className="pi pi-calendar"></i>
                                        <span className="font-semibold">{displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}</span>
                                    </span>
                                    {resume.generated_documents_data?.length > 0 && (
                                        <span className="flex align-items-center gap-2">
                                            <i className="pi pi-file"></i>
                                            <span>{resume.generated_documents_data.length} document(s)</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                <Button icon="pi pi-pencil" label="View/Edit" className="p-button-sm p-button-info" onClick={(e) => { e.stopPropagation(); handleViewEdit(resume); }} />
                                <Button
                                    label={resume.is_default ? "Unset Default" : "Set as Default"}
                                    icon={resume.is_default ? "pi pi-star-fill" : "pi pi-star"}
                                    className={`p-button-sm ${resume.is_default ? 'p-button-warning p-button-outlined' : 'p-button-success'}`}
                                    onClick={(e) => { e.stopPropagation(); handleSetDefault(resume.id, !resume.is_default); }}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentLayout === 'grid') {
            return (
                <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                    <div className="p-4 border-1 surface-border surface-card border-round h-full flex flex-column justify-content-between cursor-pointer hover:shadow-3 transition-shadow transition-duration-200" onClick={() => handleViewEdit(resume)}>
                        <div>
                            <div className="flex flex-column align-items-center gap-2 mb-3">
                                <i className={`pi ${resume.icon || 'pi-file-edit'} text-5xl text-primary mb-2`}></i>
                                <h4 className="font-semibold text-lg mb-0 text-center" style={{ minHeight: '2.5em' }}>
                                    {resume.title || 'Untitled Resume'}
                                    {resume.is_default && <Tag severity="success" value="Default" className="ml-1 text-xs"></Tag>}
                                </h4>
                                <p className="text-xs text-color-secondary mb-1 text-center" style={{ minHeight: '3em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {resume.about || 'No description'}
                                </p>
                            </div>
                            <div className="flex flex-column gap-1 text-xs text-center">
                                <div className="text-color-secondary">
                                    <i className="pi pi-calendar mr-1"></i>
                                    Updated: {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                                </div>
                                {resume.generated_documents_data?.length > 0 && (
                                    <div className="text-color-secondary">
                                        <i className="pi pi-file mr-1"></i>
                                        {resume.generated_documents_data.length} document(s)
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-column gap-2">
                             <Button
                                label="View/Edit"
                                icon="pi pi-pencil"
                                className="p-button-sm p-button-info w-full"
                                onClick={(e) => { e.stopPropagation(); handleViewEdit(resume); }}
                            />
                            <Button
                                label={resume.is_default ? "Unset Default" : "Set as Default"}
                                icon={resume.is_default ? "pi pi-star-fill" : "pi pi-star"}
                                className={`p-button-sm w-full ${resume.is_default ? 'p-button-warning p-button-outlined' : 'p-button-success'}`}
                                onClick={(e) => { e.stopPropagation(); handleSetDefault(resume.id, !resume.is_default); }}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    };

    const renderDataViewHeader = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center p-3 surface-border border-bottom-1">
                <h2 className="m-0 text-2xl font-bold">Resume Management</h2>
                <div className="flex align-items-center gap-2 mt-2 md:mt-0">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Keyword Search" className="p-inputtext-sm" />
                    </span>
                    <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
                </div>
            </div>
        );
    };

    const dataviewHeader = renderDataViewHeader();

    // Fallback for date formatting if submissionDate is invalid
    const dateBodyTemplate = (rowData) => {
        if (rowData.submissionDate) {
            const date = new Date(rowData.submissionDate);
            return date.toLocaleDateString();
        }
        return 'N/A';
    };


    if (loading && !resumes.length) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' /* Adjust based on your layout's header/footer */ }}>
                <ProgressSpinner strokeWidth="3" style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    if (error && !resumes.length) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="text-center p-5 surface-card border-round shadow-2">
                    <i className="pi pi-exclamation-triangle text-red-500 text-5xl mb-3"></i>
                    <h3 className="text-xl font-semibold mb-2">Failed to Load Resumes</h3>
                    <p className="text-color-secondary mb-4">{error}</p>
                    <Button
                        label="Retry"
                        icon="pi pi-refresh"
                        className="p-button-outlined"
                        onClick={() => {
                            localStorage.removeItem(RESUMES_CACHE_KEY); // Clear potentially bad cache
                            // Re-trigger useEffect by forcing a state change or directly calling fetch
                            // For simplicity here, we'll rely on the dependency array of useEffect
                            // A more direct way would be to have fetchResumesData callable and call it.
                            // This example implies a re-render would re-trigger if session/status changed,
                            // or you could add a dummy state to dependencies and change it.
                            // For a direct retry:
                            // setLoading(true); setError(null); fetchResumesData(); // (if fetchResumesData is memoized or stable)
                            window.location.reload(); // Simplest, but not ideal UX for SPA
                        }}
                    />
                </div>
            </div>
        );
    }

    // Ensure the DataView's value uses the filtered resumes if globalFilter is applied.
    const filteredResumes = resumes.filter(resume => {
        if (!globalFilter) return true;
        const filter = globalFilter.toLowerCase();
        return (resume.title?.toLowerCase().includes(filter) ||
            // resume.candidateName?.toLowerCase().includes(filter) || // candidateName not in your provided data structure
            resume.about?.toLowerCase().includes(filter) || // Assuming 'about' can be searched
            resume.id?.toString().toLowerCase().includes(filter)
        );
    });

    return (
        <div className="p-0 md:p-4">
            <Toast ref={toast} />
            <div className="card shadow-2 border-round">
                <DataView
                    value={filteredResumes} // Use filteredResumes
                    itemTemplate={resumeItemTemplate}
                    layout={layout}
                    header={dataviewHeader}
                    paginator
                    rows={layout === 'grid' ? 12 : 5}
                    rowsPerPageOptions={layout === 'grid' ? [12, 24, 36, 48] : [5, 10, 20]}
                    loading={loading}
                    emptyMessage={error ? "Error loading data. Please try again." : "No resumes found."}
                    sortField="updated_at" // Sort by updated_at or created_at
                    sortOrder={-1}
                    pt={{ header: { className: 'p-0 border-none' } }}
                />
            </div>
        </div>
    );
};

export default ResumeListPage;

// Remember to define handleViewEdit and other necessary functions if not already present.
// And ensure your API for setting default correctly unsets other defaults if that's the desired behavior.
