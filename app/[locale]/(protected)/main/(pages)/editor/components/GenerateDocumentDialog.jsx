import React, { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message'; // Added Message
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const documentTypeOptions = [
    { label: 'Cover Letter', value: 'cover_letter' },
    { label: 'Recommendation Letter', value: 'recommendation_letter' },
    { label: 'Motivation Letter', value: 'motivation_letter' },
    // Add other document types as needed
];

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Spanish', value: 'es' },
    // Add other languages as needed
];

const GenerateDocumentDialog = ({
    visible,
    onHide,
    initialResumeId,
    availableResumes = [],
    allResumesListCache = [], // Prop is correctly named here

    existingDocTypes: initialExistingDocTypes = [],
    onGenerationSuccess
}) => {
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [documentType, setDocumentType] = useState(null);
    const [language, setLanguage] = useState(languageOptions[0]?.value);
    const [otherInfo, setOtherInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDocTypes, setLoadingDocTypes] = useState(false);
    const [currentExistingDocTypes, setCurrentExistingDocTypes] = useState([]);
    const toast = useRef(null);
    const router = useRouter();
    const token = useSession()?.data?.accessToken; // Get access token from session

    const isResumeSelectionMode = !initialResumeId;

    // Effect to reset form basics when dialog becomes visible or initialResumeId changes to null
    useEffect(() => {
        if (visible) {
            setLoading(false);
            setLoadingDocTypes(false);
            setOtherInfo('');
            setLanguage(languageOptions[0]?.value);
            setDocumentType(null); // Always reset document type selection

            if (!initialResumeId) {
                // If no initial resume is provided, clear selection fields for the user to choose.
                // This runs when the dialog opens in selection mode.
                setSelectedResumeId(null);
                setCurrentExistingDocTypes([]);
            }
            // If initialResumeId IS provided, its specific setup is handled by the effect below,
            // which will use the latest allResumesListCache.
        }
    }, [visible, initialResumeId]); // Dependencies are focused on visibility and presence of initialResumeId

    // Effect to handle setting up the dialog when an initialResumeId is provided
    useEffect(() => {
        if (visible && initialResumeId) {
            setSelectedResumeId(initialResumeId);
            let typesForInitialResume = initialExistingDocTypes || []; // Start with prop

            // If cache is available, try to get existing types from there for the initialResumeId
            if (allResumesListCache && allResumesListCache.length > 0) {
                const selectedResumeData = allResumesListCache.find(
                    (resume) => resume.id === initialResumeId
                );
                if (selectedResumeData && selectedResumeData.json_content) {
                    typesForInitialResume = Object.keys(selectedResumeData.json_content);
                } else {
                    // Log if initial resume not found in cache, will fall back to initialExistingDocTypes
                    console.warn(`GenerateDocumentDialog: Initial resume ID ${initialResumeId} not found in allResumesListCache or has no json_content. Using prop initialExistingDocTypes or default empty array.`);
                }
            }
            setCurrentExistingDocTypes(typesForInitialResume);
        }
        // If initialResumeId is null, this effect does nothing.
        // The reset for that case is handled by the effect above.
    }, [visible, initialResumeId, allResumesListCache, initialExistingDocTypes]);


    const availableDocTypes = useMemo(() => {
        return documentTypeOptions.filter(
            docType => !currentExistingDocTypes.includes(docType.value)
        );
    }, [currentExistingDocTypes]);

    useEffect(() => {
        // Auto-select first available document type if a resume is selected and doc types are available
        if (selectedResumeId) {
            const isCurrentTypeStillValid = documentType && availableDocTypes.some(opt => opt.value === documentType);
            if (!isCurrentTypeStillValid) {
                if (availableDocTypes.length > 0) {
                    setDocumentType(availableDocTypes[0].value);
                } else {
                    setDocumentType(null);
                }
            }
        } else {
            setDocumentType(null); // No resume selected, clear doc type
        }
    }, [selectedResumeId, availableDocTypes, documentType]);



   const handleResumeSelect = (e) => {
        const newResumeId = e.value; // This will be resume.id
        setSelectedResumeId(newResumeId);
        setDocumentType(null); // Reset document type

        if (newResumeId && allResumesListCache) { // Use the prop allResumesListCache
            setLoadingDocTypes(true);
            const selectedResumeData = allResumesListCache.find(
                (resume) => resume.id === newResumeId // Use .id for lookup
            );

            if (selectedResumeData && selectedResumeData.json_content) {
                const existingTypes = Object.keys(selectedResumeData.json_content);
                setCurrentExistingDocTypes(existingTypes);
            } else {
                setCurrentExistingDocTypes([]);
                console.warn(`Resume with ID ${newResumeId} not found in allResumesListCache or has no json_content data.`);
            }
            setLoadingDocTypes(false);
        } else {
            setCurrentExistingDocTypes([]);
            if (!allResumesListCache || allResumesListCache.length === 0) { // Check if cache is empty or undefined
                console.warn("allResumesListCache is not available or empty to determine existing document types.");
            }
            setLoadingDocTypes(false);
        }
    };

    const getPlaceholderText = () => {
        switch (documentType) {
            case 'cover_letter':
                return "Provide details about the target company, job role, specific requirements, or any key points you want to emphasize...";
            case 'recommendation_letter':
                return "Provide details about the recipient (name, title, organization), the purpose of the recommendation (job, admission), key strengths/examples to highlight, and your relationship with the candidate...";
            case 'motivation_letter':
                return "Provide details about the target program/institution/opportunity, your specific motivations, relevant experiences, future goals, or any specific points to address...";
            default:
                return "Enter any additional relevant information for the document generation...";
        }
    };

    const handleNavigateToEditor = (docId) => {
        if (docId) {
            toast.current?.clear();
            onHide(); // Close dialog before navigating
            router.push(`/document_editor/${docId}`);
        }
    };

    const handleSubmit = async () => {
        if (!selectedResumeId) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Resume', detail: 'Please select a resume.', life: 3000 });
            return;
        }
        if (!documentType) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Document Type', detail: 'Please select a document type.', life: 3000 });
            return;
        }
        if (!language) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Language', detail: 'Please select a language.', life: 3000 });
            return;
        }

        setLoading(true);
        try {
            if (!process.env.NEXT_PUBLIC_BACKEND_URL) throw new Error("Backend URL is not configured.");
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate_document/`,
                { resumeId: selectedResumeId, documentType, language, otherInfo },
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Use token from session
                    }
                }
            );

            if ((response.status === 201 || response.status === 200) && response.data?.document_uuid) {
                const newDocId = response.data.document_uuid;

                if (onGenerationSuccess) { // Call parent callback
                    onGenerationSuccess({ document_uuid: newDocId, resume_id_used: selectedResumeId });
                }
                // The toast with navigation options can be handled by the parent (DashboardPage)
                // or kept here if preferred. For now, let parent handle it via onGenerationSuccess.
                // onHide(); // Close dialog on success, parent will show toast and navigate.
                // For now, let's keep the sticky toast here as per original complex dialog.
                 toast.current?.show({
                    severity: 'success',
                    summary: 'Generation Started',
                    detail: (
                        <div className="flex flex-column align-items-start" style={{ flex: '1' }}>
                            <span>{`${documentTypeOptions.find(o => o.value === documentType)?.label || 'Document'} generation initiated.`}</span>
                            <div className="flex align-items-center gap-2 mt-3">
                                <Button
                                    label="Go to Editor"
                                    icon="pi pi-arrow-right"
                                    className="p-button-sm p-button-success"
                                    onClick={() => handleNavigateToEditor(newDocId)}
                                />
                                <Button
                                    label="Stay Here"
                                    icon="pi pi-times"
                                    className="p-button-sm p-button-secondary p-button-outlined"
                                    onClick={() => {
                                        toast.current?.clear();
                                        onHide();
                                    }}
                                />
                            </div>
                        </div>
                    ),
                    sticky: true
                });
                // Dialog is NOT hidden here by default if using sticky toast with options.
            } else {
                throw new Error(response.data?.detail || response.data?.error || "Failed to start document generation.");
            }
        } catch (error) {
            console.error("Error generating document:", error);
            const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'An unexpected error occurred.';
            toast.current?.show({ severity: 'error', summary: 'Generation Failed', detail: errorMessage, life: 5000 });
        } finally {
            setLoading(false); // Set loading to false in all cases, success toast handles dialog state
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
            <Button
                label="Generate Document"
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={!selectedResumeId || !documentType || loading || loadingDocTypes || (!!selectedResumeId && availableDocTypes.length === 0)}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} position="bottom-center" />
            <Dialog
                header="Generate New Document"
                visible={visible}
                style={{ width: 'clamp(400px, 50vw, 600px)' }}
                modal
                footer={dialogFooter}
                onHide={onHide}
                blockScroll
            >
                <div className="p-fluid flex flex-column gap-4">
                    {isResumeSelectionMode && (
                        <div className="field">
                            <label htmlFor="resumeSelector" className="font-semibold block mb-2">
                                Select Resume <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="resumeSelector"
                                value={selectedResumeId}
                                options={availableResumes} // Use the prop
                                onChange={handleResumeSelect}
                                placeholder="Choose a resume..."
                                filter
                                disabled={loading || loadingDocTypes}
                                className="w-full"
                            />
                            {!selectedResumeId && <small className="p-error mt-1">Resume selection is required.</small>}
                        </div>
                    )}

                    {selectedResumeId ? (
                        <>
                            <div className="field">
                                <label htmlFor="docType" className="font-semibold block mb-2">
                                    Document Type <span className="text-red-500">*</span>
                                </label>
                                {loadingDocTypes ? (
                                    <div className="flex align-items-center text-color-secondary">
                                        <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="6" className="mr-2" />
                                        <span>Verifying existing documents...</span>
                                    </div>
                                ) : availableDocTypes.length > 0 ? (
                                    <Dropdown
                                        id="docType"
                                        value={documentType}
                                        options={availableDocTypes}
                                        onChange={(e) => setDocumentType(e.value)}
                                        placeholder="Select Document Type"
                                        disabled={loading}
                                        className="w-full"
                                    />
                                ) : (
                                    <Message
                                        severity="info"
                                        text={currentExistingDocTypes.length >= documentTypeOptions.length && selectedResumeId ?
                                              "All standard document types already exist for this resume." :
                                              "No new document types available for this resume."}
                                        className="w-full"
                                    />
                                )}
                                {!documentType && availableDocTypes.length > 0 && !loadingDocTypes && (
                                    <small className="p-error mt-1">Document type is required.</small>
                                )}
                            </div>

                            {documentType && (
                                <>
                                    <div className="field">
                                        <label htmlFor="language" className="font-semibold block mb-2">
                                            Language <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            id="language"
                                            value={language}
                                            options={languageOptions}
                                            onChange={(e) => setLanguage(e.value)}
                                            placeholder="Select Language"
                                            disabled={loading}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="otherInfo" className="font-semibold block mb-2">Additional Information (Optional)</label>
                                        <InputTextarea
                                            id="otherInfo"
                                            value={otherInfo}
                                            onChange={(e) => setOtherInfo(e.target.value)}
                                            rows={5}
                                            placeholder={getPlaceholderText()}
                                            autoResize
                                            className="w-full"
                                            disabled={loading}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        isResumeSelectionMode && <Message severity="info" text="Please select a resume first to proceed." className="w-full" />
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default GenerateDocumentDialog;
