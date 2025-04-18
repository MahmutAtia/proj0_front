"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

const ResumePreviewPage = ({ params }) => {
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('default.html');
    const [selectedTheme, setSelectedTheme] = useState('theme-default');
    const router = useRouter();
    const { data: session, status } = useSession();
    const iframeRef = useRef(null);

    // Client-side cache for generated PDF Blobs
    const pdfBlobCache = useRef({});

    const templates = [
        { name: 'Default', value: 'default.html' },
        // ... other templates
    ];

    const themes = [
        { name: 'Default', value: 'theme-default' },
        { name: 'Dark', value: 'theme-grey' },
        { name: 'blue', value: 'theme-blue' },
        { name: 'green', value: 'theme-green' },
    ];

    const generateCacheKey = (resumeId, template, theme) => {
        const key = `${resumeId}-${template}-${theme}`;
        console.log("Generated Cache Key:", key);
        return key;
    };

    const fetchPdf = async (template, theme) => {
        if (status === 'loading') {
            console.log("fetchPdf called while loading, returning.");
            return;
        }

        const resumeId = params.id;
        const cacheKey = generateCacheKey(resumeId, template, theme);
        console.log("fetchPdf - Checking cache for:", cacheKey);

        if (pdfBlobCache.current[cacheKey]) {
            console.log("fetchPdf - Cache HIT for:", cacheKey);
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
            setLoading(false); // Ensure loading is false after cache hit
            return;
        }

        console.log("fetchPdf - Cache MISS for:", cacheKey + ". Fetching from backend...");
        setLoading(true);
        setPdfUrl(null);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate-pdf/`,
                {
                    resumeId: resumeId,
                    templateTheme: template,
                    chosenTheme: theme,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(session?.accessToken && {
                            'Authorization': `Bearer ${session.accessToken}`
                        })
                    },
                    responseType: 'blob',
                }
            );

            const pdfBlob = response.data;
            const pdfObjectURL = URL.createObjectURL(pdfBlob);
            setPdfUrl(pdfObjectURL);
            pdfBlobCache.current[cacheKey] = pdfBlob; // Store the Blob
            console.log("fetchPdf - Blob stored in cache:", pdfBlobCache.current);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally set an error state here
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("useEffect [params.id, status, session?.accessToken] triggered. Initial fetch.");
        fetchPdf(selectedTemplate, selectedTheme);
    }, [params.id, status, session?.accessToken]);

    useEffect(() => {
        return () => {
            console.log("useEffect cleanup triggered. Revoking Object URLs.");
            // Only revoke the current pdfUrl to avoid memory leaks
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]); // Keep dependency on pdfUrl for cleaning up the current URL

    const handleTemplateChange = (e) => {
        const newTemplate = e.value;
        console.log("handleTemplateChange - New template selected:", newTemplate);
        setSelectedTemplate(newTemplate);
        const cacheKey = generateCacheKey(params.id, newTemplate, selectedTheme);
        console.log("handleTemplateChange - Checking cache for:", cacheKey);
        if (pdfBlobCache.current[cacheKey]) {
            console.log("handleTemplateChange - Cache HIT for:", cacheKey);
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
        } else {
            console.log("handleTemplateChange - Cache MISS for:", cacheKey + ". Calling fetchPdf.");
            fetchPdf(newTemplate, selectedTheme);
        }
    };

    const handleThemeChange = (e) => {
        const newTheme = e.value;
        console.log("handleThemeChange - New theme selected:", newTheme);
        setSelectedTheme(newTheme);
        const cacheKey = generateCacheKey(params.id, selectedTemplate, newTheme);
        console.log("handleThemeChange - Checking cache for:", cacheKey);
        if (pdfBlobCache.current[cacheKey]) {
            console.log("handleThemeChange - Cache HIT for:", cacheKey);
            setPdfUrl(URL.createObjectURL(pdfBlobCache.current[cacheKey]));
        } else {
            console.log("handleThemeChange - Cache MISS for:", cacheKey + ". Calling fetchPdf.");
            fetchPdf(selectedTemplate, newTheme);
        }
    };

    return (
        <div className="layout-wrapper">
            <div className="layout-content">
                <div className="grid p-fluid">
                    <div className="col-12 md:col-3">
                        <Panel header="Customize Preview">
                            <div className="mb-3">
                                <label htmlFor="template" className="block text-900 font-medium mb-2">Template</label>
                                <Dropdown
                                    id="template"
                                    value={selectedTemplate}
                                    options={templates}
                                    onChange={handleTemplateChange}
                                    optionLabel="name"
                                    optionValue="value"
                                    placeholder="Select a Template"
                                    className="w-full"
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="theme" className="block text-900 font-medium mb-2">Theme</label>
                                <Dropdown
                                    id="theme"
                                    value={selectedTheme}
                                    options={themes}
                                    onChange={handleThemeChange}
                                    optionLabel="name"
                                    optionValue="value"
                                    placeholder="Select a Theme"
                                    className="w-full"
                                />
                            </div>
                        </Panel>
                    </div>
                    <div className="col-12 md:col-9">
                        <Panel header="PDF Preview">
                            {loading ? (
                                <div className="flex justify-content-center align-items-center h-full">
                                    <ProgressSpinner />
                                </div>
                            ) : pdfUrl ? (
                                <iframe
                                    ref={iframeRef}
                                    src={pdfUrl}
                                    type="application/pdf"
                                    width="100%"
                                    height="600px"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <div className="text-center">Error loading PDF.</div>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumePreviewPage;
