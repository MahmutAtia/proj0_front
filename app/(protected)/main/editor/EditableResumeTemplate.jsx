import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useRouter } from 'next/navigation';
import { Divider } from 'primereact/divider'; // Import Divider
import { Tooltip } from 'primereact/tooltip'; // Import Tooltip
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

const EditableResumeTemplate = ({ resumeId }) => {
    const { data, updateData } = useResume(); // Assuming updateData is available if needed later
    const [loading, setLoading] = useState(!data);
    const [hiddenSections, setHiddenSections] = useState([]);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const mainContentRef = useRef(null); // Ref for the main scrollable area

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
                resumes.push({ id: Number(resumeId), name: `Resume ${resumeId}`, resume: data });
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
                                                    {formatSectionName(sectionKey)}
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
        </div>
    );
};

export default EditableResumeTemplate;
