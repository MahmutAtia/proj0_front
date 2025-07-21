"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios'; // Adjust the import path as necessary
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Slider } from 'primereact/slider';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog'; // Import Dialog
import styles from './export.module.css';
import { MOCK_TEMPLATES_WITH_THEMES } from './templates.js';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { SelectButton } from 'primereact/selectbutton';
import { ToggleButton } from 'primereact/togglebutton';
// --- Constants ---
const PDF_ASPECT_RATIO = 1.414;
const BASE_PREVIEW_WIDTH = 800;
const HEADER_HEIGHT = 60; // Approx height of your main app header (adjust if needed)
const TOOLBAR_HEIGHT = 53; // Approx height of the new preview toolbar
const LOADING_MESSAGES = [
    "Generating Preview...",
    "Applying styles...",
    "Rendering layout...",
    "Fetching fonts...",
    "Almost ready...",
    "Just a moment...",
];

const ResumePreviewPage = () => {
    const params = useParams();
    const { data: session, status } = useSession();
    const resumeId = params.id;

    // --- State ---
    const [templatesData, setTemplatesData] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedThemeValue, setSelectedThemeValue] = useState(null);
    const [scale, setScale] = useState(100);
    const [fontScale, setFontScale] = useState('medium');
    const [showIcons, setShowIcons] = useState(false);
    const [showAvatar, setShowAvatar] = useState(false); // New state for avatar
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [errorOptions, setErrorOptions] = useState(null);
    const [errorPdf, setErrorPdf] = useState(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    // --- Calculated Dimensions ---
    const iframeScaleFactor = scale / 100;
    const iframeWidth = BASE_PREVIEW_WIDTH * iframeScaleFactor;
    const iframeHeight = iframeWidth * PDF_ASPECT_RATIO;

    // --- Refs ---
    const pdfBlobCache = useRef({});
    const previewContentRef = useRef(null);
    const loadingIntervalRef = useRef(null);

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

    const generateCacheKey = useCallback((templateId, themeValue, fontScale, showIcons, showAvatar) => {
        if (!resumeId || !templateId || !themeValue) return null;
        return `${resumeId}-${templateId}-${themeValue}-${fontScale}-${showIcons}-${showAvatar}`;
    }, [resumeId]);

    const fetchPdf = useCallback(async (templateObject, themeValue) => {
        if (status !== 'authenticated') {
            setErrorPdf("Authentication required.");
            return;
        }
        if (!templateObject || !themeValue) return;
        const cacheKey = generateCacheKey(templateObject.id, themeValue, fontScale, showIcons, showAvatar);
        const currentPdfUrl = pdfUrl;
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
            const response = await api.post(
                `/api/resumes/generate-pdf/`,
                {
                    resume_id: resumeId,
                    templateTheme: templateObject.value,
                    chosenTheme: themeValue,
                    scale: fontScale,
                    showIcons: showIcons,
                    showAvatar: showAvatar, // Add this parameter
                },
                {
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
    }, [resumeId, status, generateCacheKey, fontScale, showIcons, showAvatar]);

    useEffect(() => {
        if (selectedTemplate && selectedThemeValue) {
            fetchPdf(selectedTemplate, selectedThemeValue);
        }
    }, [selectedTemplate, selectedThemeValue, fetchPdf, fontScale, showIcons, showAvatar]);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    // Effect to cycle through loading messages
    useEffect(() => {
        if (isLoadingPdf) {
            setLoadingMessageIndex(0); // Reset to first message on new load
            loadingIntervalRef.current = setInterval(() => {
                setLoadingMessageIndex(prevIndex =>
                    (prevIndex + 1) % LOADING_MESSAGES.length
                );
            }, 1000); // Change message every 2 seconds
        } else {
            clearInterval(loadingIntervalRef.current); // Clear interval when not loading
        }

        // Cleanup interval on component unmount
        return () => clearInterval(loadingIntervalRef.current);
    }, [isLoadingPdf]);

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
        
        const cacheKey = generateCacheKey(selectedTemplate?.id, selectedThemeValue, fontScale, showIcons, showAvatar);
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
            console.log("Available cache keys:", Object.keys(pdfBlobCache.current));
            console.log("Looking for cache key:", cacheKey);
        }
    };

    const handlePreviewOpen = (imageUrl, event) => {
        event.stopPropagation(); // Prevent card selection when clicking preview
        setPreviewImageUrl(imageUrl || '/images/previews/default.png');
        setIsPreviewVisible(true);
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
                                                        className={`cursor-pointer border-2 hover:shadow-md ${styles.templateCard} ${selectedTemplate?.id === template.id ? 'border-primary shadow-2' : 'border-transparent'} relative`} // Added relative positioning
                                                        onClick={() => handleTemplateSelect(template)}
                                                        pt={{ header: { className: 'p-0' }, body: { className: 'p-0' }, content: { className: 'p-2 text-center' } }}
                                                    >
                                                        {/* --- Preview Button Overlay --- */}
                                                        <Button
                                                            icon="pi pi-eye"
                                                            rounded
                                                            text
                                                            severity="secondary"
                                                            aria-label={`Preview ${template.name}`}
                                                            tooltip="Preview Template"
                                                            tooltipOptions={{ position: 'top', showDelay: 300 }}
                                                            className={`absolute top-0 right-0 mt-1 mr-1 z-1 ${styles.previewButton}`} // Position top-right
                                                            onClick={(e) => handlePreviewOpen(template.previewUrl, e)}
                                                        />
                                                        {/* --- End Preview Button --- */}

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

                    {/* Enhanced Controls Section */}
                    <div className="p-4 border-top-1 surface-border">
                        <h3 className="text-lg font-semibold mb-3 text-color">Preview Settings</h3>
                        


                        {/* Scale Control */}
                        <div className="mb-3">
                            <div className="flex align-items-center justify-content-between mb-2">
                                <label className="text-sm font-medium text-color-secondary">Preview Scale</label>
                                <span className="text-sm font-medium text-color-secondary w-3rem text-right">{scale}%</span>
                            </div>
                            <Slider
                                value={scale}
                                onChange={handleScaleChange}
                                min={50}
                                max={150}
                                step={5}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Download Button */}
                    <div className="p-4 border-top-1 surface-border mt-auto flex-shrink-0">
                        <Button 
                            label="Download PDF" 
                            icon="pi pi-download" 
                            className="w-full" 
                            onClick={handleDownload} 
                            disabled={!pdfUrl || isLoadingPdf || errorPdf || isLoadingOptions} 
                        />
                    </div>
                </div>

                {/* Right Side (Toolbar + Preview) */}
                <div className="col-12 md:col-8 lg:col-9 h-full flex flex-column">

                    {/* Preview Toolbar - NEW */}
                    <div className={`p-2 border-bottom-1 surface-border bg-surface-0 flex align-items-center justify-content-between flex-shrink-0 ${styles.previewToolbar}`} style={{ height: `${TOOLBAR_HEIGHT}px` }}>
                        {/* Left side - Theme and customization controls */}
                        <div className="flex align-items-center gap-3">
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

                            {/* Font Size Selector */}
                            <div className="flex align-items-center gap-2 ml-3">
                                <span className="text-xs uppercase font-semibold text-color-secondary">Size:</span>
                                <SelectButton 
                                    value={fontScale} 
                                    onChange={(e) => setFontScale(e.value)} 
                                    options={[
                                        { label: 'S', value: 'small' },
                                        { label: 'M', value: 'medium' },
                                        { label: 'L', value: 'large' }
                                    ]}
                                    size="small"
                                    disabled={isLoadingOptions || isLoadingPdf}
                                />
                            </div>
                        </div>

                        {/* Right side - Icons and Avatar toggles */}
                        <div className="flex align-items-center gap-3">
                            {/* Icons Toggle */}
                            <div className="flex align-items-center gap-2">
                                <span className="text-xs uppercase font-semibold text-color-secondary">Icons:</span>
                                <ToggleButton
                                    checked={showIcons}
                                    onChange={(e) => setShowIcons(e.value)}
                                    className={`w-3rem h-2rem ${styles.centeredToggle}`}
                                    disabled={isLoadingOptions || isLoadingPdf}
                                />
                            </div>

                            {/* Avatar Toggle */}
                            <div className="flex align-items-center gap-2">
                                <span className="text-xs uppercase font-semibold text-color-secondary">Avatar:</span>
                                <ToggleButton
                                    checked={showAvatar}
                                    onChange={(e) => setShowAvatar(e.value)}
                                    className={`w-3rem h-2rem ${styles.centeredToggle}`}
                                    disabled={isLoadingOptions || isLoadingPdf}
                                />
                            </div>
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
                            <AnimatePresence> {/* Wrap conditional rendering with AnimatePresence */}
                                {isLoadingPdf && (
                                    <motion.div // Use motion.div for animation
                                        key="pdf-loading-overlay" // Add a unique key for AnimatePresence
                                        className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-white-alpha-80 ${styles.overlayBase}`}
                                        initial={{ opacity: 0 }} // Start invisible
                                        animate={{ opacity: 1 }} // Fade in
                                        exit={{ opacity: 0 }}    // Fade out
                                        transition={{ duration: 0.3 }} // Control animation speed
                                    >
                                        <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
                                        {/* Display cycling loading message */}
                                        <p className="mt-3 text-color-secondary">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Error Overlay (Can also be animated similarly if desired) */}
                            {!isLoadingPdf && errorPdf && (
                                <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-red-100 text-red-700 p-4 border-round ${styles.overlayBase}`}>
                                    <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                                    <p className="text-center">{errorPdf}</p>
                                </div>
                            )}
                            {/* PDF Iframe */}
                            {!isLoadingPdf && pdfUrl && !errorPdf && (
                            <iframe
                                key={pdfUrl} // Key helps React replace the iframe correctly
                                src={`${pdfUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`} // Changed FitH to Fit
                                title={`Resume Preview - ${selectedTemplate?.name || ''}`}
                                className={styles.pdfIframe}
                                style={{ width: '100%', height: '100%' }}
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
            {/* --- Template Preview Modal --- */}
            <Dialog
                header="Template Preview"
                visible={isPreviewVisible}
                style={{ width: '90vw', maxWidth: '600px' }} // Responsive width
                modal
                onHide={() => setIsPreviewVisible(false)}
                pt={{
                    content: { className: 'p-0' } // Remove padding from content area
                }}
            >
                <img src={previewImageUrl} alt="Template Preview" style={{ width: '100%', display: 'block' }} />
            </Dialog>
            {/* --- End Modal --- */}

        </div>
    );
};

export default ResumePreviewPage;
