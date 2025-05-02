
import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

// --- Child Component: AiEditDialog ---
/**
 * Dialog for AI-assisted editing of a cover letter section.
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether the dialog is visible.
 * @param {Function} props.onHide - Callback function when the dialog is hidden.
 * @param {object | null} props.section - Information about the section being edited ({ type, index?, id }).
 * @param {string} props.prompt - Current AI prompt value.
 * @param {Function} props.setPrompt - Function to update the AI prompt state.
 * @param {Function} props.onSubmit - Callback function when the submit button is clicked.
 * @param {boolean} props.isProcessing - Indicates if the AI request is in progress.
 */
const AiEditDialog = ({
    visible,
    onHide,
    section,
    prompt,
    setPrompt,
    onSubmit,
    isProcessing
}) => {

    const getTitle = () => {
        if (!section) return 'AI Edit Section';
        const typeName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
        return `AI Edit ${typeName}${section.index !== undefined ? ` Paragraph ${section.index + 1}` : ''}`;
    };

    const footer = (
        <div className='pt-3'>
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={isProcessing} />
            <Button
                label={isProcessing ? 'Processing...' : 'Apply AI Edit'}
                icon={isProcessing ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-check"}
                onClick={onSubmit}
                disabled={isProcessing || !prompt.trim()}
                autoFocus
            />
        </div>
    );

    return (
        <Dialog
            header={getTitle()}
            visible={visible}
            style={{ width: '50vw', maxWidth: '700px' }}
            breakpoints={{ '960px': '70vw', '641px': '90vw' }}
            modal
            onHide={onHide}
            footer={footer}
        >
            <div className="field">
                <label htmlFor="aiPrompt">Editing Instructions</label>
                <InputTextarea
                    id="aiPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                    className="w-full mt-1"
                    placeholder={`e.g., "Make this paragraph more formal", "Shorten the closing", "Rewrite the subject line to be more impactful"`}
                    autoFocus
                    disabled={isProcessing}
                />
                <small className="p-text-secondary mt-1 block">
                    Describe how you want the AI to change this section.
                </small>
            </div>
        </Dialog>
    );
};

export default AiEditDialog;
