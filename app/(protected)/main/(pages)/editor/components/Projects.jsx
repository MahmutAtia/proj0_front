"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import './styles.css';

const Projects = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem } = useResume();
    const projects = data[sectionKey] || [];
    const historyRef = useRef([]);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const [newItemIndex, setNewItemIndex] = useState(null);

    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const handleInputChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value.target?.value ?? value;
        setData(newData);
    };

    const addProject = () => {
        const newIndex = projects.length;
        const newProject = {
            name: '',
            description: '',
            url: '',
            github: '',
            keywords: []
        };
        const newData = { ...data };
        newData[sectionKey] = [...projects, newProject];
        setData(newData);
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, projects.length);

        setTimeout(() => {
            lastItemRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    };

    const handleAIUpdate = async (index, updatedData) => {
        try {
            const prevState = { ...data[sectionKey][index] };
            historyRef.current.push(JSON.stringify(prevState));

            const newData = { ...data };
            newData[sectionKey][index] = {
                ...newData[sectionKey][index],
                ...updatedData
            };
            setData(newData);

            toast.current.show({
                severity: 'success',
                summary: 'AI Updated',
                detail: 'Project has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update project'
            });
        }
    };

    const handleUndo = (index) => {
        if (historyRef.current.length > 0) {
            const prevState = JSON.parse(historyRef.current.pop());
            const newData = { ...data };
            newData[sectionKey][index] = prevState;
            setData(newData);

            toast.current.show({
                severity: 'info',
                summary: 'Undo',
                detail: 'Previous state restored'
            });
        }
    };

    const handleDelete = (index) => {
        if (isItemEditing(index)) {
            toggleEditMode(sectionKey, index);
        }
        removeSectionItem(sectionKey, index);

        setTimeout(() => {
            if (firstItemRef.current) {
                firstItemRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);

        toast.current.show({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Project has been removed'
        });
    };

    return (
        <SectionWrapper
            title="Projects"
            onAdd={addProject}
            toast={toast}
            className="scroll-mt-[100px]"
        >
            {projects.map((project, index) => (
                <ItemWrapper
                    key={index}
                    itemRef={index === 0
                        ? firstItemRef
                        : index === projects.length - 1
                            ? lastItemRef
                            : null
                    }
                    isNewItem={index === newItemIndex}
                    isEditing={isItemEditing(index)}
                    onEdit={() => toggleEditMode(sectionKey, index)}
                    onUndo={() => handleUndo(index)}
                    onDelete={() => handleDelete(index)}
                    canUndo={historyRef.current.length > 0}
                    onAIUpdate={(updatedData) => handleAIUpdate(index, updatedData)}
                    sectionData={project}
                    sectionTitle={sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    editContent={
                        <div className="flex flex-column gap-3">
                            <InputText
                                placeholder="Project Name"
                                value={project.name}
                                onChange={(e) => handleInputChange(index, 'name', e)}
                                className="w-full"
                            />
                            <InputTextarea
                                placeholder="Description"
                                value={project.description}
                                onChange={(e) => handleInputChange(index, 'description', e)}
                                rows={3}
                                className="w-full"
                            />
                            <div className="flex gap-2">
                                <InputText
                                    placeholder="Project URL"
                                    value={project.url}
                                    onChange={(e) => handleInputChange(index, 'url', e)}
                                    className="flex-1"
                                />
                                <InputText
                                    placeholder="GitHub URL"
                                    value={project.github}
                                    onChange={(e) => handleInputChange(index, 'github', e)}
                                    className="flex-1"
                                />
                            </div>
                            <InputText
                                placeholder="Technologies (comma-separated)"
                                value={project.keywords?.join(', ')}
                                onChange={(e) => handleInputChange(index, 'keywords', {
                                    target: { value: e.target.value.split(',').map(k => k.trim()) }
                                })}
                                className="w-full"
                            />
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="font-semibold">{project.name}</span>
                                <div className="flex gap-2">
                                    {project.url && (
                                        <a href={project.url} target="_blank" rel="noopener noreferrer">
                                            <i className="pi pi-link"></i>
                                        </a>
                                    )}
                                    {project.github && (
                                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                                            <i className="pi pi-github"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div style={{ whiteSpace: 'pre-line' }} className="text-700">{project.description}</div>
                            <div className="flex flex-wrap gap-2">
                                {project.keywords?.map((tech, i) => (
                                    <span key={i} className="surface-200 text-700 border-round px-2 py-1">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default Projects;
