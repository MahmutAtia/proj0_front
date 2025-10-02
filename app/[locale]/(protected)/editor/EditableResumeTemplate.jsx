'use client';
import React, { useEffect, useState, useRef } from 'react';
import api,{aiApi} from '@/lib/axios';
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
import { SplitButton } from 'primereact/splitbutton'; // Import SplitButton
import { Menu } from 'primereact/menu'; // Import Menu
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
import { getResumesFromCache } from '@/app/utils/resumeCache'; // Import cache utility
import AIAssistant from './components/AIAssistant'; // Import AIAssistant
import 'primeflex/primeflex.css';
import styles from './EditableResumeTemplate.module.css'; // Ensure CSS Modules are used
import { startTour } from './tour'; 
import { useTranslation } from '@/hooks/useTranslation';
import { FaQuestionCircle } from "react-icons/fa"; // Import tour icon

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
    initialSectionOrder,
    initialHiddenSections, 
    personalWebsiteUuid,
    
}) => {
    const { data,aboutCandidate, setData, undo, redo, canUndo, canRedo } = useResume();
    const [loading, setLoading] = useState(!data);
    // Initialize with prop, default to empty array if prop is null/undefined
    const [hiddenSections, setHiddenSections] = useState(initialHiddenSections || []);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [isMobileView, setIsMobileView] = useState(false); // State for mobile view
    const [activeSection, setActiveSection] = useState(null);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false); // <-- Add state for dialog
    const [showDocumentsDialog, setShowDocumentsDialog] = useState(false); // <-- Add state for documents dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false); // <-- Add state for create dialog
    const [isDirty, setIsDirty] = useState(false); // State to track unsaved changes
    const [showConfirmDialog, setShowConfirmDialog] = useState(false); // State for the confirmation dialog
    const [nextAction, setNextAction] = useState(null); // State to hold the navigation URL or action
    const [showGlobalEditDialog, setShowGlobalEditDialog] = useState(false); // State for global edit dialog
    const [globalEditPrompt, setGlobalEditPrompt] = useState(''); // State for global edit prompt
    const [isGlobalAIProcessing, setIsGlobalAIProcessing] = useState(false); // State for global AI processing
    const router = useRouter();
    const toast = useRef(null);
    const mainContentRef = useRef(null); // Ref for the main scrollable area
    const moreOptionsMenu = useRef(null); // Ref for the mobile menu
    const { data: session, status } = useSession();
    const token = session?.accessToken || null; // Get the token from session
    // Initialize local state from props
    const [linkedDocuments, setLinkedDocuments] = useState(initialLinkedDocuments || []);
    
    // Store initial state to compare for changes
    const initialDataRef = useRef(null);
    
    // Get resumes cache for GenerateDocumentDialog
    const allResumesListCache = getResumesFromCache() || [];

    const { t } = useTranslation();

        // Effect to run the tour on first visit
    useEffect(() => {
        if (!loading && data) {
            const hasSeenTour = localStorage.getItem('hasSeenResumeEditorTour');

            console.log("Has seen tour?", hasSeenTour);
            if (!hasSeenTour) {
                setTimeout(() => {
                    console.log("################# Starting tour...");
                    startTour(t);
                }, 1000);
            }
        }
    }, [loading, data, t]);
 
    const handleGlobalEditSubmit = async () => {
        if (!globalEditPrompt.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter a prompt.', life: 3000 });
            return;
        }
        setIsGlobalAIProcessing(true);
        try {
            const response = await aiApi.post("/resumes-v2/global_edit_resume", {
                input_text: JSON.stringify(data),
                instructions: globalEditPrompt,
                aboutCandidate: aboutCandidate || "No context about the candidate was provided."
            });

            setData(response.data); // Update context, which handles history
            setShowGlobalEditDialog(false);
            setGlobalEditPrompt('');
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Resume updated globally!', life: 3000 });

        } catch (error) {
            console.error("Error during global AI edit:", error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to edit resume: ${error.response?.data?.detail || "Unknown error"}`,
                life: 5000
            });
        } finally {
            setIsGlobalAIProcessing(false);
        }
    };

    const actionItems = [
        {
            label: 'Generate Website',
            icon: 'pi pi-globe',
            command: () => confirmAndProceed(() => {
                if (personalWebsiteUuid) {
                    router.push(`/site-editor/${personalWebsiteUuid}`);
                } else {
                    router.push(`/generate_site_yaml/${resumeId}`);
                }
            })
        },
        {
            label: 'Browse Documents',
            icon: 'pi pi-folder-open',
            command: () => setShowDocumentsDialog(true)
        },
        {
            label: 'Generate New Resume',
            icon: 'pi pi-copy',
            command: () => setShowCreateDialog(true)
        }
    ];

    // Define items for the mobile "More Options" menu
    const moreOptionsItems = [
        {
            label: t('globalEdit'),
            icon: 'pi pi-sparkles',
            command: () => setShowGlobalEditDialog(true),
            disabled: loading || !data
        },
        {
            label: t('export'),
            icon: 'pi pi-download',
            command: () => confirmAndProceed(`/export/${resumeId}`),
            disabled: loading
        },
        { separator: true },
        ...actionItems, // Includes "Generate Website", "Browse Documents", etc.
        { separator: true },
        {
            label: t('undo'),
            icon: 'pi pi-undo',
            command: undo,
            disabled: !canUndo
        },
        {
            label: t('redo'),
            icon: 'pi pi-refresh',
            command: redo,
            disabled: !canRedo
        },
        {
            label: t('startTour'),
            icon: 'pi pi-question-circle',
            command: () => startTour(t)
        }
    ];

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

    // Handle moving sections up/down on mobile
    const handleMoveSection = (index, direction) => {
        const newOrder = Array.from(sectionOrder);
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newOrder.length) {
            return; // Cannot move outside of bounds
        }

        const [item] = newOrder.splice(index, 1);
        newOrder.splice(newIndex, 0, item);
        setSectionOrder(newOrder);
    };

    // Render the appropriate component for each section
    const renderSectionComponent = (sectionKey) => {
        const commonProps = { sectionKey: sectionKey }; // Pass sectionKey for potential use within components
        switch (sectionKey) {
            case 'personal_information': return <PersonalInformation {...commonProps} />;
            case 'summary': return <Summary {...commonProps} />;
            case 'objective': return <Summary {...commonProps} />; // as objective is similar to summary
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
        // Close sidebar on mobile after clicking a section to navigate
        if (isMobileView) {
            setSidebarVisible(false);
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
        const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
        const mobileMediaQuery = window.matchMedia('(max-width: 767px)');

        const handleResize = () => {
            setSidebarVisible(desktopMediaQuery.matches);
            setIsMobileView(mobileMediaQuery.matches);
        };

        handleResize(); // Initial check
        desktopMediaQuery.addEventListener('change', handleResize);
        mobileMediaQuery.addEventListener('change', handleResize);

        return () => {
            desktopMediaQuery.removeEventListener('change', handleResize);
            mobileMediaQuery.removeEventListener('change', handleResize);
        };
    }, [data, initialHiddenSections, sectionOrder]); // Added initialHiddenSections and sectionOrder to dependencies

    // Effect to track unsaved changes
    useEffect(() => {
        if (data && !loading) {
            // Store the initial state once data is loaded
            if (initialDataRef.current === null) {
                initialDataRef.current = JSON.stringify({
                    data,
                    sectionOrder,
                    hiddenSections,
                });
                return; // Don't mark as dirty on initial load
            }

            // Compare current state with the initial state
            const currentState = JSON.stringify({
                data,
                sectionOrder,
                hiddenSections,
            });

            if (currentState !== initialDataRef.current) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [data, sectionOrder, hiddenSections, loading]);

    // Effect to handle browser navigation (refresh, close tab)
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                event.preventDefault();
                // Most modern browsers show a generic message, but this is required
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    // Save resume data with fixed toast notifications
    const saveResumeData = () => {
        return new Promise((resolve, reject) => {
            setLoading(true); // Show loading indicator during save

            // Send data to backend using PATCH request
            api.patch(
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
                    // After successful save, reset the dirty state
                    setIsDirty(false);
                    initialDataRef.current = JSON.stringify({
                        data: response.data.resume, // Use the updated data from the response
                        sectionOrder,
                        hiddenSections,
                    });
                    resolve(true); // Resolve the promise on success
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
                    reject(false); // Reject the promise on failure
                });
        });
    };

    // Helper to format section keys for display
    const formatSectionName = (key) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Combine class names conditionally
    const classNames = (...classes) => classes.filter(Boolean).join(' ');


    // Handle navigation or actions that might lose unsaved data
    const confirmAndProceed = (action) => {
        if (isDirty) {
            setNextAction(() => action); // Use a function to ensure the latest action is set
            setShowConfirmDialog(true);
        } else {
            // If not dirty, just execute the action
            if (typeof action === 'function') {
                action();
            } else if (typeof action === 'string') {
                router.push(action);
            }
        }
    };


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
                    const response = await api.get(
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
                        icon="pi pi-arrow-left"
                        className="p-button-text p-button-secondary tour-back-button"
                        tooltip="Back to Dashboard"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={() => confirmAndProceed('/main')}
                    />
                   <Button
                        icon="pi pi-bars"
                        className={classNames(styles.sidebarToggleButton, "p-button-text p-button-secondary", "lg:hidden")}
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                        aria-controls="resume-sidebar"
                        aria-expanded={sidebarVisible}
                    />
                    <h1 className="text-xl md:text-2xl font-semibold m-0 hidden md:block">Resume Editor</h1>

                </div>
                <div className="flex gap-2 align-items-center">
                    {loading && <ProgressSpinner style={{ width: '2rem', height: '2rem' }} strokeWidth="6" />}
                    
                    {/* --- Desktop Buttons --- */}
                    <div className={classNames(styles.hideOnMobile, "flex-row gap-2 align-items-center")}>
                        <Button 
                            icon="pi pi-undo" 
                            className="p-button-rounded p-button-text" 
                            onClick={undo} 
                            disabled={!canUndo}
                            tooltip="Undo"
                        />
                        <Button 
                            icon="pi pi-refresh" 
                            className="p-button-rounded p-button-text" 
                            onClick={redo} 
                            disabled={!canRedo}
                            tooltip="Redo"
                        />
                        <Button 
                            icon={<FaQuestionCircle />} 
                            className="p-button-rounded p-button-text p-button-plain" 
                            onClick={() => startTour(t)} 
                            tooltip="Start Tour"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            label="Global Edit"
                            icon="pi pi-sparkles"
                            className="p-button-secondary"
                            onClick={() => setShowGlobalEditDialog(true)}
                            disabled={loading || !data}
                            tooltip="Use AI to edit the entire resume"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <SplitButton
                            label="Generate Document"
                            icon="pi pi-file-edit"
                            onClick={() => setShowGenerateDialog(true)}
                            model={actionItems}
                            className="p-button-outlined p-button-secondary tour-generate-document "
                            tooltip="Actions"
                            tooltipOptions={{ position: 'bottom' }}
                            disabled={loading || !data}
                        />
                        <Button
                            icon="pi pi-download"
                            label="Export"
                            tooltip="Export Options"
                            tooltipOptions={{ position: 'bottom' }}
                            className="p-button-secondary tour-export-button"
                            onClick={() => confirmAndProceed(`/export/${resumeId}`)}
                            disabled={loading}
                        />
                    </div>
                    
                    {/* --- Save Button (Always Visible) --- */}
                    <Button
                        icon="pi pi-save"
                        label="Save"
                        severity="success"
                        onClick={saveResumeData}
                        disabled={loading || !isDirty}
                        className="tour-save-button"
                    />

                    {/* --- Mobile "More Options" Menu --- */}
                    <div className={styles.showOnMobile}>
                        <Menu model={moreOptionsItems} popup ref={moreOptionsMenu} id="popup_menu_right" popupAlignment="right" />
                        <Button
                            icon="pi pi-ellipsis-v"
                            className="p-button-text"
                            onClick={(event) => moreOptionsMenu.current.toggle(event)}
                            aria-controls="popup_menu_right"
                            aria-haspopup
                        />
                    </div>
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
                        "flex flex-column h-full surface-section border-right-1 surface-border",
                        "tour-sidebar"
                    )}
                    style={{ transition: 'transform 0.3s ease' }}
                >
                    <div className={styles.sidebarHeader}>
                        <div>
                            <span className="font-semibold">Sections</span>
                            <p className="text-xs text-color-secondary mt-1 mb-0">
                                {isMobileView ? "Tap arrows to reorder" : "Drag to reorder"}
                            </p>
                        </div>
                        <Button
                            icon="pi pi-times"
                            className={classNames("p-button-text p-button-secondary", styles.mobileOnly)}
                            onClick={() => setSidebarVisible(false)}
                            aria-label="Close sidebar"
                        />
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
                                                <Draggable key={sectionKey} draggableId={sectionKey} index={index} isDragDisabled={isMobileView}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={classNames(
                                                                styles.sidebarItem,
                                                                snapshot.isDragging && styles.sidebarItemDragging,
                                                                isHidden && styles.sidebarItemHidden,
                                                                activeSection === sectionKey && "bg-primary-reverse",
                                                                "flex align-items-center justify-content-between p-2 surface-border cursor-pointer",
                                                                "tour-section-item"
                                                            )}
                                                            onClick={(e) => {
                                                                // Prevent click from firing if the target is a button inside the item
                                                                if (e.target.closest('button')) {
                                                                    return;
                                                                }
                                                                scrollToSection(sectionKey);
                                                            }}
                                                        >
                                                            <div className={classNames(styles.sidebarItemContent, "flex align-items-center")}>
                                                                <span {...provided.dragHandleProps} className={classNames(styles.dragHandle, "mr-2", "cursor-grab", "tour-drag-handle")}>
                                                                    <i className="pi pi-bars"></i>
                                                                </span>
                                                                <span className={styles.sidebarItemText}>{formatSectionName(sectionKey)}</span>
                                                                {isEmpty && !isHidden && (
                                                                    <span className={classNames(styles.emptyIndicator, "ml-1 text-xs text-color-secondary")}>
                                                                        (Empty)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={styles.sidebarItemControls}>
                                                                {/* Mobile-only Move Buttons */}
                                                                <div className={styles.mobileOnly}>
                                                                    <Button
                                                                        icon="pi pi-arrow-up"
                                                                        className="p-button-text p-button-secondary p-button-sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'up'); }}
                                                                        disabled={index === 0}
                                                                    />
                                                                    <Button
                                                                        icon="pi pi-arrow-down"
                                                                        className="p-button-text p-button-secondary p-button-sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'down'); }}
                                                                        disabled={index === sectionOrder.length - 1}
                                                                    />
                                                                </div>
                                                                {/* Visibility Toggle */}
                                                                <Button
                                                                    icon={isHidden ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                                                    className={classNames("p-button-text p-button-secondary p-button-sm", styles.visibilityToggle, "tour-visibility-toggle")}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleSectionVisibility(sectionKey);
                                                                    }}
                                                                    tooltip={isHidden ? 'Show Section' : 'Hide Section'}
                                                                    tooltipOptions={{ position: 'left', showDelay: 500 }}
                                                                />
                                                            </div>
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
                <main ref={mainContentRef} className="flex-1 overflow-y-auto surface-ground p-3 md:p-5 tour-main-editor">
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
                                        if (!sectionKey || hiddenSections.includes(sectionKey)) return null;

                                        return (
                                            <div key={sectionKey} id={`section-${sectionKey}`} className="scroll-mt-[80px]">
                                                {renderSectionComponent(sectionKey)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Confirmation Dialog for Unsaved Changes */}
            <Dialog
                header="Unsaved Changes"
                visible={showConfirmDialog}
                style={{ width: '400px' }}
                modal
                footer={
                    <div>
                        <Button label="Cancel" icon="pi pi-times" onClick={() => setShowConfirmDialog(false)} className="p-button-text" />
                        <Button
                            label="Discard & Continue"
                            icon="pi pi-trash"
                            className="p-button-danger p-button-text"
                            onClick={() => {
                                setShowConfirmDialog(false);
                                if (nextAction) {
                                    if (typeof nextAction === 'function') nextAction();
                                    else if (typeof nextAction === 'string') router.push(nextAction);
                                }
                            }}
                        />
                        <Button
                            label="Save & Continue"
                            icon="pi pi-check"
                            onClick={async () => {
                                try {
                                    await saveResumeData();
                                    setShowConfirmDialog(false);
                                    if (nextAction) {
                                        if (typeof nextAction === 'function') nextAction();
                                        else if (typeof nextAction === 'string') router.push(nextAction);
                                    }
                                } catch {
                                    // Error is handled in saveResumeData, do nothing here
                                }
                            }}
                            autoFocus
                        />
                    </div>
                }
                onHide={() => setShowConfirmDialog(false)}
            >
                <div className="flex align-items-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>You have unsaved changes. What would you like to do?</span>
                </div>
            </Dialog>

            {/* Global Edit Dialog */}
            <Dialog
                header="Global Resume Edit"
                visible={showGlobalEditDialog}
                style={{ width: 'min(95vw, 600px)' }}
                modal
                onHide={() => setShowGlobalEditDialog(false)}
            >
                <div className="p-fluid">
                    <p className="mb-4 text-color-secondary">
                        Enter instructions to apply changes across your entire resume. For example: &quot;Change all dates to YYYY-MM format&quot; or &quot;Rewrite my experience section to be more concise and impactful.&quot;
                    </p>
                    <AIAssistant
                        prompt={globalEditPrompt}
                        setPrompt={setGlobalEditPrompt}
                        onSubmit={handleGlobalEditSubmit}
                        isProcessing={isGlobalAIProcessing}
                    />
                </div>
            </Dialog>

            {/* Documents Dialog */}
            <Dialog
                header="Resume Documents"
                visible={showDocumentsDialog}
                style={{ width: 'min(95vw, 900px)' }}
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
                    allResumesListCache={allResumesListCache} // Pass the cache data
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



