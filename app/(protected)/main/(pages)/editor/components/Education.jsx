"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import './styles.css';

const Education = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem } = useResume();
    const education = data[sectionKey] || [];
    const historyRef = useRef([]);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const [newItemIndex, setNewItemIndex] = useState(null);

    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const handleInputChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value;
        setData(newData);
    };

    const addEducation = () => {
        const newIndex = education.length;
        const newEducation = {
            institution: '',
            area: '',
            studyType: '',
            startDate: '',
            endDate: '',
            gpa: ''
        };
        const newData = { ...data };
        newData[sectionKey] = [...education, newEducation];
        setData(newData);
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, education.length);

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
                detail: 'Education has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update education'
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
            detail: 'Item has been removed'
        });
    };

    return (
        <SectionWrapper
            title="Education"
            onAdd={addEducation}
            toast={toast}
            className="scroll-mt-[100px]"
        >
            {education.map((edu, index) => (
                <ItemWrapper
                    key={index}
                    itemRef={index === 0
                        ? firstItemRef
                        : index === education.length - 1
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
                    sectionData={edu}
                    sectionTitle={sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    editContent={
                        <div className="flex flex-column gap-3">
                            <InputText
                                placeholder="Institution"
                                value={edu.institution}
                                onChange={(e) => handleInputChange(index, 'institution', e.target.value)}
                                className="w-full"
                            />
                            <InputText
                                placeholder="Area of Study"
                                value={edu.area}
                                onChange={(e) => handleInputChange(index, 'area', e.target.value)}
                                className="w-full"
                            />
                            <InputText
                                placeholder="Degree Type"
                                value={edu.studyType}
                                onChange={(e) => handleInputChange(index, 'studyType', e.target.value)}
                                className="w-full"
                            />
                            <div className="flex gap-2">
                                <Calendar
                                    placeholder="Start Date"
                                    value={edu.startDate}
                                    onChange={(e) => handleInputChange(index, 'startDate', e.value)}
                                    className="flex-1"
                                    monthNavigator
                                    yearNavigator
                                    yearRange="2000:2030"
                                />
                                <Calendar
                                    placeholder="End Date"
                                    value={edu.endDate}
                                    onChange={(e) => handleInputChange(index, 'endDate', e.value)}
                                    className="flex-1"
                                    monthNavigator
                                    yearNavigator
                                    yearRange="2000:2030"
                                />
                            </div>
                            <InputText
                                placeholder="GPA"
                                value={edu.gpa}
                                onChange={(e) => handleInputChange(index, 'gpa', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="font-semibold">{edu.institution}</span>
                                <span className="text-500">
                                    {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ''} -
                                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <span className="text-primary">{edu.studyType} in {edu.area}</span>
                            {edu.gpa && <span className="text-700">GPA: {edu.gpa}</span>}
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default Education;
