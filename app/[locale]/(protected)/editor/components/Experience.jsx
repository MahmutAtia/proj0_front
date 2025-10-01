"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import './styles.css';

const Experience = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem, addSectionItem, moveSectionItem } = useResume();
    const experiences = data[sectionKey] || [];
    const historyRef = useRef([]);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const [newItemIndex, setNewItemIndex] = useState(null);



    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const toggleItemEditMode = (index) => {
        toggleEditMode(sectionKey, index);
    };

    const handleInputChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value;
        setData(newData);
    };

    const addExperience = () => {
        const newIndex = experiences.length;
        addSectionItem(sectionKey, {
            company: '',
            title: '',
            start_date: '',
            end_date: '',
            location: '',
            description: '',
            technologies: []
        });
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, newIndex);

        setTimeout(() => {
            lastItemRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    };
    const handleAIUpdate = async (index, updatedData) => {
        try {
            // Save current state to history
            const prevState = { ...data[sectionKey][index] };
            historyRef.current.push(JSON.stringify(prevState));

            // Update the specific experience item with AI response
            const newData = { ...data };
            // Assuming API returns { company, position, startDate, endDate, description }
            newData[sectionKey][index] = {
                ...newData[sectionKey][index],
                ...updatedData
            };

            setData(newData);

            toast.current.show({
                severity: 'success',
                summary: 'AI Updated',
                detail: 'Experience has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update experience'
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
        // Close edit mode if open
        if (isItemEditing(index)) {
            toggleItemEditMode(index);
        }
        // Remove item from data
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
            detail: 'Item has been removed'
        });
    };

    const addTechnology = (index) => {
        const newData = { ...data };
        newData[sectionKey][index].technologies = [...(newData[sectionKey][index].technologies || []), ''];
        setData(newData);
    };

    const handleTechnologyChange = (expIndex, techIndex, value) => {
        const newData = { ...data };
        newData[sectionKey][expIndex].technologies[techIndex] = value;
        setData(newData);
    };

    const removeTechnology = (expIndex, techIndex) => {
        const newData = { ...data };
        newData[sectionKey][expIndex].technologies.splice(techIndex, 1);
        setData(newData);
    };

    return (<SectionWrapper
        title="Experience" 
        onAdd={addExperience} 
        toast={toast}
        sectionKey={sectionKey}
        className="scroll-mt-[120px] pt-4"
    >
        {experiences.map((exp, index) => (
            <ItemWrapper
                key={exp.id || index}
                itemId={exp.id}
                itemRef={index === 0
                    ? firstItemRef
                    : index === experiences.length - 1
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
                sectionData={exp}
                sectionTitle="Experience"
                onMoveUp={() => moveSectionItem(sectionKey, index, 'up')}
                onMoveDown={() => moveSectionItem(sectionKey, index, 'down')}
                isFirst={index === 0}
                isLast={index === experiences.length - 1}
                editContent={
                    <div className="flex flex-column gap-3">
                        <InputText
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => handleInputChange(index, 'company', e.target.value)}
                            className="w-full"
                            tooltip="Company Name"
                            tooltipOptions={{ position: 'top' }}
                        />
                        <InputText
                            placeholder="Title"
                            value={exp.title}
                            onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                            className="w-full"
                            tooltip="Job Title"
                            tooltipOptions={{ position: 'top' }}
                        />
                        <InputText
                            placeholder="Location"
                            value={exp.location}
                            onChange={(e) => handleInputChange(index, 'location', e.target.value)}
                            className="w-full"
                            tooltip="Work Location"
                            tooltipOptions={{ position: 'top' }}
                        />
                        <div className="flex gap-2">
                            <InputText
                                placeholder="Start Date (YYYY-MM-DD)"
                                value={exp.start_date}
                                onChange={(e) => handleInputChange(index, 'start_date', e.target.value)}
                                className="flex-1"
                                tooltip="Start Date"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="End Date (YYYY-MM-DD or Current)"
                                value={exp.end_date}
                                onChange={(e) => handleInputChange(index, 'end_date', e.target.value)}
                                className="flex-1"
                                tooltip="End Date"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                        <InputTextarea
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                            rows={5}
                            className="w-full"
                            tooltip="Job Description"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>
                }
                viewContent={
                    <div className="flex flex-column gap-2">
                        <div className="flex justify-content-between align-items-start">
                            <span className="font-semibold" title="Company Name">{exp.company}</span>
                            <span className="text-500 text-right flex-shrink-0 ml-2" title="Employment Period">
                                {exp.start_date || ''} - {exp.end_date || 'Current'}
                            </span>
                        </div>
                        <span className="text-primary font-medium" title="Job Title">{exp.title}</span>
                        {exp.location && (
                            <span className="text-600 text-sm" title="Work Location">{exp.location}</span>
                        )}
                        <div 
                            style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }} 
                            className="text-700 line-height-4 mt-2"
                            title="Job Description"
                        >
                            {exp.description}
                        </div>
                    </div>
                }
            />
        ))}
    </SectionWrapper>
    );


};


export default Experience;
