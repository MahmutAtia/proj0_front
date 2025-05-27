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
import { Toast } from 'primereact/toast';

const ResumeEditorPage = ({ params: paramsPromise }) => {
    const params = React.use(paramsPromise);
    const resumeId = params.id;

    const [resumeData, setResumeData] = useState(null);
    const [linkedDocuments, setLinkedDocuments] = useState([]);
    const [initialSectionOrder, setInitialSectionOrder] = useState(null); // New state
    const [initialHiddenSections, setInitialHiddenSections] = useState(null); // New state
    const [fetchError, setFetchError] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        const fetchResumeData = async () => {
            if (status === 'loading') return;

            setResumeData(null);
            setLinkedDocuments([]);
            setInitialSectionOrder(null); // Reset
            setInitialHiddenSections(null); // Reset
            setFetchError(null);

            const localData = localStorage.getItem('all_resumes_list_cache');
            let foundInLocal = false;
            if (localData) {
                try {
                    const resumes = JSON.parse(localData).data;
                    const resumeItem = resumes.find((item) => item.id === Number(params.id));
                    if (resumeItem && resumeItem.resume) {
                        setResumeData(resumeItem.resume);
                        setLinkedDocuments(resumeItem.generated_documents_data || []);
                        setInitialSectionOrder(resumeItem.sections_sort || null); // Load sections_sort
                        setInitialHiddenSections(resumeItem.hidden_sections || null); // Load hidden_sections
                        foundInLocal = true;
                        console.log("Loaded resume, linked documents, section order, and hidden sections from local storage.");
                    }
                } catch (e) {
                    console.error("Error parsing local storage data:", e);
                    localStorage.removeItem('data');
                }
            }

            if (!foundInLocal) {
                console.log("Resume not in local storage or error, fetching from backend...");
                try {
                    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                        throw new Error("Backend URL is not configured.");
                    }
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/${resumeId}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(session?.accessToken && {
                                    'Authorization': `Bearer ${session.accessToken}`
                                })
                            },
                            timeout: 10000
                        }
                    );
                    // response.data is the parent object from the API
                    if (response.data && response.data.resume) {
                        setResumeData(response.data.resume);
                        setLinkedDocuments(response.data.generated_documents_data || []);
                        setInitialSectionOrder(response.data.sections_sort || null); // Load sections_sort from API
                        setInitialHiddenSections(response.data.hidden_sections || null); // Load hidden_sections from API
                        console.log("Loaded resume, linked documents, section order, and hidden sections from backend:", response.data);
                    } else {
                         throw new Error("Invalid data format received from backend.");
                    }
                } catch (error) {
                    console.error("Error fetching resume data:", error);
                    let detail = 'Could not load resume data.';
                    if (error.response) {
                        detail = `Server Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
                    } else if (error.request) {
                        detail = 'No response from server. Check network connection or backend status.';
                    } else {
                        detail = error.message;
                    }
                    setFetchError(detail);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error Loading Resume',
                        detail: detail,
                        life: 5000
                    });
                     if (error.response?.status === 404 || error.response?.status === 403) {
                         setTimeout(() => router.push('/main/dashboard'), 3000);
                     }
                }
            }
        };

        fetchResumeData();
    }, [resumeId, session, status, router]);

    return (
        <div>
            <Toast ref={toast} />
            {fetchError && !resumeData && (
                 <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 60px)' }}>
                    <div className="text-center p-4 surface-card border-round shadow-2">
                        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-3 text-lg font-medium">Error Loading Resume</p>
                        <p className="text-color-secondary">{fetchError}</p>
                        <Button label="Go to Dashboard" icon="pi pi-arrow-left" className="p-button-text mt-2" onClick={() => router.push('/main/dashboard')} />
                    </div>
                </div>
            )}

            {resumeData && (
                <ResumeProvider initialData={resumeData}>
                    <EditableResumeTemplate
                        resumeId={resumeId}
                        linkedDocuments={linkedDocuments}
                        initialSectionOrder={initialSectionOrder} // Pass new prop
                        initialHiddenSections={initialHiddenSections} // Pass new prop
                    />
                </ResumeProvider>
            )}

            {!fetchError && !resumeData && (
                 <div className="flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 60px)' }}>
                     <ProgressSpinner strokeWidth="4" style={{width: '50px', height: '50px'}} />
                 </div>
            )}
        </div>
    );
};

export default ResumeEditorPage;
