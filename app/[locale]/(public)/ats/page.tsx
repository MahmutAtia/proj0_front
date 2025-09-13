"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FileUpload, FileUploadSelectEvent, FileUploadHandlerEvent } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown, { Components } from 'react-markdown';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ats.module.css';
import { Suspense } from 'react';
import { addOrUpdateResumeInCache, getResumesFromCache } from '@/app/utils/resumeCache'; // 1. Import getResumesFromCache
import api,{ aiApi } from '@/lib/axios'; 



// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const fadeInOut = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: { opacity: 1, height: 'auto', marginBottom: '1rem', transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};
const buttonHoverTap = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
};

// Constants
const POLLING_INTERVAL = 3000; // Check status every 3 seconds
const MAX_POLLING_ATTEMPTS = 20; // Stop polling after 60 seconds (20 * 3s)

// --- Define Page Component ---
const ATSCheckerPageContent = () => {
    // --- State ---
    const [resumeInputMethod, setResumeInputMethod] = useState<'upload' | 'paste'>('upload');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState<string>('');
    const [targetRole, setTargetRole] = useState('');
    const [targetLanguage, setTargetLanguage] = useState<string>('en');
    const [includeJobDescription, setIncludeJobDescription] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(true);

    // New state for authenticated users
    const [generateNewResume, setGenerateNewResume] = useState(true); // Default to creating a new resume
    const [userHasResumes, setUserHasResumes] = useState<boolean | null>(null); // null = unchecked, false = no resumes, true = has resumes

    // State for background task polling
    const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
    const [postAuthTaskIdToCheck, setPostAuthTaskIdToCheck] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [pollingAttempts, setPollingAttempts] = useState(0);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
    const [postAuthCheckComplete, setPostAuthCheckComplete] = useState(false);

    // --- Refs and Hooks ---
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Options for SelectButton ---
    const resumeInputOptions = [
        { label: 'Upload File', value: 'upload', icon: 'pi pi-upload' },
        { label: 'Paste Text', value: 'paste', icon: 'pi pi-pencil' }
    ];

    const languageOptions = [
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
        { label: 'Spanish', value: 'es' },
    ];

    // --- Event Handlers ---
    const resetPollingState = () => {
        setGenerationTaskId(null);
        setPostAuthTaskIdToCheck(null);
        setIsCheckingStatus(false);
        setPollingAttempts(0);
        setStatusError(null);
        setGeneratedResumeId(null);
        setPostAuthCheckComplete(false);
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const resetFormAndResults = () => {
        setApiResponse(null);
        setError(null);
        setResumeFile(null);
        setResumeText('');
        setShowForm(true);
        resetPollingState();
        fileUploadRef.current?.clear();
    };

    const handleFileSelect = (event: FileUploadSelectEvent) => {
        if (event.files && event.files.length > 0) {
            setResumeFile(event.files[0]);
            setResumeText('');
            setApiResponse(null);
            setError(null);
            resetPollingState();
        }
    };

    const handleFileRemove = () => {
        setResumeFile(null);
        setApiResponse(null);
        setError(null);
        resetPollingState();
    };

    const handleResumeTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setResumeText(event.target.value);
        setResumeFile(null);
        setApiResponse(null);
        setError(null);
        resetPollingState();
    };

    const handleInputMethodChange = (e: SelectButtonChangeEvent) => {
        if (e.value !== null) {
            setResumeInputMethod(e.value);
            if (e.value === 'upload') setResumeText('');
            if (e.value === 'paste') setResumeFile(null);
            setApiResponse(null);
            setError(null);
            resetPollingState();
        }
    };

    const handleLanguageChange = (e: DropdownChangeEvent) => {
        setTargetLanguage(e.value);
    };

    const customUploader = async (event: FileUploadHandlerEvent) => {
        event.options.clear();
    };

    useEffect(() => {
        // Check for existing resumes only when the user is authenticated.
        if (status === 'authenticated') {
            const cachedResumes = getResumesFromCache();
            const hasResumes = cachedResumes && cachedResumes.length > 0;
            setUserHasResumes(hasResumes);
            // If the user has no resumes, we must create one. Otherwise, let them choose.
            setGenerateNewResume(!hasResumes);
        } else {
            setUserHasResumes(false);
        }
    }, [status]);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const postAuthTask = searchParams.get('post_auth_task');
        if (status === 'authenticated' && postAuthTask === 'true' && !postAuthCheckComplete) {
            // Immediately mark the post-auth check as handled to prevent this from re-running.
            setPostAuthCheckComplete(true);

            const pendingTaskId = sessionStorage.getItem('pendingTaskId');
            const pendingApiResponse = sessionStorage.getItem('pendingApiResponse');
            
            sessionStorage.removeItem('pendingTaskId');
            sessionStorage.removeItem('pendingApiResponse');

            if (pendingTaskId) {
                // Restore the UI state from before login
                setShowForm(false);
                setError(null);
                setIsLoading(false); // Stop the main page loader
                if (pendingApiResponse) {
                    setApiResponse(pendingApiResponse);
                }
                // Start the status check for the restored task ID
                setPostAuthTaskIdToCheck(pendingTaskId);
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Session Expired?', detail: 'Could not retrieve analysis task after sign-in.' });
                router.push('/main');
            }
        }
    }, [status, searchParams, router, postAuthCheckComplete]);

    const saveGeneratedResume = async (taskId: string) => {
        if (!isCheckingStatus) setIsCheckingStatus(true);
        setStatusError(null);

        try {
            const saveApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/save_generated_resume/`;
            const fetchOptions: RequestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                },
                body: JSON.stringify({ generation_task_id: taskId })
            };
            const response = await fetch(saveApiUrl, fetchOptions);

            if (!response.ok) {
                let errorDetail = 'Failed to save the generated resume.';
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorData.error || errorData.message || errorDetail;
                } catch (e) { }
                throw new Error(errorDetail);
            }

            const result = await response.json();
            // Your backend now returns the full resume object here.
            const newResumeData = result.resume_data;
            const resumeIdFromResult = result.resume_id || newResumeData?.id;

            if (resumeIdFromResult && newResumeData) {
                setGeneratedResumeId(String(resumeIdFromResult));
                toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Resume saved and editor is ready.', life: 3000 });

                // 2. Replace the old cache removal with a direct, efficient update.
                addOrUpdateResumeInCache(newResumeData);

                setStatusError(null);
            } else {
                throw new Error("Resume saved, but editor ID or data was not provided.");
            }

        } catch (err: any) {
            console.error("Save generated resume error:", err);
            setStatusError(err.message || 'An error occurred while saving the resume.');
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: err.message || 'Could not save the resume.' });
        } finally {
            setIsCheckingStatus(false);
            if (postAuthTaskIdToCheck) {
                setPostAuthCheckComplete(true);
            }
        }
    };

    const checkStatus = async (taskId: string, isPostAuthCheck: boolean = false) => {
        if (!isCheckingStatus) setIsCheckingStatus(true);
        if (pollingAttempts === 0) {
            setStatusError(null);
        }

        try {
            const statusApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task-status/${taskId}/`;
            const fetchOptions: RequestInit = {
                method: 'GET',
                headers: {
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                },
            };
            const response = await fetch(statusApiUrl, fetchOptions);

            if (!response.ok) {
                console.error(`Status check failed with status: ${response.status}`);
                if (pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                    setIsCheckingStatus(false);
                    throw new Error("Checking editor status timed out or failed repeatedly.");
                }
                setPollingAttempts(prev => prev + 1);
                return;
            }

            const statusResult = await response.json();


            switch (statusResult.status) {
                case 'SUCCESS':
                    // Task succeeded, now call the save endpoint to get the resume details.
                    // This works for both post-authentication checks and regular polling.
                    console.log(`Task ${taskId} succeeded, calling saveGeneratedResume.`);
                    
                    // Stop polling and related state updates.
                    setIsCheckingStatus(false);
                    setPollingAttempts(0);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    
                    // The save function will handle the rest of the UI updates.
                    await saveGeneratedResume(taskId);
                    break;

                case 'FAILURE':
                    setIsCheckingStatus(false);
                    throw new Error(statusResult.result || "The analysis task failed on the server.");

                case 'PENDING':
                default:
                    if (pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                        setIsCheckingStatus(false);
                        throw new Error("Checking editor status is taking longer than expected.");
                    }
                    setPollingAttempts(prev => prev + 1);
                    break;
            }

        } catch (err: any) {
            console.error("Status check error:", err);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            setStatusError(err.message || 'An error occurred while checking status.');
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Could not check status.' });
            setIsCheckingStatus(false);
            if (isPostAuthCheck) {
                setPostAuthCheckComplete(true);
            }
            setPollingAttempts(0);
        }
    };

    useEffect(() => {
        const activeTaskId = postAuthTaskIdToCheck || generationTaskId;
        const isPostAuth = !!postAuthTaskIdToCheck;

        if (activeTaskId && !generatedResumeId && !statusError) {
            if (!isCheckingStatus) {
                setIsCheckingStatus(true);
            }

            const poll = () => {
                if (activeTaskId && !generatedResumeId && !statusError) {
                    checkStatus(activeTaskId, isPostAuth);
                } else {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }
            };

            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }

            setPollingAttempts(0);

            console.log(`Starting polling/check for task ${activeTaskId}, isPostAuth: ${isPostAuth}`);
            checkStatus(activeTaskId, isPostAuth);

            pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
            console.log(`Interval set for task ${activeTaskId}`);

        } else {
            if (pollingIntervalRef.current) {
                console.log("Polling conditions not met, clearing interval.");
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            if (isCheckingStatus && !activeTaskId) {
                setIsCheckingStatus(false);
            }
        }

        return () => {
            if (pollingIntervalRef.current) {
                console.log("Cleanup: Clearing interval.");
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [generationTaskId, postAuthTaskIdToCheck]);

    const handleSubmit = async () => {
        // --- Early Returns for Validation ---
        if (isLoading) return;
        if (targetRole.trim() === '') {
            return toast.current?.show({ severity: 'warn', summary: 'Missing Role', detail: 'Please specify a target role for your resume.' });
        }
        if (resumeInputMethod === 'upload' && !resumeFile) {
            return toast.current?.show({ severity: 'warn', summary: 'No File Selected', detail: 'Please upload your resume file.' });
        }
        if (resumeInputMethod === 'paste' && !resumeText.trim()) {
            return toast.current?.show({ severity: 'warn', summary: 'No Text Provided', detail: 'Please paste your resume text.' });
        }

        setIsLoading(true);
        setApiResponse(null);
        setError(null);
        setShowForm(false);
        resetPollingState();

        const formData = new FormData();

        if (resumeInputMethod === 'upload' && resumeFile) {
            formData.append('resume', resumeFile);
        } else if (resumeInputMethod === 'paste' && resumeText.trim()) {
            formData.append('resume_text', resumeText.trim());
        }

        const backendFormData: { [key: string]: any } = {
            description: includeJobDescription ? jobDescription : '',
            targetLanguage: targetLanguage,
            targetRole: targetRole,
        };

        if (status === 'authenticated') {
            backendFormData.generate_new_resume = generateNewResume;
        }

        formData.append('formData', JSON.stringify(backendFormData));

        try {
            const response = await aiApi.post('/resumes-v2/ats_checker_and_generate', formData, {
                headers: {
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                }
            });

            if (!response || !response.data) {
                console.error("Invalid response from backend:", response);
                throw new Error("Failed to analyze resume. Please try again.");
            }
            // Uncomment this if you want to handle non-200 responses


       
            const result = await response.data;
            const markdownOutput = result.ats_result;
            const taskId = result.generation_task_id;

            if (typeof markdownOutput === 'string' && markdownOutput.trim() !== '') {
                setApiResponse(markdownOutput);
            } else {
                console.warn("Received response, but 'ats_result' key was missing, empty, or not a string:", result);
                setApiResponse('Analysis complete, but no specific feedback was returned.');
            }

            toast.current?.show({ severity: 'success', summary: 'Analysis Complete', detail: 'Your resume has been scanned.', life: 3000 });

            if (taskId) {
                if (status === 'authenticated' && generateNewResume) {
                    setGenerationTaskId(taskId);
                } else if (status !== 'authenticated') {
                    sessionStorage.setItem('pendingTaskId', taskId);
                    if (markdownOutput) {
                        sessionStorage.setItem('pendingApiResponse', markdownOutput);
                    }
                }
            } else {
                if (status === 'authenticated' && !generateNewResume) {
                    console.log("generate_new_resume was false, no task ID received.");
                } else if (status !== 'authenticated') {
                    console.warn("Backend did not return a 'generation_task_id' for unauthenticated user.");
                    setStatusError("Could not initiate save process after sign-in (missing task ID).");
                } else {
                    console.warn("Backend did not return a 'generation_task_id' when expected (authenticated user).");
                    setStatusError("Could not initiate editor status check (missing task ID).");
                }
            }

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during submission.');
            toast.current?.show({ severity: 'error', summary: 'Analysis Failed', detail: err.message || 'An unexpected error occurred.' });
            setShowForm(true);
            resetPollingState();
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToEditor = () => {
        if (generatedResumeId) {
            router.push(`/editor/${generatedResumeId}`);
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Not Ready', detail: 'Editor is not ready yet or status check failed.' });
        }
    };

    const handleRetry = () => {
        const taskIdToRetry = postAuthTaskIdToCheck || generationTaskId;
        if (taskIdToRetry) {
            setStatusError(null);
            setPollingAttempts(0);
        if (taskIdToRetry) {
                setPostAuthCheckComplete(false);
                checkStatus(taskIdToRetry, true);
            } else {
                setIsCheckingStatus(true);
            }
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Cannot retry, task ID is missing.' });
        }
    };

    // This function is now simplified. The state is already saved in `handleSubmit`.
    const handleSignInAndRedirect = () => {
        const locale = window.location.pathname.split('/')[1] || 'en';
        const callbackUrl = `/${locale}/ats?post_auth_task=true`;
        signIn('google', { callbackUrl });
    };

    const isSubmitDisabled = isLoading || !targetRole.trim() || !((resumeInputMethod === 'upload' && resumeFile) || (resumeInputMethod === 'paste' && resumeText.trim()));

    return (
        <div className="p-4 md:p-6 lg:p-8 flex justify-content-center align-items-start min-h-screen bg-gray-100">
            {/* Make the main container wider */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full" style={{ maxWidth: '1200px' }}>
                <Toast ref={toast} position="top-right" />
                <Card title="ATS Compatibility Checker" subTitle="See how your resume stacks up against automated screening systems." className={styles.atsCard}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div className="p-fluid formgrid grid">
                                    <div className="field col-12">
                                        <label className="font-semibold block mb-2">1. Provide Your Resume</label>
                                        <SelectButton
                                            value={resumeInputMethod}
                                            options={resumeInputOptions}
                                            onChange={handleInputMethodChange}
                                            optionLabel="label"
                                            itemTemplate={(option) => (
                                                <div className="flex align-items-center">
                                                    <i className={`${option.icon} mr-2`}></i>
                                                    <span>{option.label}</span>
                                                </div>
                                            )}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {resumeInputMethod === 'upload' && (
                                            <motion.div
                                                key="upload"
                                                className="field col-12"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <FileUpload
                                                    ref={fileUploadRef}
                                                    name="resume"
                                                    customUpload
                                                    uploadHandler={customUploader}
                                                    onSelect={handleFileSelect}
                                                    onRemove={handleFileRemove}
                                                    onClear={() => setResumeFile(null)}
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    maxFileSize={5000000}
                                                    chooseLabel={resumeFile ? "Change File" : "Select File"}
                                                    chooseOptions={{ className: 'p-button-outlined w-full md:w-auto' }}
                                                    cancelOptions={{ className: 'p-button-danger p-button-outlined' }}
                                                    progressBarTemplate={() => null}
                                                    emptyTemplate={<p className="m-0 text-color-secondary">Drag and drop file here or click to select.</p>}
                                                    className={styles.fileUpload}
                                                    disabled={isLoading}
                                                    uploadOptions={{ style: { display: 'none' } }}
                                                />
                                                {resumeFile && <p className="mt-2 text-sm text-green-600">Selected: {resumeFile.name}</p>}
                                            </motion.div>
                                        )}

                                        {resumeInputMethod === 'paste' && (
                                            <motion.div
                                                key="paste"
                                                className="field col-12"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <InputTextarea
                                                    value={resumeText}
                                                    onChange={handleResumeTextChange}
                                                    rows={10}
                                                    placeholder="Paste your full resume text here..."
                                                    autoResize
                                                    className="w-full"
                                                    disabled={isLoading}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="field col-12 md:col-6">
                                        <label htmlFor="targetRole" className="font-semibold block mb-2">2. Target Role</label>
                                        <InputText
                                            id="targetRole"
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            placeholder="e.g., Software Engineer"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="field col-12 md:col-6">
                                        <label htmlFor="targetLanguage" className="font-semibold block mb-2">Target Language</label>
                                        <Dropdown
                                            id="targetLanguage"
                                            value={targetLanguage}
                                            options={languageOptions}
                                            onChange={handleLanguageChange}
                                            placeholder="Select Language"
                                            disabled={isLoading}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Conditionally show the 'Create new resume' option */}
                                    {status === 'authenticated' && userHasResumes && (
                                        <div className="field col-12 mt-3 mb-0 p-3 border-1 surface-border border-round bg-surface-50">
                                            <div className="field-checkbox flex align-items-center">
                                                <Checkbox
                                                    inputId="generateNew"
                                                    checked={generateNewResume}
                                                    onChange={(e: CheckboxChangeEvent) => setGenerateNewResume(e.checked ?? false)}
                                                    disabled={isLoading}
                                                />
                                                <label htmlFor="generateNew" className="ml-2 font-semibold">Create a new resume entry from this analysis?</label>
                                            </div>
                                            <Message severity="info" text="Uncheck this if you only want the ATS score without creating a new resume entry." className="mt-2 text-sm" />
                                        </div>
                                    )}

                                    <div className="field-checkbox col-12 md:col-6 flex align-items-end pb-2 md:pb-0 md:pt-3">
                                        <Checkbox
                                            inputId="includeJD"
                                            checked={includeJobDescription}
                                            onChange={(e: CheckboxChangeEvent) => setIncludeJobDescription(e.checked ?? false)}
                                            disabled={isLoading}
                                        />
                                        <label htmlFor="includeJD" className="ml-2 font-semibold">Add Job Description? (Recommended)</label>
                                    </div>

                                    <AnimatePresence>
                                        {includeJobDescription && (
                                            <motion.div
                                                className="field col-12"
                                                variants={fadeInOut}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <label htmlFor="jobDescription" className="font-semibold block mb-2">3. Paste Job Description</label>
                                                <InputTextarea
                                                    id="jobDescription"
                                                    value={jobDescription}
                                                    onChange={(e) => setJobDescription(e.target.value)}
                                                    rows={8}
                                                    placeholder="Paste the full job description here..."
                                                    autoResize
                                                    className="w-full"
                                                    disabled={isLoading}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="col-12 flex justify-content-center mt-4">
                                        <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                            <Button
                                                label="Check ATS Score"
                                                icon="pi pi-shield"
                                                onClick={handleSubmit}
                                                disabled={isSubmitDisabled || isLoading}
                                                className="p-button-lg p-button-success w-full md:w-auto"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-column justify-content-center align-items-center my-5 text-center"
                            style={{ minHeight: '200px' }}
                        >
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".8s" />
                            <motion.p
                                className="mt-4 text-lg text-color-secondary font-semibold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                Analyzing your resume...
                            </motion.p>
                            <motion.p
                                className="mt-2 text-sm text-color-secondary"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                            >
                                Checking keywords and structure against ATS standards.
                            </motion.p>
                        </motion.div>
                    )}

                    {!isLoading && error && (
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className={`p-3 border-round bg-red-100 text-red-700 my-4 ${styles.errorMessage}`}>
                            <strong>Error:</strong> {error}
                        </motion.div>
                    )}

                    {/* --- NEW TWO-COLUMN RESULTS LAYOUT --- */}
                    {!isLoading && apiResponse && !error && (
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mt-4">
                            <div className="grid">
                                {/* Left Column: Scrollable Report */}
                                <div className="col-12 lg:col-7">
                                    <h3 className="text-xl font-semibold mt-0 mb-3">Analysis Report</h3>
                                    <div className={styles.reportContent}>
                                        <ReactMarkdown
                                            components={{
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 leading-normal" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                code: ({ node, inline, className, children, ...props }: {
                                                    node?: any;
                                                    inline?: boolean;
                                                    className?: string;
                                                    children?: React.ReactNode;
                                                    [key: string]: any;
                                                }) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline ? (
                                                        <pre className={styles.codeBlock} {...props}><code>{children}</code></pre>
                                                    ) : (
                                                        <code className={styles.inlineCode} {...props}>{children}</code>
                                                    );
                                                }
                                            }}
                                        >
                                            {apiResponse}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Right Column: Sticky Actions Panel */}
                                <div className="col-12 lg:col-5">
                                    <div className={`${styles.actionPanel} sticky`} style={{ top: '1rem' }}>
                                        <h3 className="text-xl font-semibold mt-0 mb-4">Next Steps</h3>
                                        
                                        <div className="flex flex-column gap-3">
                                            {/* All conditional action buttons are now grouped here */}

                                            {status !== 'authenticated' && sessionStorage.getItem('pendingTaskId') && !postAuthTaskIdToCheck && !postAuthCheckComplete && (
                                                <motion.div
                                                    className="w-full text-center p-4 border-round bg-primary-50"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <i className="pi pi-google text-3xl text-primary mb-3"></i>
                                                    <h4 className="text-lg font-bold text-primary-800 mt-0 mb-2">Unlock Full Potential!</h4>
                                                    <p className="text-color-secondary mb-4">Sign in to save this analysis and access the resume editor.</p>
                                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                                        <Button
                                                            label="Sign In & Continue"
                                                            icon="pi pi-google"
                                                            className="p-button-success p-button-lg w-full"
                                                            onClick={handleSignInAndRedirect}
                                                        />
                                                    </motion.div>
                                                </motion.div>
                                            )}

                                            {isCheckingStatus && status === 'authenticated' && (
                                                <div className="surface-100 p-3 border-round">
                                                    <div className="flex align-items-center mb-2">
                                                        <ProgressSpinner style={{ width: '24px', height: '24px' }} strokeWidth="4" className="mr-2" />
                                                        <span className="font-semibold">Preparing Editor...</span>
                                                    </div>
                                                    <p className="text-sm text-color-secondary m-0">This may take a moment while we apply ATS improvements.</p>
                                                </div>
                                            )}

                                            {generatedResumeId && !isCheckingStatus && !statusError && (
                                                <motion.div
                                                    variants={buttonHoverTap}
                                                    whileHover="hover"
                                                    whileTap="tap"
                                                    animate={{ scale: [1, 1.02, 1] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    <Button
                                                        label="Go to Editor"
                                                        icon="pi pi-pencil"
                                                        className="p-button-success p-button-lg w-full p-button-raised"
                                                        onClick={handleGoToEditor}
                                                    />
                                                </motion.div>
                                            )}

                                            {statusError && !isCheckingStatus && (postAuthTaskIdToCheck || generationTaskId) && (
                                                <Button
                                                    label="Retry Preparation"
                                                    icon="pi pi-exclamation-triangle"
                                                    className="p-button-danger p-button-outlined w-full"
                                                    onClick={handleRetry}
                                                />
                                            )}

                                            {status === 'authenticated' && !generateNewResume && !generationTaskId && !postAuthTaskIdToCheck && !isCheckingStatus && !statusError && (
                                                <Button
                                                    label="Go to Dashboard"
                                                    icon="pi pi-th-large"
                                                    className="p-button-outlined w-full"
                                                    onClick={() => router.push('/main')}
                                                />
                                            )}

                                            <Divider />

                                            <Button
                                                label="Start New Analysis"
                                                icon="pi pi-refresh"
                                                className="p-button-secondary p-button-outlined w-full"
                                                onClick={resetFormAndResults}
                                                disabled={isCheckingStatus}
                                            />

                                            {statusError && !isCheckingStatus && !(postAuthTaskIdToCheck || generationTaskId) && (
                                                <small className="p-error text-center block">{statusError}</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

// This is the main exported page component
const ATSCheckerPage = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" />
                <p className="ml-2">Loading ATS Checker...</p>
            </div>
        }>
            <ATSCheckerPageContent />
        </Suspense>
    );
};

export default ATSCheckerPage;
