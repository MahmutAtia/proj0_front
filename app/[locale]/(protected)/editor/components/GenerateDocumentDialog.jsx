import React, { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message'; // Added Message
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api, { aiApi } from '@/lib/axios'; // Import the axios instance

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
                    (resume) => resume.id == initialResumeId // Use loose equality
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
                (resume) => resume.id == newResumeId // Use loose equality to handle string/number differences
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
                     
            // Get resume data from cache
            const selectedResumeData = allResumesListCache?.find(
                (resume) => resume.id == selectedResumeId  // Use loose equality to handle string/number differences
            );


            if (!selectedResumeData) {
                // Additional debugging to see what IDs are available
                const availableIds = allResumesListCache?.map(r => ({ id: r.id, type: typeof r.id }));
                throw new Error("Selected resume not found in cache. Please refresh and try again.");
            }

            // Extract personal_info and about from cache
            const personal_info = selectedResumeData.resume?.personal_information || {};
            const about_candidate = selectedResumeData.about || "";

            // Debug the extracted data
            console.log("Debug - personal_info:", personal_info);
            console.log("Debug - about_candidate:", about_candidate);
            console.log("Debug - selectedResumeData structure keys:", Object.keys(selectedResumeData));
            if (selectedResumeData.resume) {
                console.log("Debug - resume structure keys:", Object.keys(selectedResumeData.resume));
            }

            // Call the new FastAPI documents endpoint
            console.log("Debug - About to call API with:", {
                endpoint: `/documents/generate`,
                baseURL: process.env.NEXT_PUBLIC_AI_API_URL,
                payload: {
                    resume_id: selectedResumeId,
                    document_type: documentType, 
                    language: language, 
                    other_info: {
                        personal_info: personal_info,
                        about_candidate: about_candidate,
                        additional_context: otherInfo
                    }
                }
            });
            
            const response = await aiApi.post(
                `/documents/generate`,
                { 
                    resume_id: selectedResumeId,
                    document_type: documentType, 
                    language: language, 
                    other_info: {
                        personal_info: personal_info,
                        about_candidate: about_candidate,
                        additional_context: otherInfo
                    }
                }
            );

            console.log("Debug - Full response:", response);
            console.log("Debug - Response status:", response.status);
            console.log("Debug - Response data:", response.data);

            if (response.status === 200 || response.status === 201) {
                // Handle successful response
                const responseData = response.data;
                
                if (responseData?.success && responseData?.document_id) {
                    const newDocId = responseData.document_id;

                    if (onGenerationSuccess) {
                        onGenerationSuccess({ document_uuid: newDocId, resume_id_used: selectedResumeId });
                    }
                    
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Generation Completed',
                        detail: (
                            <div className="flex flex-column align-items-start" style={{ flex: '1' }}>
                                <span>{`${documentTypeOptions.find(o => o.value === documentType)?.label || 'Document'} generated successfully.`}</span>
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
                } else {
                    throw new Error(responseData?.detail || responseData?.error || "Unexpected response format from server");
                }
            } else {
                throw new Error(response.data?.detail || response.data?.error || "Failed to generate document.");
            }
        } catch (error) {
            console.error("Error generating document:", error);
            console.error("Error response:", error.response);
            console.error("Error response data:", error.response?.data);
            console.error("Error message:", error.message);
            console.error("Error code:", error.code);
            console.error("Error config:", error.config);
            
            let errorMessage = 'An unexpected error occurred.';
            
            if (error.response) {
                // Server responded with error status
                errorMessage = error.response.data?.detail || error.response.data?.error || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Network error or no response
                errorMessage = 'Network error: Unable to reach the server. Please check if the API server is running.';
            } else {
                // Other error
                errorMessage = error.message || 'An unexpected error occurred.';
            }
            
            toast.current?.show({ severity: 'error', summary: 'Generation Failed', detail: errorMessage, life: 5000 });
        } finally {
            setLoading(false);
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
                style={{ width: 'min(95vw, 600px)' }}
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
