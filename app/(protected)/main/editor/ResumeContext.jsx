import React, { createContext, useState, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import "primeicons/primeicons.css";

export const ResumeContext = createContext();

export const ResumeProvider = ({ children, initialData }) => {

    const [data, setData] = useState(initialData);
    const [editMode, setEditMode] = useState({});

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
        setData((prevData) => {
            const newData = JSON.parse(JSON.stringify(prevData));
            if (!newData[section]) {
                newData[section] = [];
            }
            if (Array.isArray(newData[section])) {
                newData[section].push({ id: uuidv4(), ...getDefaultItem(section) });
            }
            return newData;
        });
    };

    const removeSectionItem = (section, index, id) => {
        setData((prevData) => {
            const newData = JSON.parse(JSON.stringify(prevData));
            if (Array.isArray(newData[section])) {
                newData[section] = newData[section].filter((item, i) =>
                    id ? item.id !== id : i !== index,
                );
            }
            return newData;
        });
        setEditMode((prevEditMode) => {
            const newEditMode = { ...prevEditMode };
            if (newEditMode[section]) {
                delete newEditMode[section][id || "all"];
            }
            return newEditMode;
        });
    };

    const getDefaultItem = (section) => {
        return defaultItems[section] || {};
    };



    return (
        <ResumeContext.Provider
            value={{
                data,
                setData,
                editMode,
                setEditMode,
                toggleEditMode,
                addSectionItem,
                removeSectionItem,
                getDefaultItem,
                defaultSections, // Provide default sections to the context
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
        phone: [],
        location: {
            address: null,
            city: null,
            state: null,
            postal_code: null,
        },
        profiles: {
            linkedin: null,
            github: null,
            website: null,
            portfolio: null,
        },
    },
    experience: {
        company: "",
        title: "",
        location: null,
        start_date: "",
        end_date: null,
        description: "",
        technologies: [],
    },
    education: {
        institution: "",
        degree: "",
        major: "",
        minor: null,
        gpa: null,
        graduation_date: "",
        relevant_courses: [],
    },
    skills: {
        name: "",
        proficiency: "",
        keywords: [],
    },
    projects: {
        name: "",
        description: "",
        link: null,
    },
    awards_and_recognition: {
        title: "",
        issuing_organization: "",
        date_received: "",
        description: "",
    },
    volunteer_and_social_activities: {
        organization: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
    },
    certifications: {
        name: "",
        issuing_authority: "",
        date_obtained: "",
        expiry_date: null,
    },
    languages: {
        language: "",
        proficiency: "",
    },
    interests: {
        name: "",
        keywords: [],
    },
    references: {
        name: "",
        position: "",
        company: "",
        email: "",
        phone: [],
        relationship: "",
        years_known: "",
    },
    publications: {
        title: "",
        authors: [],
        publication_date: "",
        publisher: "",
        link: null,
        description: "",
    },
    courses: {
        title: "",
        institution: "",
        completion_date: "",
        link: null,
        description: "",
    },
    conferences: {
        name: "",
        date: "",
        location: "",
        link: null,
        description: "",
    },
    speaking_engagements: {
        title: "",
        event: "",
        date: "",
        location: "",
        audience_size: null,
        video_link: null,
        slides_link: null,
    },
    patents: {
        title: "",
        patent_number: "",
        filing_date: "",
        issue_date: null,
        status: "",
        inventors: [],
        description: "",
    },
    professional_memberships: {
        organization: "",
        role: "",
        start_date: "",
        end_date: null,
        benefits: [],
    },
    military_service: {
        branch: "",
        rank: "",
        start_date: "",
        end_date: "",
        location: "",
        duties: [],
        awards: [],
    },
    teaching_experience: {
        institution: "",
        position: "",
        subject: "",
        start_date: "",
        end_date: null,
        description: "",
        student_level: "",
        class_size: null,
    },
    research_experience: {
        institution: "",
        project: "",
        role: "",
        start_date: "",
        end_date: null,
        description: "",
        funding_source: null,
        publications: [],
        collaborators: [],
    },
};

