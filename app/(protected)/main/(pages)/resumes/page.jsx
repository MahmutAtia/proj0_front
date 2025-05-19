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

// Assuming PrimeFlex and PrimeReact CSS/theme are globally imported in your layout or _app.js
// import 'primeflex/primeflex.css';
// import 'primereact/resources/themes/saga-blue/theme.css'; // Or your chosen theme
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';

const ResumeListPage = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [layout, setLayout] = useState('grid'); // For DataView layout switching

    const localStorageKey = 'all_resumes_list_cache'; // Specific key for this list

    useEffect(() => {
        const fetchResumesData = async () => {
            if (sessionStatus === 'loading') {
                // Still waiting for session information
                return;
            }

            setLoading(true);
            setError(null);

            // 1. Try local storage first
            const localData = localStorage.getItem(localStorageKey);
            if (localData) {
                try {
                    const parsedResumes = JSON.parse(localData);
                    setResumes(parsedResumes);
                    setLoading(false);
                    console.log("Loaded resumes from local storage.");
                    // Optionally, implement a background refresh or stale data check here
                    return;
                } catch (e) {
                    console.error(`Error parsing local storage data from key ${localStorageKey}:`, e);
                    localStorage.removeItem(localStorageKey); // Clear potentially corrupted data
                }
            }

            // 2. If not in local storage or cache is invalid, fetch from API
            console.log("Fetching resumes from API...");
            try {
                if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                    throw new Error("Backend URL (NEXT_PUBLIC_BACKEND_URL) is not configured.");
                }

                const headers = {
                    'Content-Type': 'application/json',
                };
                if (session?.accessToken) {
                    headers['Authorization'] = `Bearer ${session.accessToken}`;
                }

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`,
                    {
                        headers: headers,
                        timeout: 15000 // Increased timeout for potentially large lists
                    }
                );

                // Assuming the API returns an array of resume objects directly
                if (Array.isArray(response.data)) {
                    setResumes(response.data);
                    localStorage.setItem(localStorageKey, JSON.stringify(response.data));
                    console.log("Fetched resumes from API and saved to local storage.");
                } else {
                    // Handle cases where data might be nested, e.g. response.data.resumes
                    // For this example, we expect a direct array.
                    console.error("Invalid data format received from backend. Expected an array.", response.data);
                    throw new Error("Invalid data format received from backend.");
                }
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
            } finally {
                setLoading(false);
            }
        };

        fetchResumesData();
    }, [session, sessionStatus]); // Re-fetch if session or its status changes

    const handleViewEdit = (resume) => {
        // Navigate to the editor page for the selected resume
        // The editor page ([id]/page.jsx) will handle its own data fetching logic
        // (checking its local storage or fetching from /api/resumes/:id)
        router.push(`/main/editor/${resume.id}`);
    };

    const getStatusSeverity = (status) => {
        // Example: Customize tag colors based on status
        switch (status?.toLowerCase()) {
            case 'draft':
                return 'info';
            case 'submitted':
                return 'success';
            case 'archived':
                return 'warning';
            default:
                return null;
        }
    };

    const resumeItemTemplate = (resume, currentLayout) => {
        if (!resume) {
            return null;
        }

        if (currentLayout === 'list') {
            return (
                <div className="col-12 cursor-pointer hover:surface-hover p-3 border-bottom-1 surface-border" onClick={() => handleViewEdit(resume)}>
                    <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                        <i className="pi pi-file-edit text-6xl text-primary"></i>
                        <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                            <div className="flex flex-column align-items-center sm:align-items-start gap-3">
                                <div className="text-xl font-bold text-900">{resume.title || 'Untitled Resume'}</div>
                                <div className="text-sm text-color-secondary">{resume.candidateName || 'N/A'}</div>
                                <div className="flex align-items-center gap-3">
                                    {resume.status && <Tag value={resume.status} severity={getStatusSeverity(resume.status)} />}
                                    <span className="flex align-items-center gap-2">
                                        <i className="pi pi-calendar"></i>
                                        <span className="font-semibold">{resume.submissionDate ? new Date(resume.submissionDate).toLocaleDateString() : 'N/A'}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                <Button icon="pi pi-pencil" label="View/Edit" className="p-button-sm p-button-info" onClick={(e) => { e.stopPropagation(); handleViewEdit(resume); }} />
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
                                <i className="pi pi-file-edit text-6xl text-primary"></i>
                                <h4 className="font-semibold text-lg mb-0 text-center" style={{ minHeight: '2.5em' /* Ensure consistent height for title */ }}>{resume.title || 'Untitled Resume'}</h4>
                                <p className="text-sm text-color-secondary mb-1">{resume.candidateName || 'N/A'}</p>
                            </div>
                            <div className="flex flex-column gap-2">
                                {resume.status && (
                                    <div className="flex align-items-center justify-content-center">
                                        <Tag value={resume.status} severity={getStatusSeverity(resume.status)} className="text-xs" />
                                    </div>
                                )}
                                <div className="text-xs text-color-secondary text-center">
                                    <i className="pi pi-calendar mr-1"></i>
                                    {resume.submissionDate ? new Date(resume.submissionDate).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                        <Button
                            label="View/Edit"
                            icon="pi pi-pencil"
                            className="p-button-sm p-button-info mt-3 w-full"
                            onClick={(e) => { e.stopPropagation(); handleViewEdit(resume); }} // Stop propagation to prevent card click if button is clicked
                        />
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
                            localStorage.removeItem(localStorageKey); // Clear potentially bad cache
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

    return (
        // This div should be placed within your app's main content area
        // e.g., inside a div with className={styles.mainScrollArea} from your Dashboard.module.css
        <div className="p-0 md:p-4"> {/* Adjust padding */}
            <Toast ref={toast} />
            <div className="card shadow-2 border-round">
                <DataView
                    value={resumes.filter(resume => {
                        if (!globalFilter) return true;
                        const filter = globalFilter.toLowerCase();
                        return (resume.title?.toLowerCase().includes(filter) ||
                            resume.candidateName?.toLowerCase().includes(filter) ||
                            resume.status?.toLowerCase().includes(filter) ||
                            resume.id?.toString().toLowerCase().includes(filter)
                        );
                    })}
                    itemTemplate={resumeItemTemplate}
                    layout={layout}
                    header={dataviewHeader}
                    paginator
                    rows={layout === 'grid' ? 12 : 5} // Adjust rows per page based on layout
                    rowsPerPageOptions={layout === 'grid' ? [12, 24, 36, 48] : [5, 10, 20]}
                    loading={loading} // Shows loader overlay
                    emptyMessage={error ? "Error loading data. Please try again." : "No resumes found."}
                    sortField="submissionDate" // Default sort field
                    sortOrder={-1} // Default sort order (descending)
                    pt={{ header: { className: 'p-0 border-none' } }} // Remove default padding from header slot
                />
            </div>
        </div>
    );
};

export default ResumeListPage;
