"use client";
import React from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';


// --- Child Component: EditorToolbar ---
/**
 * Toolbar for the document editor, providing save and download functionality.
 * @param {object} props - Component props.
 * @param {Function} props.onSave - Callback function when the save button is clicked.
 * @param {boolean} props.isSaving - Indicates if a save operation is in progress.
 * @param {boolean} props.hasUnsavedChanges - Indicates if there are unsaved changes.
 * @param {string} [props.documentId] - The ID of the document, required for PDF download.
 * @param {Function} [props.onDownloadPdf] - Callback function to trigger PDF download.
 * @param {boolean} [props.isDownloadingPdf] - Indicates if PDF download is in progress.
 * @param {Function} [props.onDownloadWord] - Callback function to trigger Word download.
 * @param {boolean} [props.isDownloadingWord] - Indicates if Word download is in progress.
 */
const EditorToolbar = ({
    onSave,
    isSaving,
    hasUnsavedChanges,
    documentId,
    onDownloadPdf,
    isDownloadingPdf,
    onDownloadWord,
    isDownloadingWord
}) => {
    return (
        <div className="p-3 surface-ground border-bottom-1 surface-border flex justify-content-end align-items-center sticky top-0 z-5 gap-2">
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && !isSaving && (
                <i
                    className="pi pi-circle-fill text-orange-500 p-mr-2 animation-pulse"
                    style={{ fontSize: '0.7rem' }}
                    title="Unsaved changes"
                ></i>
            )}

            {/* Download PDF Button */}
            {onDownloadPdf && documentId && (
                <Button
                    label={isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                    icon={isDownloadingPdf ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-file-pdf"}
                    className="p-button-sm p-button-secondary"
                    onClick={onDownloadPdf}
                    disabled={isDownloadingPdf || isSaving || isDownloadingWord}
                    tooltip="Download as PDF"
                    tooltipOptions={{ position: 'bottom' }}
                />
            )}

            {/* Download Word Button */}
            {onDownloadWord && documentId && (
                <Button
                    label={isDownloadingWord ? 'Downloading...' : 'Download Word'}
                    icon={isDownloadingWord ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-file-word"}
                    className="p-button-sm p-button-info"
                    onClick={onDownloadWord}
                    disabled={isDownloadingWord || isSaving || isDownloadingPdf}
                    tooltip="Download as Microsoft Word document"
                    tooltipOptions={{ position: 'bottom' }}
                />
            )}

            {/* Save Button */}
            <Button
                label={isSaving ? 'Saving...' : 'Save Changes'}
                icon={isSaving ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-save"}
                className="p-button-sm p-button-success"
                onClick={onSave}
                disabled={isSaving || !hasUnsavedChanges || isDownloadingPdf || isDownloadingWord}
                tooltip={hasUnsavedChanges ? "Save your latest changes" : "No changes to save"}
                tooltipOptions={{ position: 'bottom' }}
            />
            <style jsx>{`
                .animation-pulse {
                    animation: pulse 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};


export default EditorToolbar;
