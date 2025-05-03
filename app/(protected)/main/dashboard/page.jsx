"use client"; // If this layout component is also client-side
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Ripple } from 'primereact/ripple';


// Add these helper functions
const getDocumentIcon = (type) => {
    const icons = {
        resume: 'pi pi-file',
        coverLetter: 'pi pi-envelope',
        motivation: 'pi pi-heart',
        portfolio: 'pi pi-briefcase'
    };
    return icons[type] || 'pi pi-file';
};

const getDocumentDescription = (type) => {
    const descriptions = {
        resume: 'Professional summary of your experience and skills',
        coverLetter: 'Compelling introduction to potential employers',
        motivation: 'Personal statement of career goals',
        portfolio: 'Showcase of your best work and achievements'
    };
    return descriptions[type] || '';
};

// New helper function for document titles
const getDocumentTitle = (doc) => {
    // First check if doc has a title property
    if (doc.title) {
        return doc.title;
    }

    // Otherwise use the type with proper formatting
    const titles = {
        resume: 'Resume',
        coverLetter: 'Cover Letter',
        motivation: 'Motivation Letter',
        portfolio: 'Portfolio',
        transcript: 'Transcript',
        recommendation: 'Recommendation Letter'
    };

    return titles[doc.type] || 'Document';
};

// New helper function for document preview images
const getDocumentPreview = (doc) => {
    // Check if doc has its own preview image
    if (doc.previewImage) {
        return doc.previewImage;
    }

    // Otherwise use placeholder based on document type
    const previews = {
        resume: '/images/placeholders/resume-placeholder.png',
        coverLetter: '/images/placeholders/cover-letter-placeholder.png',
        motivation: '/images/placeholders/motivation-letter-placeholder.png',
        portfolio: '/images/placeholders/portfolio-placeholder.png',
        transcript: '/images/placeholders/transcript-placeholder.png',
        recommendation: '/images/placeholders/recommendation-placeholder.png'
    };

    return previews[doc.type] || '/images/placeholders/document-placeholder.png';
};



