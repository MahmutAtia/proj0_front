import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useRouter } from 'next/navigation';
import { useResume } from "./ResumeContext";
import PersonalInformation from "./components/PersonalInformation";
import Summary from "./components/Summary";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Languages from "./components/Languages";
import GenericSection from "./components/GenericSection";
import 'primeflex/primeflex.css';
import styles from './EditableResumeTemplate.module.css'; // Ensure CSS Modules are used

const EditableResumeTemplate = ({ resumeId }) => {
    const { data } = useResume();
    const [loading, setLoading] = useState(!data); // Initialize loading based on initial data presence
    const [hiddenSections, setHiddenSections] = useState([]);
    const [sidebarVisible, setSidebarVisible] = useState(true); // Default to visible on larger screens
    const router = useRouter();
    const toast = useRef(null);

    // Define section keys and non-array sections
    const ALL_SECTION_KEYS = [
        "personal_information", "summary", "experience", "education", "projects",
        "skills", "languages", "awards_and_recognition", "volunteer_and_social_activities",
        "certifications", "interests", "references", "publications", "courses",
        "conferences", "speaking_engagements", "patents", "professional_memberships",
        "military_service", "teaching_experience", "research_experience",
    ];
    const NON_ARRAY_SECTIONS = ['personal_information', 'summary', 'objective']; // Add 'objective' if used

    const [sectionOrder, setSectionOrder] = useState(ALL_SECTION_KEYS);

    // Check if a section is empty
    const isSectionEmpty = (key) => {
        if (!data || !data[key]) return true;
        const sectionData = data[key];

        if (NON_ARRAY_SECTIONS.includes(key)) {
            return typeof sectionData === 'object' && sectionData !== null && Object.values(sectionData).every(value => !value || (typeof value === 'string' && value.trim() === ''));
        }

        if (Array.isArray(sectionData)) {
            return sectionData.length === 0;
            // Optional: Add deeper check for arrays of objects if needed
            // return sectionData.every(item => typeof item === 'object' && item !== null && Object.values(item).every(v => !v || (typeof v === 'string' && v.trim() === '')));
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
        // Optional: Persist order changes (e.g., to context/backend)
        // updateData({ ...data, sectionOrder: newOrder }); // Example if context supports it
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

    // Initialize hidden sections and sidebar visibility effect
    useEffect(() => {
        if (data) {
            setLoading(false);
            // Initialize hidden sections based on emptiness only once when data loads
            setHiddenSections(sectionOrder.filter((key) => isSectionEmpty(key)));
        }

        // Handle responsive sidebar visibility
        const mediaQuery = window.matchMedia('(min-width: 1024px)'); // lg breakpoint
        const handleResize = () => setSidebarVisible(mediaQuery.matches);
        handleResize(); // Initial check
        mediaQuery.addEventListener('change', handleResize);
        return () => mediaQuery.removeEventListener('change', handleResize);
    }, [data]); // Rerun only when data initially loads

    // Save resume data (example using localStorage)
    const saveResumeData = () => {
        console.log("Saving data:", data);
        setLoading(true); // Show loading indicator during save
        try {
            const localData = localStorage.getItem('data');
            let resumes = localData ? JSON.parse(localData) : [];
            const existingResumeIndex = resumes.findIndex((item) => item.id === Number(resumeId));

            if (existingResumeIndex !== -1) {
                resumes[existingResumeIndex] = { ...resumes[existingResumeIndex], resume: data };
            } else {
                // Handle case where resume ID might not be in local storage yet
                // This might need adjustment based on your app's logic
                console.warn("Resume ID not found in local storage during save. Adding new entry.");
                resumes.push({ id: Number(resumeId), name: `Resume ${resumeId}`, resume: data }); // Add name or other metadata if needed
            }

            localStorage.setItem('data', JSON.stringify(resumes));
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Resume saved successfully', life: 3000 });
        } catch (error) {
            console.error("Failed to save resume:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save resume.', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Helper to format section keys for display
    const formatSectionName = (key) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Combine class names conditionally
    const classNames = (...classes) => classes.filter(Boolean).join(' ');

    return (
        <div className={styles.editorLayout}>
            <Toast ref={toast} />

            {/* Header */}
            <header className={styles.editorHeader}>
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
                    {loading && <ProgressSpinner style={{width: '2rem', height: '2rem'}} strokeWidth="6" />}
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
            <div className={styles.editorMainArea}>

                {/* Sidebar */}
                <aside
                    id="resume-sidebar"
                    className={classNames(styles.sidebar, sidebarVisible && styles.sidebarVisible)}
                >
                    <div className={styles.sidebarHeader}>
                        <span className="font-semibold">Sections</span>
                        <p className="text-xs text-color-secondary mt-1 mb-0">Drag to reorder. Click eye to toggle.</p>
                    </div>

                    <div className={styles.sidebarContent}>
                        <DragDropContext onDragEnd={handleReorderSections}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={styles.sidebarSectionList}
                                    >
                                        {sectionOrder.map((sectionKey, index) => {
                                            if (!sectionKey) return null; // Should not happen with defined keys
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
                                                                isHidden && styles.sidebarItemHidden
                                                            )}
                                                        >
                                                            <div className={styles.sidebarItemContent}>
                                                                <span {...provided.dragHandleProps} className={styles.dragHandle}>
                                                                    <i className="pi pi-bars"></i>
                                                                </span>
                                                                <span className={styles.sidebarItemText}>{formatSectionName(sectionKey)}</span>
                                                                {isEmpty && !isHidden && (
                                                                    <span className={styles.emptyIndicator}>(Empty)</span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                icon={isHidden ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                                                className={classNames("p-button-text p-button-secondary p-button-sm", styles.visibilityToggle)}
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent drag on button click
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
                {sidebarVisible && <div className={styles.overlay} onClick={() => setSidebarVisible(false)} />}

                {/* Main Content */}
                <main className={styles.mainContent}>
                    <div className={styles.contentPadding}>
                        {!data && loading && (
                            <div className={styles.centeredSpinner}>
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
                             <div className={styles.resumePaper}>
                                <div className={styles.resumeSectionsContainer}>
                                    {sectionOrder.map((sectionKey) => {
                                        if (hiddenSections.includes(sectionKey)) return null;
                                        const isEmpty = isSectionEmpty(sectionKey);
                                        return (
                                            <section key={sectionKey} id={`section-${sectionKey}`} className={styles.sectionWrapper}>
                                                {renderSectionComponent(sectionKey)}
                                                {isEmpty && (
                                                    <div className={styles.emptySectionMessage}>
                                                        This section is empty. Add content or hide it using the <i className="pi pi-eye-slash mx-1"></i> icon in the sidebar.
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
        </div>
    );
};

export default EditableResumeTemplate;
