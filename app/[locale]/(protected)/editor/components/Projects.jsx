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
    const { data, setData, toggleEditMode, editMode, removeSectionItem, addSectionItem, moveSectionItem } = useResume();
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
            link: ''
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
                    key={project.id || index}
                    itemId={project.id}
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
                    sectionTitle="Projects"
                    onMoveUp={() => moveSectionItem(sectionKey, index, 'up')}
                    onMoveDown={() => moveSectionItem(sectionKey, index, 'down')}
                    isFirst={index === 0}
                    isLast={index === projects.length - 1}
                    editContent={
                        <div className="flex flex-column gap-3">
                            <InputText
                                placeholder="Project Name"
                                value={project.name}
                                onChange={(e) => handleInputChange(index, 'name', e)}
                                className="w-full"
                                tooltip="Project Name"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputTextarea
                                placeholder="Description"
                                value={project.description}
                                onChange={(e) => handleInputChange(index, 'description', e)}
                                rows={4}
                                className="w-full"
                                tooltip="Project Description"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Project Link/URL"
                                value={project.link}
                                onChange={(e) => handleInputChange(index, 'link', e)}
                                className="w-full"
                                tooltip="Project Link/URL"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between align-items-start">
                                <span 
                                    className="font-semibold text-900"
                                    title="Project Name"
                                >
                                    {project.name}
                                </span>
                                {project.link && project.link !== '' && (
                                    <a 
                                        href={project.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary"
                                        title="Project Link"
                                    >
                                        <i className="pi pi-external-link"></i>
                                    </a>
                                )}
                            </div>
                            <div 
                                style={{ 
                                    whiteSpace: 'pre-line',
                                    wordBreak: 'break-word'
                                }} 
                                className="text-700 line-height-3"
                                title="Project Description"
                            >
                                {project.description}
                            </div>
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default Projects;
