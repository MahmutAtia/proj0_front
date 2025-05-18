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

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-content-center">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-info"
                    onClick={() => handleViewEdit(rowData)}
                    tooltip="View/Edit Resume"
                    tooltipOptions={{ position: 'top' }}
                />
                {/* Add other actions like delete if needed */}
                {/* <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => handleDelete(rowData)} tooltip="Delete" /> */}
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <h2 className="m-0 text-2xl font-bold">Resume Management</h2>
                <span className="p-input-icon-left mt-2 md:mt-0">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Keyword Search" className="p-inputtext-sm" />
                </span>
            </div>
        );
    };

    const header = renderHeader();

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
                <ProgressSpinner strokeWidth="3" style={{width: '50px', height: '50px'}} />
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
        <div className="p-4"> {/* Add padding as per your design */}
            <Toast ref={toast} />
            <div className="card shadow-2 border-round"> {/* PrimeReact card for styling */}
                <DataTable
                    value={resumes}
                    header={header}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    loading={loading} // Shows table's internal loader for background updates
                    dataKey="id"
                    globalFilter={globalFilter}
                    emptyMessage={error ? "Error loading data. Please try again." : "No resumes found."}
                    responsiveLayout="scroll" // Or "stack" for better mobile view
                    className="p-datatable-customers" // Example class, can use p-datatable-striped, p-datatable-gridlines
                    sortMode="multiple"
                    filterDisplay="menu" // 'row' or 'menu'
                >
                    {/* Adjust field names, headers, and body templates based on your actual resume data structure */}
                    <Column field="id" header="ID" sortable filter filterPlaceholder="ID" style={{ minWidth: '6rem' }} />
                    <Column field="title" header="Resume Title" sortable filter filterPlaceholder="Search title" style={{ minWidth: '18rem' }} body={(rowData) => rowData.title || 'N/A'} />
                    <Column field="candidateName" header="Candidate" sortable filter filterPlaceholder="Search name" style={{ minWidth: '14rem' }} body={(rowData) => rowData.candidateName || 'N/A'} />
                    <Column field="submissionDate" header="Submitted On" sortable body={dateBodyTemplate} style={{ minWidth: '10rem' }} />
                    <Column field="status" header="Status" sortable filter filterPlaceholder="Search status" style={{ minWidth: '10rem' }} body={(rowData) => rowData.status || 'N/A'} />
                    <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem', textAlign: 'center' }} />
                </DataTable>
            </div>
        </div>
    );
};

export default ResumeListPage;
