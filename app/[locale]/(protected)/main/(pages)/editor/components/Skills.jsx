"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import './styles.css';

const Skills = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem } = useResume();
    const skills = data[sectionKey] || [];
    const historyRef = useRef([]);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const [newItemIndex, setNewItemIndex] = useState(null);

    const levelOptions = [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced', value: 'Advanced' },
        { label: 'Expert', value: 'Expert' }
    ];

    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const handleInputChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value;
        setData(newData);
    };

    const addSkill = () => {
        const newIndex = skills.length;
        const newSkill = {
            name: '',
            level: '',
            keywords: []
        };
        const newData = { ...data };
        newData[sectionKey] = [...skills, newSkill];
        setData(newData);
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, skills.length);

        setTimeout(() => {
            lastItemRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    };

    const addKeyword = (index) => {
        const newData = { ...data };
        newData[sectionKey][index].keywords = [...(newData[sectionKey][index].keywords || []), ''];
        setData(newData);
    };

    const handleKeywordChange = (skillIndex, keywordIndex, value) => {
        const newData = { ...data };
        newData[sectionKey][skillIndex].keywords[keywordIndex] = value;
        setData(newData);
    };

    const removeKeyword = (skillIndex, keywordIndex) => {
        const newData = { ...data };
        newData[sectionKey][skillIndex].keywords.splice(keywordIndex, 1);
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
                detail: 'Skill has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update skill'
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
            title="Skills"
            onAdd={addSkill}
            toast={toast}
            className="scroll-mt-[100px]"
        >
            {skills.map((skill, index) => (
                <ItemWrapper
                    key={index}
                    itemRef={index === 0
                        ? firstItemRef
                        : index === skills.length - 1
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
                    sectionData={skill}
                    sectionTitle={sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    editContent={
                        <div className="flex flex-column gap-3">
                            <InputText
                                placeholder="Skill Name"
                                value={skill.name}
                                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                className="w-full"
                            />
                            <Dropdown
                                placeholder="proficiency"
                                value={skill.level}
                                options={levelOptions}
                                onChange={(e) => handleInputChange(index, 'proficiency', e.value)}
                                className="w-full"
                            />
                            <div className="flex flex-column gap-2">
                                <label>Keywords</label>
                                <div className="flex flex-wrap gap-2">
                                    {skill.keywords?.map((keyword, keywordIndex) => (
                                        <div key={keywordIndex} className="flex align-items-center gap-2">
                                            <InputText
                                                value={keyword}
                                                onChange={(e) => handleKeywordChange(index, keywordIndex, e.target.value)}
                                                className="w-8rem"
                                            />
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-rounded p-button-text p-button-danger"
                                                onClick={() => removeKeyword(index, keywordIndex)}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        icon="pi pi-plus"
                                        className="p-button-rounded p-button-text"
                                        onClick={() => addKeyword(index)}
                                        tooltip="Add Keyword"
                                    />
                                </div>
                            </div>
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="font-semibold">{skill.name}</span>
                                <span className="text-500">{skill.level}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {skill.keywords?.map((keyword, keywordIndex) => (
                                    <span key={keywordIndex} className="surface-200 text-700 border-round px-2 py-1">
                                        {keyword}
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

export default Skills;
