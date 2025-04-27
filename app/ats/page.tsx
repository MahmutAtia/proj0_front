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
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton'; // Import SelectButton
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { signIn, useSession } from 'next-auth/react';
import styles from './ats.module.css'; // Ensure this CSS module exists

// Animation Variants (Keep existing)
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
    const [resumeInputMethod, setResumeInputMethod] = useState<'upload' | 'paste'>('upload'); // 'upload' or 'paste'
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState<string>(''); // State for pasted text
    const [targetRole, setTargetRole] = useState('');
    const [includeJobDescription, setIncludeJobDescription] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- Refs and Hooks ---
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const { data: session, status } = useSession();

    // --- Options for SelectButton ---
    const resumeInputOptions = [
        { label: 'Upload File', value: 'upload', icon: 'pi pi-upload' },
        { label: 'Paste Text', value: 'paste', icon: 'pi pi-pencil' }
    ];

    // --- Event Handlers ---
    const handleFileSelect = (event: FileUploadSelectEvent) => {
        if (event.files && event.files.length > 0) {
            setResumeFile(event.files[0]);
            setResumeText(''); // Clear pasted text if file is selected
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
        setResumeFile(null); // Clear file if text is pasted
        setApiResponse(null);
        setError(null);
    };

    const handleInputMethodChange = (e: SelectButtonChangeEvent) => {
        if (e.value !== null) {
            setResumeInputMethod(e.value);
            // Optionally clear the other input type when switching
            if (e.value === 'upload') setResumeText('');
            if (e.value === 'paste') setResumeFile(null);
            setApiResponse(null);
            setError(null);
        }
    };

    // Dummy uploader for FileUpload component when customUpload is true
    const customUploader = async (event: FileUploadHandlerEvent) => {
        event.options.clear();
    };

    const handleSubmit = async () => {
        // --- Validation ---
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

        const formData = new FormData();

        // Add resume data (either file or text)
        if (resumeInputMethod === 'upload' && resumeFile) {
            formData.append('resume', resumeFile);
        } else if (resumeInputMethod === 'paste' && resumeText.trim()) {
            formData.append('resume_text', resumeText.trim());
        }

        const backendFormData = {
            description: includeJobDescription ? jobDescription : '',
            targetLanguage: 'en',
        };
        formData.append('formData', JSON.stringify(backendFormData));
        formData.append('target_role', targetRole);

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
            setApiResponse(result.analysis || result.ats_result || 'Analysis complete, but no specific feedback was returned.');
            toast.current?.show({ severity: 'success', summary: 'Analysis Complete', detail: 'Your resume has been scanned.' });

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            toast.current?.show({ severity: 'error', summary: 'Analysis Failed', detail: err.message || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    // --- Render Logic ---
    const isSubmitDisabled = isLoading || !targetRole.trim() || !((resumeInputMethod === 'upload' && resumeFile) || (resumeInputMethod === 'paste' && resumeText.trim()));

    return (
        // Add padding and center the card for a page layout
        <div className="p-4 md:p-6 lg:p-8 flex justify-content-center align-items-start min-h-screen bg-gray-100">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full" style={{ maxWidth: '800px' }}>
                <Toast ref={toast} position="top-right" />
                <Card title="ATS Compatibility Checker" subTitle="See how your resume stacks up against automated screening systems." className={styles.atsCard}>
                    <div className="p-fluid formgrid grid">

                        {/* Resume Input Method Selection */}
                        <div className="field col-12">
                            <label className="font-semibold block mb-2">1. Provide Your Resume</label>
                            <SelectButton
                                value={resumeInputMethod}
                                options={resumeInputOptions}
                                onChange={handleInputMethodChange}
                                optionLabel="label"
                                itemTemplate={(option) => ( // Custom template for icon + label
                                    <div className="flex align-items-center">
                                        <i className={`${option.icon} mr-2`}></i>
                                        <span>{option.label}</span>
                                    </div>
                                )}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Conditional Resume Input: Upload */}
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
                                        maxFileSize={5000000} // 5MB
                                        chooseLabel={resumeFile ? "Change File" : "Select File"}
                                        chooseOptions={{ className: 'p-button-outlined w-full md:w-auto' }}
                                        cancelOptions={{ className: 'p-button-danger p-button-outlined' }}
                                        progressBarTemplate={() => null}
                                        emptyTemplate={<p className="m-0 text-color-secondary">Drag and drop file here or click to select.</p>}
                                        className={styles.fileUpload}
                                        disabled={isLoading}
                                    />
                                    {resumeFile && <p className="mt-2 text-sm text-green-600">Selected: {resumeFile.name}</p>}
                                </motion.div>
                            )}

                            {/* Conditional Resume Input: Paste */}
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

                        {/* Target Role */}
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

                        {/* Job Description Checkbox */}
                        <div className="field-checkbox col-12 md:col-6 flex align-items-end pb-2 md:pb-0 md:pt-3"> {/* Adjusted alignment */}
                            <Checkbox
                                inputId="includeJD"
                                checked={includeJobDescription}
                                onChange={(e: CheckboxChangeEvent) => setIncludeJobDescription(e.checked ?? false)}
                                disabled={isLoading}
                            />
                            <label htmlFor="includeJD" className="ml-2 font-semibold">Add Job Description? (Recommended)</label>
                        </div>

                        {/* Job Description Textarea (Conditional) */}
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

                        {/* Submit Button */}
                        <div className="col-12 flex justify-content-center mt-4">
                            <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                                <Button
                                    label={isLoading ? "Analyzing..." : "Check ATS Score"}
                                    icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-shield"}
                                    onClick={handleSubmit}
                                    disabled={isSubmitDisabled}
                                    className="p-button-lg p-button-success w-full md:w-auto" // Full width on mobile
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Loading Spinner */}
                    {isLoading && (
                        <div className="flex justify-content-center my-5">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" animationDuration=".5s" />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && !isLoading && (
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className={`p-3 border-round bg-red-100 text-red-700 my-4 ${styles.errorMessage}`}>
                            <strong>Error:</strong> {error}
                        </motion.div>
                    )}

                    {/* Results Container */}
                    {apiResponse && !isLoading && (
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className={`mt-5 ${styles.resultsContainer}`}>
                            <h3 className="text-xl font-semibold mb-3 border-bottom-1 pb-2">Analysis Results:</h3>
                            <ReactMarkdown
                               components={{ // Keep custom markdown renderers
                                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-2 leading-normal" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                    code: ({node, inline, className, children, ...props}) => {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline ? (
                                          <pre className={styles.codeBlock} {...props}><code>{children}</code></pre>
                                        ) : (
                                          <code className={styles.inlineCode} {...props}>{children}</code>
                                        )
                                      }
                               }}
                            >
                                {apiResponse}
                            </ReactMarkdown>

                            {/* Sign-In / Dashboard Buttons */}
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
                                        <Button label="Go to Dashboard" icon="pi pi-arrow-right" className="p-button-outlined" onClick={() => window.location.href = '/dashboard'} />
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

export default ATSCheckerPage; // Export as default for the page
