'use client';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { Divider } from 'primereact/divider'; // Import Divider
import { Tooltip } from 'primereact/tooltip'; // Import Tooltip
import { DataView } from 'primereact/dataview'; // Added DataView import
import { Dialog } from 'primereact/dialog'; // Added Dialog import
import { useResume } from "./ResumeContext";
import PersonalInformation from "./components/PersonalInformation";
import Summary from "./components/Summary";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Languages from "./components/Languages";
import GenericSection from "./components/GenericSection";
import GenerateDocumentDialog from "./components/GenerateDocumentDialog"; // <-- Import the new component
import CreateResumeFromExistingDialog from "./components/CreateResumeFromExistingDialog"; // <-- Import the new component
import 'primeflex/primeflex.css';
import styles from './EditableResumeTemplate.module.css'; // Ensure CSS Modules are used

const SECTION_ICONS = {
    personal_information: 'pi pi-user',
    summary: 'pi pi-align-left',
    experience: 'pi pi-briefcase',
    education: 'pi pi-book',
    projects: 'pi pi-code',
    skills: 'pi pi-star',
    languages: 'pi pi-globe',
    // Add icons for all other keys...
    default: 'pi pi-file'
};

const EditableResumeTemplate = ({
    resumeId,
    linkedDocuments: initialLinkedDocuments,
    initialSectionOrder, // New prop
    initialHiddenSections // New prop
}) => {
    const { data, updateData } = useResume();
    const [loading, setLoading] = useState(!data);
    // Initialize with prop, default to empty array if prop is null/undefined
    const [hiddenSections, setHiddenSections] = useState(initialHiddenSections || []);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false); // <-- Add state for dialog
    const [showDocumentsDialog, setShowDocumentsDialog] = useState(false); // <-- Add state for documents dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false); // <-- Add state for create dialog
    const router = useRouter();
    const toast = useRef(null);
    const mainContentRef = useRef(null); // Ref for the main scrollable area
    const { data: session, status } = useSession();
    const token = session?.accessToken || null; // Get the token from session
    // Initialize local state from props
    const [linkedDocuments, setLinkedDocuments] = useState(initialLinkedDocuments || []);

    // Define section keys and non-array sections
    const ALL_SECTION_KEYS = [
        "personal_information", "summary", "experience", "education", "projects",
        "skills", "languages", "awards_and_recognition", "volunteer_and_social_activities",
        "certifications", "interests", "references", "publications", "courses",
        "conferences", "speaking_engagements", "patents", "professional_memberships",
        "military_service", "teaching_experience", "research_experience",
    ];
    const NON_ARRAY_SECTIONS = ['personal_information', 'summary', 'objective']; // Add 'objective' if used

    // Initialize with prop, default to ALL_SECTION_KEYS if prop is null/undefined
    const [sectionOrder, setSectionOrder] = useState(initialSectionOrder || ALL_SECTION_KEYS);

    // Check if a section is empty
    const isSectionEmpty = (key) => {
        if (!data || !data[key]) return true;
        const sectionData = data[key];

        if (NON_ARRAY_SECTIONS.includes(key)) {
            return typeof sectionData === 'object' && sectionData !== null && Object.values(sectionData).every(value => !value || (typeof value === 'string' && value.trim() === ''));
        }

        if (Array.isArray(sectionData)) {
            return sectionData.length === 0;
        }

        return true; // Default to empty for unexpected types
    };

    // Toggle section visibility
    const toggleSectionVisibility = (sectionKey) => {
        setHiddenSections((prev) =>
            prev.includes(sectionKey)
                ? prev.filter((key) => key !== sectionKey)
                : [...prev, sectionKey]
        );
    };

    // Handle reordering of sections
    const handleReorderSections = (result) => {
        if (!result.destination || result.source.index === result.destination.index) {
            return;
        }

        const newOrder = Array.from(sectionOrder);
        const [removed] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, removed);

        setSectionOrder(newOrder);
    };

    // Render the appropriate component for each section
    const renderSectionComponent = (sectionKey) => {
        const commonProps = { sectionKey: sectionKey }; // Pass sectionKey for potential use within components
        switch (sectionKey) {
            case 'personal_information': return <PersonalInformation {...commonProps} />;
            case 'summary': return <Summary {...commonProps} />;
            case 'experience': return <Experience {...commonProps} />;
            case 'education': return <Education {...commonProps} />;
            case 'projects': return <Projects {...commonProps} />;
            case 'skills': return <Skills {...commonProps} />;
            case 'languages': return <Languages {...commonProps} />;
            default: return <GenericSection {...commonProps} />;
        }
    };

    // Scroll to Section Function
    const scrollToSection = (sectionKey) => {
        setActiveSection(sectionKey); // Set active state first
        const sectionElement = document.getElementById(`section-${sectionKey}`);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Initialize hidden sections and sidebar visibility effect
    useEffect(() => {
        if (data) {
            setLoading(false);
            // If initialHiddenSections was not provided (null/undefined),
            // calculate hidden sections based on emptiness using the current sectionOrder.
            // The `useState` for `hiddenSections` already initialized it to `[]` in this case.
            if (initialHiddenSections === null || initialHiddenSections === undefined) {
                const calculatedHiddenSections = sectionOrder.filter((key) => isSectionEmpty(key));
                setHiddenSections(calculatedHiddenSections);
            }
            // If initialHiddenSections was provided (e.g., an empty array or an array with items),
            // the `hiddenSections` state is already correctly set by `useState`.
        }

        // Handle responsive sidebar visibility
        const mediaQuery = window.matchMedia('(min-width: 1024px)'); // lg breakpoint
        const handleResize = () => setSidebarVisible(mediaQuery.matches);
        handleResize(); // Initial check
        mediaQuery.addEventListener('change', handleResize);
        return () => mediaQuery.removeEventListener('change', handleResize);
    }, [data, initialHiddenSections, sectionOrder]); // Added initialHiddenSections and sectionOrder to dependencies

    // Save resume data with fixed toast notifications
    const saveResumeData = () => {
        setLoading(true); // Show loading indicator during save

        // Send data to backend using PATCH request
        axios.patch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/${resumeId}/`,
            {
                resume: data,
                sections_sort: sectionOrder, // Add sectionOrder to payload
                hidden_sections: hiddenSections // Add hiddenSections to payload
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include auth token if using JWT
                }
            }
        )
            .then(response => {
                console.log("Save successful:", response.data);
                setLoading(false);
                // Show success notification using PrimeReact Toast
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Resume saved successfully',
                    life: 3000
                });

                // Pass the entire resume item from the backend response to updateResumeCache
                updateResumeCache(response.data);
            })
            .catch(error => {
                console.error("Error saving resume:", error);
                setLoading(false);
                // Show error notification using PrimeReact Toast
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to save: ${error.response?.data?.error || "Unknown error"}`,
                    life: 3000
                });
            });

    };

    // Helper to format section keys for display
    const formatSectionName = (key) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Combine class names conditionally
    const classNames = (...classes) => classes.filter(Boolean).join(' ');



    // Item template for documents in the dialog
    const documentItemTemplate = (doc) => {
        return (
            <div className="col-12 p-2">
                <div className="p-3 border-1 surface-border border-round surface-card mb-2 shadow-1 hover:shadow-3 transition-all transition-duration-300">
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                        <div className="flex align-items-center mb-3 md:mb-0">
                            <i className={`${SECTION_ICONS[doc.document_type] || 'pi pi-file'} text-xl mr-3 p-3 border-circle bg-primary-50`}></i>
                            <div>
                                <div className="text-xl font-semibold mb-1">{formatDocumentType(doc.document_type)}</div>
                                <div className="text-sm text-color-secondary">
                                    {doc.created_at ? `Created: ${new Date(doc.created_at).toLocaleDateString()}` : 'Creation date not available'}
                                </div>
                            </div>
                        </div>
                        <Button
                            icon="pi pi-pencil"
                            label="Edit Document"
                            className="p-button-sm"
                            onClick={() => {
                                if (!doc.unique_id) {
                                    toast.current?.show({
                                        severity: 'error',
                                        summary: 'Navigation Error',
                                        detail: 'Document ID is missing. Cannot open editor.',
                                        life: 3000
                                    });
                                    return;
                                }
                                setShowDocumentsDialog(false); // Close the dialog
                                router.push(`/document_editor/${doc.unique_id}`);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const formatDocumentType = (type) => {
        return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Document';
    };

    // Add this new function to update cache after backend operations
    const updateResumeCache = async (updatedResumeItem = null, newDocument = null) => {
        try {
            // If we have an updated resume item (e.g., after saving)
            if (updatedResumeItem && updatedResumeItem.resume) {
                try {
                    const localData = localStorage.getItem('all_resumes_list_cache');
                    let parsedData = localData ? JSON.parse(localData) : { data: [] };
                    let resumes = parsedData.data || [];

                    const existingResumeIndex = resumes.findIndex((item) => item.id === Number(resumeId));

                    if (existingResumeIndex !== -1) {
                        // Merge existing item with the updated one from backend response
                        resumes[existingResumeIndex] = {
                            ...resumes[existingResumeIndex], // Preserve other potential local fields
                            id: updatedResumeItem.id, // from backend
                            name: updatedResumeItem.name || resumes[existingResumeIndex].name, // from backend or fallback
                            resume: updatedResumeItem.resume, // from backend
                            sections_sort: updatedResumeItem.sections_sort, // from backend
                            hidden_sections: updatedResumeItem.hidden_sections, // from backend
                            generated_documents_data: updatedResumeItem.generated_documents_data !== undefined
                                ? updatedResumeItem.generated_documents_data
                                : resumes[existingResumeIndex].generated_documents_data, // Preserve or update
                        };
                    } else {
                        // Add new resume item to cache if not found (less likely for an update)
                        resumes.push({
                            id: Number(resumeId), // or updatedResumeItem.id
                            name: updatedResumeItem.name || `Resume ${resumeId}`,
                            resume: updatedResumeItem.resume,
                            sections_sort: updatedResumeItem.sections_sort,
                            hidden_sections: updatedResumeItem.hidden_sections,
                            generated_documents_data: updatedResumeItem.generated_documents_data || []
                        });
                    }

                    localStorage.setItem('all_resumes_list_cache', JSON.stringify({ data: resumes }));
                    console.log("Resume data (including sort/hidden) cached in localStorage successfully");
                } catch (storageError) {
                    console.error("Failed to cache resume in localStorage:", storageError);
                }
            }

            // If we have a new document, handle document updates (existing logic)
            if (newDocument && newDocument.document_uuid) {
                try {
                    // Fetch complete document details from the backend
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/document_bloks/${newDocument.document_uuid}/`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    const documentData = response.data;
                    if (documentData) {
                        // Update the linked documents in the component state
                        const updatedDocuments = [...(linkedDocuments || []), documentData];
                        setLinkedDocuments(updatedDocuments);

                        // Update localStorage for all_resumes_list_cache
                        try {
                            const localData = localStorage.getItem('all_resumes_list_cache');
                            if (localData) {
                                let parsedData = JSON.parse(localData);
                                let resumes = parsedData.data || [];

                                const existingResumeIndex = resumes.findIndex(
                                    (item) => item.id === Number(resumeId)
                                );

                                if (existingResumeIndex !== -1) {
                                    // Initialize generated_documents_data if it doesn't exist
                                    if (!resumes[existingResumeIndex].generated_documents_data) {
                                        resumes[existingResumeIndex].generated_documents_data = [];
                                    }

                                    // Add the new document to the documents array if it doesn't already exist
                                    const docExists = resumes[existingResumeIndex].generated_documents_data.some(
                                        doc => doc.unique_id === documentData.unique_id
                                    );
                                    console.log("Document exists:", docExists);

                                    if (!docExists) {
                                        resumes[existingResumeIndex].generated_documents_data.push(documentData);

                                        // Save back to localStorage
                                        localStorage.setItem('all_resumes_list_cache',
                                            JSON.stringify({ data: resumes })
                                        );
                                        console.log("Document data cached in localStorage successfully");
                                    }
                                }
                            }
                        } catch (storageError) {
                            console.error("Failed to cache document in localStorage:", storageError);
                        }

                        toast.current?.show({
                            severity: 'success',
                            summary: 'Document Linked',
                            detail: 'Document successfully linked to your resume',
                            life: 3000
                        });
                    } else {
                        throw new Error("Received empty document data from server");
                    }
                } catch (error) {
                    console.error("Error fetching document data:", error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: `Failed to fetch document data: ${error.response?.data?.error || error.message || "Unknown error"}`,
                        life: 3000
                    });
                }
            }

            return true;
        } catch (error) {
            console.error("Unexpected error in updateResumeCache:", error);
            toast.current?.show({
                severity: 'error',
                summary: 'Cache Update Failed',
                detail: 'An unexpected error occurred while updating the cache',
                life: 3000
            });
            return false;
        }
    };


    return (
        <div className={classNames(styles.editorLayout, "flex flex-column h-screen")}>
            <Toast ref={toast} />

            {/* Header */}
            <header className={classNames(styles.editorHeader, "flex justify-content-between align-items-center p-3 border-bottom-1 surface-border")}>
                <div className="flex align-items-center">
                    <Button
                        icon="pi pi-bars"
                        className={classNames(styles.sidebarToggleButton, "p-button-text p-button-secondary mr-2")}
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                        aria-controls="resume-sidebar"
                        aria-expanded={sidebarVisible}
                    />
                    <h1 className="text-xl md:text-2xl font-semibold m-0">Resume Editor</h1>
                </div>
                <div className="flex gap-2 align-items-center">
                    {loading && <ProgressSpinner style={{ width: '2rem', height: '2rem' }} strokeWidth="6" />}
                    <Button
                        icon="pi pi-globe"
                        tooltip="Generate Website"
                        tooltipOptions={{ position: 'bottom' }}
                        className="p-button-outlined p-button-secondary"
                        onClick={() => router.push(`/generate_site_yaml/${resumeId}`)}
                        disabled={loading}
                    />
                    <Button
                        icon="pi pi-download"
                        tooltip="Export Options"
                        tooltipOptions={{ position: 'bottom' }}
                        className="p-button-outlined p-button-secondary"
                        onClick={() => router.push(`/export/${resumeId}`)}
                        disabled={loading}
                    />
                    {/* // create new resume from this resume */}
                    <Button
                        icon="pi pi-copy"
                        tooltip="Create New Resume from this one"
                        tooltipOptions={{ position: 'bottom' }}
                        className="p-button-outlined p-button-secondary"
                        onClick={() => {

                            setShowCreateDialog(true);
                        }
                        }
                        // disabled={loading}
                    />


                    <Button
                        icon="pi pi-folder-open"
                        tooltip="Browse Documents"
                        tooltipOptions={{ position: 'bottom' }}
                        className="p-button-outlined p-button-secondary"
                        onClick={() => setShowDocumentsDialog(true)}
                        disabled={loading}
                        badge={linkedDocuments?.length || 0}
                        badgeClassName={linkedDocuments?.length ? "p-badge-warning" : ""}
                    />
                    <Button
                        icon="pi pi-file-edit" // Or pi-plus, pi-book, etc.
                        tooltip="Generate Document"
                        tooltipOptions={{ position: 'bottom' }}
                        className="p-button-outlined p-button-secondary"
                        onClick={() => setShowGenerateDialog(true)} // <-- Open the dialog
                        disabled={loading || !data} // Disable if loading or no data
                    />
                    <Button
                        icon="pi pi-save"
                        label="Save"
                        severity="success"
                        onClick={saveResumeData}
                        disabled={loading}
                    />
                </div>
            </header>

            {/* Main Area */}
            <div className={classNames(styles.editorMainArea, "flex flex-1 overflow-hidden")}>

                {/* Sidebar */}
                <aside
                    id="resume-sidebar"
                    className={classNames(
                        styles.sidebar,
                        sidebarVisible && styles.sidebarVisible,
                        "flex flex-column h-full surface-section border-right-1 surface-border"
                    )}
                    style={{ transition: 'transform 0.3s ease' }}
                >
                    <div className={styles.sidebarHeader}>
                        <span className="font-semibold">Sections</span>
                        <p className="text-xs text-color-secondary mt-1 mb-0">Drag to reorder. Click eye to toggle.</p>
                    </div>

                    <div className={classNames(styles.sidebarContent, "overflow-y-auto")}>
                        <DragDropContext onDragEnd={handleReorderSections}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={styles.sidebarSectionList}
                                    >
                                        {sectionOrder.map((sectionKey, index) => {
                                            if (!sectionKey) return null;
                                            const isEmpty = isSectionEmpty(sectionKey);
                                            const isHidden = hiddenSections.includes(sectionKey);
                                            return (
                                                <Draggable key={sectionKey} draggableId={sectionKey} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={classNames(
                                                                styles.sidebarItem,
                                                                snapshot.isDragging && styles.sidebarItemDragging,
                                                                isHidden && styles.sidebarItemHidden,
                                                                activeSection === sectionKey && "bg-primary-reverse",
                                                                "flex align-items-center justify-content-between p-2 surface-border cursor-pointer"
                                                            )}
                                                            onClick={() => scrollToSection(sectionKey)}
                                                        >
                                                            <div className={classNames(styles.sidebarItemContent, "flex align-items-center")}>
                                                                <span {...provided.dragHandleProps} className={classNames(styles.dragHandle, "mr-2", "cursor-grab")}>
                                                                    <i className={SECTION_ICONS[sectionKey] || SECTION_ICONS.default}></i>
                                                                </span>
                                                                <span className={styles.sidebarItemText}>{formatSectionName(sectionKey)}</span>
                                                                {isEmpty && !isHidden && (
                                                                    <span className={classNames(styles.emptyIndicator, "ml-1 text-xs text-color-secondary")}>
                                                                        (Empty)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                icon={isHidden ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                                                className={classNames("p-button-text p-button-secondary p-button-sm", styles.visibilityToggle)}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSectionVisibility(sectionKey);
                                                                }}
                                                                tooltip={isHidden ? 'Show Section' : 'Hide Section'}
                                                                tooltipOptions={{ position: 'left', showDelay: 500 }}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </aside>

                {/* Overlay for Sidebar on Small Screens */}
                {sidebarVisible && <div className={classNames(styles.overlay, "lg:hidden")} onClick={() => setSidebarVisible(false)} />}

                {/* Main Content */}
                <main ref={mainContentRef} className="flex-1 overflow-y-auto surface-ground p-3 md:p-5">
                    <div className="h-full">
                        {!data && loading && (
                            <div className="flex flex-column justify-content-center align-items-center h-full">
                                <ProgressSpinner strokeWidth="3" />
                                <p className="mt-2 text-color-secondary">Loading Resume...</p>
                            </div>
                        )}
                        {!loading && !data && (
                            <div className="text-center p-4 text-color-secondary">
                                Failed to load resume data. Please try again later.
                            </div>
                        )}
                        {data && (
                            <div className="surface-card p-4 md:p-5 shadow-2 border-round max-w-screen-xl mx-auto">
                                <div className="flex flex-column gap-5">
                                    <Tooltip target=".section-title-help" />
                                    {sectionOrder.map((sectionKey, index) => {
                                        if (hiddenSections.includes(sectionKey)) return null;
                                        const isEmpty = isSectionEmpty(sectionKey);
                                        return (
                                            <section
                                                key={sectionKey}
                                                id={`section-${sectionKey}`}
                                                className={classNames(
                                                    activeSection === sectionKey && "outline-1 outline-primary outline-dashed outline-offset-2"
                                                )}
                                            >
                                                {index > 0 && <Divider className="my-4" />}
                                                <h2 className="text-xl font-semibold mt-0 mb-3">
                                                    <i className="pi pi-info-circle ml-2 text-sm text-color-secondary section-title-help"
                                                        data-pr-tooltip={`Enter your professional ${formatSectionName(sectionKey).toLowerCase()} here.`}
                                                        data-pr-position="right"></i>
                                                </h2>
                                                {renderSectionComponent(sectionKey)}
                                                {isEmpty && (
                                                    <div className="mt-3 p-3 border-1 border-dashed surface-border border-round bg-black-alpha-5 text-center text-color-secondary">
                                                        This section is empty. Add content or hide it using the <i className="pi pi-eye-slash mx-1 vertical-align-middle"></i> icon in the sidebar.
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Documents Dialog */}
            <Dialog
                header="Resume Documents"
                visible={showDocumentsDialog}
                style={{ width: '80vw', maxWidth: '900px' }}
                modal
                onHide={() => setShowDocumentsDialog(false)}
                footer={
                    <div className="flex justify-content-between">
                        <Button
                            label="Create New Document"
                            icon="pi pi-plus"
                            onClick={() => {
                                setShowDocumentsDialog(false);
                                setShowGenerateDialog(true);
                            }}
                        />
                        <Button
                            label="Close"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setShowDocumentsDialog(false)}
                        />
                    </div>
                }
            >
                {linkedDocuments && linkedDocuments.length > 0 ? (
                    <DataView
                        value={linkedDocuments}
                        itemTemplate={documentItemTemplate}
                        layout="list"
                        emptyMessage="No documents have been generated for this resume yet."
                    />
                ) : (
                    <div className="p-4 text-center">
                        <i className="pi pi-folder-open text-4xl mb-3 text-color-secondary"></i>
                        <p className="m-0 text-lg font-medium">No Documents Available</p>
                        <p className="mt-2 text-color-secondary">You haven&apos;t created any documents for this resume yet.</p>
                        <Button
                            label="Create Your First Document"
                            icon="pi pi-plus"
                            className="mt-4"
                            onClick={() => {
                                setShowDocumentsDialog(false);
                                setShowGenerateDialog(true);
                            }}
                        />
                    </div>
                )}


            </Dialog>


            {/* Create New Resume Dialog */}
             <CreateResumeFromExistingDialog
                visible={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                availableResumes={[]}
                onSuccess={
                    (newResumeId) => {
                        setShowCreateDialog(false);
                        router.push(`/editor/${newResumeId}`);
                    }
                }
                initialResumeId ={resumeId} // Pass the current resumeId
            />


            {/* Render the Dialog */}
            {data && ( // Ensure data is loaded before rendering dialog with resume-specific props
                <GenerateDocumentDialog
                    visible={showGenerateDialog}
                    onHide={() => setShowGenerateDialog(false)}
                    initialResumeId={resumeId} // Pass the current resumeId
                    existingDocTypes={linkedDocuments.map(doc => doc.document_type)} // Pass existing document types

                    onGenerationSuccess={(genDetails) => {
                        setShowGenerateDialog(false);
                        // Update the cache with the new document
                        updateResumeCache(null, genDetails); // Pass null for updatedData if not needed

                        toast.current?.show({
                            severity: 'success',
                            summary: 'Document Generation Started',
                            detail: `Your document is being generated.`,
                            life: 3000
                        })
                    }}
                />
            )}
        </div>
    );
};

export default EditableResumeTemplate;
