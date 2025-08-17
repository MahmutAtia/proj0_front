import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import api ,{aiApi} from '@/lib/axios'; // Ensure this import matches your axios setup
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { addOrUpdateResumeInCache } from '@/app/utils/resumeCache';
import { generateYamlFromLocalStorage } from '@/app/utils/utils'; // Adjust the import path as needed

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Spanish', value: 'es' },
    // Add other languages as needed
];


const CreateResumeFromExistingDialog = ({
    visible,
    onHide,
    initialResumeId, // Optional: ID of the resume to base the new one on
    availableResumes = [], // Optional: [{ label: 'Resume A', value: 'id1'}, ...]
    onSuccess, // Callback function (newResumeId) => {}
}) => {
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [targetLanguage, setTargetLanguage] = useState(languageOptions[0]?.value || 'en');
    const [jobDescription, setJobDescription] = useState('');
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const toast = useRef(null);
    const { data: session } = useSession();
    const router = useRouter();

    const isSourceResumeSelectionDisabled = !!initialResumeId;

    const loadingMessages = [
        "Analyzing your source resume...",
        "Tailoring content for the new role...",
        "Applying language and instructions...",
        "Building the new document structure...",
        "Finalizing the details...",
        "Almost ready..."
    ];

    useEffect(() => {
        let intervalId;
        if (loading) {
            let messageIndex = 0;
            setLoadingMessage(loadingMessages[0]);
            intervalId = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[messageIndex]);
            }, 2500); // Change message every 2.5 seconds
        }
        return () => {
            clearInterval(intervalId);
        };
    }, [loading]);

    useEffect(() => {
        if (visible) {
            // Set the initial resume ID if provided
            setSelectedResumeId(initialResumeId || null);

            // Reset other fields when dialog becomes visible
            setTargetLanguage(languageOptions[0]?.value || 'en');
            setJobDescription('');
            setAdditionalInstructions('');
            setError(null);
            setLoading(false);
        }
    }, [visible, initialResumeId]);

    // The useEffect to generate YAML on selection is no longer needed.

    const handleSubmit = async () => {
        if (!selectedResumeId) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a source resume.', life: 3000 });
            return;
        }
        if (!targetLanguage) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a target language.', life: 3000 });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Generate the YAML from the selected resume ID just before sending
            const resumeYaml = generateYamlFromLocalStorage(selectedResumeId);

            if (!process.env.NEXT_PUBLIC_AI_API_URL) {
                throw new Error("AI API URL is not configured.");
            }
            const apiUrl = `${process.env.NEXT_PUBLIC_AI_API_URL}/resumes-v2/create_resume`;

            const payload = {
                input_text: resumeYaml,
                language: targetLanguage,
                job_description: jobDescription,
                instructions: additionalInstructions
            };
            // Send the request to the AI API
            const response = await aiApi.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                },
            });

            // The backend now returns the full resume object in `response.data.resume`
            if (response.data && response.data.success && response.data.resume) {
                const newResume = response.data.resume;
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success!',
                    detail: 'New resume created and added to cache. Redirecting...',
                    life: 3000
                });

                // Add the new resume directly to the local cache
                addOrUpdateResumeInCache(newResume);

                if (onSuccess) {
                    onSuccess(newResume.id);
                }

                // Redirect after a short delay
                setTimeout(() => {
                    // Ensure the path is absolute and includes the /main segment
                    router.push(`/editor/${newResume.id}`);
                }, 1500);

            } else {
                throw new Error(response.data?.detail || 'Failed to create resume. No resume data returned.');
            }
        } catch (err) {
            // This will now also catch errors from generateYamlFromLocalStorage
            console.error("Error creating resume from existing:", err);
            const errorMessage = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
            setError(errorMessage);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
        } finally {
            // Keep loading true during redirection, let the page transition handle it
            // setLoading(false);
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
            <Button
                label="Create Resume"
                icon="pi pi-plus"
                onClick={handleSubmit}
                loading={loading}
                disabled={!selectedResumeId || !targetLanguage || loading}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <Dialog
                header="Create New Resume from Existing"
                visible={visible}
                style={{ width: 'clamp(450px, 60vw, 700px)' }}
                modal
                footer={dialogFooter}
                onHide={onHide}
                blockScroll
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-column justify-content-center align-items-center text-center p-4"
                            style={{ minHeight: '400px', background: 'var(--surface-ground)', borderRadius: 'var(--border-radius)' }}
                        >
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                            <h3 className="mt-4 mb-2 text-lg font-semibold text-primary">Crafting Your New Resume</h3>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={loadingMessage}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="text-color-secondary"
                                    style={{ minHeight: '2rem' }}
                                >
                                    {loadingMessage}
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-fluid flex flex-column gap-4"
                        >
                            {!isSourceResumeSelectionDisabled && (
                                <div className="field">
                                    <label htmlFor="sourceResume" className="font-semibold block mb-2">
                                        Source Resume <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        id="sourceResume"
                                        value={selectedResumeId}
                                        options={availableResumes} // Expects { label: 'Name', value: 'id' }
                                        onChange={(e) => setSelectedResumeId(e.value)}
                                        placeholder="Select a source resume"
                                        filter
                                        className="w-full"
                                        disabled={loading}
                                    />
                                    {!selectedResumeId && <small className="p-error mt-1">Source resume is required.</small>}
                                </div>
                            )}
                            {isSourceResumeSelectionDisabled && initialResumeId && (
                                 <Message severity="info" text={`Creating new resume based on: ${availableResumes.find(r => r.value === initialResumeId)?.label || `Resume ID ${initialResumeId}` }`} className="w-full" />
                            )}

                            <div className="field">
                                <label htmlFor="targetLanguage" className="font-semibold block mb-2">
                                    Target Language for New Resume <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="targetLanguage"
                                    value={targetLanguage}
                                    options={languageOptions}
                                    onChange={(e) => setTargetLanguage(e.value)}
                                    placeholder="Select language"
                                    className="w-full"
                                    disabled={loading}
                                />
                                 {!targetLanguage && <small className="p-error mt-1">Target language is required.</small>}
                            </div>

                            <div className="field">
                                <label htmlFor="jobDescription" className="font-semibold block mb-2">
                                    Job Description (Important)
                                </label>
                                <InputTextarea
                                    id="jobDescription"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    rows={8}
                                    placeholder="Paste the full job description here. This greatly helps in tailoring the new resume."
                                    autoResize
                                    className="w-full"
                                    disabled={loading}
                                />
                                <small className="text-color-secondary mt-1 block">Providing a detailed job description is highly recommended for the best results.</small>
                            </div>

                            <div className="field">
                                <label htmlFor="additionalInstructions" className="font-semibold block mb-2">
                                    Additional Instructions (Optional)
                                </label>
                                <InputTextarea
                                    id="additionalInstructions"
                                    value={additionalInstructions}
                                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                                    rows={4}
                                    placeholder="e.g., Emphasize project management skills, target a senior role, make it more concise."
                                    autoResize
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>

                            {error && <Message severity="error" text={error} className="w-full" />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Dialog>
        </>
    );
};

export default CreateResumeFromExistingDialog;
