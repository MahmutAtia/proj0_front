import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // If navigation is needed from the dialog

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
    const toast = useRef(null);
    const { data: session } = useSession();
    const router = useRouter();

    const isSourceResumeSelectionDisabled = !!initialResumeId;

    useEffect(() => {
        if (visible) {
            if (initialResumeId) {
                setSelectedResumeId(initialResumeId);
            } else {
                setSelectedResumeId(null); // Reset if no initial ID
            }
            // Reset other fields when dialog becomes visible
            setTargetLanguage(languageOptions[0]?.value || 'en');
            setJobDescription('');
            setAdditionalInstructions('');
            setError(null);
            setLoading(false);
        }
    }, [visible, initialResumeId]);

    const handleSubmit = async () => {
        if (!selectedResumeId) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a source resume.', life: 3000 });
            return;
        }
        if (!targetLanguage) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a target language.', life: 3000 });
            return;
        }
        // Job description is optional but important, no hard validation here, but could add a soft warning or UI hint.

        setLoading(true);
        setError(null);

        try {
            if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                throw new Error("Backend URL is not configured.");
            }
            const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/create_from_existing/`;
            const payload = {
                source_resume_id: selectedResumeId,
                target_language: targetLanguage,
                job_description: jobDescription,
                instructions: additionalInstructions,
            };

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.accessToken && {
                        'Authorization': `Bearer ${session.accessToken}`
                    })
                },
            });

            if (response.data && response.data.new_resume_id) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.data.message || 'New resume created successfully!',
                    life: 3000
                });
                if (onSuccess) {
                    onSuccess(response.data.new_resume_id);
                }
                onHide(); // Close dialog on success
            } else {
                throw new Error(response.data?.detail || 'Failed to create resume. Invalid response from server.');
            }
        } catch (err) {
            console.error("Error creating resume from existing:", err);
            const errorMessage = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
            setError(errorMessage);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
        } finally {
            setLoading(false);
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
                <div className="p-fluid flex flex-column gap-4">
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
                </div>
            </Dialog>
        </>
    );
};

export default CreateResumeFromExistingDialog;
