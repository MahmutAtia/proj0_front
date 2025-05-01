"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // Assuming axios is installed
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

// --- Child Component: LoadingIndicator ---
const LoadingIndicator = ({ message = "Loading document editor..." }) => {
    return (
        <div className="flex justify-content-center align-items-center min-h-screen">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="ml-3 text-lg">{message}</p>
        </div>
    );
};

// --- Child Component: ErrorDisplay ---
const ErrorDisplay = ({ error, onRetry }) => {
    return (
        <div className="flex justify-content-center align-items-center min-h-screen text-red-500 p-4 text-center">
            <div>
                <i className="pi pi-times-circle mr-2" style={{ fontSize: '2rem' }}></i>
                <p className="text-lg mb-2">{error || "An unexpected error occurred."}</p>
                {onRetry && (
                    <Button
                        label="Try Again"
                        icon="pi pi-refresh"
                        onClick={onRetry}
                        className="p-button-sm mt-2 p-button-danger p-button-outlined"
                    />
                )}
            </div>
        </div>
    );
};


// --- Child Component: EditableSection ---
/**
 * A component that wraps a section of the document, providing editing controls.
 * @param {object} props - Component props.
 * @param {string} props.sectionId - Unique identifier for the section (e.g., 'header', 'paragraph-0').
 * @param {Function} props.onEdit - Callback function when the manual edit button is clicked.
 * @param {Function} props.onAiEdit - Callback function when the AI edit button is clicked.
 * @param {Function} props.onUndo - Callback function when the undo button is clicked.
 * @param {Function} props.onRedo - Callback function when the redo button is clicked.
 * @param {boolean} props.canUndo - Whether the undo action is currently possible for this section.
 * @param {boolean} props.canRedo - Whether the redo action is currently possible for this section.
 * @param {React.ReactNode} props.children - The content to be rendered within the editable section (usually an iframe).
 */
