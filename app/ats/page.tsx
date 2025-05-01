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
import ReactMarkdown from 'react-markdown';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ats.module.css';

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
const ATSCheckerPage = () => {
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
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const postAuthTask = searchParams.get('post_auth_task');
        if (status === 'authenticated' && postAuthTask === 'true' && !postAuthCheckComplete) {
            const pendingTaskId = sessionStorage.getItem('pendingTaskId');
            const pendingApiResponse = sessionStorage.getItem('pendingApiResponse');
            sessionStorage.removeItem('pendingTaskId');
            sessionStorage.removeItem('pendingApiResponse');
            router.replace('/ats', undefined);

            if (pendingTaskId) {
                setPostAuthTaskIdToCheck(pendingTaskId);
                if (pendingApiResponse) {
                    setApiResponse(pendingApiResponse);
                }
                setShowForm(false);
                setError(null);
                setIsLoading(false);
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Session Expired?', detail: 'Could not retrieve analysis task after sign-in.' });
                router.push('/main/dashboard');
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
            const resumeIdFromResult = result.resume_id;

            if (resumeIdFromResult) {
                setGeneratedResumeId(String(resumeIdFromResult));
                toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Resume saved and editor is ready.', life: 3000 });
                try {
                    localStorage.removeItem('data');
                } catch (storageError) {
                    console.error("Failed to remove 'data' from localStorage:", storageError);
                }
                setStatusError(null);
            } else {
                throw new Error("Resume saved, but editor ID was not provided.");
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
        if (isPostAuthCheck || pollingAttempts === 0) {
            setStatusError(null);
        }

        try {
            const statusApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/pdf-generation-status/${taskId}/`;
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
                if (!isPostAuthCheck && pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                    throw new Error("Checking editor status timed out or failed repeatedly.");
                }
                if (isPostAuthCheck) {
                    throw new Error(`Status check failed (${response.status}). Please retry.`);
                }
                setPollingAttempts(prev => prev + 1);
                return;
            }

            const statusResult = await response.json();

            if (isPostAuthCheck) {
                switch (statusResult.status) {
                    case 'SUCCESS':
                        if (statusResult.result?.status === 'SUCCESS') {
                            await saveGeneratedResume(taskId);
                        } else {
                            throw new Error(statusResult.result?.error || 'Background task completed but data processing failed.');
                        }
                        break;
                    case 'RETRY':
                        await saveGeneratedResume(taskId);
                        break;
                    case 'FAILURE':
                        throw new Error(statusResult.error || 'Analysis task failed previously.');
                    case 'PENDING':
                    default:
                        setStatusError(null);
                        setIsCheckingStatus(true);
                        toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Resume preparation is still in progress. Please wait.', life: 4000 });
                        setPostAuthCheckComplete(true);
                        break;
                }
            } else {
                switch (statusResult.status) {
                    case 'SUCCESS':
                        if (statusResult.result?.status === 'SUCCESS') {
                            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                            setPollingAttempts(0);
                            await saveGeneratedResume(taskId);
                        } else {
                            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                            throw new Error(statusResult.result?.error || 'Background task completed but data processing failed.');
                        }
                        break;
                    case 'FAILURE':
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                        const errorDetail = statusResult.error || 'Preparing editor failed.';
                        setStatusError(errorDetail);
                        toast.current?.show({ severity: 'error', summary: 'Editor Status Failed', detail: errorDetail });
                        setIsCheckingStatus(false);
                        setPollingAttempts(0);
                        break;
                    case 'PENDING':
                    default:
                        if (pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                            throw new Error("Checking editor status is taking longer than expected.");
                        }
                        setPollingAttempts(prev => prev + 1);
                        break;
                }
            }

        } catch (err: any) {
            console.error("Status check error:", err);
            if (!isPostAuthCheck && pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            setStatusError(err.message || 'An error occurred while checking status.');
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Could not check status.' });
            setIsCheckingStatus(false);
            if (isPostAuthCheck) {
                setPostAuthCheckComplete(true);
            } else {
                setPollingAttempts(0);
            }
        }
    };

    useEffect(() => {
        if (postAuthTaskIdToCheck && session?.accessToken && !postAuthCheckComplete && !isCheckingStatus) {
            checkStatus(postAuthTaskIdToCheck, true);
        }
    }, [postAuthTaskIdToCheck, session?.accessToken, postAuthCheckComplete, isCheckingStatus]);

    useEffect(() => {
        if (generationTaskId && !postAuthTaskIdToCheck && !generatedResumeId && !statusError) {
            if (!isCheckingStatus) {
                setIsCheckingStatus(true);
                setPollingAttempts(0);

                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
                checkStatus(generationTaskId, false);
                pollingIntervalRef.current = setInterval(() => {
                    if (!generatedResumeId && !statusError) {
                        checkStatus(generationTaskId, false);
                    } else {
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    }
                }, POLLING_INTERVAL);
            }
        } else {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [generationTaskId, postAuthTaskIdToCheck, generatedResumeId, statusError, session?.accessToken, isCheckingStatus]);

    const handleSubmit = async () => {
        const isResumeProvided = (resumeInputMethod === 'upload' && resumeFile) || (resumeInputMethod === 'paste' && resumeText.trim());
        if (!isResumeProvided) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Resume', detail: `Please ${resumeInputMethod === 'upload' ? 'upload your resume file' : 'paste your resume text'}.` });
            return;
        }
        if (!targetRole.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Role', detail: 'Please enter the target role.' });
            return;
        }
        if (includeJobDescription && !jobDescription.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Job Description', detail: 'Please paste the job description or uncheck the box.' });
            return;
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
            const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/ats-checker/`;

            const fetchOptions: RequestInit = {
                method: 'POST',
                body: formData,
                headers: {
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                },
            };

            const response = await fetch(apiUrl, fetchOptions);

            if (!response.ok) {
                let errorDetail = 'Failed to analyze resume. Please try again.';
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorData.error || errorData.message || errorDetail;
                } catch (e) {
                    errorDetail = response.statusText || errorDetail;
                }
                throw new Error(errorDetail);
            }

            const result = await response.json();
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
                if (status === 'authenticated') {
                    setGenerationTaskId(taskId);
                } else {
                    sessionStorage.setItem('pendingTaskId', taskId);
                    if (markdownOutput) {
                        sessionStorage.setItem('pendingApiResponse', markdownOutput);
                    }
                }
            } else {
                if (status === 'authenticated' && !generateNewResume) {
                    console.log("generate_new_resume was false, no task ID received.");
                } else {
                    console.warn("Backend did not return a 'generation_task_id' when expected.");
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
            router.push(`/main/editor/${generatedResumeId}`);
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Not Ready', detail: 'Editor is not ready yet or status check failed.' });
        }
    };

    const handleRetry = () => {
        const taskIdToRetry = postAuthTaskIdToCheck || generationTaskId;
        if (taskIdToRetry) {
            setStatusError(null);
            setPollingAttempts(0);
            if (postAuthTaskIdToCheck) {
                setPostAuthCheckComplete(false);
            }
            if (postAuthTaskIdToCheck) {
                checkStatus(taskIdToRetry, true);
            } else {
                checkStatus(taskIdToRetry, false);
            }
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Cannot retry, task ID is missing.' });
        }
    };

    const handleSignInAndRedirect = () => {
        const taskIdToStore = sessionStorage.getItem('pendingTaskId');

        if (taskIdToStore) {
        } else {
            console.warn("Attempting to sign in, but no pending task ID found in sessionStorage.");
        }

        if (apiResponse) {
            sessionStorage.setItem('pendingApiResponse', apiResponse);
        }
        signIn('google', { callbackUrl: '/ats?post_auth_task=true' });
    };

    const isSubmitDisabled = isLoading || !targetRole.trim() || !((resumeInputMethod === 'upload' && resumeFile) || (resumeInputMethod === 'paste' && resumeText.trim()));

    return (
        <div className="p-4 md:p-6 lg:p-8 flex justify-content-center align-items-start min-h-screen bg-gray-100">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full" style={{ maxWidth: '800px' }}>
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

                                    {status === 'authenticated' && (
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
                                            <Message severity="warn" text="Checking this box will add a new resume to your dashboard after the analysis." className="mt-2 text-sm" />
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

                    {!isLoading && apiResponse && !error && (
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className={`mt-5 ${styles.resultsContainer}`}>
                            <h3 className="text-xl font-semibold mb-3 border-bottom-1 pb-2">Analysis Results:</h3>
                            <ReactMarkdown
                                components={{
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-2 leading-normal" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                    code: ({ node, inline, className, children, ...props }) => {
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

                            <div className="mt-5 pt-4 border-top-1 flex flex-column justify-content-center align-items-center gap-3">
                                {status !== 'authenticated' && sessionStorage.getItem('pendingTaskId') && !postAuthTaskIdToCheck && !postAuthCheckComplete && (
                                    <div className="w-full text-center p-4 border-1 surface-border border-round bg-primary-50">
                                        <h4 className="text-lg font-semibold text-primary-700 mt-0 mb-2">Unlock Full Potential!</h4>
                                        <p className="text-color-secondary mb-4">Sign in with Google to save this analysis, access the powerful resume editor, and manage all your resumes in one place.</p>
                                        <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                            <Button
                                                label="Continue with Google to Save & Edit"
                                                icon="pi pi-google"
                                                className="p-button-success p-button-lg w-full sm:w-auto"
                                                onClick={handleSignInAndRedirect}
                                                tooltip="Sign in to save this analysis and access the editor"
                                                tooltipOptions={{ position: 'bottom', showDelay: 300 }}
                                            />
                                        </motion.div>
                                        <Divider className="my-4" />
                                    </div>
                                )}

                                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                    <Button
                                        label="Start New Scan"
                                        icon="pi pi-refresh"
                                        className="p-button-secondary p-button-outlined w-full sm:w-auto"
                                        onClick={resetFormAndResults}
                                        disabled={isCheckingStatus}
                                    />
                                </motion.div>

                                {isCheckingStatus && status === 'authenticated' && (
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button
                                            label="Checking Status / Saving..."
                                            icon="pi pi-spin pi-spinner"
                                            disabled={true}
                                            className="p-button-outlined w-full sm:w-auto"
                                            tooltip="Please wait..."
                                            tooltipOptions={{ position: 'bottom', showDelay: 300 }}
                                        />
                                    </motion.div>
                                )}

                                {statusError && !isCheckingStatus && (postAuthTaskIdToCheck || generationTaskId) && (
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button
                                            label="Retry Preparation"
                                            icon="pi pi-exclamation-triangle"
                                            className="p-button-danger p-button-outlined w-full sm:w-auto"
                                            onClick={handleRetry}
                                            tooltip={`Error: ${statusError}. Click to retry.`}
                                            tooltipOptions={{ position: 'bottom', showDelay: 100 }}
                                        />
                                    </motion.div>
                                )}

                                {generatedResumeId && !isCheckingStatus && !statusError && (
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button
                                            label="Go to Editor"
                                            icon="pi pi-pencil"
                                            className="p-button-success p-button-outlined w-full sm:w-auto"
                                            onClick={handleGoToEditor}
                                            tooltip="Edit this resume"
                                            tooltipOptions={{ position: 'bottom', showDelay: 300 }}
                                        />
                                    </motion.div>
                                )}

                                {status === 'authenticated' && !generationTaskId && !postAuthTaskIdToCheck && !isCheckingStatus && !statusError && (
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button
                                            label="Go to Dashboard"
                                            icon="pi pi-th-large"
                                            className="p-button-outlined w-full sm:w-auto"
                                            onClick={() => router.push('/dashboard')}
                                        />
                                    </motion.div>
                                )}

                                {statusError && !isCheckingStatus && !(postAuthTaskIdToCheck || generationTaskId) && (
                                    <small className="p-error text-center sm:text-left w-full sm:w-auto">{statusError}</small>
                                )}
                            </div>
                        </motion.div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default ATSCheckerPage;
