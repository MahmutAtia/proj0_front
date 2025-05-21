import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FiFileText, FiEdit, FiDownload, FiPlusSquare, FiArchive } from 'react-icons/fi';

const ResumeDocumentsDialog = ({ visible, onHide, resume, onEditDocument, onManageResume }) => {
    const router = useRouter();

    if (!resume) return null;

    const documents = resume.generated_documents_data || [];

    const documentTypeDisplay = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleDownloadDocument = (doc) => {
        console.log("Initiate download for document:", doc.unique_id, "Type:", doc.document_type);
        alert(`Download for ${documentTypeDisplay(doc.document_type)} (ID: ${doc.unique_id}) - (Implement actual download)`);
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" />
        </div>
    );

    return (
        <Dialog
            header={
                <div className="flex align-items-center">
                    <FiFileText className="mr-2 text-xl text-primary" />
                    <span>Documents for: <span className="font-semibold">{resume.title || 'Untitled Resume'}</span></span>
                </div>
            }
            visible={visible}
            style={{ width: 'clamp(380px, 55vw, 650px)' }}
            modal
            onHide={onHide}
            footer={dialogFooter}
            pt={{
                header: { className: 'p-dialog-title-icon-right border-bottom-1 surface-border' },
                content: { className: 'bg-surface-50' }
            }}
        >
            {documents.length > 0 ? (
                <ul className="list-none p-0 m-0 flex flex-column gap-3 py-3">
                    {documents.map(doc => (
                        <li key={doc.unique_id} className="p-3 surface-card border-1 surface-border border-round flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-3 hover:shadow-1 transition-shadow">
                            <div className="flex align-items-center">
                                <FiFileText className="text-2xl text-primary mr-3 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold text-md block">{documentTypeDisplay(doc.document_type)}</span>
                                    <span className="text-xs text-color-secondary">
                                        Created: {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                              <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                                <Button
                                    icon={<FiDownload style={{ fontSize: '1.2rem' }} />}
                                    className="p-button-rounded p-button-text p-button-secondary" // Use p-button-rounded for a circular shape, removed p-button-sm
                                    tooltip="Download Document"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => handleDownloadDocument(doc)}
                                    aria-label="Download Document" // Added for accessibility
                                />
                                <Button
                                    icon={<FiEdit style={{ fontSize: '1.2rem' }} />}
                                    className="p-button-rounded p-button-text p-button-info" // Use p-button-rounded for a circular shape, removed p-button-sm
                                    tooltip="Edit Document"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => onEditDocument(doc.unique_id)}
                                    aria-label="Edit Document" // Added for accessibility
                                />
                            </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center p-5 my-3 bg-surface-ground border-round">
                    <FiArchive className="text-5xl text-color-secondary mb-3" />
                    <p className="text-lg text-color-secondary font-medium mb-2">No Documents Yet</p>
                    <p className="text-sm text-color-secondary mb-4">
                        This resume doesn&apos;t have any linked documents. You can create and manage documents in the resume editor.
                    </p>
                    <Button
                        label="Go to Resume Editor"
                        icon={<FiEdit className="mr-2" />}
                        className="p-button-outlined p-button-sm"
                        onClick={() => {
                            onHide();
                            onManageResume(resume);
                        }}
                    />
                </div>
            )}
        </Dialog>
    );
};

export default ResumeDocumentsDialog;
