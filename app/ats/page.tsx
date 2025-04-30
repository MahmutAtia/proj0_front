"use client";

import React, { useState, useRef } from 'react';
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

    // --- Refs and Hooks ---
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const { data: session, status } = useSession();

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
    const handleFileSelect = (event: FileUploadSelectEvent) => {
        if (event.files && event.files.length > 0) {
            setResumeFile(event.files[0]);
            setResumeText('');
            setApiResponse(null);
            setError(null);
        }
    };

    const handleFileRemove = () => {
        setResumeFile(null);
        setApiResponse(null);
        setError(null);
    };

    const handleResumeTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setResumeText(event.target.value);
        setResumeFile(null);
        setApiResponse(null);
        setError(null);
    };

    const handleInputMethodChange = (e: SelectButtonChangeEvent) => {
        if (e.value !== null) {
            setResumeInputMethod(e.value);
            if (e.value === 'upload') setResumeText('');
            if (e.value === 'paste') setResumeFile(null);
            setApiResponse(null);
            setError(null);
        }
    };

    const handleLanguageChange = (e: DropdownChangeEvent) => {
        setTargetLanguage(e.value);
    };

    const customUploader = async (event: FileUploadHandlerEvent) => {
        event.options.clear();
    };

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
            const markdownOutput = result;

            if (typeof markdownOutput === 'string' && markdownOutput.trim() !== '') {
                setApiResponse(markdownOutput);
            } else {
                console.warn("Received response, but 'ats_result' key was missing, empty, or not a string:", result);
                setApiResponse('Analysis complete, but no specific feedback was returned.');
            }

            toast.current?.show({ severity: 'success', summary: 'Analysis Complete', detail: 'Your resume has been scanned.' });

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            toast.current?.show({ severity: 'error', summary: 'Analysis Failed', detail: err.message || 'An unexpected error occurred.' });
            setShowForm(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewScan = () => {
        setApiResponse(null);
        setError(null);
        setResumeFile(null);
        setResumeText('');
        setShowForm(true);
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

                            <div className="mt-5 pt-4 border-top-1 text-center">
                                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                    <Button
                                        label="Start New Scan"
                                        icon="pi pi-refresh"
                                        className="p-button-secondary p-button-outlined"
                                        onClick={handleNewScan}
                                    />
                                </motion.div>
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
                            {status === 'authenticated' && (
                                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mt-5 pt-4 border-top-1 text-center">
                                    <p className="mb-3 font-semibold">Go to your dashboard to continue editing.</p>
                                    <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                        <Button label="Go to Dashboard" icon="pi pi-arrow-right" className="p-button-outlined" onClick={() => window.location.href = '/main/dashboard'} />
                                    </motion.div>
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
