"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useResume } from '../ResumeContext';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import './styles.css';

const Languages = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode, removeSectionItem } = useResume();
    const languages = data[sectionKey] || [];
    const historyRef = useRef([]);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const [newItemIndex, setNewItemIndex] = useState(null);

    const fluencyOptions = [
        { label: 'Native', value: 'Native' },
        { label: 'Fluent', value: 'Fluent' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Basic', value: 'Basic' }
    ];

    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const handleInputChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value.target?.value ?? value;
        setData(newData);
    };

    const addLanguage = () => {
        const newIndex = languages.length;
        const newLanguage = {
            language: '',
            fluency: ''
        };
        const newData = { ...data };
        newData[sectionKey] = [...languages, newLanguage];
        setData(newData);
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, languages.length);

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
                detail: 'Language has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update language'
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
            detail: 'Language has been removed'
        });
    };

    return (
        <SectionWrapper
            title="Languages"
            onAdd={addLanguage}
            toast={toast}
            className="scroll-mt-[100px]"
        >
            {languages.map((lang, index) => (
                <ItemWrapper
                    key={index}
                    itemRef={index === 0
                        ? firstItemRef
                        : index === languages.length - 1
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
                    sectionData={lang}
                    sectionTitle={sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    editContent={
                        <div className="flex flex-column gap-3">
                            <InputText
                                placeholder="Language"
                                value={lang.language}
                                onChange={(e) => handleInputChange(index, 'language', e)}
                                className="w-full"
                            />
                            <Dropdown
                                placeholder="Fluency Level"
                                value={lang.fluency}
                                options={fluencyOptions}
                                onChange={(e) => handleInputChange(index, 'fluency', e.value)}
                                className="w-full"
                            />
                        </div>
                    }
                    viewContent={
                        <div className="flex justify-content-between align-items-center">
                            <span className="font-semibold">{lang.language}</span>
                            <span className="text-500">{lang.fluency}</span>
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default Languages;
