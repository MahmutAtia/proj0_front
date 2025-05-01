"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
// Add other necessary imports like Calendar if needed for date fields

// Placeholder for the initial state based on the provided JSON structure
const initialCoverLetterState = {
    cover_letter: {
        header: {
            sender_name: "John Doe",
            sender_address: "123 Main Street",
            sender_city_postal: "Anytown, CA 90210",
            sender_phone: "555-123-4567",
            sender_email: "john.doe@email.com",
            sender_linkedin: "https://linkedin.com/in/johndoe",
            date: "2025-05-01", // Consider using Date object if using Calendar component
            recipient_name: "Jane Smith",
            recipient_title: "Hiring Manager",
            recipient_company: "Tech Solutions Inc.",
            recipient_address: "456 Corporate Blvd",
            recipient_city_postal: "Metropolis, NY 10001",
            subject: "Application for Software Engineer - John Doe",
            salutation: "Dear Ms. Smith,"
        },
        body_paragraphs: [
            "I am writing to express my enthusiastic interest in the Software Engineer position at Tech Solutions Inc., as advertised on [Platform where you saw the ad]. With my background in [Relevant Skill 1] and [Relevant Skill 2], and my proven track record of developing innovative solutions, I am confident I possess the skills and experience necessary to make a significant contribution to your team.",
            "In my previous role at [Previous Company], I was responsible for [Key Responsibility 1] and [Key Responsibility 2]. One of my key achievements was [Quantifiable Achievement], which resulted in [Positive Outcome]. I am proficient in [Programming Language/Tool 1], [Programming Language/Tool 2], and [Programming Language/Tool 3], and I am eager to apply these skills to the challenges at Tech Solutions Inc.",
            "I have been following Tech Solutions Inc.'s work in [Company's Area of Focus] with great interest, particularly [Specific Project or Value]. Your company's commitment to [Company Value] aligns perfectly with my own professional values, and I am excited by the prospect of contributing to such a forward-thinking organization.",
            "Thank you for considering my application. I have attached my resume for your review and welcome the opportunity to discuss how my skills and experience can benefit Tech Solutions Inc. in more detail. I am available for an interview at your earliest convenience."
        ],
        footer: {
            closing: "Sincerely,",
            signature_name: "John Doe",
            signature_contact: "555-123-4567\njohn.doe@email.com",
            attachments_mentioned: [
                "Resume/CV"
            ]
        }
    }
};

// CSS provided by the user
const coverLetterCSS = `
:root {
    --font-family-body: 'Lato', sans-serif;
    --font-family-heading: 'Merriweather', serif;
    --base-font-size: 10.5pt;
    --line-height: 1.45;
    --primary-color: #333;
    --secondary-color: #555;
    --accent-color: #000;
    --link-color: #0066cc;
}
body.theme-modern {
    --primary-color: #2c3e50;
    --secondary-color: #7f8c8d;
    --accent-color: #2980b9;
    --link-color: #3498db;
}
body.theme-elegant {
    --primary-color: #34495e;
    --secondary-color: #666;
    --accent-color: #16a085;
    --link-color: #1abc9c;
}
/* @page rule might not apply well inside iframe, apply A4 sizing to container */
body {
    font-family: var(--font-family-body);
    font-size: var(--base-font-size);
    line-height: var(--line-height);
    color: var(--primary-color);
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: white; /* Ensure iframe background is white */
    height: 100%; /* Needed for height calculation */
    overflow: hidden; /* Prevent scrollbars inside iframe */
}
html { height: 100%; }

.cover-letter-container { /* Applied outside iframe */
    max-width: 18cm;
    margin: 0 auto;
}
.header-section { margin-bottom: 10px; position: relative; } /* Reduced margins for iframe context */
.sender-info { text-align: left; margin-bottom: 5px; font-size: 9.5pt; color: var(--secondary-color); line-height: 1.3; }
.sender-info p { margin: 0; }
.sender-info .sender-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 13pt; color: var(--accent-color); margin-bottom: 4px; }
.sender-info a { color: var(--link-color); text-decoration: none; }
.sender-info a:hover { text-decoration: underline; }
.date { text-align: right; font-size: 10pt; color: var(--secondary-color); margin-top: -10px; margin-bottom: 10px; }
.recipient-info { text-align: left; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.4; }
.recipient-info p { margin: 1px 0; }
.recipient-info .recipient-name, .recipient-info .recipient-title { font-weight: 700; color: var(--primary-color); }
.subject { font-family: var(--font-family-heading); font-weight: 700; margin-top: 15px; margin-bottom: 10px; font-size: 11.5pt; color: var(--accent-color); }
.subject p { margin: 0; }
.salutation { font-weight: 700; margin-bottom: 10px; font-size: 10.5pt; }
.salutation p { margin: 0; }
.body p { margin-bottom: 0.9em; text-align: justify; }
.closing { margin-top: 10px; margin-bottom: 5px; font-size: 10.5pt; }
.closing p { margin: 0; }
.signature { margin-top: 5px; margin-bottom: 10px; line-height: 1.4; }
.signature .signature-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 11pt; color: var(--primary-color); }
.signature .signature-contact { font-size: 9.5pt; color: var(--secondary-color); white-space: pre-line; margin-top: 3px; }
.attachments { margin-top: 10px; font-size: 9pt; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
.attachments p { margin: 0 0 4px 0; font-weight: 700; color: var(--secondary-color); }
.attachments ul { list-style: none; padding: 0; margin: 0; }
.attachments li { margin-bottom: 2px; }
`;

