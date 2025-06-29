"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import ArrowIndicator from './ArrowIndicator';
import './styles.css';

const Experience = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem } = useResume();
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
        const newExperience = {
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: ''
        };
        const newData = { ...data };
        newData[sectionKey] = [...experiences, newExperience];
        setData(newData);
        // Automatically enable editing for new item
        setNewItemIndex(newIndex); // Set index to trigger animation
        toggleItemEditMode(experiences.length); // Enable editing


        //  scroll
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

    return (<SectionWrapper
        title="Experience" onAdd={addExperience} toast={toast}
        className="scroll-mt-[120px] pt-4"
    >
        {experiences.map((exp, index) => (


            <ItemWrapper
                key={index}
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
                sectionTitle={sectionKey.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
                editContent={
                    <div className="flex flex-column gap-3">
                        <InputText
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => handleInputChange(index, 'company', e.target.value)}
                            className="w-full"
                        />
                        <InputText
                            placeholder="Position"
                            value={exp.position}
                            onChange={(e) => handleInputChange(index, 'position', e.target.value)}
                            className="w-full"
                        />
                        <div className="flex gap-2">
                            <Calendar
                                placeholder="Start Date"
                                value={exp.startDate}
                                onChange={(e) => handleInputChange(index, 'startDate', e.value)}
                                className="flex-1"
                                monthNavigator
                                yearNavigator
                                yearRange="2000:2030"
                            />
                            <Calendar
                                placeholder="End Date"
                                value={exp.endDate}
                                onChange={(e) => handleInputChange(index, 'endDate', e.value)}
                                className="flex-1"
                                monthNavigator
                                yearNavigator
                                yearRange="2000:2030"
                            />
                        </div>
                        <InputTextarea
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                            rows={5}
                            className="w-full"
                        />
                    </div>
                }
                viewContent={
                    <div className="flex flex-column gap-2">
                        <div className="flex justify-content-between">
                            <span className="font-semibold">{exp.company}</span>
                            <span className="text-500">
                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} -
                                {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                            </span>
                        </div>
                        <span className="text-primary">{exp.position}</span>
                        <div style={{ whiteSpace: 'pre-line' }} className="text-700 line-height-4">{exp.description}</div>
                    </div>
                }
            />
        ))}
    </SectionWrapper>
    );


};


export default Experience;
