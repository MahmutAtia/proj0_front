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
import { Card } from 'primereact/card';
import { Tooltip } from 'primereact/tooltip';
import styles from './export.module.css';
import { MOCK_TEMPLATES_WITH_THEMES } from './templates.js';

// --- Constants ---
const PDF_ASPECT_RATIO = 1.414;
const BASE_PREVIEW_WIDTH = 800;
const HEADER_HEIGHT = 60; // Approx height of your main app header (adjust if needed)
const TOOLBAR_HEIGHT = 53; // Approx height of the new preview toolbar

const ResumePreviewPage = ({ params }) => {
    const { data: session, status } = useSession();
    const resumeId = params.id;

    // --- State ---
    const [templatesData, setTemplatesData] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedThemeValue, setSelectedThemeValue] = useState(null);
    const [scale, setScale] = useState(70);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [errorOptions, setErrorOptions] = useState(null);
    const [errorPdf, setErrorPdf] = useState(null);

    // --- Calculated Dimensions ---
    const iframeScaleFactor = scale / 100;
    const iframeWidth = BASE_PREVIEW_WIDTH * iframeScaleFactor;
    const iframeHeight = iframeWidth * PDF_ASPECT_RATIO;

    // --- Refs ---
    const pdfBlobCache = useRef({});
    const previewContentRef = useRef(null);

    // --- Logic (fetchTemplates, generateCacheKey, fetchPdf, useEffects) ---
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingOptions(true);
            setErrorOptions(null);
            setSelectedTemplate(null);
            setSelectedThemeValue(null);
            try {
                await new Promise(resolve => setTimeout(resolve, 600));
                setTemplatesData(MOCK_TEMPLATES_WITH_THEMES);
            } catch (error) {
                console.error("Error fetching templates:", error);
                setErrorOptions("Failed to load templates. Please try again.");
            } finally {
                setIsLoadingOptions(false);
            }
        };
        if (status === 'authenticated') fetchTemplates();
        else if (status === 'unauthenticated') {
            setErrorOptions("Please log in to view this page.");
            setIsLoadingOptions(false);
        }
    }, [resumeId, status, session?.accessToken]);

    const generateCacheKey = useCallback((templateId, themeValue) => {
        if (!resumeId || !templateId || !themeValue) return null;
        return `${resumeId}-${templateId}-${themeValue}`;
    }, [resumeId]);

    const fetchPdf = useCallback(async (templateObject, themeValue) => {
        if (status !== 'authenticated') {
            setErrorPdf("Authentication required.");
            return;
        }
        if (!templateObject || !themeValue) return;
        const cacheKey = generateCacheKey(templateObject.id, themeValue);
        const currentPdfUrl = pdfUrl; // Capture current URL before potential state change
        if (pdfBlobCache.current[cacheKey]) {
            if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
            setIsLoadingPdf(false);
            setErrorPdf(null);
            return;
        }
        setIsLoadingPdf(true);
        setErrorPdf(null);
        if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
        setPdfUrl(null);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate-pdf/`,
                {
                    resumeId: resumeId,
                    templateTheme: templateObject.value,
                    chosenTheme: themeValue,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` })
                    },
                    responseType: 'blob',
                }
            );
            const pdfBlob = response.data;
            const pdfObjectURL = URL.createObjectURL(pdfBlob);
            setPdfUrl(pdfObjectURL);
            pdfBlobCache.current[cacheKey] = pdfBlob;
        } catch (error) {
            console.error("Error generating PDF:", error);
            setErrorPdf(error.response?.data?.message || error.message || "Failed to generate PDF.");
        } finally {
            setIsLoadingPdf(false);
        }
    }, [resumeId, status, session?.accessToken, generateCacheKey]);

    useEffect(() => {
        if (selectedTemplate && selectedThemeValue) {
            fetchPdf(selectedTemplate, selectedThemeValue);
        }
    }, [selectedTemplate, selectedThemeValue, fetchPdf]);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    // --- Handlers ---
    const handleTemplateSelect = (template) => {
        if (isLoadingPdf || template.id === selectedTemplate?.id) return;
        setSelectedTemplate(template);
        const firstThemeValue = template.themes?.[0]?.value || null;
        setSelectedThemeValue(firstThemeValue);
    };

    const handleThemeSelect = (themeValue) => {
        if (isLoadingPdf || themeValue === selectedThemeValue) return;
        setSelectedThemeValue(themeValue);
    };

    const handleScaleChange = (e) => {
        setScale(e.value);
    };

    const handleDownload = () => {
        if (!pdfUrl || isLoadingPdf || errorPdf) return;
        const cacheKey = generateCacheKey(selectedTemplate?.id, selectedThemeValue);
        const blob = pdfBlobCache.current[cacheKey];
        if (blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const templateName = selectedTemplate?.name.replace(/\s+/g, '-') || 'Resume';
            const themeName = selectedTemplate?.themes.find(t => t.value === selectedThemeValue)?.name.replace(/\s+/g, '-') || 'DefaultTheme';
            link.download = `${templateName}-${themeName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } else {
            console.error("Download failed: Blob not found in cache.");
        }
    };

    // --- Render Skeletons ---
    const renderTemplateSkeletons = () => (
        Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-tpl-${i}`} className="col-6">
                <Skeleton height="150px" className="mb-2 border-round" />
                <Skeleton height="1rem" width="70%" className="mx-auto border-round" />
            </div>
        ))
    );

    // --- Current Themes ---
    const currentThemes = selectedTemplate?.themes || [];

    // --- Render Component ---
    return (
        <div className="min-h-screen flex flex-column bg-surface-100">
            {/* Main Grid - Adjust height calculation */}
            <div className="flex-grow-1 grid grid-nogutter" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>

                {/* Control Panel (Templates Only) */}
                <div className="col-12 md:col-4 lg:col-3 flex flex-column h-full border-right-1 surface-border bg-surface-0">
                    {/* Panel Header */}
                    <div className="p-4 border-bottom-1 surface-border flex-shrink-0">
                        <h1 className="text-lg font-semibold m-0">Select Template</h1>
                    </div>

                    {/* Scrollable Content Area (Templates) */}
                    <div className="p-4 flex-grow-1 overflow-y-auto">
                        {isLoadingOptions ? (
                            <> {/* Skeleton Loading */}
                                <div className="mb-5">
                                    <div className="grid"> {renderTemplateSkeletons()} </div>
                                </div>
                            </>
                        ) : errorOptions ? (
                            <Message severity="error" text={errorOptions} className="w-full" />
                        ) : (
                            <> {/* Loaded Content */}
                                {/* Templates Section */}
                                <div className="mb-5">
                                    {templatesData.length > 0 ? (
                                        <div className="grid grid-nogutter -m-1">
                                            {templatesData.map((template) => (
                                                <div key={template.id} className="col-6 p-1">
                                                    <Card
                                                        className={`cursor-pointer border-2 hover:shadow-md ${styles.templateCard} ${selectedTemplate?.id === template.id ? 'border-primary shadow-2' : 'border-transparent'}`}
                                                        onClick={() => handleTemplateSelect(template)}
                                                        pt={{ header: { className: 'p-0' }, body: { className: 'p-0' }, content: { className: 'p-2 text-center' } }}
                                                    >
                                                        <img src={template.previewUrl || '/images/previews/default.png'} alt={`${template.name} Preview`} className={`w-full block border-round-top ${styles.templatePreviewImage}`} />
                                                        <div className="text-sm font-medium text-color-secondary mt-1">{template.name}</div>
                                                    </Card>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-sm text-color-secondary">No templates available.</p>)}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Download Button Area */}
                    <div className="p-4 border-top-1 surface-border mt-auto flex-shrink-0">
                        <Button label="Download PDF" icon="pi pi-download" className="w-full" onClick={handleDownload} disabled={!pdfUrl || isLoadingPdf || errorPdf || isLoadingOptions} />
                    </div>
                </div>

                {/* Right Side (Toolbar + Preview) */}
                <div className="col-12 md:col-8 lg:col-9 h-full flex flex-column">

                    {/* Preview Toolbar - NEW */}
                    <div className={`p-2 border-bottom-1 surface-border bg-surface-0 flex align-items-center justify-content-between flex-shrink-0 ${styles.previewToolbar}`} style={{ height: `${TOOLBAR_HEIGHT}px` }}>
                        {/* Theme Selector (Conditional) */}
                        <div className="flex align-items-center gap-2">
                            {selectedTemplate && currentThemes.length > 0 && (
                                <>
                                    <span className="text-xs uppercase font-semibold text-color-secondary mr-1">Theme:</span>
                                    {currentThemes.map((theme) => (
                                        <React.Fragment key={theme.value}>
                                            <Tooltip target={`.swatch-${theme.value}`} content={theme.name} position="bottom" />
                                            <div
                                                className={`${styles.themeSwatch} swatch-${theme.value} ${selectedThemeValue === theme.value ? styles.themeSwatchSelected : ''}`}
                                                style={{ backgroundColor: theme.color || 'var(--surface-200)' }}
                                                onClick={() => handleThemeSelect(theme.value)}
                                            />
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                            {selectedTemplate && currentThemes.length === 0 && (
                                <span className="text-xs text-color-secondary">No themes for this template.</span>
                            )}
                        </div>

                        {/* Zoom Control */}
                        <div className="flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                            <i className="pi pi-search-minus text-color-secondary"></i>
                            <Slider value={scale} onChange={handleScaleChange} min={25} max={150} step={5} className="flex-grow-1 mx-1" disabled={isLoadingOptions || isLoadingPdf} />
                            <i className="pi pi-search-plus text-color-secondary"></i>
                            <span className="text-sm font-medium text-color-secondary w-3rem text-right">{scale}%</span>
                        </div>
                    </div>

                    {/* Preview Area - Adjust height calculation */}
                    <div
                        ref={previewContentRef}
                        className="flex-grow-1 overflow-auto bg-surface-100 p-4 lg:p-6 flex justify-content-center"
                        style={{ height: `calc(100% - ${TOOLBAR_HEIGHT}px)` }}
                    >
                        {/* PDF Container - Size set dynamically */}
                        <div
                            className={`${styles.pdfContainer} relative`}
                            style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}
                        >
                            {/* Overlays and Iframe */}
                            {isLoadingPdf && (
                                <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-white-alpha-80 ${styles.overlayBase}`}>
                                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
                                    <p className="mt-3 text-color-secondary">Generating Preview...</p>
                                </div>
                            )}
                            {!isLoadingPdf && errorPdf && (
                                <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-red-100 text-red-700 p-4 border-round ${styles.overlayBase}`}>
                                    <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                                    <p className="text-center">{errorPdf}</p>
                                </div>
                            )}
                            {!isLoadingPdf && pdfUrl && !errorPdf && (
                                <iframe
                                    key={pdfUrl}
                                    src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                    title={`Resume Preview - ${selectedTemplate?.name || ''}`}
                                    className={styles.pdfIframe}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            )}
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
        </div>
    );
};

export default ResumePreviewPage;
