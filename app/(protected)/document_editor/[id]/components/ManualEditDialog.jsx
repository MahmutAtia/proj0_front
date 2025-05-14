import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import axios from 'axios';
import AIAssistant from '../../../main/editor/components/AIAssistant';

/**
 * Dialog for manually editing a cover letter section (header, paragraph, footer).
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether the dialog is visible.
 * @param {Function} props.onHide - Callback function when the dialog is hidden.
 * @param {object | null} props.section - Information about the section being edited ({ type, index?, id, documentType }).
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
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiFeedbackMessage, setAiFeedbackMessage] = useState({ text: null, severity: null });

    useEffect(() => {
        if (visible) {
            setAiPrompt('');
            setAiFeedbackMessage({ text: null, severity: null });
        }
    }, [visible, section]);

    const getTitle = () => {
        if (!section) return 'Edit Section';
        const typeName = section.type.charAt(0).toUpperCase() + section.type.slice(1);
        return `Edit ${typeName}${section.index !== undefined ? ` Paragraph ${section.index + 1}` : ''}`;
    };

    const renderField = (key, value) => {
        if (key === 'ai_feedback') return null;

        const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const isTextArea = typeof value === 'string' && (value.length > 60 || value.includes('\n') || key.includes('address') || key.includes('subject') || key.includes('contact'));
        const isArray = Array.isArray(value);

        return (
            <div key={key} className="field col-12 md:col-6 mb-3">
                <label htmlFor={key} className="block mb-1 font-medium">{label}</label>
                {isTextArea ? (
                    <InputTextarea
                        id={key}
                        value={value ?? ''}
                        onChange={(e) => onDataChange(key, e.target.value)}
                        rows={key === 'signature_contact' ? 3 : (key === 'subject' ? 2 : 4)}
                        autoResize
                        className="w-full mt-1"
                    />
                ) : isArray ? (
                    <InputTextarea
                        id={key}
                        value={value.join(', ')}
                        onChange={(e) => onDataChange(key, e.target.value)}
                        rows={2}
                        autoResize
                        className="w-full mt-1"
                        tooltip="Enter items separated by commas"
                        tooltipOptions={{ position: 'top' }}
                    />
                ) : (
                    <InputText
                        id={key}
                        value={value ?? ''}
                        onChange={(e) => onDataChange(key, e.target.value)}
                        className="w-full mt-1"
                    />
                )}
            </div>
        );
    };

    const handleAiRequest = async () => {
        if (!aiPrompt.trim() || !section) return;

        setIsAiProcessing(true);
        setAiFeedbackMessage({ text: null, severity: null });

        const currentSectionData = section.type === 'paragraph' ? { text: editText } : { ...editData };

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error("Backend URL is not configured.");
            }
            const payload = {
                prompt: aiPrompt,
                sectionData: currentSectionData,
                documentType: section.documentType
            };

            const response = await axios.post(`${backendUrl}/api/resumes/edit_document_blok/`, payload);
            const { feedback_message, ...updatedSectionData } = response.data;

            if (section.type === 'paragraph') {
                if (updatedSectionData.text !== undefined) {
                    setEditText(updatedSectionData.text);
                }
            } else {
                for (const key in updatedSectionData) {
                    if (Object.hasOwnProperty.call(updatedSectionData, key)) {
                        onDataChange(key, updatedSectionData[key]);
                    }
                }
            }
            setAiFeedbackMessage({ text: feedback_message || 'AI processing complete.', severity: 'success' });
            setAiPrompt('');
        } catch (error) {
            console.error("Error during AI edit:", error);
            const errorMsg = error.response?.data?.detail || error.message || "AI request failed.";
            setAiFeedbackMessage({ text: `AI Error: ${errorMsg}`, severity: 'error' });
        } finally {
            setIsAiProcessing(false);
        }
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
            style={{ width: '70vw', maxWidth: '900px' }}
            breakpoints={{ '960px': '80vw', '641px': '95vw' }}
            modal
            onHide={onHide}
            footer={footer}
        >
            {section?.type === 'paragraph' && (
                <div className="field mb-3">
                    <label htmlFor="paragraphEdit" className="block mb-1 font-medium">Paragraph Text</label>
                    <InputTextarea
                        id="paragraphEdit"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={10}
                        className="w-full mt-1"
                        autoFocus
                    />
                </div>
            )}
            {(section?.type === 'header' || section?.type === 'footer') && (
                <div className="formgrid grid p-fluid mb-3">
                    {Object.entries(editData).map(([key, value]) => renderField(key, value))}
                </div>
            )}

            <div className="mt-4 p-3 border-top-1 surface-border">
                <h5 className="mb-2">AI Assistant</h5>
                <AIAssistant
                    prompt={aiPrompt}
                    setPrompt={setAiPrompt}
                    onSubmit={handleAiRequest}
                    isProcessing={isAiProcessing}
                />
                {aiFeedbackMessage.text && (
                    <div className="mt-2">
                        <Message severity={aiFeedbackMessage.severity} text={aiFeedbackMessage.text} style={{ wordBreak: 'break-word' }}/>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ManualEditDialog;
