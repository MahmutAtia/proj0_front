import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRouter } from 'next/navigation'; // Import useRouter
import axios from 'axios';

const documentTypeOptions = [
    { label: 'Cover Letter', value: 'cover_letter' },
    { label: 'Recommendation Letter', value: 'recommendation_letter' },
    { label: 'Motivation Letter', value: 'motivation_letter' },
];

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Spanish', value: 'es' },
    // Add other languages as needed
];

const GenerateDocumentDialog = ({ visible, onHide, resumeId }) => {
    const [documentType, setDocumentType] = useState(documentTypeOptions[0].value);
    const [language, setLanguage] = useState(languageOptions[0].value);
    const [otherInfo, setOtherInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedDocId, setGeneratedDocId] = useState(null); // Store the new doc ID
    const toast = useRef(null);
    const router = useRouter(); // Initialize router

    // Reset state when dialog is hidden/shown
    useEffect(() => {
        if (visible) {
            setDocumentType(documentTypeOptions[0].value);
            setLanguage(languageOptions[0].value);
            setOtherInfo('');
            setLoading(false);
            setGeneratedDocId(null); // Reset generated ID when dialog opens
        }
    }, [visible]);

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
            router.push(`/document_editor/${docId}`);
            onHide(); // Close dialog after navigation starts
        }
    };

    const handleSubmit = async () => {
        if (!resumeId || !documentType || !language) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Information', detail: 'Please ensure all fields are selected.', life: 3000 });
            return;
        }

        setLoading(true);
        setGeneratedDocId(null); // Reset in case of retry
        try {
            const response = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/resumes/generate_document/', {
                resumeId: resumeId,
                documentType: documentType,
                language: language,
                otherInfo: otherInfo,
            });

            // Check for successful creation status (201) and response data
            if (response.status === 201 && response.data?.document_uuid) {
                const newDocId = response.data.document_uuid;
                setGeneratedDocId(newDocId); // Store the ID
                console.log("Document generation successful:", newDocId);

                // Show sticky success toast with navigation option
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
                                        toast.current?.clear(); // Clear this specific toast
                                        onHide(); // Close the dialog
                                    }}
                                />
                            </div>
                        </div>
                    ),
                    sticky: true // Keep toast visible until user interaction
                });
                // Don't close dialog automatically, let user decide via toast buttons
            } else {
                // Handle cases where status is not 201 or uuid is missing
                throw new Error(response.data?.error || "Invalid response from server during document creation.");
            }

        } catch (error) {
            console.error("Error generating document:", error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to start document generation.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
            setGeneratedDocId(null); // Ensure ID is null on error
        } finally {
            // Keep loading false if successful (dialog stays open), only reset if error occurred
            if (!generatedDocId) { // Only set loading false if there was an error or invalid response
                setLoading(false);
            }
        }
    };

    // Footer changes slightly: Disable Generate button if successful until dialog is closed/reopened
    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
            <Button
                label="Generate"
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={!!generatedDocId} // Disable Generate button after successful generation
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} position="bottom-center" /> {/* Position toast */}
            <Dialog
                header="Generate New Document"
                visible={visible}
                style={{ width: '50vw', minWidth: '450px' }}
                modal
                footer={dialogFooter}
                onHide={onHide}
                blockScroll
            >
                <div className="p-fluid flex flex-column gap-4">
                    <div className="field">
                        <label htmlFor="docType" className="font-semibold block mb-2">Document Type</label>
                        <Dropdown
                            id="docType"
                            value={documentType}
                            options={documentTypeOptions}
                            onChange={(e) => setDocumentType(e.value)}
                            placeholder="Select a Document Type"
                            disabled={loading || !!generatedDocId} // Also disable fields after success
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="language" className="font-semibold block mb-2">Language</label>
                        <Dropdown
                            id="language"
                            value={language}
                            options={languageOptions}
                            onChange={(e) => setLanguage(e.value)}
                            placeholder="Select Language"
                            disabled={loading || !!generatedDocId} // Also disable fields after success
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="otherInfo" className="font-semibold block mb-2">Additional Information</label>
                        <InputTextarea
                            id="otherInfo"
                            value={otherInfo}
                            onChange={(e) => setOtherInfo(e.target.value)}
                            rows={8}
                            placeholder={getPlaceholderText()}
                            autoResize
                            className="w-full"
                            disabled={loading || !!generatedDocId} // Also disable fields after success
                            tooltip="Provide context like target company, recipient details, specific points to include, etc."
                            tooltipOptions={{ position: 'top' }}
                        />
                        <small className="text-color-secondary">Enter any relevant details. You can also paste text here.</small>
                    </div>


                    {generatedDocId && !loading && (
                        <div className="p-message p-message-success mt-3">
                            <span className="p-message-icon pi pi-check"></span>
                            <span className="p-message-text">Document created successfully! Use the options in the notification below.</span>
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default GenerateDocumentDialog;
