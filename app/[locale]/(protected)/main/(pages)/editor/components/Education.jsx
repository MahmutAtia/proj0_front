"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
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
            degree: '',
            major: '',
            minor: '',
            graduation_date: '',
            gpa: '',
            relevant_courses: []
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

    const addCourse = (index) => {
        const newData = { ...data };
        newData[sectionKey][index].relevant_courses = [...(newData[sectionKey][index].relevant_courses || []), ''];
        setData(newData);
    };

    const handleCourseChange = (eduIndex, courseIndex, value) => {
        const newData = { ...data };
        newData[sectionKey][eduIndex].relevant_courses[courseIndex] = value;
        setData(newData);
    };

    const removeCourse = (eduIndex, courseIndex) => {
        const newData = { ...data };
        newData[sectionKey][eduIndex].relevant_courses.splice(courseIndex, 1);
        setData(newData);
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

    const formatGraduationDate = (dateString) => {
        if (!dateString) return '';
        try {
            // For YYYY-MM format, add day to make it a valid date
            const date = new Date(dateString + '-01');
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
        } catch (error) {
            return dateString; // Return original if parsing fails
        }
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
                                tooltip="Institution Name"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Degree"
                                value={edu.degree}
                                onChange={(e) => handleInputChange(index, 'degree', e.target.value)}
                                className="w-full"
                                tooltip="Degree/Program"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Major"
                                value={edu.major}
                                onChange={(e) => handleInputChange(index, 'major', e.target.value)}
                                className="w-full"
                                tooltip="Major Field of Study"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Minor"
                                value={edu.minor}
                                onChange={(e) => handleInputChange(index, 'minor', e.target.value)}
                                className="w-full"
                                tooltip="Minor Field of Study"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Graduation Date (YYYY-MM)"
                                value={edu.graduation_date}
                                onChange={(e) => handleInputChange(index, 'graduation_date', e.target.value)}
                                className="w-full"
                                tooltip="Graduation Date"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="GPA"
                                value={edu.gpa}
                                onChange={(e) => handleInputChange(index, 'gpa', e.target.value)}
                                className="w-full"
                                tooltip="Grade Point Average"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <div className="flex flex-column gap-2">
                                <label>Relevant Courses</label>
                                <div className="flex flex-wrap gap-2">
                                    {edu.relevant_courses?.map((course, courseIndex) => (
                                        <div key={courseIndex} className="flex align-items-center gap-2">
                                            <InputText
                                                value={course}
                                                onChange={(e) => handleCourseChange(index, courseIndex, e.target.value)}
                                                className="w-10rem"
                                            />
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-rounded p-button-text p-button-danger"
                                                onClick={() => removeCourse(index, courseIndex)}
                                                tooltip="Remove Course"
                                                tooltipOptions={{ position: 'top' }}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        icon="pi pi-plus"
                                        className="p-button-rounded p-button-text"
                                        onClick={() => addCourse(index)}
                                        tooltip="Add Course"
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between align-items-start">
                                <span className="font-semibold" title="Institution Name">{edu.institution}</span>
                                <span className="text-500 text-right flex-shrink-0 ml-2" title="Graduation Date">
                                    {formatGraduationDate(edu.graduation_date)}
                                </span>
                            </div>
                            <span className="text-primary font-medium" title="Degree/Program">{edu.degree}</span>
                            {edu.major && edu.major !== '' && (
                                <span className="text-600" title="Major Field of Study">Major: {edu.major}</span>
                            )}
                            {edu.minor && edu.minor !== '' && (
                                <span className="text-600" title="Minor Field of Study">Minor: {edu.minor}</span>
                            )}
                            {edu.gpa && edu.gpa !== '' && (
                                <span className="text-700" title="Grade Point Average">GPA: {edu.gpa}</span>
                            )}
                            {edu.relevant_courses && edu.relevant_courses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {edu.relevant_courses.map((course, courseIndex) => (
                                        <span key={courseIndex} className="bg-blue-50 text-blue-700 px-2 py-1 border-round text-xs">
                                            {course}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default Education;
