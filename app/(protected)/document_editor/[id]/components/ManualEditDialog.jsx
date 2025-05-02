import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';

// --- Child Component: ManualEditDialog ---
/**
 * Dialog for manually editing a cover letter section (header, paragraph, footer).
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether the dialog is visible.
 * @param {Function} props.onHide - Callback function when the dialog is hidden.
 * @param {object | null} props.section - Information about the section being edited ({ type, index?, id }).
 * @param {string} props.editText - Current text value for paragraph editing.
 * @param {Function} props.setEditText - Function to update editText state.
 * @param {object} props.editData - Current data object for header/footer editing.
 * @param {Function} props.onDataChange - Function to handle changes in header/footer fields (receives key, value).
 * @param {Function} props.onSave - Callback function when the save button is clicked.
 */
const ManualEditDialog = ({
    visible,
    onHide,
    section,
    editText,
    setEditText,
    editData,
    onDataChange,
    onSave
}) => {

    const getTitle = () => {
        if (!section) return 'Edit Section';
        const typeName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
        return `Edit ${typeName}${section.index !== undefined ? ` Paragraph ${section.index + 1}` : ''}`;
    };

    const renderField = (key, value) => {
        // Skip internal fields if they exist (like ai_feedback)
        if (key === 'ai_feedback') return null;

        const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        // Determine if field should be textarea (simple heuristic)
        const isTextArea = typeof value === 'string' && (value.length > 60 || value.includes('\n') || key.includes('address') || key.includes('subject') || key.includes('contact'));
        const isArray = Array.isArray(value);

        return (
            <div key={key} className="field col-12 md:col-6 mb-3">
                <label htmlFor={key} className="block mb-1 font-medium">{label}</label>
                {isTextArea ? (
                    <InputTextarea
                        id={key}
                        value={value ?? ''} // Handle null/undefined
                        onChange={(e) => onDataChange(key, e.target.value)}
                        rows={key === 'signature_contact' ? 3 : (key === 'subject' ? 2 : 4)} // Adjust rows
                        autoResize
                        className="w-full mt-1"
                    />
                ) : isArray ? (
                    // Simple comma-separated input for arrays (e.g., attachments)
                    <InputTextarea
                        id={key}
                        value={value.join(', ')} // Join array for display
                        onChange={(e) => onDataChange(key, e.target.value)} // Value will be processed on save
                        rows={2}
                        autoResize
                        className="w-full mt-1"
                        tooltip="Enter items separated by commas"
                        tooltipOptions={{ position: 'top' }}
                    />
                ) : (
                    <InputText
                        id={key}
                        value={value ?? ''} // Handle null/undefined
                        onChange={(e) => onDataChange(key, e.target.value)}
                        className="w-full mt-1"
                    />
                )}
            </div>
        );
    };

    const footer = (
        <div className='pt-3'>
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Save Changes" icon="pi pi-check" onClick={onSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header={getTitle()}
            visible={visible}
            style={{ width: '60vw', maxWidth: '800px' }}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            modal
            onHide={onHide}
            footer={footer}
        >
            {section?.type === 'paragraph' && (
                <div className="field">
                    <label htmlFor="paragraphEdit">Paragraph Text</label>
                    <InputTextarea
                        id="paragraphEdit"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={15}
                        className="w-full mt-1"
                        autoFocus
                    />
                </div>
            )}
            {(section?.type === 'header' || section?.type === 'footer') && (
                <div className="formgrid grid p-fluid">
                    {/* Render inputs based on the keys in editData */}
                    {Object.entries(editData).map(([key, value]) => renderField(key, value))}
                </div>
            )}
        </Dialog>
    );
};


export default ManualEditDialog;