const EditableSection = ({
    sectionId,
    onEdit,
    onAiEdit,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    children
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="editable-section relative mb-2" // Add margin-bottom for spacing
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ outline: isHovered ? '2px dashed var(--primary-color)' : 'none', transition: 'outline-color 0.2s' }}
        >
            {/* Render the actual content (iframe) */}
            {children}

            {/* Overlay controls shown on hover */}
            {isHovered && (
                <div
                    className="edit-overlay absolute top-0 right-0 p-1 flex flex-column align-items-end gap-1 bg-black-alpha-10 border-round-sm" // Subtle background
                    style={{ zIndex: 10 }} // Ensure controls are above iframe
                >
                    <div className="flex gap-1">
                         {/* AI Edit Button */}
                         <Button
                            icon="pi pi-sparkles"
                            className="p-button-rounded p-button-info p-button-sm"
                            onClick={onAiEdit}
                            tooltip={`AI Edit ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Manual Edit Button */}
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onEdit}
                            tooltip={`Edit ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Undo Button */}
                        <Button
                            icon="pi pi-undo"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onUndo}
                            disabled={!canUndo}
                            tooltip={`Undo ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Redo Button */}
                        <Button
                            icon="pi pi-redo"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onRedo}
                            disabled={!canRedo}
                            tooltip={`Redo ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

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


// --- Initial State and Constants ---
const initialCoverLetterState = {
    cover_letter: {
        header: null,
        body_paragraphs: [],
        footer: null
    }
};

const coverLetterCSS = `
:root {
    --font-family-body: 'Lato', sans-serif;
    --font-family-heading: 'Merriweather', serif;
    --primary-color: #333;
    --secondary-color: #555;
    --accent-color: #0056b3; /* Example accent */
    --link-color: #0056b3;
    --bg-color: #ffffff;
    --font-size-base: 10.5pt;
    --line-height-base: 1.5;
}
body {
    font-family: var(--font-family-body);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    color: var(--primary-color);
    background-color: var(--bg-color);
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden; /* Prevent scrollbars within iframe */
}
p { margin: 0 0 0.8em 0; }
a { color: var(--link-color); text-decoration: none; }
a:hover { text-decoration: underline; }

.header-section { margin-bottom: 15px; position: relative; }
.sender-info { text-align: left; margin-bottom: 8px; font-size: 9.5pt; color: var(--secondary-color); line-height: 1.3; }
.sender-info p { margin: 0; }
.sender-info .sender-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 13pt; color: var(--accent-color); margin-bottom: 4px; }
.date { text-align: right; font-size: 10pt; color: var(--secondary-color); margin-top: -15px; margin-bottom: 15px; }
.recipient-info { text-align: left; margin-bottom: 15px; font-size: 10.5pt; line-height: 1.4; }
.recipient-info p { margin: 1px 0; }
.recipient-info .recipient-name, .recipient-info .recipient-title { font-weight: 700; color: var(--primary-color); }
.subject { font-family: var(--font-family-heading); font-weight: 700; margin-top: 20px; margin-bottom: 15px; font-size: 11.5pt; color: var(--accent-color); }
.subject p { margin: 0; }
.salutation { font-weight: 700; margin-bottom: 15px; font-size: 10.5pt; }
.salutation p { margin: 0; }
.body p { margin-bottom: 1em; text-align: justify; }
.footer-section { margin-top: 20px; }
.closing { margin-top: 15px; margin-bottom: 8px; font-size: 10.5pt; }
.closing p { margin: 0; }
.signature { margin-top: 8px; margin-bottom: 15px; line-height: 1.4; }
.signature .signature-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 11pt; color: var(--primary-color); }
.signature .signature-contact { font-size: 9.5pt; color: var(--secondary-color); white-space: pre-line; margin-top: 4px; }
.attachments { margin-top: 15px; font-size: 9pt; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
.attachments p { margin: 0 0 5px 0; font-weight: 700; color: var(--secondary-color); }
.attachments ul { list-style: none; padding: 0; margin: 0; }
.attachments li { margin-bottom: 3px; }
`;

// --- Helper Functions ---

/**
 * Generates the HTML source document for an iframe, including content, CSS, and height adjustment script.
 * @param {string} htmlContent - The HTML content for the section.
 * @param {string} css - The CSS styles to apply.
 * @param {string} sectionId - The unique ID of the section for communication.
 * @returns {string} The full HTML document string for the iframe's srcDoc.
 */
const generateSrcDoc = (htmlContent, css, sectionId) => {
    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };
    const escapedCss = css.replace(/<\/style>/gi, '<\\/style>');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
            <style>
                ${escapedCss}
                html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; background-color: white; }
            </style>
        </head>
        <body class="theme-classic"> {# TODO: Make theme dynamic #}
            ${htmlContent}
             <script>
                // --- Iframe Height Adjustment Script ---
                function adjustHeight() {
                    let timeoutId;
                    function debounceAdjust() {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            const body = document.body;
                            const html = document.documentElement;
                            // Use scrollHeight for potentially taller content than viewport
                            const height = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight);
                            const adjustedHeight = height + 2; // Small buffer
                            if (window.parent) {
                                window.parent.postMessage({ type: 'resize-iframe', height: adjustedHeight, sectionId: '${escapeHtml(sectionId)}' }, '*');
                            }
                        }, 50); // Debounce delay
                    }
                    debounceAdjust(); // Initial call
                    // Use ResizeObserver for more reliable element resize detection
                    if (typeof ResizeObserver !== 'undefined') {
                        const resizeObserver = new ResizeObserver(debounceAdjust);
                        resizeObserver.observe(document.body);
                    } else {
                        // Fallback for older browsers
                        window.addEventListener('resize', debounceAdjust);
                        const observer = new MutationObserver(debounceAdjust);
                        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
                    }
                 }
                 // Ensure adjustment happens after all content (including fonts) is likely loaded
                 if (document.readyState === 'complete') {
                     setTimeout(adjustHeight, 100); // Add slight delay for rendering
                 } else {
                     window.addEventListener('load', () => setTimeout(adjustHeight, 100));
                 }
            </script>
        </body>
        </html>
    `;
};

/**
 * Renders HTML for the header section, handling potentially missing data.
 * @param {object | null} headerData - The header data object.
 * @returns {string} HTML string for the header.
 */
const renderHeaderHtml = (headerData) => {
    if (!headerData) return '<div class="header-section"><p><i>Header data missing</i></p></div>';
    const escape = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
    return `
        <div class="header-section">
            <div class="sender-info">
                ${headerData.sender_name ? `<p class="sender-name">${escape(headerData.sender_name)}</p>` : ''}
                ${headerData.sender_address ? `<p>${escape(headerData.sender_address)}</p>` : ''}
                ${headerData.sender_city_postal ? `<p>${escape(headerData.sender_city_postal)}</p>` : ''}
                ${headerData.sender_phone ? `<p>${escape(headerData.sender_phone)}</p>` : ''}
                ${headerData.sender_email ? `<p><a href="mailto:${escape(headerData.sender_email)}">${escape(headerData.sender_email)}</a></p>` : ''}
                ${headerData.sender_linkedin ? `<p><a href="${escape(headerData.sender_linkedin)}" target="_blank">${escape(headerData.sender_linkedin)}</a></p>` : ''}
            </div>
            ${headerData.date ? `<div class="date"><p>${escape(headerData.date)}</p></div>` : ''}
            <div class="recipient-info">
                 ${headerData.recipient_name ? `<p class="recipient-name">${escape(headerData.recipient_name)}</p>` : ''}
                 ${headerData.recipient_title ? `<p class="recipient-title">${escape(headerData.recipient_title)}</p>` : ''}
                 ${headerData.recipient_company ? `<p>${escape(headerData.recipient_company)}</p>` : ''}
                 ${headerData.recipient_address ? `<p>${escape(headerData.recipient_address)}</p>` : ''}
                 ${headerData.recipient_city_postal ? `<p>${escape(headerData.recipient_city_postal)}</p>` : ''}
            </div>
             ${headerData.subject ? `<div class="subject"><p>${escape(headerData.subject)}</p></div>` : ''}
             ${headerData.salutation ? `<div class="salutation"><p>${escape(headerData.salutation)}</p></div>` : ''}
        </div>
    `;
};

/**
 * Renders HTML for a single paragraph, handling potentially missing data.
 * @param {string | null | undefined} paragraphText - The text content of the paragraph.
 * @returns {string} HTML string for the paragraph.
 */
const renderParagraphHtml = (paragraphText) => {
    if (paragraphText === null || paragraphText === undefined) return '<div class="body"><p><i>Paragraph data missing</i></p></div>';
    const escape = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
    // Replace newlines with <br> for display within a single <p> tag
    const formattedText = escape(String(paragraphText).trim()).replace(/\n/g, '<br>');
    return `<div class="body"><p>${formattedText || '<i>Empty paragraph</i>'}</p></div>`;
};

/**
 * Renders HTML for the footer section, handling potentially missing data.
 * @param {object | null} footerData - The footer data object.
 * @returns {string} HTML string for the footer.
 */
const renderFooterHtml = (footerData) => {
    if (!footerData) return '<div class="footer-section"><p><i>Footer data missing</i></p></div>';
    const escape = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
    let attachmentsHtml = '';
    if (footerData.attachments_mentioned && Array.isArray(footerData.attachments_mentioned) && footerData.attachments_mentioned.length > 0) {
        attachmentsHtml = `
            <div class="attachments">
                <p>Attachment${footerData.attachments_mentioned.length > 1 ? 's' : ''}</p>
                <ul>
                    ${footerData.attachments_mentioned.map(att => `<li>${escape(att)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    // Replace newlines in signature contact with <br>
    const signatureContactHtml = footerData.signature_contact ? escape(String(footerData.signature_contact).trim()).replace(/\n/g, '<br>') : '';
    return `
        <div class="footer-section">
            <div class="closing">
                <p>${escape(footerData.closing || 'Sincerely,')}</p>
            </div>
            <div class="signature">
                ${footerData.signature_name ? `<p class="signature-name">${escape(footerData.signature_name)}</p>` : ''}
                ${signatureContactHtml ? `<p class="signature-contact">${signatureContactHtml}</p>` : ''}
            </div>
            ${attachmentsHtml}
        </div>
    `;
};


// --- Main Editor Page Component ---

const CoverLetterEditorPage = ({ params }) => {
    const documentId = params.id;
    const toast = useRef(null);

    // --- Core State ---
    const [coverLetterData, setCoverLetterData] = useState(initialCoverLetterState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Editing & Saving State ---
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialDataRef = useRef(null); // Stores stringified data on load/save

    // --- History State (Undo/Redo) ---
    const [sectionHistory, setSectionHistory] = useState({}); // { sectionId: [state1, state2, ...] }
    const [historyIndex, setHistoryIndex] = useState({});   // { sectionId: currentIndex }

    // --- Iframe Height State ---
    const [iframeHeights, setIframeHeights] = useState({}); // { sectionId: height }

    // --- Manual Edit Dialog State ---
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentEditingSection, setCurrentEditingSection] = useState(null); // { type, index?, id }
    const [editText, setEditText] = useState(''); // For paragraphs
    const [editData, setEditData] = useState({}); // For header/footer

    // --- AI Edit Dialog State ---
    const [isAiEditDialogOpen, setIsAiEditDialogOpen] = useState(false);
    const [currentEditingSectionForAI, setCurrentEditingSectionForAI] = useState(null); // { type, index?, id }
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // --- Helper Functions ---

    /** Generates a unique ID for a section based on type and optional index. */
    const getSectionId = useCallback((type, index = null) => {
        return index !== null ? `${type}-${index}` : type;
    }, []);

    /** Retrieves the current data for a given section from the main state. */
    const getSectionData = useCallback((sectionInfo) => {
        if (!sectionInfo || !coverLetterData.cover_letter) return null;
        const { type, index } = sectionInfo;
        switch (type) {
            case 'header': return coverLetterData.cover_letter.header;
            case 'paragraph': return coverLetterData.cover_letter.body_paragraphs?.[index];
            case 'footer': return coverLetterData.cover_letter.footer;
            default: return null;
        }
    }, [coverLetterData]);

    /** Parses a section ID string back into type and index. */
    const parseSectionId = (sectionId) => {
        if (!sectionId) return null;
        return sectionId.includes('-')
            ? { type: sectionId.split('-')[0], index: parseInt(sectionId.split('-')[1], 10) }
            : { type: sectionId };
    };

    // --- History Management Callbacks ---

    /** Initializes the history state based on the loaded document data. */
    const initializeHistory = useCallback((data) => {
        if (!data || !data.cover_letter) return;
        const initialHistory = {};
        const initialIndices = {};
        const { header, body_paragraphs, footer } = data.cover_letter;

        const addStateToHistory = (id, state) => {
            // Use deep copy for objects, direct value for primitives (like paragraph strings)
            const stateToAdd = (typeof state === 'object' && state !== null) ? JSON.parse(JSON.stringify(state)) : state;
            initialHistory[id] = [stateToAdd];
            initialIndices[id] = 0;
        };

        if (header !== null && header !== undefined) addStateToHistory(getSectionId('header'), header);
        if (body_paragraphs && Array.isArray(body_paragraphs)) {
            body_paragraphs.forEach((p, i) => addStateToHistory(getSectionId('paragraph', i), p));
        }
        if (footer !== null && footer !== undefined) addStateToHistory(getSectionId('footer'), footer);

        setSectionHistory(initialHistory);
        setHistoryIndex(initialIndices);
        console.log("History Initialized:", initialHistory, initialIndices);
    }, [getSectionId]);

    /** Updates the history for a specific section after an edit. */
    const updateHistory = useCallback((sectionId, newState) => {
        // Use deep copy for objects, direct value for primitives
        const stateToAdd = (typeof newState === 'object' && newState !== null) ? JSON.parse(JSON.stringify(newState)) : newState;

        setSectionHistory(prev => {
            const currentHistory = prev[sectionId] || [];
            const currentIndex = historyIndex[sectionId] ?? -1;
            // Discard redo states by slicing up to current index + 1
            const relevantHistory = currentHistory.slice(0, currentIndex + 1);
            return { ...prev, [sectionId]: [...relevantHistory, stateToAdd] };
        });
        // Update the index to point to the newly added state
        setHistoryIndex(prev => ({ ...prev, [sectionId]: (prev[sectionId] ?? -1) + 1 }));
        setHasUnsavedChanges(true); // Mark changes as unsaved
    }, [historyIndex]); // Depends on historyIndex to correctly slice

    // --- Data Fetching and Initialization ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHasUnsavedChanges(false);
        try {
            console.log(`Simulating fetch for document: ${documentId}`);
            await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

            // --- Simulated API Response ---
            const fetchedData = {
              "cover_letter": {
                "header": {
                  "sender_name": "John Doe",
                  "sender_address": "123 Main Street",
                  "sender_city_postal": "Anytown, CA 90210",
                  "sender_phone": "555-123-4567",
                  "sender_email": "john.doe@email.com",
                  "sender_linkedin": "https://linkedin.com/in/johndoe",
                  "date": "2025-05-01",
                  "recipient_name": "Jane Smith",
                  "recipient_title": "Hiring Manager",
                  "recipient_company": "Tech Solutions Inc.",
                  "recipient_address": "456 Corporate Blvd",
                  "recipient_city_postal": "Metropolis, NY 10001",
                  "subject": "Application for Software Engineer - John Doe",
                  "salutation": "Dear Ms. Smith,"
                },
                "body_paragraphs": [
                    // Start with empty paragraphs as per example
                    "This is the first paragraph. It demonstrates how text flows and justifies within the container. We need enough text to see how line breaks and spacing work.",
                    "Here is a second paragraph, providing further details or context. It might discuss specific qualifications or experiences relevant to the application.",
                    "A third paragraph can be used to conclude the main points or express enthusiasm for the role. Ensuring proper spacing between paragraphs is important for readability."
                ],
                "footer": {
                  "closing": "Sincerely,",
                  "signature_name": "John Doe",
                  "signature_contact": "555-123-4567\njohn.doe@email.com", // Example with newline
                  "attachments_mentioned": [
                    "Resume/CV",
                    "Portfolio Link"
                  ]
                }
                // footer: null, // To test missing footer
              }
            };
            // --- End Simulation ---

            // Validate and provide defaults for missing top-level sections
            const validatedData = {
                cover_letter: {
                    header: fetchedData.cover_letter?.header ?? null,
                    body_paragraphs: fetchedData.cover_letter?.body_paragraphs ?? [],
                    footer: fetchedData.cover_letter?.footer ?? null,
                }
            };

            setCoverLetterData(validatedData);
            initialDataRef.current = JSON.stringify(validatedData); // Store initial state
            initializeHistory(validatedData); // Initialize history

        } catch (err) {
            console.error("Error fetching document:", err);
            setError(`Failed to load document data. ${err.message || ''}`);
            toast.current?.show({ severity: 'error', summary: 'Load Error', detail: 'Failed to load document.', life: 5000 });
        } finally {
            setLoading(false);
        }
    }, [documentId, initializeHistory]); // Add initializeHistory dependency

    useEffect(() => {
        fetchData(); // Fetch data on component mount or when documentId changes
    }, [fetchData]); // Use fetchData callback

    // --- Iframe Height Handling ---
    useEffect(() => {
        const handleMessage = (event) => {
            // Add origin check for security in a real application
            // if (event.origin !== 'expected_origin') return;
            if (event.data?.type === 'resize-iframe' && event.data.sectionId) {
                setIframeHeights(prev => {
                    // Only update if height is different to avoid unnecessary re-renders
                    if (prev[event.data.sectionId] !== event.data.height) {
                        return { ...prev, [event.data.sectionId]: event.data.height };
                    }
                    return prev;
                });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []); // Run once on mount

    // --- Core Action Handlers (Undo, Redo, Save) ---

    /** Applies the state change for undo/redo to the main coverLetterData. */
    const applyStateChange = (sectionId, newState) => {
        setCoverLetterData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy
            const sectionInfo = parseSectionId(sectionId);
            if (!sectionInfo) return prevData; // Should not happen

            if (sectionInfo.type === 'paragraph') {
                // Ensure array exists if needed (though unlikely during undo/redo)
                if (!newData.cover_letter.body_paragraphs) newData.cover_letter.body_paragraphs = [];
                newData.cover_letter.body_paragraphs[sectionInfo.index] = newState;
            } else if (sectionInfo.type === 'header') {
                newData.cover_letter.header = newState;
            } else if (sectionInfo.type === 'footer') {
                newData.cover_letter.footer = newState;
            }
            return newData;
        });
        setHasUnsavedChanges(true); // Undo/Redo counts as an unsaved change
    };

    const handleUndo = (sectionId) => {
        const history = sectionHistory[sectionId] || [];
        const currentIndex = historyIndex[sectionId];
        if (currentIndex > 0) {
            const previousIndex = currentIndex - 1;
            const previousState = history[previousIndex];
            applyStateChange(sectionId, previousState); // Update main data
            setHistoryIndex(prev => ({ ...prev, [sectionId]: previousIndex })); // Update index
            toast.current?.show({ severity: 'info', summary: 'Undo', detail: `Reverted ${sectionId}`, life: 1500 });
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Undo', detail: `No previous state for ${sectionId}`, life: 1500 });
        }
    };

    const handleRedo = (sectionId) => {
        const history = sectionHistory[sectionId] || [];
        const currentIndex = historyIndex[sectionId];
        if (currentIndex < history.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextState = history[nextIndex];
            applyStateChange(sectionId, nextState); // Update main data
            setHistoryIndex(prev => ({ ...prev, [sectionId]: nextIndex })); // Update index
            toast.current?.show({ severity: 'info', summary: 'Redo', detail: `Restored ${sectionId}`, life: 1500 });
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Redo', detail: `No future state for ${sectionId}`, life: 1500 });
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            console.log("Simulating save for document:", documentId);
            console.log("Data to save:", coverLetterData);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay

            // --- In a real app, replace simulation with API call: ---
            // await axios.put(`/api/documents/${documentId}`, coverLetterData);

            initialDataRef.current = JSON.stringify(coverLetterData); // Update reference state
            setHasUnsavedChanges(false); // Mark as saved
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Document saved successfully!', life: 3000 });
        } catch (err) {
            console.error("Error saving document:", err);
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: `Failed to save document. ${err.message || ''}`, life: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Manual Edit Dialog Handlers ---

    const openEditDialog = (sectionInfo) => {
        const currentData = getSectionData(sectionInfo);
        const sectionId = getSectionId(sectionInfo.type, sectionInfo.index);
        setCurrentEditingSection({ ...sectionInfo, id: sectionId });

        if (sectionInfo.type === 'paragraph') {
            setEditText(currentData ?? ''); // Use empty string if null/undefined
            setEditData({});
        } else {
            // Header/Footer: Use current data or empty object if null
            setEditData(currentData ? { ...currentData } : {});
            setEditText('');
        }
        setIsEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setIsEditDialogOpen(false);
        setCurrentEditingSection(null);
        setEditText('');
        setEditData({});
    };

    const handleDialogInputChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleEditSave = () => {
        if (!currentEditingSection) return;
        const { type, index, id: sectionId } = currentEditingSection;
        let newState;

        try {
            if (type === 'paragraph') {
                newState = editText; // Already a string
            } else if (type === 'header') {
                newState = { ...editData }; // Simple object copy
            } else if (type === 'footer') {
                // Process attachments string back to array
                const processedData = { ...editData };
                if (processedData.attachments_mentioned && typeof processedData.attachments_mentioned === 'string') {
                    // Split by comma, trim whitespace, remove empty strings
                    processedData.attachments_mentioned = processedData.attachments_mentioned
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                } else if (!Array.isArray(processedData.attachments_mentioned)) {
                    // Ensure it's an array if it wasn't a string or already an array
                    processedData.attachments_mentioned = [];
                }
                newState = processedData;
            } else {
                throw new Error("Unknown section type");
            }

            // Update main state directly (will trigger re-render)
            applyStateChange(sectionId, newState);
            // Update history
            updateHistory(sectionId, newState);

            closeEditDialog();
            toast.current?.show({ severity: 'success', summary: 'Updated', detail: `Section updated successfully!`, life: 3000 });
        } catch (error) {
            console.error("Error saving edit:", error);
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: `Failed to update section: ${error.message}`, life: 4000 });
        }
    };

    // --- AI Edit Dialog Handlers ---

    const openAiEditDialog = (sectionInfo) => {
        const sectionId = getSectionId(sectionInfo.type, sectionInfo.index);
        setCurrentEditingSectionForAI({ ...sectionInfo, id: sectionId });
        setAiPrompt(''); // Reset prompt
        setIsAiEditDialogOpen(true);
    };

    const closeAiEditDialog = () => {
        setIsAiEditDialogOpen(false);
        setCurrentEditingSectionForAI(null);
        setAiPrompt('');
    };

    const handleAiEditSubmit = async () => {
        if (!currentEditingSectionForAI || !aiPrompt.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter a prompt.', life: 3000 });
            return;
        }

        setIsAiProcessing(true);
        const { type, index, id: sectionId } = currentEditingSectionForAI;
        const currentData = getSectionData(currentEditingSectionForAI);

        try {
            // --- Simulate AI API Call ---
            console.log(`Simulating AI edit for section: ${sectionId}`);
            console.log("Prompt:", aiPrompt);
            console.log("Current Data:", currentData);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

            let aiResult;
            if (type === 'paragraph') {
                aiResult = `AI modified paragraph based on prompt: "${aiPrompt}". Original was: "${currentData || ''}"`;
            } else if (type === 'header') {
                // Simulate a more realistic change
                aiResult = {
                    ...(currentData || {}),
                    subject: `Re: ${currentData?.subject || 'Application'} (AI Enhanced: ${aiPrompt.substring(0, 20)}...)`,
                    salutation: `Dear ${currentData?.recipient_name || 'Hiring Manager'} (AI suggestion),`
                };
            } else if (type === 'footer') {
                 aiResult = {
                    ...(currentData || {}),
                    closing: `Best regards (AI: ${aiPrompt.substring(0, 15)}...)`,
                    signature_name: `${currentData?.signature_name || 'AI'} (AI Edited)`
                 };
            } else {
                throw new Error("Unknown section type for AI edit");
            }
            console.log("Simulated AI Result:", aiResult);
            // --- End Simulation ---

            // --- In a real app, replace simulation with API call: ---
            // const response = await axios.post('/api/ai-edit', { documentId, sectionId, currentData, prompt });
            // const aiResult = response.data.updatedData;

            // Update main state
            applyStateChange(sectionId, aiResult);
            // Update history
            updateHistory(sectionId, aiResult);

            closeAiEditDialog();
            toast.current?.show({ severity: 'success', summary: 'AI Update', detail: `Section updated by AI!`, life: 3000 });

        } catch (err) {
            console.error("Error during AI edit:", err);
            toast.current?.show({ severity: 'error', summary: 'AI Error', detail: `Failed to update section with AI: ${err.message}`, life: 5000 });
        } finally {
            setIsAiProcessing(false);
        }
    };

    // --- Rendering Logic ---

    if (loading) {
        return <LoadingIndicator />;
    }
    if (error) {
        return <ErrorDisplay error={error} onRetry={fetchData} />;
    }

    // Safely access data after loading/error checks
    const { header = null, body_paragraphs = [], footer = null } = coverLetterData.cover_letter || {};

    return (
        <div className="document-editor flex flex-column h-screen">
            <Toast ref={toast} />

            {/* Toolbar */}
            <EditorToolbar
                onSave={handleSaveChanges}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
            />

            {/* Scrollable A4 Page Container */}
            <div className="flex-grow-1 overflow-auto p-4 surface-100 flex justify-content-center">
                {/* A4 Page Element */}
                <div
                    className="a4-page bg-white shadow-3 border-1 border-300"
                    style={{ width: '210mm', minHeight: '297mm', padding: '1.5cm', boxSizing: 'border-box' }}
                >
                    {/* Header Section */}
                    <EditableSection
                        sectionId={getSectionId('header')}
                        onEdit={() => openEditDialog({ type: 'header' })}
                        onAiEdit={() => openAiEditDialog({ type: 'header' })}
                        onUndo={() => handleUndo(getSectionId('header'))}
                        onRedo={() => handleRedo(getSectionId('header'))}
                        canUndo={(historyIndex[getSectionId('header')] ?? 0) > 0}
                        canRedo={(sectionHistory[getSectionId('header')]?.length ?? 0) > (historyIndex[getSectionId('header')] ?? 0) + 1}
                    >
                        <iframe
                            key={`${getSectionId('header')}-${JSON.stringify(header)}`} // Key changes on data update to force iframe reload
                            title="Cover Letter Header"
                            srcDoc={generateSrcDoc(renderHeaderHtml(header), coverLetterCSS, getSectionId('header'))}
                            style={{ width: '100%', border: 'none', height: `${iframeHeights[getSectionId('header')] || 150}px`, overflow: 'hidden', display: 'block', transition: 'height 0.2s ease-out' }}
                            scrolling="no"
                            sandbox="allow-scripts allow-same-origin" // allow-scripts needed for height adjustment
                        />
                    </EditableSection>

                    {/* Body Paragraphs */}
                    {body_paragraphs.map((paragraph, index) => {
                        const paragraphId = getSectionId('paragraph', index);
                        return (
                            <EditableSection
                                key={paragraphId} // Unique key for each paragraph section
                                sectionId={paragraphId}
                                onEdit={() => openEditDialog({ type: 'paragraph', index })}
                                onAiEdit={() => openAiEditDialog({ type: 'paragraph', index })}
                                onUndo={() => handleUndo(paragraphId)}
                                onRedo={() => handleRedo(paragraphId)}
                                canUndo={(historyIndex[paragraphId] ?? 0) > 0}
                                canRedo={(sectionHistory[paragraphId]?.length ?? 0) > (historyIndex[paragraphId] ?? 0) + 1}
                            >
                                <iframe
                                    key={`${paragraphId}-${paragraph}`} // Key changes on data update
                                    title={`Paragraph ${index + 1}`}
                                    srcDoc={generateSrcDoc(renderParagraphHtml(paragraph), coverLetterCSS, paragraphId)}
                                    style={{ width: '100%', border: 'none', height: `${iframeHeights[paragraphId] || 60}px`, overflow: 'hidden', display: 'block', transition: 'height 0.2s ease-out' }}
                                    scrolling="no"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            </EditableSection>
                        );
                    })}
                    {/* Optional: Add button to add new paragraph */}
                    {/* <Button label="Add Paragraph" icon="pi pi-plus" className="p-button-text p-button-sm mt-2" onClick={handleAddParagraph} /> */}


                    {/* Footer Section */}
                    <EditableSection
                        sectionId={getSectionId('footer')}
                        onEdit={() => openEditDialog({ type: 'footer' })}
                        onAiEdit={() => openAiEditDialog({ type: 'footer' })}
                        onUndo={() => handleUndo(getSectionId('footer'))}
                        onRedo={() => handleRedo(getSectionId('footer'))}
                        canUndo={(historyIndex[getSectionId('footer')] ?? 0) > 0}
                        canRedo={(sectionHistory[getSectionId('footer')]?.length ?? 0) > (historyIndex[getSectionId('footer')] ?? 0) + 1}
                    >
                        <iframe
                            key={`${getSectionId('footer')}-${JSON.stringify(footer)}`} // Key changes on data update
                            title="Cover Letter Footer"
                            srcDoc={generateSrcDoc(renderFooterHtml(footer), coverLetterCSS, getSectionId('footer'))}
                            style={{ width: '100%', border: 'none', height: `${iframeHeights[getSectionId('footer')] || 100}px`, overflow: 'hidden', display: 'block', transition: 'height 0.2s ease-out' }}
                            scrolling="no"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </EditableSection>
                </div>
            </div>

            {/* Manual Edit Dialog */}
            <ManualEditDialog
                visible={isEditDialogOpen}
                onHide={closeEditDialog}
                section={currentEditingSection}
                editText={editText}
                setEditText={setEditText}
                editData={editData}
                onDataChange={handleDialogInputChange}
                onSave={handleEditSave}
            />

            {/* AI Edit Dialog */}
            <AiEditDialog
                visible={isAiEditDialogOpen}
                onHide={closeAiEditDialog}
                section={currentEditingSectionForAI}
                prompt={aiPrompt}
                setPrompt={setAiPrompt}
                onSubmit={handleAiEditSubmit}
                isProcessing={isAiProcessing}
            />
        </div>
    );
};

export default CoverLetterEditorPage;
