"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Slider } from 'primereact/slider';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card'; // Use Card for templates
import { Tooltip } from 'primereact/tooltip';
import styles from './export.module.css'; // Import the minimal CSS

// import mock data from ./templates.js
import { MOCK_TEMPLATES_WITH_THEMES } from './templates.js'; // Adjust the path as necessary

const ResumePreviewPage = ({ params }) => {
    const { data: session, status } = useSession();
    const resumeId = params.id;

    // --- State --- (Keep state variables the same)
    const [templatesData, setTemplatesData] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedThemeValue, setSelectedThemeValue] = useState(null);
    const [scale, setScale] = useState(70);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [errorOptions, setErrorOptions] = useState(null);
    const [errorPdf, setErrorPdf] = useState(null);

    // --- Constants for calculation ---
    const PDF_ASPECT_RATIO = 1.414; // Approx A4 height/width
    const BASE_PREVIEW_WIDTH = 800; // e.g., 800px wide at 100% zoom

    // Calculate iframe dimensions based on scale
    const iframeScaleFactor = scale / 100;
    const iframeWidth = BASE_PREVIEW_WIDTH * iframeScaleFactor;
    const iframeHeight = iframeWidth * PDF_ASPECT_RATIO;

    // --- Refs --- (Keep refs the same)
    const pdfBlobCache = useRef({});
    const previewContentRef = useRef(null); // Ref for the scrollable preview area

    // --- Logic --- (Keep fetching, caching, handlers the same)
    useEffect(() => { /* ... fetchTemplates logic ... */
        const fetchTemplates = async () => { setIsLoadingOptions(true); setErrorOptions(null); setSelectedTemplate(null); setSelectedThemeValue(null); try { await new Promise(resolve => setTimeout(resolve, 600)); setTemplatesData(MOCK_TEMPLATES_WITH_THEMES); } catch (error) { console.error("Error fetching templates:", error); setErrorOptions("Failed to load templates. Please try again."); } finally { setIsLoadingOptions(false); } }; if (status === 'authenticated') fetchTemplates(); else if (status === 'unauthenticated') { setErrorOptions("Please log in to view this page."); setIsLoadingOptions(false); }
    }, [resumeId, status, session?.accessToken]);
    const generateCacheKey = useCallback((templateId, themeValue) => { if (!resumeId || !templateId || !themeValue) return null; return `${resumeId}-${templateId}-${themeValue}`; }, [resumeId]);
    // --- Fetch PDF --- (Using the provided logic)
    // ...existing code...

    // --- Fetch PDF --- (Using the provided logic)
    const fetchPdf = useCallback(async (templateObject, themeValue) => {
        // Check session status directly
        if (status !== 'authenticated') {
            console.log("fetchPdf called while not authenticated, returning.");
            setErrorPdf("Authentication required to generate PDF."); // Set error state
            return;
        }
        if (!templateObject || !themeValue) {
            console.log("fetchPdf called without template or theme, returning.");
            return;
        }

        // Use templateObject.id and themeValue for the key
        const cacheKey = generateCacheKey(templateObject.id, themeValue);
        console.log("fetchPdf - Checking cache for:", cacheKey);

        // --- CHANGE POINT 1: Revoke URL logic moved ---
        // We will revoke the URL *before* setting the new one,
        // but we don't need pdfUrl as a dependency for useCallback.
        // We can access the current pdfUrl via state directly when needed.

        if (pdfBlobCache.current[cacheKey]) {
            console.log("fetchPdf - Cache HIT for:", cacheKey);
            // Revoke previous URL if it exists before setting a new one
            // Access pdfUrl directly from state closure (or use a ref if preferred, but state is fine here)
            const currentPdfUrl = pdfUrl; // Get current value at time of execution
            if (currentPdfUrl) { URL.revokeObjectURL(currentPdfUrl); }
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
            setIsLoadingPdf(false); // Ensure loading is false after cache hit
            setErrorPdf(null); // Clear any previous errors
            return;
        }

        console.log("fetchPdf - Cache MISS for:", cacheKey + ". Fetching from backend...");
        setIsLoadingPdf(true);
        setErrorPdf(null); // Clear previous errors on new fetch
        // Revoke previous URL and clear state before fetching new one
        const currentPdfUrl = pdfUrl; // Get current value at time of execution
        if (currentPdfUrl) { URL.revokeObjectURL(currentPdfUrl); }
        setPdfUrl(null);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate-pdf/`,
                {
                    resumeId: resumeId, // Use resumeId from params
                    templateTheme: templateObject.value, // Pass template file value (e.g., 'template1.html')
                    chosenTheme: themeValue, // Pass the selected theme value string
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // Conditionally add Authorization header
                        ...(session?.accessToken && {
                            'Authorization': `Bearer ${session.accessToken}`
                        })
                    },
                    responseType: 'blob', // Expect a Blob response
                }
            );

            const pdfBlob = response.data;
            const pdfObjectURL = URL.createObjectURL(pdfBlob);
            setPdfUrl(pdfObjectURL);
            pdfBlobCache.current[cacheKey] = pdfBlob; // Store the Blob in cache
            console.log("fetchPdf - Blob stored in cache:", cacheKey);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Set a user-friendly error state
            setErrorPdf(error.response?.data?.message || error.message || "Failed to generate PDF. Please try again.");
        } finally {
            setIsLoadingPdf(false); // Ensure loading is set to false in finally block
        }
        // --- CHANGE POINT 2: Remove pdfUrl from dependencies ---
    }, [resumeId, status, session?.accessToken, generateCacheKey]); // REMOVED pdfUrl

    // --- Trigger PDF Fetch on Selection Change ---
    // This useEffect remains the same
    useEffect(() => {
        if (selectedTemplate && selectedThemeValue) {
            // Pass the whole selectedTemplate object and the theme value string
            fetchPdf(selectedTemplate, selectedThemeValue);
        }
        // No need for the else block here if fetchPdf handles null template/theme
    }, [selectedTemplate, selectedThemeValue, fetchPdf]);

    // --- Cleanup Object URLs on Unmount ---
    // This useEffect remains the same
    useEffect(() => {
        // This effect runs only when the component unmounts
        return () => {
            if (pdfUrl) {
                console.log("Unmounting: Revoking active PDF URL");
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]); // Only depends on pdfUrl




    const handleTemplateSelect = (template) => { if (isLoadingPdf || template.id === selectedTemplate?.id) return; setSelectedTemplate(template); const firstThemeValue = template.themes?.[0]?.value || null; setSelectedThemeValue(firstThemeValue); };
    const handleThemeSelect = (themeValue) => { if (isLoadingPdf || themeValue === selectedThemeValue) return; setSelectedThemeValue(themeValue); };
    const handleScaleChange = (e) => { setScale(e.value); };
    const handleDownload = () => { /* ... handleDownload logic ... */ if (!pdfUrl || isLoadingPdf || errorPdf) return; const cacheKey = generateCacheKey(selectedTemplate?.id, selectedThemeValue); const blob = pdfBlobCache.current[cacheKey]; if (blob) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); const templateName = selectedTemplate?.name.replace(/\s+/g, '-') || 'Resume'; const themeName = selectedTemplate?.themes.find(t => t.value === selectedThemeValue)?.name.replace(/\s+/g, '-') || 'DefaultTheme'; link.download = `${templateName}-${themeName}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); } else { console.error("Download failed: Blob not found in cache."); } };

    // --- Render Skeletons ---
    const renderTemplateSkeletons = () => (
        Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-tpl-${i}`} className="col-6">
                <Skeleton height="150px" className="mb-2 border-round" />
                <Skeleton height="1rem" width="70%" className="mx-auto border-round" />
            </div>
        ))
    );
    const renderThemeSkeletons = () => (
        <div className="flex align-items-center gap-2"> {/* Use gap-2 */}
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`skel-thm-${i}`} shape="circle" size="24px" />
            ))}
        </div>
    );

    // --- Current Themes ---
    const currentThemes = selectedTemplate?.themes || [];

    // --- Render Component ---
    return (
        // Use min-h-screen for full height, bg-surface-100 for a light gray background
        <div className="min-h-screen flex flex-column bg-surface-100">
            {/* Main Grid */}
            <div className="flex-grow-1 grid grid-nogutter" style={{ height: 'calc(100vh - 60px)' }}> {/* Adjust 60px for header */}

                {/* Control Panel */}
                <div className="col-12 md:col-4 lg:col-3 flex flex-column h-full border-right-1 surface-border bg-surface-0"> {/* White background */}
                    {/* Panel Header */}
                    <div className="p-4 border-bottom-1 surface-border flex-shrink-0">
                        <h1 className="text-lg font-semibold m-0">Export Options</h1>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="p-4 flex-grow-1 overflow-y-auto">
                        {isLoadingOptions ? (
                            <> {/* Skeleton Loading */}
                                <div className="mb-5">
                                    <Skeleton height="0.8rem" width="40%" className="mb-3 border-round" />
                                    <div className="grid"> {renderTemplateSkeletons()} </div>
                                </div>
                                <div className="mb-5">
                                    <Skeleton height="0.8rem" width="30%" className="mb-3 border-round" />
                                    {renderThemeSkeletons()}
                                </div>
                                <div>
                                    <Skeleton height="0.8rem" width="25%" className="mb-3 border-round" />
                                    <Skeleton height="2rem" className="border-round" />
                                </div>
                            </>
                        ) : errorOptions ? (
                            <Message severity="error" text={errorOptions} className="w-full" />
                        ) : (
                            <> {/* Loaded Content */}
                                {/* Templates Section */}
                                <div className="mb-5">
                                    <h2 className="text-xs uppercase font-semibold text-color-secondary mb-3">Template</h2>
                                    {templatesData.length > 0 ? (
                                        <div className="grid grid-nogutter -m-1"> {/* Negative margin to counter card padding */}
                                            {templatesData.map((template) => (
                                                <div key={template.id} className="col-6 p-1"> {/* Padding for spacing */}
                                                    <Card
                                                        className={`cursor-pointer border-2 hover:shadow-md ${styles.templateCard} ${selectedTemplate?.id === template.id ? 'border-primary shadow-2' : 'border-transparent'}`}
                                                        onClick={() => handleTemplateSelect(template)}
                                                        pt={{ // Use PassThrough to style internal Card elements
                                                            header: { className: 'p-0' }, // Remove default header padding
                                                            body: { className: 'p-0' }, // Remove default body padding
                                                            content: { className: 'p-2 text-center' } // Padding for name
                                                        }}
                                                    >
                                                        <img
                                                            src={template.previewUrl || '/images/previews/default.png'}
                                                            alt={`${template.name} Preview`}
                                                            className={`w-full block border-round-top ${styles.templatePreviewImage}`} // Use custom class for height/fit
                                                        />
                                                        <div className="text-sm font-medium text-color-secondary mt-1">{template.name}</div>
                                                    </Card>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-sm text-color-secondary">No templates available.</p>)}
                                </div>

                                {/* Themes Section (Conditional) */}
                                {selectedTemplate && (
                                    <div className="mb-5">
                                        <h2 className="text-xs uppercase font-semibold text-color-secondary mb-3">Theme</h2>
                                        {currentThemes.length > 0 ? (
                                            <div className="flex flex-wrap align-items-center gap-2"> {/* Use gap-2 */}
                                                {currentThemes.map((theme) => (
                                                    <React.Fragment key={theme.value}>
                                                        <Tooltip target={`.swatch-${theme.value}`} content={theme.name} position="bottom" />
                                                        <div
                                                            className={`${styles.themeSwatch} swatch-${theme.value} ${selectedThemeValue === theme.value ? styles.themeSwatchSelected : ''}`}
                                                            style={{ backgroundColor: theme.color || 'var(--surface-200)' }} // Use surface-200 for fallback
                                                            onClick={() => handleThemeSelect(theme.value)}
                                                        />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ) : (<p className="text-sm text-color-secondary">No themes for this template.</p>)}
                                    </div>
                                )}

                                {/* Scale Section */}
                                <div>
                                    <h2 className="text-xs uppercase font-semibold text-color-secondary mb-3">Zoom</h2>
                                    <div className="flex align-items-center gap-3"> {/* Use gap-3 */}
                                        <Slider value={scale} onChange={handleScaleChange} min={25} max={150} step={5} className="flex-grow-1" />
                                        <span className="text-sm font-medium text-color-secondary w-3rem text-right">{scale}%</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Download Button Area */}
                    <div className="p-4 border-top-1 surface-border mt-auto flex-shrink-0"> {/* mt-auto pushes to bottom */}
                        <Button
                            label="Download PDF"
                            icon="pi pi-download"
                            className="w-full" // Full width
                            onClick={handleDownload}
                            disabled={!pdfUrl || isLoadingPdf || errorPdf || isLoadingOptions}
                        />
                    </div>
                </div>

                {/* Preview Area - Handles scrolling and centers content */}
                <div
                    ref={previewContentRef}
                    className="col-12 md:col-8 lg:col-9 h-full overflow-auto bg-surface-100 p-4 lg:p-6 flex justify-content-center" // Added flex justify-content-center
                >
                    {/* PDF Container - No CSS scaling, size set dynamically */}
                    <div
                        className={`${styles.pdfContainer} relative`} // Use relative for overlay positioning
                        style={{
                            width: `${iframeWidth}px`, // Apply calculated width
                            height: `${iframeHeight}px` // Apply calculated height
                        }}
                    >
                        {/* Loading Overlay */}
                        {isLoadingPdf && (
                            <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-white-alpha-80 ${styles.overlayBase}`}>
                                <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
                                <p className="mt-3 text-color-secondary">Generating Preview...</p>
                            </div>
                        )}
                        {/* Error Overlay */}
                        {!isLoadingPdf && errorPdf && (
                             <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-red-100 text-red-700 p-4 border-round ${styles.overlayBase}`}>
                                <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                                <p className="text-center">{errorPdf}</p>
                            </div>
                        )}
                        {/* PDF Iframe - Fills its container */}
                        {!isLoadingPdf && pdfUrl && !errorPdf && (
                            <iframe
                                key={pdfUrl}
                                src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                title={`Resume Preview - ${selectedTemplate?.name || ''}`}
                                className={styles.pdfIframe} // Ensure this has width/height 100%
                                style={{
                                    width: '100%', // Fill the container
                                    height: '100%', // Fill the container
                                }}
                            />
                        )}
                        {/* Placeholder */}
                        {!isLoadingPdf && !pdfUrl && !errorPdf && (
                            <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-1 bg-surface-50 text-color-secondary ${styles.overlayBase}`}>
                                <i className="pi pi-file-edit text-4xl mb-3 text-surface-400"></i>
                                <p>{isLoadingOptions ? 'Loading options...' : 'Select a template to begin.'}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ResumePreviewPage;
