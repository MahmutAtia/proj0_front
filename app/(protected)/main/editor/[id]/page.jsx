"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

import EditableResumeTemplate from '../EditableResumeTemplate';
import { ResumeProvider } from '../ResumeContext';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import 'primeflex/primeflex.css';
import { Toast } from 'primereact/toast'; // Keep Toast if used for fetch errors

const ResumeEditorPage = ({ params }) => {
    // Removed loading state, handled within EditableResumeTemplate
    const [resumeData, setResumeData] = useState(null);
    const [fetchError, setFetchError] = useState(null); // State to track fetch errors
    const router = useRouter();
    const toast = useRef(null); // Keep toast ref for fetch errors
    const { data: session, status } = useSession();

    useEffect(() => {
        const fetchResumeData = async () => {
            if (status === 'loading') return; // Wait for session status

            // Reset state on new fetch attempt
            setResumeData(null);
            setFetchError(null);

            // Try local storage first
            const localData = localStorage.getItem('data');
            let foundInLocal = false;
            if (localData) {
                try {
                    const resumes = JSON.parse(localData);
                    const resume = resumes.find((item) => item.id === Number(params.id));
                    if (resume && resume.resume) {
                        setResumeData(resume.resume);
                        foundInLocal = true;
                        console.log("Loaded resume from local storage.");
                    }
                } catch (e) {
                    console.error("Error parsing local storage data:", e);
                    localStorage.removeItem('data'); // Clear potentially corrupted data
                }
            }

            // If not found or error in local storage, fetch from backend
            if (!foundInLocal) {
                console.log("Resume not in local storage or error, fetching from backend...");
                try {
                    // Ensure backend URL is correctly configured
                    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                        throw new Error("Backend URL is not configured.");
                    }
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/${params.id}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(session?.accessToken && {
                                    'Authorization': `Bearer ${session.accessToken}`
                                })
                            },
                            timeout: 10000 // Add a timeout
                        }
                    );
                    // Assuming the API returns { resume: {...} } structure
                    if (response.data && response.data.resume) {
                        setResumeData(response.data.resume);
                        console.log("Loaded resume from backend:", response.data.resume);
                        // Optionally update local storage with fetched data
                        // This requires careful handling to merge/update correctly
                    } else {
                         throw new Error("Invalid data format received from backend.");
                    }
                } catch (error) {
                    console.error("Error fetching resume data:", error);
                    let detail = 'Could not load resume data.';
                    if (error.response) {
                        // Server responded with a status code outside 2xx range
                        detail = `Server Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
                    } else if (error.request) {
                        // Request was made but no response received
                        detail = 'No response from server. Check network connection or backend status.';
                    } else {
                        // Something happened in setting up the request
                        detail = error.message;
                    }
                    setFetchError(detail); // Set error state
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error Loading Resume',
                        detail: detail,
                        life: 5000 // Longer life for error messages
                    });
                     // Redirect if critical error (e.g., 404 Not Found, 403 Forbidden)
                     if (error.response?.status === 404 || error.response?.status === 403) {
                         setTimeout(() => router.push('/main/dashboard'), 3000);
                     }
                }
            }
        };

        fetchResumeData();
    }, [params.id, session, status, router]); // Add router to dependency array if used inside effect

    // Render based on state: loading (implicit in EditableResumeTemplate), error, or success
    return (
        // Removed h-screen, overflow-hidden, surface-ground from this div
        // Let EditableResumeTemplate manage its own full-height layout
        <div>
            <Toast ref={toast} />
            {/*
               Conditionally render ResumeProvider and EditableResumeTemplate.
               EditableResumeTemplate now handles its own internal loading spinner
               based on whether initialData is available.
               We show a message here only if there was a fetch error *before* rendering the editor.
            */}
            {fetchError && !resumeData && (
                 <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 60px)' /* Adjust based on header */ }}>
                    <div className="text-center p-4 surface-card border-round shadow-2">
                        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-3 text-lg font-medium">Error Loading Resume</p>
                        <p className="text-color-secondary">{fetchError}</p>
                        <Button label="Go to Dashboard" icon="pi pi-arrow-left" className="p-button-text mt-2" onClick={() => router.push('/main/dashboard')} />
                    </div>
                </div>
            )}

            {/* Render the editor once data is available (even if fetched after initial mount) */}
            {/* ResumeProvider needs initialData, so only render when resumeData is not null */}
            {resumeData && (
                <ResumeProvider initialData={resumeData}>
                    <EditableResumeTemplate resumeId={params.id} />
                </ResumeProvider>
            )}

            {/* If there's no error and no data yet, EditableResumeTemplate will show its internal loading state */}
            {!fetchError && !resumeData && (
                 <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 60px)' }}>
                     {/* Placeholder or minimal loading indicator while waiting for fetch */}
                     <ProgressSpinner strokeWidth="4" style={{width: '50px', height: '50px'}} />
                 </div>
            )}
        </div>
    );
};

export default ResumeEditorPage;
