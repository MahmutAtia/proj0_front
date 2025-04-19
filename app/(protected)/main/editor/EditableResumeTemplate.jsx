import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import PersonalInformation from "./components/PersonalInformation";
import Summary from "./components/Summary";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Languages from "./components/Languages";
import { useResume } from "./ResumeContext";
import GenericSection from "./components/GenericSection";
import { ProgressSpinner } from 'primereact/progressspinner';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import 'primeflex/primeflex.css';
import styles from './EditableResumeTemplate.module.css';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';

const EditableResumeTemplate = ({ resumeId }) => {
    const { data } = useResume();
    const [loading, setLoading] = useState(false);
    const [hiddenSections, setHiddenSections] = useState([]);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const router = useRouter();
    const NON_ARRAY_SECTIONS = ['personal_information', 'summary', 'objective'];
    const toast = useRef(null);
    const [sectionOrder, setSectionOrder] = useState([
        "personal_information",
        "summary",
        "experience",
        "education",
        "projects",
        "skills",
        "languages",
        "awards_and_recognition",
        "volunteer_and_social_activities",
        "certifications",
        "interests",
        "references",
        "publications",
        "courses",
        "conferences",
        "speaking_engagements",
        "patents",
        "professional_memberships",
        "military_service",
        "teaching_experience",
        "research_experience",
    ]);
    const sectionRefs = useRef({});

    // Check if a section is empty
    const isSectionEmpty = (key) => {
        if (!data[key]) return true;

        if (NON_ARRAY_SECTIONS.includes(key)) {
            return Object.keys(data[key]).length === 0;
        }

        return Array.isArray(data[key]) && data[key].length === 0;
    };


    const toggleSectionVisibility = (sectionKey) => {
        setHiddenSections((prev) => {
            const newHiddenSections = prev.includes(sectionKey)
                ? prev.filter((key) => key !== sectionKey)
                : [...prev, sectionKey];

            if (!newHiddenSections.includes(sectionKey)) {
                setTimeout(() => {
                    const element = document.getElementById(`section-${sectionKey}`);
                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }, 100);
            }
            return newHiddenSections;
        });
    };

    // Handle reordering of sections
    const handleReorderSections = (result) => {
        if (!result.destination) return;

        const newOrder = Array.from(sectionOrder);
        const [removed] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, removed);

        setSectionOrder(newOrder);
        localStorage.setItem('sectionOrder', JSON.stringify(newOrder));
    };



    // Render the appropriate component for each section
    const renderSection = (sectionKey) => {
        if (hiddenSections.includes(sectionKey)) return null;

        const isEmpty = isSectionEmpty(sectionKey);

        switch (sectionKey) {
            case 'personal_information':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <PersonalInformation sectionKey={sectionKey} />
                </div>
            case 'summary':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <Summary sectionKey={sectionKey} />
                </div>
            case 'experience':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <Experience sectionKey={sectionKey} />
                </div>
            case 'education':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <Education sectionKey={sectionKey} />
                </div>
            case 'projects':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}

                    className="scroll-mt-[120px]"
                >
                    <Projects sectionKey={sectionKey} />
                </div>
            case 'skills':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <Skills sectionKey={sectionKey} />
                </div>
            case 'languages':
                return <div
                    key={sectionKey}
                    id={`section-${sectionKey}`}
                    className="scroll-mt-[120px]"
                >
                    <Languages sectionKey={sectionKey} />
                </div>
            default:
                return (
                    <div


                        key={sectionKey}
                        id={`section-${sectionKey}`}
                        className="scroll-mt-[120px]"
                    >
                        <GenericSection sectionKey={sectionKey} />
                    </div>
                );
        }
    };


    // Load section order from localStorage on mount
    useEffect(() => {
        // const savedOrder = localStorage.getItem('sectionOrder');
        // if (savedOrder) {
        //     setSectionOrder(JSON.parse(savedOrder));
        // }

        sectionOrder.forEach(sectionKey => {
            sectionRefs.current[sectionKey] = null;
        });

        // Set the initial visibility of sections
        setHiddenSections(sectionOrder.filter((key) => isSectionEmpty(key)));
    }, []);



    const saveResumeData = () => {
        console.log("data from save", data);
        const localData = localStorage.getItem('data');
        let resumes = localData ? JSON.parse(localData) : [];
        console.log("resumes", data);
        const existingResumeIndex = resumes.findIndex((item) => item.id === Number(resumeId));
        if (existingResumeIndex !== -1) {
            resumes[existingResumeIndex].resume = data;
        } else {
            resumes.push({ id: Number(params.id), resume: data });
        }

        localStorage.setItem('data', JSON.stringify(resumes));
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Resume saved successfully' });
    };

    return (
        <div>
            <Toast ref={toast} />
            {/* Header */}
            <div className="flex justify-content-between align-items-center p-4 surface-card shadow-1 border-round-lg sticky top-0 z-5">
                <h1 className="text-2xl font-semibold m-0">Resume Editor</h1>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-globe"
                        label='Generate Website'
                        className="p-button-outlined"
                        onClick={() => router.push(`/generate_site/${resumeId}`)}
                    />

                    <Button
                        icon="pi pi-download"
                        label="Export"
                        className="p-button-outlined"
                        onClick={() => router.push(`/export/${resumeId}`)}
                    />
                    <Button
                        icon="pi pi-save"
                        label="Save"
                        severity="success"
                        onClick={saveResumeData}
                    />
                </div>
            </div>
            <div className="surface-ground h-full flex">

                <div className="flex-1 overflow-hidden">

                    {/* Sidebar Toggle Button */}
                    <button
                        className={`${styles.sidebarToggleButton} `}
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                    >
                        <i className="pi pi-bars"></i>
                    </button>

                    {/* Sidebar */}
                    <div className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarVisible : ''}`}>
                        <div className="surface-card p-4 border-bottom-1 surface-border backdrop-blur-sm bg-white-alpha-90">
                            <p className="text-600 text-sm mt-2 mb-0">Drag sections to reorder</p>
                        </div>
                        <div className={styles.sidebarContent}>
                            <Accordion multiple activeIndex={[0]} className="surface-ground">
                                <AccordionTab
                                    header={
                                        <div className="flex align-items-center gap-2">
                                            <i className="pi pi-list text-primary"></i>
                                            <span className="font-medium text-900">Sections</span>
                                        </div>
                                    }
                                >
                                    <DragDropContext onDragEnd={handleReorderSections}>
                                        <Droppable droppableId="sections">
                                            {(provided) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className="flex flex-column gap-2 mt-2"
                                                >
                                                    {sectionOrder.map((sectionKey, index) => {
                                                        if (!sectionKey) return null; // Guard clause for undefined keys

                                                        const isEmpty = isSectionEmpty(sectionKey);
                                                        return (
                                                            <Draggable
                                                                key={sectionKey}
                                                                draggableId={sectionKey}
                                                                index={index}
                                                            >
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        onClick={() => toggleSectionVisibility(sectionKey)}
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`
                                                                    surface-card border-round-lg
                                                                    p-3 flex align-items-center justify-content-between
                                                                    cursor-pointer transition-all transition-duration-200
                                                                    ${snapshot.isDragging
                                                                                ? "shadow-4"
                                                                                : "shadow-1 hover:shadow-2"
                                                                            }
                                                                `}
                                                                    >
                                                                        <div className="flex align-items-center gap-2">
                                                                            <span className="font-medium text-700">
                                                                                {sectionKey.split('_').map(word =>
                                                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                                                ).join(' ')}
                                                                            </span>
                                                                            {isEmpty && (
                                                                                <span className="text-sm text-500 ml-2 p-1 border-round-sm bg-yellow-100">
                                                                                    Empty
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <i
                                                                            className={`pi ${hiddenSections.includes(sectionKey) ? 'pi-eye-slash' : 'pi-eye'} text-600 cursor-pointer`}
                                                                            onClick={() => toggleSectionVisibility(sectionKey)}
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
                                </AccordionTab>
                            </Accordion>
                        </div>
                    </div>

                    {/* Overlay for Sidebar on Small Screens */}
                    {sidebarVisible && (
                        <div
                            className={`${styles.overlay} lg:hidden`}
                            onClick={() => setSidebarVisible(false)}
                        />
                    )}

                    {/* Main Content Area */}
                    <div className={`${styles.mainContent} flex-grow-1`}>
                        <div className="h-full flex justify-content-center p-2 lg:p-4">
                            {loading && (
                                <div className="fixed top-50 left-50 -translate-x-50 -translate-y-50 z-5">
                                    <ProgressSpinner strokeWidth="3" />
                                </div>
                            )}
                            <div className={`${styles.surfaceCard} ${styles.scrollableContent} w-full`}>
                                {sectionOrder.map((sectionKey) => {
                                    const isEmpty = isSectionEmpty(sectionKey);
                                    return (
                                        !hiddenSections.includes(sectionKey) && (
                                            <div key={sectionKey} ref={sectionRefs.current[sectionKey]} className={styles.sectionSpacing}>
                                                {renderSection(sectionKey)}
                                                {isEmpty && (
                                                    <div className="text-center text-500 mt-2">
                                                        This section is empty. Add content to make it visible.
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};


export default EditableResumeTemplate;

