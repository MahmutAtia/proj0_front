"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Slider } from 'primereact/slider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { AnimatePresence, motion } from 'framer-motion'; // Import AnimatePresence
import { useDebouncedCallback } from 'use-debounce';
import api from '@/lib/axios'; // Ensure this points to your configured axios instance
import styles from './export.module.css';
import { MOCK_TEMPLATES_WITH_THEMES } from './templates.js'; // Import mock templates

// --- Constants ---
const PDF_ASPECT_RATIO = 297 / 210; // A4 aspect ratio
const BASE_PREVIEW_WIDTH = 800; // Base width in pixels for 100% scale
const HEADER_HEIGHT = 60;
const TOOLBAR_HEIGHT = 53;
const LOADING_MESSAGES = [
    "Generating Preview...",
    "Applying styles...",
    "Rendering layout...",
    "Fetching fonts...",
    "Almost ready...",
];

const ResumePreviewPage = () => {
    const params = useParams();
    const { data: session, status } = useSession();
    const id = params.id; // Resume ID from URL

    // --- Refs ---
    const toast = useRef(null);
    const previewContentRef = useRef(null);
    const loadingIntervalRef = useRef(null);

    // --- Options State ---
    const [templatesData, setTemplatesData] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [errorOptions, setErrorOptions] = useState(null);
    const [resumeData, setResumeData] = useState(null); // Store resume data for download filename

    // --- Selection State ---
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedThemeValue, setSelectedThemeValue] = useState(null);

    // --- Preview State ---
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [errorPreview, setErrorPreview] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // --- UI State ---
    const [scale, setScale] = useState(100);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    // --- Calculated Dimensions ---
    const iframeScaleFactor = scale / 100;
    const iframeWidth = BASE_PREVIEW_WIDTH * iframeScaleFactor;
    const iframeHeight = iframeWidth * PDF_ASPECT_RATIO;

    // --- Data Fetching ---
    useEffect(() => {
        const fetchOptions = () => {
            if (status !== 'authenticated' || !id) return;
            
            setIsLoadingOptions(true);
            setErrorOptions(null);
            
            try {
                // Use mock templates directly - no API fetching needed
                setTemplatesData(MOCK_TEMPLATES_WITH_THEMES);
                
                // Set initial selection to the first template
                if (MOCK_TEMPLATES_WITH_THEMES.length > 0) {
                    const initialTemplate = MOCK_TEMPLATES_WITH_THEMES[0];
                    setSelectedTemplate(initialTemplate);
                    
                    // Set initial theme to the first theme of the first template
                    if (initialTemplate.themes && initialTemplate.themes.length > 0) {
                        setSelectedThemeValue(initialTemplate.themes[0].value);
                    }
                }
                
            } catch (err) {
                console.error("Failed to load templates:", err);
                setErrorOptions("Could not load templates. Please refresh the page.");
            } finally {
                setIsLoadingOptions(false);
            }
        };

        // Add a small timeout to ensure session is properly loaded
        const timeoutId = setTimeout(fetchOptions, 100);
        return () => clearTimeout(timeoutId);
    }, [id, status]);

    // --- Preview Generation ---
    const debouncedSetPreviewUrl = useDebouncedCallback(() => {
        if (!selectedTemplate || !id) return;

        console.log('Setting preview URL for:', { 
            template: selectedTemplate.value, 
            theme: selectedThemeValue, 
            resumeId: id 
        });

        setIsLoadingPreview(true);
        setErrorPreview(null);

        const themeQueryParam = selectedThemeValue ? `&theme=${selectedThemeValue}` : '';
        // env.NEXT_PUBLIC_BACKEND_URL is assumed to be set in your environment variables
        // Adjust the URL as per your backend API structure

        const url =  `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/resumes/${id}/preview/?template=${selectedTemplate.value}${themeQueryParam}`;
        console.log('Generated preview URL:', url);
        setPreviewUrl(url);
    }, 300);

    useEffect(() => {
        debouncedSetPreviewUrl();
    }, [selectedTemplate, selectedThemeValue, id, debouncedSetPreviewUrl]);

    // --- Loading Message Cycling ---
    useEffect(() => {
        if (isLoadingPreview) {
            loadingIntervalRef.current = setInterval(() => {
                setLoadingMessageIndex(prevIndex => (prevIndex + 1) % LOADING_MESSAGES.length);
            }, 2000);
        } else {
            clearInterval(loadingIntervalRef.current);
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(loadingIntervalRef.current);
    }, [isLoadingPreview]);

    // --- Handlers ---
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        // Reset theme to the default for the new template
        setSelectedThemeValue(template.themes?.[0]?.value || null);
    };

    const handleThemeSelect = (themeValue) => {
        setSelectedThemeValue(themeValue);
    };

    const handleScaleChange = (e) => {
        setScale(e.value);
    };

    const handleIframeLoad = () => {
        console.log('Iframe loaded successfully');
        setIsLoadingPreview(false);
    };

    const handleIframeError = () => {
        console.error('Iframe failed to load');
        setIsLoadingPreview(false);
        setErrorPreview('Failed to load preview. Please try again.');
    };

    const handleDownload = async () => {
        if (!selectedTemplate || !id) {
            toast.current.show({ severity: 'warn', summary: 'Cannot Download', detail: 'Please select a template first.', life: 3000 });
            return;
        }
        setIsDownloading(true);
        try {
            const response = await api.post('/api/resumes/generate-pdf/', {
                resume_id: id,
                templateTheme: selectedTemplate.value, // Use template.value instead of template.id
                chosenTheme: selectedThemeValue,
            }, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = `Resume_${resumeData?.basics?.name?.replace(/\s+/g, '_') || id}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.current.show({ severity: 'success', summary: 'Download Started', detail: 'Your PDF resume is downloading.', life: 3000 });
        } catch (err) {
            console.error('PDF download failed:', err);
            toast.current.show({ severity: 'error', summary: 'Download Failed', detail: 'Could not generate the PDF. Please try again.', life: 4000 });
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePreviewOpen = (imageUrl, event) => {
        event.stopPropagation();
        setPreviewImageUrl(imageUrl);
        setIsPreviewVisible(true);
    };

    // --- Render Skeletons ---
    const renderTemplateSkeletons = () => (
        Array.from({ length: 6 }).map((_, i) => ( // Changed to 6 to match mock templates count
            <div key={`skel-tpl-${i}`} className="col-6 p-1">
                <Skeleton height="150px" className="mb-2 border-round" />
                <Skeleton height="1rem" width="70%" className="mx-auto border-round" />
            </div>
        ))
    );

    const currentThemes = selectedTemplate?.themes || [];

    if (status === 'loading') {
        return <div className="flex justify-content-center align-items-center min-h-screen"><ProgressSpinner /></div>;
    }

    return (
        <div className="min-h-screen flex flex-column bg-surface-100">
            <Toast ref={toast} />

            <div className="flex-grow-1 grid grid-nogutter" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>

                {/* Sidebar Column */}
                <div className="col-12 md:col-4 lg:col-3 flex flex-column h-full border-right-1 surface-border bg-surface-0">
                    <div className="p-4 border-bottom-1 surface-border flex-shrink-0">
                        <h1 className="text-lg font-semibold m-0">Select Template</h1>
                    </div>

                    <div className="p-4 flex-grow-1 overflow-y-auto">
                        {isLoadingOptions ? (
                            <div className="grid grid-nogutter -m-1">{renderTemplateSkeletons()}</div>
                        ) : errorOptions ? (
                            <Message severity="error" text={errorOptions} className="w-full" />
                        ) : (
                            <div className="grid grid-nogutter -m-1">
                                {templatesData.map((template) => (
                                    <div key={template.id} className="col-6 p-1">
                                        <Card
                                            className={`cursor-pointer border-2 hover:shadow-md ${styles.templateCard} ${selectedTemplate?.id === template.id ? 'border-primary shadow-2' : 'border-transparent'} relative`}
                                            onClick={() => handleTemplateSelect(template)}
                                            pt={{ header: { className: 'p-0' }, body: { className: 'p-0' }, content: { className: 'p-2 text-center' } }}
                                        >
                                            <Button
                                                icon="pi pi-eye"
                                                rounded text severity="secondary"
                                                aria-label={`Preview ${template.name}`}
                                                tooltip="Preview Template"
                                                tooltipOptions={{ position: 'top', showDelay: 300 }}
                                                className={`absolute top-0 right-0 mt-1 mr-1 z-1 ${styles.previewButton}`}
                                                onClick={(e) => handlePreviewOpen(template.previewUrl, e)}
                                            />
                                            <img src={template.previewUrl || '/images/previews/default.png'} alt={`${template.name} Preview`} className={`w-full block border-round-top ${styles.templatePreviewImage}`} />
                                            <div className="text-sm font-medium text-color-secondary mt-1">{template.name}</div>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-top-1 surface-border mt-auto flex-shrink-0">
                        <Button
                            label="Download PDF"
                            icon="pi pi-download"
                            className="w-full"
                            onClick={handleDownload}
                            loading={isDownloading}
                            disabled={!selectedTemplate || isLoadingPreview || isLoadingOptions}
                        />
                    </div>
                </div>

                {/* Preview Column */}
                <div className="col-12 md:col-8 lg:col-9 h-full flex flex-column">
                    <div className={`p-2 border-bottom-1 surface-border bg-surface-0 flex align-items-center justify-content-between flex-shrink-0`} style={{ height: `${TOOLBAR_HEIGHT}px` }}>
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
                        </div>

                        <div className="flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                            <i className="pi pi-search-minus text-color-secondary"></i>
                            <Slider value={scale} onChange={handleScaleChange} min={25} max={150} step={5} className="flex-grow-1 mx-1" disabled={isLoadingOptions || isLoadingPreview} />
                            <i className="pi pi-search-plus text-color-secondary"></i>
                            <span className="text-sm font-medium text-color-secondary w-3rem text-right">{scale}%</span>
                        </div>
                    </div>

                    <div
                        ref={previewContentRef}
                        className="flex-grow-1 overflow-auto bg-surface-100 p-4 lg:p-6 flex justify-content-center"
                        style={{ height: `calc(100% - ${TOOLBAR_HEIGHT}px)` }}
                    >
                        <div
                            className={`${styles.pdfContainer} relative`}
                            style={{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }}
                        >
                            <AnimatePresence>
                                {isLoadingPreview && (
                                    <motion.div
                                        key="preview-loading-overlay"
                                        className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-white-alpha-80 ${styles.overlayBase}`}
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="3" />
                                        <p className="mt-3 text-color-secondary">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isLoadingPreview && errorPreview && (
                                <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-2 bg-red-100 text-red-700 p-4 border-round ${styles.overlayBase}`}>
                                    <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                                    <p className="text-center">{errorPreview}</p>
                                </div>
                            )}

                            {/* HTML Preview Iframe */}
                            {previewUrl && !errorPreview && (
                                <iframe
                                    key={previewUrl}
                                    src={previewUrl}
                                    title={`Resume Preview - ${selectedTemplate?.name || ''}`}
                                    className={styles.pdfIframe}
                                    style={{ 
                                        width: '100%', 
                                        height: '100%',
                                        visibility: isLoadingPreview ? 'hidden' : 'visible' 
                                    }}
                                    onLoad={handleIframeLoad}
                                    onError={handleIframeError}
                                />
                            )}

                            {/* Placeholder */}
                            {!previewUrl && !errorPreview && !isLoadingPreview && (
                                <div className={`absolute top-0 left-0 w-full h-full flex flex-column align-items-center justify-content-center z-1 bg-surface-50 text-color-secondary ${styles.overlayBase}`}>
                                    <i className="pi pi-file-edit text-4xl mb-3 text-surface-400"></i>
                                    <p>{isLoadingOptions ? 'Loading options...' : 'Select a template to begin.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Preview Dialog */}
            <Dialog
                header="Template Preview"
                visible={isPreviewVisible}
                style={{ width: '90vw', maxWidth: '600px' }}
                modal
                onHide={() => setIsPreviewVisible(false)}
                pt={{ content: { className: 'p-0' } }}
            >
                <img src={previewImageUrl} alt="Template Preview" style={{ width: '100%', display: 'block' }} />
            </Dialog>
        </div>
    );
};

export default ResumePreviewPage;