const DashboardLayout = () => {
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: session, status } = useSession();
    const router = useRouter();


    const [positionChanging, setPositionChanging] = useState(false);



    // Add a new state to track accordion open/closed status
    const [templatesAccordionOpen, setTemplatesAccordionOpen] = useState(true);

    // Add a toggle function for the accordion
    const toggleTemplatesAccordion = () => {
        setTemplatesAccordionOpen(!templatesAccordionOpen);
    };

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                    throw new Error('Backend URL not configured');
                }

                if (status !== "authenticated" || !session?.accessToken) {
                    setLoading(false);
                    setError("Authentication required.");
                    return;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`, {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status === 401) {
                    console.error("Authentication failed during fetch. User may need to log in.");
                    setError("Session expired. Please refresh or log in again.");
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to fetch positions: ${errorData.detail || response.statusText}`);
                }

                const data = await response.json();
                setPositions(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching positions:', err);
                setError(err.message || 'An unexpected error occurred.');
                setLoading(false);
            }
        };

        if (status === "authenticated" && positions.length === 0 && !error) {
            fetchPositions();
        } else if (status === "unauthenticated") {
            setLoading(false);
            setError("You need to be logged in to view templates.");
        }
    }, [status, session, error, positions.length]);


    // Modify your handlePositionSelect function
    const handlePositionSelect = (position) => {
        // Set loading state
        setPositionChanging(true);

        // Simulate a brief delay for better UX
        setTimeout(() => {
            setSelectedPosition(position);
            setPositionChanging(false);
        }, 400); // 400ms delay is usually enough to notice but not annoy users
    };

    const handleTemplateSelect = (position, selectedItem, type = 'resume') => {
        console.log(`Selected ${type} for position "${position.title}":`, selectedItem);
        const itemId = selectedItem.id;
        const positionId = position.id;

        // the correct path to navigate to the editor
        //`/main/editor/${selectedPosition.id}` #
        //`/main/editor/${selectedPosition.id}/${selectedItem.id} for documents`

        // Navigate to the editor page with the selected position and document type
        if (type === 'resume') {
            router.push(`/main/editor/${positionId}`);
        }
        else {
            router.push(`/main/editor/${positionId}/${itemId}`);
        }
    };

    return (
        <div className="flex min-h-screen surface-ground"> {/* Main container */}
            {/* === Sidebar with Accordion === */}
            <div className="flex flex-column surface-card shadow-2 select-none" style={{ width: '300px', flexShrink: 0 }}>
                {/* App Title / Logo */}
                <div className="flex align-items-center justify-content-center px-4 py-4 text-2xl font-bold border-bottom-1 surface-border text-primary">
                    <i className="pi pi-fw pi-briefcase mr-3"></i>
                    <span className="hidden md:inline">JobReady AI</span>
                </div>

                {/* Navigation Menu */}
                <div className="flex flex-column p-3">
                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors mb-2">
                        <i className="pi pi-home mr-3"></i>
                        <span className="font-medium">Home</span>
                        <Ripple />
                    </a>

                    {/* Templates Accordion - With Toggle */}
                    <div className="mb-2">
                        <div
                            className="flex align-items-center cursor-pointer p-3 border-round text-700 bg-primary-100"
                            onClick={toggleTemplatesAccordion}
                        >
                            <i className="pi pi-list mr-3"></i>
                            <span className="font-medium">Templates</span>
                            <i className={`pi ${templatesAccordionOpen ? 'pi-chevron-down' : 'pi-chevron-right'} ml-auto`}></i>
                        </div>

                        {/* Positions List - Conditionally Visible */}
                        {templatesAccordionOpen && (
                            <div className="pl-3 pr-1 py-2 max-h-15rem overflow-y-auto">
                                {loading ? (
                                    <div className="p-2 text-center">
                                        <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                                    </div>
                                ) : error ? (
                                    <div className="p-2 text-center text-red-600">
                                        <i className="pi pi-exclamation-circle mr-2"></i>
                                        Error loading positions
                                    </div>
                                ) : positions.length === 0 ? (
                                    <div className="p-2 text-center text-700">
                                        No positions available
                                    </div>
                                ) : (
                                    positions.map(position => (
                                        <div
                                            key={position.id}
                                            className={`p-2 border-round cursor-pointer flex align-items-center
                            ${selectedPosition?.id === position.id ? 'bg-primary-50 text-primary-700' : 'text-700 hover:surface-hover'}
                            ${positionChanging && 'position-selection' === position.id ? 'position-loading' : ''}`}
                                            onClick={() => {
                                                if (!positionChanging) {  // Prevent multiple rapid clicks
                                                    // Add a temporary ID to track which position is being selected
                                                    setPositionChanging('position-selection');
                                                    handlePositionSelect(position);
                                                }
                                            }}
                                        >
                                            <i className={`${position.icon || 'pi pi-briefcase'} mr-2 text-sm`}></i>
                                            <span className="text-sm">{position.title}</span>
                                            {positionChanging && 'position-selection' === position.id && (
                                                <i className="pi pi-spin pi-spinner ml-auto text-primary"></i>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors mb-2">
                        <i className="pi pi-folder mr-3"></i>
                        <span className="font-medium">My Documents</span>
                        <Ripple />
                    </a>
                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                        <i className="pi pi-cog mr-3"></i>
                        <span className="font-medium">Settings</span>
                        <Ripple />
                    </a>
                </div>

                {/* User Info / Profile Link */}
                <div className="mt-auto p-3 border-top-1 surface-border">
                    <div className="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                        <div className="flex align-items-center justify-content-center bg-primary-100 text-primary-800 mr-3" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }}>
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="font-medium">User Name</span>
                    </div>
                </div>
            </div>

            {/* === Main Content Area === */}
            <div className="flex flex-column flex-grow-1 overflow-hidden">
                {/* Top Bar */}
                <div className="surface-section shadow-1 p-4 flex justify-content-between align-items-center">
                    <h2 className="font-bold text-xl m-0">
                        {selectedPosition ? selectedPosition.title : 'Browse Templates'}
                    </h2>
                    <div className="flex align-items-center gap-3">
                        <Button icon="pi pi-bell" rounded text severity="secondary" />
                        <div className="flex align-items-center gap-2 cursor-pointer">
                            <i className="pi pi-user"></i>
                            <span className="font-medium text-700">User Name</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1 overflow-y-auto p-4">
                    {positionChanging ? (
                        <div className="flex flex-column align-items-center justify-content-center h-full">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                            <p className="text-primary mt-3 font-medium">Loading templates...</p>
                        </div>
                    ) : !selectedPosition ? (
                        <div className="flex justify-content-center align-items-center h-full">
                            <div className="text-center">
                                <i className="pi pi-arrow-left text-4xl text-primary mb-3"></i>
                                <h3 className="text-xl font-medium">Select a position from the sidebar</h3>
                                <p className="text-700">View available document templates for each position</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid">
                            {/* Resume Template */}
                            <div className="col-12 md:col-6 lg:col-4 p-3">
                                <Card className="shadow-2 h-full cursor-pointer hover:shadow-4 transition-duration-300"
                                    onClick={() => handleTemplateSelect(selectedPosition, selectedPosition, 'resume')}>
                                    <div className="flex flex-column h-full">
                                        <div className="mb-3">
                                            <div className="flex align-items-center mb-3">
                                                <i className={`${getDocumentIcon('resume')} text-xl text-primary mr-2`}></i>
                                                <span className="font-medium text-lg">Resume</span>
                                            </div>
                                            <p className="text-600 line-height-3 m-0">{getDocumentDescription('resume')}</p>
                                        </div>
                                        <div className="mt-auto pt-3">
                                            <img
                                                src="/images/placeholders/resume-placeholder.png"
                                                alt="Resume preview"
                                                className="w-full border-1 surface-border"
                                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                                            />
                                            <Button
                                                label="Create Resume"
                                                icon="pi pi-file-edit"
                                                className="p-button-primary w-full mt-3"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>



                            {/* If no other docs */}
                            {/* {(!selectedPosition.other_docs || selectedPosition.other_docs.length === 0) && (
                                <div className="col-12 md:col-6 lg:col-4 p-3">
                                    <Card className="surface-100 shadow-1 h-full flex align-items-center justify-content-center">
                                        <div className="text-center">
                                            <i className="pi pi-file-o text-2xl text-600 mb-3"></i>
                                            <p className="text-700 m-0">No additional document templates available</p>
                                        </div>
                                    </Card>
                                </div>
                            )} */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