// Helper to generate srcDoc for an iframe section
const generateSrcDoc = (htmlContent, css, sectionId) => {
    // Basic HTML escaping (replace with a library for robustness if needed)
    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     };

    // Escape the CSS to prevent issues if it contains special characters within the style tag
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
            </style>
        </head>
        <body class="theme-classic"> {# TODO: Make theme dynamic #}
            ${htmlContent}
             <script>
                function adjustHeight() {
                    // Debounce function
                    let timeoutId;
                    function debounceAdjust() {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            const body = document.body;
                            const html = document.documentElement;
                            // Use scrollHeight for potentially taller content than viewport
                            const height = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight);
                             // Add a small buffer (e.g., 2px) to prevent scrollbars in edge cases
                            const adjustedHeight = height + 2;
                            if (window.parent) {
                                window.parent.postMessage({ type: 'resize-iframe', height: adjustedHeight, sectionId: '${escapeHtml(sectionId)}' }, '*');
                            }
                        }, 50); // Adjust debounce delay as needed
                    }

                    // Initial adjustment
                    debounceAdjust();

                    // Adjust on window resize
                    window.addEventListener('resize', debounceAdjust);

                    // Use MutationObserver to detect content changes
                    const observer = new MutationObserver(debounceAdjust);
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        characterData: true
                    });

                     // Optional: Disconnect observer when iframe unloads (though usually not necessary for srcDoc)
                    // window.addEventListener('unload', () => observer.disconnect());
                 }
                 // Run adjustment logic after the document is fully loaded
                 if (document.readyState === 'complete') {
                    adjustHeight();
                 } else {
                    window.addEventListener('load', adjustHeight);
                 }
            </script>
        </body>
        </html>
    `;
};


// Helper to render header HTML string
const renderHeaderHtml = (headerData) => {
    if (!headerData) return '';
     // Basic HTML escaping helper
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

// Helper to render a single paragraph HTML string
const renderParagraphHtml = (paragraphText) => {
    if (!paragraphText) return '';
    const escape = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
    // Preserve line breaks within the paragraph text
    const formattedText = escape(paragraphText.trim()).replace(/\n/g, '<br>');
    return `<div class="body"><p>${formattedText}</p></div>`;
};

// Helper to render footer HTML string
const renderFooterHtml = (footerData) => {
    if (!footerData) return '';
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
    // Preserve line breaks in signature contact
    const signatureContactHtml = footerData.signature_contact ? escape(footerData.signature_contact.trim()).replace(/\n/g, '<br>') : '';

    return `
        <div class="closing">
            <p>${escape(footerData.closing || 'Sincerely,')}</p>
        </div>
        <div class="signature">
            ${footerData.signature_name ? `<p class="signature-name">${escape(footerData.signature_name)}</p>` : ''}
            ${signatureContactHtml ? `<p class="signature-contact">${signatureContactHtml}</p>` : ''}
        </div>
        ${attachmentsHtml}
    `;
};


const CoverLetterEditorPage = ({ params }) => {
    const documentId = params.id;
    const [coverLetterData, setCoverLetterData] = useState(initialCoverLetterState);
    const [loading, setLoading] = useState(true); // Set true initially for fetch
    const [error, setError] = useState(null);
    const toast = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialDataRef = useRef(null);

    const [iframeHeights, setIframeHeights] = useState({}); // Store heights { 'header': 100, 'p-0': 50, ... }

    // --- Data Fetching & Local Storage (Simplified Example) ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Replace with actual API call
                // const response = await axios.get(`/api/documents/${documentId}`);
                // const fetchedData = response.data;

                // Using placeholder data for now
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate fetch delay
                const fetchedData = initialCoverLetterState; // Use placeholder

                setCoverLetterData(fetchedData);
                initialDataRef.current = JSON.stringify(fetchedData); // Store initial state
                setHasUnsavedChanges(false);
                // TODO: Initialize history state here if implementing undo/redo
            } catch (err) {
                console.error("Error fetching document:", err);
                setError("Failed to load document data.");
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load document.', life: 5000 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [documentId]);

     // --- Iframe Height Handling ---
    useEffect(() => {
        const handleMessage = (event) => {
            // Add origin check for security if possible:
            // if (event.origin !== window.location.origin) return;

            if (event.data && event.data.type === 'resize-iframe' && event.data.sectionId) {
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
    }, []); // Empty dependency array means this runs once on mount


    // --- Edit Dialog State and Handlers ---
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentEditingSection, setCurrentEditingSection] = useState(null); // { type: 'header' | 'paragraph' | 'footer', index?: number }
    const [editText, setEditText] = useState(''); // For simple text editing (paragraphs)
    const [editData, setEditData] = useState({}); // For complex object editing (header/footer)

    const getSectionData = useCallback((sectionInfo) => {
        if (!sectionInfo || !coverLetterData.cover_letter) return null;
        switch (sectionInfo.type) {
            case 'header': return coverLetterData.cover_letter.header;
            case 'paragraph': return coverLetterData.cover_letter.body_paragraphs[sectionInfo.index];
            case 'footer': return coverLetterData.cover_letter.footer;
            default: return null;
        }
    }, [coverLetterData]);

    const openEditDialog = (sectionInfo) => {
        const currentData = getSectionData(sectionInfo);
        if (currentData === null) return; // Should not happen if called correctly

        setCurrentEditingSection(sectionInfo);
        if (sectionInfo.type === 'paragraph') {
            setEditText(currentData); // Paragraph data is just the string
            setEditData({});
        } else {
            // Header or Footer data is an object
            setEditData({ ...currentData });
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

    const handleEditSave = () => {
        if (!currentEditingSection) return;

        const newData = JSON.parse(JSON.stringify(coverLetterData)); // Deep copy

        try {
            if (currentEditingSection.type === 'paragraph') {
                if (typeof editText === 'string') {
                    newData.cover_letter.body_paragraphs[currentEditingSection.index] = editText;
                } else { throw new Error("Invalid data type for paragraph"); }
            } else if (currentEditingSection.type === 'header') {
                 if (typeof editData === 'object' && editData !== null) {
                    newData.cover_letter.header = { ...editData };
                 } else { throw new Error("Invalid data type for header"); }
            } else if (currentEditingSection.type === 'footer') {
                 if (typeof editData === 'object' && editData !== null) {
                    // Handle array conversion for attachments
                    if (editData.attachments_mentioned && typeof editData.attachments_mentioned === 'string') {
                        editData.attachments_mentioned = editData.attachments_mentioned.split(',').map(s => s.trim()).filter(Boolean);
                    } else if (!Array.isArray(editData.attachments_mentioned)) {
                         editData.attachments_mentioned = []; // Ensure it's an array
                    }
                    newData.cover_letter.footer = { ...editData };
                 } else { throw new Error("Invalid data type for footer"); }
            }

            setCoverLetterData(newData);
            setHasUnsavedChanges(true); // Mark changes
            // TODO: Add history management update here
            closeEditDialog();
            toast.current?.show({ severity: 'success', summary: 'Updated', detail: `Section updated successfully!`, life: 3000 });
        } catch (error) {
             console.error("Error saving edit:", error);
             toast.current?.show({ severity: 'error', summary: 'Save Error', detail: `Failed to update section: ${error.message}`, life: 4000 });
        }
    };

     // Handle input changes for complex objects (header/footer) in the dialog
    const handleDialogInputChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    // --- Save Changes ---
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Replace with actual API call
            // await axios.put(`/api/documents/${documentId}`, coverLetterData);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay
            console.log("Saving data:", coverLetterData);

            initialDataRef.current = JSON.stringify(coverLetterData); // Update reference state
            setHasUnsavedChanges(false);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Document saved successfully!', life: 3000 });
        } catch (err) {
            console.error("Error saving document:", err);
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: 'Failed to save document.', life: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Rendering ---
    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="ml-3">Loading document editor...</p>
            </div>
        );
    }
    if (error) {
         return (
            <div className="flex justify-content-center align-items-center min-h-screen text-red-500">
                <i className="pi pi-times-circle mr-2" style={{ fontSize: '2rem' }}></i>
                <p>{error}</p>
            </div>
        );
    }

    const { header, body_paragraphs, footer } = coverLetterData.cover_letter || { header: null, body_paragraphs: [], footer: null };

    // Generate unique IDs for sections for iframe communication and keys
    const getSectionId = (type, index = null) => {
        return index !== null ? `${type}-${index}` : type;
    };

    return (
        <div className="document-editor flex flex-column h-screen">
            <Toast ref={toast} />
            {/* TODO: Add EditorToolbar component */}
             <div className="p-3 surface-ground border-bottom-1 surface-border flex justify-content-end align-items-center sticky top-0 z-5 gap-2">
                 <Button
                    label={isSaving ? 'Saving...' : 'Save Changes'}
                    icon={isSaving ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-save"}
                    className="p-button-sm p-button-success"
                    onClick={handleSaveChanges}
                    disabled={isSaving || !hasUnsavedChanges}
                    tooltip={hasUnsavedChanges ? "Save your latest changes" : "No changes to save"}
                />
             </div>

            {/* Scrollable A4 Page Container */}
            <div className="flex-grow-1 overflow-auto p-4 surface-100 flex justify-content-center">
                {/* A4 Page Element */}
                <div
                    className="a4-page bg-white shadow-3 border-1 border-300"
                    style={{
                        width: '210mm',
                        minHeight: '297mm', // Ensures it looks like A4 even if content is short
                        padding: '1.5cm',
                        boxSizing: 'border-box' // Include padding in width/height
                    }}
                >
                    {/* Render Sections with Iframes */}

                    {/* Header Section */}
                    {header && (
                        <EditableSection
                            sectionId={getSectionId('header')}
                            onEdit={() => openEditDialog({ type: 'header' })}
                            // TODO: Add onUndo/onRedo props when implemented
                        >
                            <iframe
                                title="Cover Letter Header"
                                srcDoc={generateSrcDoc(renderHeaderHtml(header), coverLetterCSS, getSectionId('header'))}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    height: `${iframeHeights[getSectionId('header')] || 150}px`, // Default height
                                    overflow: 'hidden',
                                    display: 'block' // Prevents potential small gap below iframe
                                }}
                                scrolling="no"
                                sandbox="allow-same-origin" // Allows script for height adjustment
                            />
                        </EditableSection>
                    )}

                    {/* Body Paragraphs */}
                    {body_paragraphs && body_paragraphs.map((paragraph, index) => (
                         <EditableSection
                            key={getSectionId('paragraph', index)}
                            sectionId={getSectionId('paragraph', index)}
                            onEdit={() => openEditDialog({ type: 'paragraph', index })}
                            // TODO: Add onUndo/onRedo props when implemented
                        >
                            <iframe
                                title={`Paragraph ${index + 1}`}
                                srcDoc={generateSrcDoc(renderParagraphHtml(paragraph), coverLetterCSS, getSectionId('paragraph', index))}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    height: `${iframeHeights[getSectionId('paragraph', index)] || 60}px`, // Default height
                                    overflow: 'hidden',
                                    display: 'block'
                                }}
                                scrolling="no"
                                sandbox="allow-same-origin"
                            />
                        </EditableSection>
                    ))}

                    {/* Footer Section */}
                    {footer && (
                         <EditableSection
                            sectionId={getSectionId('footer')}
                            onEdit={() => openEditDialog({ type: 'footer' })}
                            // TODO: Add onUndo/onRedo props when implemented
                        >
                            <iframe
                                title="Cover Letter Footer"
                                srcDoc={generateSrcDoc(renderFooterHtml(footer), coverLetterCSS, getSectionId('footer'))}
                                style={{
                                    width: '100%',
                                    border: 'none',
                                    height: `${iframeHeights[getSectionId('footer')] || 100}px`, // Default height
                                    overflow: 'hidden',
                                    display: 'block'
                                }}
                                scrolling="no"
                                sandbox="allow-same-origin"
                            />
                        </EditableSection>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog
                header={`Edit ${currentEditingSection?.type || ''}${currentEditingSection?.index !== undefined ? ` Paragraph ${currentEditingSection.index + 1}` : ''}`}
                visible={isEditDialogOpen}
                style={{ width: '60vw', maxWidth: '800px' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                modal
                onHide={closeEditDialog}
                footer={
                    <div className='pt-3'>
                        <Button label="Cancel" icon="pi pi-times" onClick={closeEditDialog} className="p-button-text" />
                        <Button label="Save Changes" icon="pi pi-check" onClick={handleEditSave} autoFocus />
                    </div>
                }
            >
                {currentEditingSection?.type === 'paragraph' && (
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
                 {(currentEditingSection?.type === 'header' || currentEditingSection?.type === 'footer') && (
                    <div className="formgrid grid p-fluid">
                        {Object.entries(editData).map(([key, value]) => {
                            const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            const isTextArea = typeof value === 'string' && (value.length > 60 || value.includes('\n') || key.includes('address') || key.includes('subject') || key.includes('contact'));
                            const isArray = Array.isArray(value);

                            return (
                                <div key={key} className="field col-12 md:col-6 mb-3">
                                    <label htmlFor={key} className="block mb-1 font-medium">{label}</label>
                                    {isTextArea ? (
                                        <InputTextarea
                                            id={key}
                                            value={value}
                                            onChange={(e) => handleDialogInputChange(key, e.target.value)}
                                            rows={key === 'signature_contact' ? 3 : 2} // Adjust rows based on field
                                            autoResize={key !== 'signature_contact'} // AutoResize might be useful
                                        />
                                    ) : isArray ? (
                                        // Simple comma-separated input for arrays (e.g., attachments)
                                        <InputTextarea
                                            id={key}
                                            value={value.join(', ')}
                                            onChange={(e) => handleDialogInputChange(key, e.target.value)} // Saved as string, processed on save
                                            rows={2}
                                            tooltip="Enter items separated by commas"
                                            placeholder="item1, item2, item3"
                                        />
                                        // TODO: Implement a better array editor (e.g., Chips component)
                                    ) : (
                                        <InputText
                                            id={key}
                                            value={value}
                                            onChange={(e) => handleDialogInputChange(key, e.target.value)}
                                            // Consider type="date" or using PrimeReact Calendar for date fields
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Dialog>
        </div>
    );
};


// Wrapper component for editable sections (iframe + controls)
const EditableSection = ({ children, sectionId, onEdit, onUndo, onRedo }) => {
    const [isHovered, setIsHovered] = useState(false);
    // TODO: Add canUndo/canRedo state based on history props

    return (
        <div
            className="editable-section relative mb-1" // Reduced margin between sections
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                outline: isHovered ? '1px dashed var(--primary-500)' : 'none',
                outlineOffset: '2px',
                transition: 'outline 0.1s ease-in-out',
                padding: '1px 0' // Add tiny padding to ensure outline doesn't overlap content visually
            }}
        >
            {children}
            {isHovered && (
                <div
                    className="edit-controls absolute top-0 right-0 flex gap-1 z-10 p-1 bg-black-alpha-10 border-round"
                     style={{
                         transform: 'translate(105%, -5px)', // Position controls slightly outside to the top-right
                         pointerEvents: 'auto' // Ensure buttons are clickable
                     }}
                >
                     {/* TODO: Add Undo/Redo buttons when implemented */}
                    {/* <Button icon="pi pi-undo" className="p-button-rounded p-button-text p-button-sm p-button-secondary" onClick={onUndo} disabled={!canUndo} tooltip="Undo" tooltipOptions={{position: 'left'}} /> */}
                    {/* <Button icon="pi pi-redo" className="p-button-rounded p-button-text p-button-sm p-button-secondary" onClick={onRedo} disabled={!canRedo} tooltip="Redo" tooltipOptions={{position: 'left'}} /> */}
                    <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text p-button-sm p-button-secondary"
                        onClick={onEdit}
                        tooltip="Edit Section"
                        tooltipOptions={{position: 'left'}}
                    />
                </div>
            )}
        </div>
    );
};


export default CoverLetterEditorPage;
