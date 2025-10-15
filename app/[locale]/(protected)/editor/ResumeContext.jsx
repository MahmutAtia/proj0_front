import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "primeicons/primeicons.css";

export const ResumeContext = createContext();

// --- State Cache ---
// This object lives outside the component lifecycle, so it persists across unmounts.
let stateCache = {
    resumeId: null,
    data: null,
    history: [],
    historyIndex: 0,
};

export const ResumeProvider = ({ children, initialData, aboutCandidate, resumeId }) => {
    // On mount, decide whether to load from cache or use initialData.
    const getInitialState = () => {
        if (resumeId === stateCache.resumeId && stateCache.data) {
            // We are editing the same resume, so restore the cached state.
            return {
                data: stateCache.data,
                history: stateCache.history,
                historyIndex: stateCache.historyIndex,
            };
        }
        // This is a new/different resume, so start fresh.
        return {
            data: initialData,
            history: [initialData],
            historyIndex: 0,
        };
    };

    const [data, setData] = useState(getInitialState().data);
    const [history, setHistory] = useState(getInitialState().history);
    const [historyIndex, setHistoryIndex] = useState(getInitialState().historyIndex);
    const [editMode, setEditMode] = useState({});

    // Effect to update the cache whenever the state changes.
    useEffect(() => {
        stateCache = { resumeId, data, history, historyIndex };
    }, [resumeId, data, history, historyIndex]);
    
    // Effect to handle loading a completely different resume.
    useEffect(() => {
        if (resumeId !== stateCache.resumeId) {
            setData(initialData);
            setHistory([initialData]);
            setHistoryIndex(0);
        }
    }, [resumeId, initialData]);

    const updateData = useCallback((newData) => {
        // When updating data, create a new history entry
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setData(newData);
    }, [history, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setData(history[newIndex]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setData(history[newIndex]);
        }
    }, [history, historyIndex]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // List of all default sections
    const defaultSections = [
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
    ];

    const toggleEditMode = (section, id = "all") => {
        setEditMode((prevEditMode) => ({
            ...prevEditMode,
            [section]: {
                ...(prevEditMode[section] ? prevEditMode[section] : {}), // Check if exists
                [id]: !prevEditMode[section]?.[id],
            },
        }));
    };

    const addSectionItem = (section) => {
        const newData = JSON.parse(JSON.stringify(data));
        if (!newData[section]) {
            newData[section] = [];
        }
        if (Array.isArray(newData[section])) {
            const newItem = getDefaultItem(section);
            // Add a unique ID for drag-and-drop
            newItem.id = `${section}-${crypto.randomUUID()}`;
            newData[section].push(newItem);
        }
        updateData(newData); // Use updateData to record history
    };

    const removeSectionItem = (section, index, id) => {
        const newData = JSON.parse(JSON.stringify(data));
        if (Array.isArray(newData[section])) {
            newData[section] = newData[section].filter((item, i) =>
                id ? item.id !== id : i !== index,
            );
        }
        updateData(newData); // Use updateData to record history

        setEditMode((prevEditMode) => {
            const newEditMode = { ...prevEditMode };
            if (newEditMode[section]) {
                delete newEditMode[section][id || "all"];
            }
            return newEditMode;
        });
    };

    const toggleItemVisibility = (sectionKey, itemId) => {
        const newData = JSON.parse(JSON.stringify(data));
        if (Array.isArray(newData[sectionKey])) {
            const item = newData[sectionKey].find(i => i.id === itemId);
            if (item) {
                item.hidden = !item.hidden; // Toggle the hidden property
                updateData(newData);
            }
        }
    };

    const moveSectionItem = (section, index, direction) => {
        const items = Array.from(data[section]);
        const item = items[index];

        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= items.length) {
            return; // Invalid move
        }

        items.splice(index, 1);
        items.splice(newIndex, 0, item);

        const newData = { ...data, [section]: items };
        updateData(newData); // Use updateData to record history
    };

    const getDefaultItem = (section) => {
        // Deep copy to avoid modifying the original defaultItems object
        const itemStructure = JSON.parse(JSON.stringify(defaultItems[section] || {}));
        
        return {
            ...itemStructure,
            hidden: false, // Ensure it's visible by default
        };
    };



    return (
        <ResumeContext.Provider
            value={{
                data,
                setData: updateData, // Expose updateData as setData
                aboutCandidate,
                editMode,
                toggleEditMode,
                addSectionItem,
                removeSectionItem,
                toggleItemVisibility, // <-- Add this
                moveSectionItem,
                getDefaultItem,
                defaultSections,
                undo,
                redo,
                canUndo,
                canRedo,
            }}
        >
            {children}
        </ResumeContext.Provider>
    );
};

export const useResume = () => {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error("useResume must be used within a ResumeProvider");
    }
    return context;
};



const defaultItems = {
    personal_information: {
        name: "",
        email: "",
        phone: "",
        location: {
            address: "",
            city: "",
            state: "",
            postal_code: ""
        },
        profiles: {
            linkedin: "",
            github: "",
            website: "",
            portfolio: ""
        }
    },
    summary: "",
    objective: "",
    experience: {
        company: "",
        title: "",
        location: "",
        start_date: "",
        end_date: "",
        description: "",
        technologies: []
    },
    education: {
        institution: "",
        degree: "",
        major: "",
        minor: "",
        gpa: "",
        graduation_date: "",
        relevant_courses: []
    },
    skills: {
        name: "",
        proficiency: "",
        keywords: []
    },
    projects: {
        name: "",
        description: "",
        link: ""
    },
    awards_and_recognition: {
        title: "",
        issuing_organization: "",
        date_received: "",
        description: ""
    },
    volunteer_and_social_activities: {
        organization: "",
        position: "",
        start_date: "",
        end_date: "",
        description: ""
    },
    certifications: {
        name: "",
        issuing_authority: "",
        date_obtained: "",
        expiry_date: "",
        description: ""
    },
    languages: {
        language: "",
        proficiency: ""
    },
    interests: {
        name: "",
        keywords: []
    },
    references: {
        name: "",
        position: "",
        company_or_institution: "",
        email: "",
        phone: "",
        relationship: "",
        years_known: "",
        description: ""
    },
    publications: {
        title: "",
        authors: [],
        publication_date: "",
        publisher: "",
        link: "",
        description: ""
    },
    courses: {
        title: "",
        institution: "",
        completion_date: "",
        link: "",
        description: ""
    },
    conferences: {
        name: "",
        date: "",
        location: "",
        link: "",
        description: ""
    },
    speaking_engagements: {
        title: "",
        event: "",
        date: "",
        location: "",
        audience_size: "",
        video_link: "",
        slides_link: "",
        description: ""
    },
    patents: {
        title: "",
        patent_number: "",
        filing_date: "",
        issue_date: "",
        status: "",
        inventors: [],
        description: ""
    },
    professional_memberships: {
        organization: "",
        role: "",
        start_date: "",
        end_date: "",
        benefits: [],
        description: ""
    },
    military_service: {
        branch: "",
        rank: "",
        start_date: "",
        end_date: "",
        location: "",
        duties: [],
        awards: []
    },
    teaching_experience: {
        institution: "",
        position: "",
        subject: "",
        start_date: "",
        end_date: "",
        description: "",
        student_level: "",
        class_size: ""
    },
    research_experience: {
        institution: "",
        project: "",
        role: "",
        start_date: "",
        end_date: "",
        description: "",
        funding_source: "",
        publications: [],
        collaborators: []
    }
};
