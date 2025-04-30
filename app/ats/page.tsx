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
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

    // State for background task polling
    const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [pollingAttempts, setPollingAttempts] = useState(0);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);

    // --- Refs and Hooks ---
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
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
        setIsCheckingStatus(false);
        setPollingAttempts(0);
        setStatusError(null);
        setGeneratedResumeId(null);
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
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
        const checkStatus = async (taskId: string) => {
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
                    if (pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                        throw new Error("Checking editor status timed out or failed repeatedly.");
                    }
                    setPollingAttempts(prev => prev + 1);
                    return;
                }

                const statusResult = await response.json();

                switch (statusResult.status) {
                    case 'SUCCESS':
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                        const resumeIdFromResult = statusResult.result?.resume_id;

                        if (resumeIdFromResult) {
                            setGeneratedResumeId(String(resumeIdFromResult));
                            setStatusError(null);
                            toast.current?.show({ severity: 'info', summary: 'Ready', detail: 'Editor is ready.', life: 2000 });
                        } else {
                            console.warn("Status SUCCESS but 'resume_id' was missing:", statusResult.result);
                            throw new Error("Editor prepared, but resume ID was not provided.");
                        }
                        setIsCheckingStatus(false);
                        setPollingAttempts(0);
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

            } catch (err: any) {
                console.error("Polling error:", err);
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                setStatusError(err.message || 'An error occurred while checking editor status.');
                toast.current?.show({ severity: 'error', summary: 'Status Check Error', detail: err.message || 'Could not check editor status.' });
                setIsCheckingStatus(false);
                setPollingAttempts(0);
            }
        };

        if (generationTaskId && !generatedResumeId && !statusError) {
            setIsCheckingStatus(true);
            setPollingAttempts(0);

            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            pollingIntervalRef.current = setInterval(() => {
                checkStatus(generationTaskId);
            }, POLLING_INTERVAL);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [generationTaskId, session?.accessToken]);

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

        const backendFormData = {
            description: includeJobDescription ? jobDescription : '',
            targetLanguage: targetLanguage,
            targetRole: targetRole,
        };
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
                setGenerationTaskId(taskId);
            } else {
                console.warn("Backend did not return a 'generation_task_id'. Cannot check editor status.");
                setStatusError("Could not initiate editor status check (missing task ID).");
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

    const handleRetryStatusCheck = () => {
        if (generationTaskId) {
            setStatusError(null);
            setPollingAttempts(0);
            setIsCheckingStatus(true);

            const checkStatus = async (taskId: string) => {
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
                        if (pollingAttempts + 1 >= MAX_POLLING_ATTEMPTS) {
                            throw new Error("Checking editor status timed out or failed repeatedly.");
                        }
                        setPollingAttempts(prev => prev + 1);
                        return;
                    }

                    const statusResult = await response.json();

                    switch (statusResult.status) {
                        case 'SUCCESS':
                            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                            const resumeIdFromResult = statusResult.result?.resume_id;

                            if (resumeIdFromResult) {
                                setGeneratedResumeId(String(resumeIdFromResult));
                                setStatusError(null);
                                toast.current?.show({ severity: 'info', summary: 'Ready', detail: 'Editor is ready.', life: 2000 });
                            } else {
                                console.warn("Status SUCCESS but 'resume_id' was missing:", statusResult.result);
                                throw new Error("Editor prepared, but resume ID was not provided.");
                            }
                            setIsCheckingStatus(false);
                            setPollingAttempts(0);
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

                } catch (err: any) {
                    console.error("Polling error:", err);
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    setStatusError(err.message || 'An error occurred while checking editor status.');
                    toast.current?.show({ severity: 'error', summary: 'Status Check Error', detail: err.message || 'Could not check editor status.' });
                    setIsCheckingStatus(false);
                    setPollingAttempts(0);
                }
            };

            checkStatus(generationTaskId);

            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(() => {
                checkStatus(generationTaskId);
            }, POLLING_INTERVAL);
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Cannot retry, task ID is missing.' });
        }
    };

    const handleNewScan = () => {
        setApiResponse(null);
        setError(null);
        setResumeFile(null);
        setResumeText('');
        setShowForm(true);
        resetPollingState();
        fileUploadRef.current?.clear();
    };

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    const isSubmitDisabled = isLoading || !targetRole.trim() || !((resumeInputMethod === 'upload' && resumeFile) || (resumeInputMethod === 'paste' && resumeText.trim()));

    return (
        <div className="p-4 md:p-6 lg:p-8 flex justify-content-center align-items-start min-h-screen bg-gray-100">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full" style={{ maxWidth: '800px' }}>
                <Toast ref={toast} position="top-right" />
                <Card title="ATS Compatibility Checker" subTitle="See how your resume stacks up against automated screening systems." className={styles.atsCard}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                key="ats-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
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

                            <div className="mt-5 pt-4 border-top-1 flex flex-column sm:flex-row justify-content-center align-items-center gap-3">
                                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                    <Button
                                        label="Start New Scan"
                                        icon="pi pi-refresh"
                                        className="p-button-secondary p-button-outlined w-full sm:w-auto"
                                        onClick={handleNewScan}
                                        disabled={isCheckingStatus}
                                    />
                                </motion.div>

                                {status === 'authenticated' && generationTaskId && (
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button
                                            label={
                                                isCheckingStatus ? "Checking Editor Status..." :
                                                statusError ? "Retry Status Check" :
                                                generatedResumeId ? "Go to Editor" :
                                                "Preparing Editor..."
                                            }
                                            icon={
                                                isCheckingStatus ? "pi pi-spin pi-spinner" :
                                                statusError ? "pi pi-exclamation-triangle" :
                                                generatedResumeId ? "pi pi-pencil" :
                                                "pi pi-cog"
                                            }
                                            onClick={
                                                isCheckingStatus ? () => {} :
                                                statusError ? handleRetryStatusCheck :
                                                generatedResumeId ? handleGoToEditor :
                                                () => {}
                                            }
                                            disabled={isCheckingStatus || (!generatedResumeId && !statusError)}
                                            className="p-button-outlined w-full sm:w-auto"
                                            tooltip={
                                                isCheckingStatus ? "Please wait..." :
                                                statusError ? `Error: ${statusError}` :
                                                generatedResumeId ? "Edit this resume" :
                                                "Checking background task status"
                                            }
                                            tooltipOptions={{ position: 'bottom', showDelay: 300 }}
                                        />
                                    </motion.div>
                                )}
                                {statusError && !isCheckingStatus && (
                                    <small className="p-error text-center sm:text-left w-full sm:w-auto">Failed to prepare editor. {statusError}</small>
                                )}
                            </div>

                            {status !== 'authenticated' && (
                                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mt-5 pt-4 border-top-1 text-center">
                                    <p className="mb-3 font-semibold">Ready to build your perfect resume?</p>
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button label="Continue with Google" icon="pi pi-google" className="p-button-outlined" onClick={handleGoogleSignIn} />
                                    </motion.div>
                                    <p className="text-xs text-color-secondary mt-2">Sign in to save results and access the full editor.</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default ATSCheckerPage;
