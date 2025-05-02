"use client";
import React from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';


// --- Child Component: EditorToolbar ---
/**
 * Toolbar for the document editor, providing save functionality.
 * @param {object} props - Component props.
 * @param {Function} props.onSave - Callback function when the save button is clicked.
 * @param {boolean} props.isSaving - Indicates if a save operation is in progress.
 * @param {boolean} props.hasUnsavedChanges - Indicates if there are unsaved changes.
 */
const EditorToolbar = ({ onSave, isSaving, hasUnsavedChanges }) => {
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

            {/* Save Button */}
            <Button
                label={isSaving ? 'Saving...' : 'Save Changes'}
                icon={isSaving ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-save"}
                className="p-button-sm p-button-success"
                onClick={onSave}
                disabled={isSaving || !hasUnsavedChanges}
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
