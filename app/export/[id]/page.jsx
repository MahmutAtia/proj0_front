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

// Mock data (Keep the same structure)
const MOCK_TEMPLATES_WITH_THEMES = [
    {
      id: 't0',
      name: 'Default (Modern)',
      value: 'default.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Dark Blue/Grey)', value: 'theme-default', color: '#2c3e50' },
        { name: 'Blue', value: 'theme-blue', color: '#1a5276' },
        { name: 'Green', value: 'theme-green', color: '#1e8449' },
        { name: 'Grey', value: 'theme-grey', color: '#566573' },
      ],
    },
    {
      id: 't1',
      name: 'Europass Inspired',
      value: 'template1.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Europass Blue)', value: 'theme-default', color: '#003399' },
        { name: 'Grey', value: 'theme-grey', color: '#6c757d' },
        { name: 'Blue', value: 'theme-blue', color: '#0056b3' },
        { name: 'Green', value: 'theme-green', color: '#28a745' },
      ],
    },
    {
      id: 't2',
      name: 'Bootstrap Focused',
      value: 'template2.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Bootstrap Blue)', value: 'theme-default', color: '#0d6efd' },
        { name: 'Grey', value: 'theme-grey', color: '#6c757d' },
        { name: 'Blue', value: 'theme-blue', color: '#0056b3' },
        { name: 'Green', value: 'theme-green', color: '#198754' },
      ],
    },
    {
      id: 't3',
      name: 'Classic Serif',
      value: 'template3.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Dark Blue Accent)', value: 'theme-default', color: '#003366' },
        { name: 'Grey', value: 'theme-grey', color: '#505050' },
        { name: 'Maroon', value: 'theme-maroon', color: '#800000' },
        { name: 'Dark Green', value: 'theme-darkgreen', color: '#006400' },
      ],
    },
    {
      id: 't4',
      name: 'Vibrant Gradient (Sidebar)',
      value: 'template4.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Purple/Blue Gradient)', value: 'theme-default', color: '#6a11cb' },
        { name: 'Sunset Gradient', value: 'theme-sunset', color: '#ff7e5f' },
        { name: 'Forest Gradient', value: 'theme-forest', color: '#0f2027' },
        { name: 'Mono Gradient', value: 'theme-mono', color: '#333333' },
      ],
    },
    {
      id: 't5',
      name: 'Vibrant Gradient (Header)',
      value: 'template5.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Purple/Blue Gradient)', value: 'theme-default', color: '#6a11cb' },
        { name: 'Sunset Gradient', value: 'theme-sunset', color: '#ff7e5f' },
        { name: 'Forest Gradient', value: 'theme-forest', color: '#0f2027' },
        { name: 'Mono Gradient', value: 'theme-mono', color: '#333333' },
      ],
    },
    {
      id: 't6',
      name: 'Futuristic / Dark',
      value: 'template6.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Refined Dark)', value: 'theme-default', color: '#181a20' },
        { name: 'Cyberpunk Neon', value: 'theme-cyberpunk', color: '#f02e8a' }, // Using accent color for representation
        { name: 'Clean Light', value: 'theme-cleanlight', color: '#f4f7f9' },
        { name: 'Deep Space Mono', value: 'theme-deepspace', color: '#0a0a0f' },
      ],
    },
    {
      id: 't7',
      name: 'Historical / Textured',
      value: 'template7.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Renaissance Manuscript)', value: 'theme-default', color: '#fdf6e3' },
        { name: 'Viking Runestone', value: 'theme-viking', color: '#e0e0e0' },
        { name: 'Arabesque Scroll', value: 'theme-arabesque', color: '#fffaf0' },
        { name: 'Spanish Armada Map', value: 'theme-armada', color: '#e1f5fe' },
      ],
    },
    {
      id: 't8',
      name: 'Minimalist Inkwell',
      value: 'template8.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Inkwell & Quill)', value: 'theme-default', color: '#fdfbf5' },
      ],
    },
    {
      id: 't9',
      name: 'Haze / Soft Gradient',
      value: 'template9.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Golden Hour Haze)', value: 'theme-default', color: '#fff8f0' },
        { name: 'Dusk Haze', value: 'theme-dusk', color: '#f5f2f8' },
        { name: 'Dawn Haze', value: 'theme-dawn', color: '#fffaf4' },
      ],
    },
    {
      id: 't10',
      name: 'Cyberpunk Glitch',
      value: 'template10.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Chromatic Glitch)', value: 'theme-default', color: '#0f0f1a' },
        { name: 'Green Matrix', value: 'theme-matrix', color: '#000000' }, // Using background color for representation
      ],
    },
    {
      id: 't11',
      name: 'Quantum Foam (Dark)',
      value: 'template11.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Quantum Foam)', value: 'theme-default', color: '#0a0f1a' },
      ],
    },
      {
      id: 't12',
      name: 'Modern Minimalist',
      value: 'template12.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Clean White)', value: 'theme-default', color: '#ffffff' },
      ],
    },
    {
      id: 't13',
      name: 'Midnight Bloom (Dark)',
      value: 'template13.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Midnight Bloom)', value: 'theme-default', color: '#1a1a2e' },
      ],
    },
     {
      id: 't14',
      name: 'Blueprint Schematic',
      value: 'template14.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Blueprint Blue)', value: 'theme-default', color: '#ffffff' }, // Using background color
      ],
    },
    {
      id: 't15',
      name: 'Japonisme / Wabi-Sabi',
      value: 'template15.html',
      previewUrl: 'https://s3.resume.io/uploads/examples/resume/resume_pages/222/persistent-resource/student-resume-examples.jpg', // Generic placeholder
      themes: [
        { name: 'Default (Soft & Subtle)', value: 'theme-default', color: '#f8f8f4' },
      ],
    },
  ];

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

    // --- Refs --- (Keep refs the same)
    const pdfBlobCache = useRef({});
    const previewContentRef = useRef(null); // Ref for the scrollable preview area

    // --- Logic --- (Keep fetching, caching, handlers the same)
    useEffect(() => { /* ... fetchTemplates logic ... */
        const fetchTemplates = async () => { setIsLoadingOptions(true); setErrorOptions(null); setSelectedTemplate(null); setSelectedThemeValue(null); try { await new Promise(resolve => setTimeout(resolve, 600)); setTemplatesData(MOCK_TEMPLATES_WITH_THEMES); } catch (error) { console.error("Error fetching templates:", error); setErrorOptions("Failed to load templates. Please try again."); } finally { setIsLoadingOptions(false); } }; if (status === 'authenticated') fetchTemplates(); else if (status === 'unauthenticated') { setErrorOptions("Please log in to view this page."); setIsLoadingOptions(false); }
    }, [resumeId, status, session?.accessToken]);
    const generateCacheKey = useCallback((templateId, themeValue) => { if (!resumeId || !templateId || !themeValue) return null; return `${resumeId}-${templateId}-${themeValue}`; }, [resumeId]);
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

        if (pdfBlobCache.current[cacheKey]) {
            console.log("fetchPdf - Cache HIT for:", cacheKey);
            // Revoke previous URL if it exists before setting a new one
            if (pdfUrl) { URL.revokeObjectURL(pdfUrl); }
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
            setIsLoadingPdf(false); // Ensure loading is false after cache hit
            setErrorPdf(null); // Clear any previous errors
            return;
        }

        console.log("fetchPdf - Cache MISS for:", cacheKey + ". Fetching from backend...");
        setIsLoadingPdf(true);
        setErrorPdf(null); // Clear previous errors on new fetch
        // Revoke previous URL and clear state before fetching new one
        if (pdfUrl) { URL.revokeObjectURL(pdfUrl); }
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
    }, [resumeId, status, session?.accessToken, generateCacheKey, pdfUrl]); // Added pdfUrl to dependencies for cleanup logic within fetchPdf

    useEffect(() => { if (selectedTemplate && selectedThemeValue) fetchPdf(selectedTemplate, selectedThemeValue); else if (!selectedTemplate || !selectedThemeValue) { if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); } setErrorPdf(null); } }, [selectedTemplate, selectedThemeValue, fetchPdf]);
    useEffect(() => { return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }; }, [pdfUrl]);
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
                                    ) : ( <p className="text-sm text-color-secondary">No templates available.</p> )}
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
                                        ) : ( <p className="text-sm text-color-secondary">No themes for this template.</p> )}
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

                {/* Preview Area */}
                <div ref={previewContentRef} className="col-12 md:col-8 lg:col-9 h-full overflow-auto bg-surface-100 p-4 lg:p-6"> {/* Light gray bg, padding */}
                    {/* PDF Container with scaling */}
                    <div
                        className={`${styles.pdfContainer} relative`} // Use relative for overlay positioning
                        style={{ transform: `scale(${scale / 100})`, transformOrigin: 'center top' }}
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
                        {/* PDF Iframe */}
                        {!isLoadingPdf && pdfUrl && !errorPdf && (
                            <iframe
                                key={pdfUrl} // Force re-render on src change
                                src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                title={`Resume Preview - ${selectedTemplate?.name || ''}`}
                                className={styles.pdfIframe}
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
