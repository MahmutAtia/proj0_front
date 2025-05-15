"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // Assuming axios is installed
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import EditorToolbar from './components/EditorToolbar';
import EditableSection from './components/EditableSection'; // Assuming this uses default export too
import ManualEditDialog from './components/ManualEditDialog'; // Assuming this uses default export too

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
    padding: 0; /* Explicitly set padding to 0 */
    height: 100%;
    overflow: hidden; /* Prevent scrollbars within iframe */
}
p { margin: 0 0 0.1em 0; }
a { color: var(--link-color); text-decoration: none; }
a:hover { text-decoration: underline; }

.header-section { margin-bottom: 15px; position: relative; } /* Reduced margin */
.sender-info { text-align: left; margin-bottom: 5px; font-size: 9.5pt; color: var(--secondary-color); line-height: 1.2; } /* Reduced margin & line-height */
.sender-info p { margin: 0 0 2px 0; } /* Added small bottom margin for paragraphs within sender-info */
.sender-info .sender-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 13pt; color: var(--accent-color); margin-bottom: 3px; } /* Reduced margin */
.date { text-align: right; font-size: 10pt; color: var(--secondary-color); margin-top: -10px; margin-bottom: 10px; } /* Adjusted margins */
.recipient-info { text-align: left; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.3; } /* Reduced margin & line-height */
.recipient-info p { margin: 1px 0; }
.recipient-info .recipient-name, .recipient-info .recipient-title { font-weight: 700; color: var(--primary-color); }
.subject { font-family: var(--font-family-heading); font-weight: 700; margin-top: 15px; margin-bottom: 10px; font-size: 11.5pt; color: var(--accent-color); } /* Reduced margins */
.subject p { margin: 0; }
.salutation { font-weight: 700; margin-bottom: 10px; font-size: 10.5pt; } /* Reduced margin */
.salutation p { margin: 0; }
.body p { margin-bottom: 1em; text-align: justify; }
body > .body > p {
    margin-bottom: 0 !important; /* Force removal of bottom margin */
}
.footer-section { margin-top: 20px; }
.closing { margin-top: 15px; margin-bottom: 8px; font-size: 10.5pt; }
.closing p { margin: 0; }
.signature { margin-top: 8px; margin-bottom: 15px; line-height: 1.4; }
.signature .signature-name { font-family: var(--font-family-heading); font-weight: 700; font-size: 11pt; color: var(--primary-color); }
.signature .signature-contact { font-size: 9.5pt; color: var(--secondary-color); white-space: pre-line; margin-top: 4px; }
.attachments { margin-top: 15px; font-size: 9pt; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
.attachments p { margin: 0 0 5px 0; font-weight: 700; color: var(--secondary-color); }
.attachments ul { list-style: none; padding: 0 0 20px 0; margin: 0; max-width: 100%; }
.attachments li { margin-bottom: 3px; }
.recommender-info, .signature-title, .signature-organization { /* Example */
    /* Add specific styles */
}
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
        <body class="theme-classic">
            ${htmlContent}

        </body>
        </html>
    `;
};

/** Escapes HTML characters */
const escapeHtml = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';

/** Renders HTML for Cover Letter header */
const renderCoverLetterHeaderHtml = (headerData) => {
    if (!headerData) return '<div class="header-section"><p><i>Header data missing</i></p></div>';
    return `
        <div class="header-section">
            <div class="sender-info">
                ${headerData.sender_name ? `<p class="sender-name">${escapeHtml(headerData.sender_name)}</p>` : ''}
                ${headerData.sender_address ? `<p>${escapeHtml(headerData.sender_address)}</p>` : ''}
                ${headerData.sender_city_postal ? `<p>${escapeHtml(headerData.sender_city_postal)}</p>` : ''}
                ${headerData.sender_phone ? `<p>${escapeHtml(headerData.sender_phone)}</p>` : ''}
                ${headerData.sender_email ? `<p><a href="mailto:${escapeHtml(headerData.sender_email)}">${escapeHtml(headerData.sender_email)}</a></p>` : ''}
                ${headerData.sender_linkedin ? `<p><a href="${escapeHtml(headerData.sender_linkedin)}" target="_blank">${escapeHtml(headerData.sender_linkedin)}</a></p>` : ''}
            </div>
            ${headerData.date ? `<div class="date"><p>${escapeHtml(headerData.date)}</p></div>` : ''}
            <div class="recipient-info">
                 ${headerData.recipient_name ? `<p class="recipient-name">${escapeHtml(headerData.recipient_name)}</p>` : ''}
                 ${headerData.recipient_title ? `<p class="recipient-title">${escapeHtml(headerData.recipient_title)}</p>` : ''}
                 ${headerData.recipient_company ? `<p>${escapeHtml(headerData.recipient_company)}</p>` : ''}
                 ${headerData.recipient_address ? `<p>${escapeHtml(headerData.recipient_address)}</p>` : ''}
                 ${headerData.recipient_city_postal ? `<p>${escapeHtml(headerData.recipient_city_postal)}</p>` : ''}
            </div>
             ${headerData.subject ? `<div class="subject"><p>${escapeHtml(headerData.subject)}</p></div>` : ''}
             ${headerData.salutation ? `<div class="salutation"><p>${escapeHtml(headerData.salutation)}</p></div>` : ''}
        </div>
    `;
};

/** Renders HTML for Recommendation Letter header */
const renderRecommendationHeaderHtml = (headerData) => {
    if (!headerData) return '<div class="header-section"><p><i>Header data missing</i></p></div>';
    return `
        <div class="header-section">
            <div class="recommender-info">
                ${headerData.recommender_name ? `<p class="sender-name">${escapeHtml(headerData.recommender_name)}</p>` : ''}
                ${headerData.recommender_title ? `<p>${escapeHtml(headerData.recommender_title)}</p>` : ''}
                ${headerData.recommender_organization ? `<p>${escapeHtml(headerData.recommender_organization)}</p>` : ''}
                ${headerData.recommender_address ? `<p>${escapeHtml(headerData.recommender_address)}</p>` : ''}
                ${headerData.recommender_city_postal ? `<p>${escapeHtml(headerData.recommender_city_postal)}</p>` : ''}
                ${headerData.recommender_phone ? `<p>${escapeHtml(headerData.recommender_phone)}</p>` : ''}
                ${headerData.recommender_email ? `<p><a href="mailto:${escapeHtml(headerData.recommender_email)}">${escapeHtml(headerData.recommender_email)}</a></p>` : ''}
            </div>
            ${headerData.date ? `<div class="date"><p>${escapeHtml(headerData.date)}</p></div>` : ''}
            <div class="recipient-info">
                 ${headerData.recipient_name ? `<p class="recipient-name">${escapeHtml(headerData.recipient_name)}</p>` : ''}
                 ${headerData.recipient_title ? `<p class="recipient-title">${escapeHtml(headerData.recipient_title)}</p>` : ''}
                 ${headerData.recipient_organization ? `<p>${escapeHtml(headerData.recipient_organization)}</p>` : ''}
                 ${headerData.recipient_address ? `<p>${escapeHtml(headerData.recipient_address)}</p>` : ''}
                 ${headerData.recipient_city_postal ? `<p>${escapeHtml(headerData.recipient_city_postal)}</p>` : ''}
            </div>
             ${headerData.subject ? `<div class="subject"><p>${escapeHtml(headerData.subject)}</p></div>` : ''}
             ${headerData.salutation ? `<div class="salutation"><p>${escapeHtml(headerData.salutation)}</p></div>` : ''}
        </div>
    `;
};

/** Renders HTML for Motivation Letter header */
const renderMotivationHeaderHtml = (headerData) => {
    if (!headerData) return '<div class="header-section"><p><i>Header data missing</i></p></div>';
    return `
        <div class="header-section">
            <div class="sender-info"> {/* Reusing sender-info class */}
                ${headerData.sender_name ? `<p class="sender-name">${escapeHtml(headerData.sender_name)}</p>` : ''}
                ${headerData.sender_address ? `<p>${escapeHtml(headerData.sender_address)}</p>` : ''}
                ${headerData.sender_city_postal ? `<p>${escapeHtml(headerData.sender_city_postal)}</p>` : ''}
                ${headerData.sender_phone ? `<p>${escapeHtml(headerData.sender_phone)}</p>` : ''}
                ${headerData.sender_email ? `<p><a href="mailto:${escapeHtml(headerData.sender_email)}">${escapeHtml(headerData.sender_email)}</a></p>` : ''}
            </div>
            ${headerData.date ? `<div class="date"><p>${escapeHtml(headerData.date)}</p></div>` : ''}
            <div class="recipient-info">
                 ${headerData.recipient_name ? `<p class="recipient-name">${escapeHtml(headerData.recipient_name)}</p>` : ''}
                 ${headerData.recipient_title ? `<p class="recipient-title">${escapeHtml(headerData.recipient_title)}</p>` : ''}
                 ${headerData.recipient_organization ? `<p>${escapeHtml(headerData.recipient_organization)}</p>` : ''}
                 ${headerData.recipient_address ? `<p>${escapeHtml(headerData.recipient_address)}</p>` : ''}
                 ${headerData.recipient_city_postal ? `<p>${escapeHtml(headerData.recipient_city_postal)}</p>` : ''}
            </div>
             ${headerData.subject ? `<div class="subject"><p>${escapeHtml(headerData.subject)}</p></div>` : ''}
             ${headerData.salutation ? `<div class="salutation"><p>${escapeHtml(headerData.salutation)}</p></div>` : ''}
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

/** Renders HTML for Cover Letter footer */
const renderCoverLetterFooterHtml = (footerData) => {
    if (!footerData) return '<div class="footer-section"><p><i>Footer data missing</i></p></div>';
    let attachmentsHtml = '';
    if (footerData.attachments_mentioned && Array.isArray(footerData.attachments_mentioned) && footerData.attachments_mentioned.length > 0) {
        attachmentsHtml = `
            <div class="attachments">
                <p>Attachment${footerData.attachments_mentioned.length > 1 ? 's' : ''}</p>
                <ul>
                    ${footerData.attachments_mentioned.map(att => `<li>${escapeHtml(att)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    const signatureContactHtml = footerData.signature_contact ? escapeHtml(String(footerData.signature_contact).trim()).replace(/\n/g, '<br>') : '';
    return `
        <div class="footer-section">
            <div class="closing">
                <p>${escapeHtml(footerData.closing || 'Sincerely,')}</p>
            </div>
            <div class="signature">
                ${footerData.signature_name ? `<p class="signature-name">${escapeHtml(footerData.signature_name)}</p>` : ''}
                ${signatureContactHtml ? `<p class="signature-contact">${signatureContactHtml}</p>` : ''}
            </div>
            ${attachmentsHtml}
        </div>
    `;
};

/** Renders HTML for Recommendation Letter footer */
const renderRecommendationFooterHtml = (footerData) => {
    if (!footerData) return '<div class="footer-section"><p><i>Footer data missing</i></p></div>';
    const signatureContactHtml = footerData.signature_contact ? escapeHtml(String(footerData.signature_contact).trim()).replace(/\n/g, '<br>') : '';
    return `
        <div class="footer-section">
            <div class="closing">
                <p>${escapeHtml(footerData.closing || 'Sincerely,')}</p>
            </div>
            <div class="signature">
                ${footerData.signature_name ? `<p class="signature-name">${escapeHtml(footerData.signature_name)}</p>` : ''}
                ${footerData.signature_title ? `<p class="signature-title">${escapeHtml(footerData.signature_title)}</p>` : ''}
                ${footerData.signature_organization ? `<p class="signature-organization">${escapeHtml(footerData.signature_organization)}</p>` : ''}
                ${signatureContactHtml ? `<p class="signature-contact">${signatureContactHtml}</p>` : ''}
            </div>
        </div>
    `;
};

/** Renders HTML for Motivation Letter footer */
const renderMotivationFooterHtml = (footerData) => {
    if (!footerData) return '<div class="footer-section"><p><i>Footer data missing</i></p></div>';
    return `
        <div class="footer-section">
            <div class="closing">
                <p>${escapeHtml(footerData.closing || 'Sincerely,')}</p>
            </div>
            <div class="signature">
                ${footerData.signature_name ? `<p class="signature-name">${escapeHtml(footerData.signature_name)}</p>` : ''}
            </div>
        </div>
    `;
};

// --- Main Editor Page Component ---

const DocumentEditorPage = ({ params }) => {
    const documentId = params.id;
    const toast = useRef(null);

    // --- Core State ---
    const [documentType, setDocumentType] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Editing & Saving State ---
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialDataRef = useRef(null);

    // --- History State (Undo/Redo) ---
    const [sectionHistory, setSectionHistory] = useState({});
    const [historyIndex, setHistoryIndex] = useState({});

    // --- Manual Edit Dialog State ---
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentEditingSection, setCurrentEditingSection] = useState(null);
    const [editText, setEditText] = useState('');
    const [editData, setEditData] = useState({});

    // --- PDF Download State ---
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // --- Helper Functions ---

    /** Generates a unique ID for a section based on type and optional index. */
    const getSectionId = useCallback((type, index = null) => {
        return index !== null ? `${type}-${index}` : type;
    }, []);

    /** Retrieves the current data for a given section from the main state. */
    const getSectionData = useCallback((sectionInfo) => {
        if (!sectionInfo || !documentData) return null;
        const { type, index } = sectionInfo;
        switch (type) {
            case 'header': return documentData.header;
            case 'paragraph': return documentData.body_paragraphs?.[index];
            case 'footer': return documentData.footer;
            default: return null;
        }
    }, [documentData]);

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
        if (!data) return;
        const initialHistory = {};
        const initialIndices = {};
        const { header, body_paragraphs, footer } = data;

        const addStateToHistory = (id, state) => {
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
        const stateToAdd = (typeof newState === 'object' && newState !== null) ? JSON.parse(JSON.stringify(newState)) : newState;

        setSectionHistory(prev => {
            const currentHistory = prev[sectionId] || [];
            const currentIndex = historyIndex[sectionId] ?? -1;
            const relevantHistory = currentHistory.slice(0, currentIndex + 1);
            return { ...prev, [sectionId]: [...relevantHistory, stateToAdd] };
        });
        setHistoryIndex(prev => ({ ...prev, [sectionId]: (prev[sectionId] ?? -1) + 1 }));
        setHasUnsavedChanges(true);
    }, [historyIndex]);

    // --- Data Fetching and Initialization ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHasUnsavedChanges(false);
        setDocumentType(null);
        setDocumentData(null);
        try {
            // Ensure the environment variable is correctly loaded
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error("Backend URL is not configured. Check NEXT_PUBLIC_BACKEND_URL environment variable.");
            }
            const response = await axios.get(`${backendUrl}/api/resumes/document_bloks/${documentId}/`);
            const { document_type, json_data } = response.data;

            if (!document_type || !json_data) {
                throw new Error("Invalid data structure received from API: Missing document_type or json_data.");
            }

            // --- MODIFICATION START ---
            // Access the actual document data nested under the document_type key
            const actualDocumentData = json_data[document_type];

            if (!actualDocumentData) {
                throw new Error(`Data for document type '${document_type}' not found within json_data.`);
            }
            // --- MODIFICATION END ---


            console.log(`Fetched document: ${documentId}, Type: ${document_type}`);

            // Use the correctly accessed data
            const validatedData = {
                header: actualDocumentData.header ?? null,
                body_paragraphs: actualDocumentData.body_paragraphs ?? [],
                footer: actualDocumentData.footer ?? null,
            };

            setDocumentType(document_type);
            setDocumentData(validatedData);
            initialDataRef.current = JSON.stringify(validatedData);
            initializeHistory(validatedData);

        } catch (err) {
            console.error("Error fetching document:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to load document data.';
            setError(`Failed to load document data. ${errorMsg}`);
            toast.current?.show({ severity: 'error', summary: 'Load Error', detail: `Failed to load document. ${errorMsg}`, life: 5000 });
        } finally {
            setLoading(false);
        }
    }, [documentId, initializeHistory]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleIframeLoad = useCallback((e) => {
        const iframe = e.target;
        setTimeout(() => {
            try {
                if (iframe.contentDocument && iframe.contentDocument.body) {
                    const doc = iframe.contentDocument;
                    const body = doc.body;
                    let contentHeight = 0;

                    const contentElement = body.querySelector('.header-section, .body, .footer-section');

                    if (contentElement) {
                        contentHeight = contentElement.scrollHeight;
                    } else {
                        console.warn("Could not find specific content element in iframe, falling back to body height.");
                        contentHeight = body.scrollHeight;
                    }

                    const bodyStyle = window.getComputedStyle(body);
                    const marginTop = parseInt(bodyStyle.marginTop, 10) || 0;
                    const marginBottom = parseInt(bodyStyle.marginBottom, 10) || 0;

                    const totalHeight = contentHeight + marginTop + marginBottom ;

                    iframe.style.height = `${totalHeight}px`;

                }
            } catch (error) {
                console.error("Error adjusting iframe height:", error);
                iframe.style.height = '100px';
            }
        }, 50);
    }, []);

    // --- Core Action Handlers (Undo, Redo, Save) ---

    /** Applies the state change for undo/redo to the main documentData. */
    const applyStateChange = (sectionId, newState) => {
        setDocumentData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const sectionInfo = parseSectionId(sectionId);
            if (!sectionInfo) return prevData;

            if (sectionInfo.type === 'paragraph') {
                if (!newData.body_paragraphs) newData.body_paragraphs = [];
                newData.body_paragraphs[sectionInfo.index] = newState;
            } else if (sectionInfo.type === 'header') {
                newData.header = newState;
            } else if (sectionInfo.type === 'footer') {
                newData.footer = newState;
            }
            return newData;
        });
        setHasUnsavedChanges(true);
    };

    const handleUndo = (sectionId) => {
        const history = sectionHistory[sectionId] || [];
        const currentIndex = historyIndex[sectionId];
        if (currentIndex > 0) {
            const previousIndex = currentIndex - 1;
            const previousState = history[previousIndex];
            applyStateChange(sectionId, previousState);
            setHistoryIndex(prev => ({ ...prev, [sectionId]: previousIndex }));
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
            applyStateChange(sectionId, nextState);
            setHistoryIndex(prev => ({ ...prev, [sectionId]: nextIndex }));
            toast.current?.show({ severity: 'info', summary: 'Redo', detail: `Restored ${sectionId}`, life: 1500 });
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Redo', detail: `No future state for ${sectionId}`, life: 1500 });
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error("Backend URL is not configured. Check NEXT_PUBLIC_BACKEND_URL environment variable.");
            }

            const dataToSave = {
                ...documentData
            };

            const apiUrl = `${backendUrl}/api/resumes/document/${documentId}/update/`;
            console.log("Saving document to:", apiUrl);
            console.log("Data to save:", dataToSave);

            await axios.put(apiUrl, dataToSave, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            initialDataRef.current = JSON.stringify(documentData);
            setHasUnsavedChanges(false);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Document saved successfully!', life: 3000 });
        } catch (err) {
            console.error("Error saving document:", err);
            let detailMessage = `Failed to save document. ${err.message || ''}`;
            if (err.response) {
                console.error("Backend error response:", err.response.data);
                const backendError = err.response.data?.detail || err.response.data?.error || JSON.stringify(err.response.data);
                detailMessage = `Failed to save document: ${backendError}`;
            }
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: detailMessage, life: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!documentId) {
            console.error("Document ID is missing, cannot download PDF.");
            toast.current?.show({ severity: 'warn', summary: 'Download Error', detail: 'Document ID is missing.', life: 3000 });
            return;
        }
        if (hasUnsavedChanges) {
            toast.current?.show({ severity: 'warn', summary: 'Unsaved Changes', detail: 'Please save your changes before downloading the PDF.', life: 4000 });
            return;
        }
        setIsDownloadingPdf(true);
        try {
            const pdfUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/document/${documentId}/`;
            const response = await axios.get(pdfUrl, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);

            const pdfWindow = window.open(blobUrl, '_blank');
            if (pdfWindow) {
                pdfWindow.focus();
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Popup Blocked', detail: 'Could not open PDF in a new tab. Please check your popup blocker settings.', life: 5000 });
            }
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

        } catch (error) {
            console.error("Error downloading PDF:", error);
            const errorMsg = error.response?.data?.detail || error.message || "An unknown error occurred.";
            toast.current?.show({ severity: 'error', summary: 'Download Failed', detail: `Could not download PDF. ${errorMsg}`, life: 5000 });
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // --- Manual Edit Dialog Handlers ---

    const openEditDialog = (sectionInfo) => {
        const currentData = getSectionData(sectionInfo);
        const sectionId = getSectionId(sectionInfo.type, sectionInfo.index);
        setCurrentEditingSection({ ...sectionInfo, id: sectionId, documentType: documentType });

        if (sectionInfo.type === 'paragraph') {
            setEditText(currentData ?? '');
            setEditData({});
        } else {
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
        const { type, index, id: sectionId, documentType: currentDocType } = currentEditingSection;
        let newState;

        try {
            if (type === 'paragraph') {
                newState = editText;
            } else if (type === 'header') {
                newState = { ...editData };
            } else if (type === 'footer') {
                const processedData = { ...editData };
                if (currentDocType === 'cover_letter') {
                    if (processedData.attachments_mentioned && typeof processedData.attachments_mentioned === 'string') {
                        processedData.attachments_mentioned = processedData.attachments_mentioned
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                    } else if (!Array.isArray(processedData.attachments_mentioned)) {
                        processedData.attachments_mentioned = [];
                    }
                }
                newState = processedData;
            } else {
                throw new Error("Unknown section type");
            }

            applyStateChange(sectionId, newState);
            updateHistory(sectionId, newState);

            closeEditDialog();
            toast.current?.show({ severity: 'success', summary: 'Updated', detail: `Section updated successfully!`, life: 3000 });
        } catch (error) {
            console.error("Error saving edit:", error);
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: `Failed to update section: ${error.message}`, life: 4000 });
        }
    };

    // --- Rendering Logic ---

    if (loading) {
        return <LoadingIndicator />;
    }
    if (error || !documentData || !documentType) {
        return <ErrorDisplay error={error || "Document data or type is missing."} onRetry={fetchData} />;
    }

    const { header = null, body_paragraphs = [], footer = null } = documentData;

    let renderHeaderFn, renderFooterFn;
    switch (documentType) {
        case 'recommendation_letter':
            renderHeaderFn = renderRecommendationHeaderHtml;
            renderFooterFn = renderRecommendationFooterHtml;
            break;
        case 'motivation_letter':
            renderHeaderFn = renderMotivationHeaderHtml;
            renderFooterFn = renderMotivationFooterHtml;
            break;
        case 'cover_letter':
        default:
            renderHeaderFn = renderCoverLetterHeaderHtml;
            renderFooterFn = renderCoverLetterFooterHtml;
            break;
    }

    return (
        <div className="document-editor flex flex-column h-screen">
            <Toast ref={toast} />

            <EditorToolbar
                onSave={handleSaveChanges}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                documentId={documentId}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
            />

            <div

                className="flex-grow-1 overflow-auto p-4 surface-100 flex justify-content-center"
                style={{
                    background: `linear-gradient(to bottom, transparent 0, transparent calc(297mm - 1px), #ccc calc(297mm - 1px), #ccc 297mm)`,
                    backgroundSize: `100% 297mm`,
                    backgroundRepeat: 'repeat-y',
                    backgroundPosition: 'center top'
                }}
            >

                    <div
                        className="a4-page bg-white shadow-3 border-1 border-300"
                        style={{ width: '210mm', minHeight: '297mm', padding: '0.9cm', boxSizing: 'border-box', marginBottom: '20px' }}
                    >
                        <EditableSection
                            sectionId={getSectionId('header')}
                            onEdit={() => openEditDialog({ type: 'header' })}
                            onUndo={() => handleUndo(getSectionId('header'))}
                            onRedo={() => handleRedo(getSectionId('header'))}
                            canUndo={(historyIndex[getSectionId('header')] ?? 0) > 0}
                            canRedo={(sectionHistory[getSectionId('header')]?.length ?? 0) > (historyIndex[getSectionId('header')] ?? 0) + 1}
                        >
                            <iframe
                                key={`${getSectionId('header')}-${documentType}-${JSON.stringify(header)}`}
                                title={`${documentType} Header`}
                                srcDoc={generateSrcDoc(renderHeaderFn(header), coverLetterCSS, getSectionId('header'))}
                                style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block', minHeight: '100px' }}
                                scrolling="no"
                                sandbox="allow-scripts allow-same-origin"
                                onLoad={handleIframeLoad}
                            />
                        </EditableSection>

                        {body_paragraphs.map((paragraph, index) => {
                            const paragraphId = getSectionId('paragraph', index);
                            return (
                                <EditableSection
                                    key={paragraphId}
                                    sectionId={paragraphId}
                                    onEdit={() => openEditDialog({ type: 'paragraph', index })}
                                    onUndo={() => handleUndo(paragraphId)}
                                    onRedo={() => handleRedo(paragraphId)}
                                    canUndo={(historyIndex[paragraphId] ?? 0) > 0}
                                    canRedo={(sectionHistory[paragraphId]?.length ?? 0) > (historyIndex[paragraphId] ?? 0) + 1}
                                >
                                    <iframe
                                        key={`${paragraphId}-${paragraph}`}
                                        title={`Paragraph ${index + 1}`}
                                        srcDoc={generateSrcDoc(renderParagraphHtml(paragraph), coverLetterCSS, paragraphId)}
                                        style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block' }}
                                        scrolling="no"
                                        sandbox="allow-scripts allow-same-origin"
                                        onLoad={handleIframeLoad}
                                    />
                                </EditableSection>
                            );
                        })}

                        <EditableSection
                            sectionId={getSectionId('footer')}
                            onEdit={() => openEditDialog({ type: 'footer' })}
                            onUndo={() => handleUndo(getSectionId('footer'))}
                            onRedo={() => handleRedo(getSectionId('footer'))}
                            canUndo={(historyIndex[getSectionId('footer')] ?? 0) > 0}
                            canRedo={(sectionHistory[getSectionId('footer')]?.length ?? 0) > (historyIndex[getSectionId('footer')] ?? 0) + 1}
                        >
                            <iframe
                                key={`${getSectionId('footer')}-${documentType}-${JSON.stringify(footer)}`}
                                title={`${documentType} Footer`}
                                srcDoc={generateSrcDoc(renderFooterFn(footer), coverLetterCSS, getSectionId('footer'))}
                                style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block', minHeight: '80px' }}
                                scrolling="no"
                                sandbox="allow-scripts allow-same-origin"
                                onLoad={handleIframeLoad}
                            />
                        </EditableSection>
                    </div>
                </div>

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
            </div>
            );
};

            export default DocumentEditorPage;
