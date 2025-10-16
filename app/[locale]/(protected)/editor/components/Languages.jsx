"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useResume } from '../ResumeContext';
import AIAssistant from './AIAssistant';
import {aiApi} from '@/lib/axios';
import './styles.css';

const Languages = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode } = useResume();
    const languages = data[sectionKey] || [];
    const historyRef = useRef([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    const fluencyOptions = [
        { label: 'Native', value: 'Native' },
        { label: 'C2', value: 'C2' },
        { label: 'C1', value: 'C1' },
        { label: 'B2', value: 'B2' },
        { label: 'B1', value: 'B1' },
        { label: 'A2', value: 'A2' },
        { label: 'A1', value: 'A1' },
        { label: 'Fluent', value: 'Fluent' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Basic', value: 'Basic' }
    ];

    const isEditing = editMode[sectionKey]?.all;

    const handleLanguageChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value.target?.value ?? value;
        setData(newData, { recordHistory: false });
    };

    const addLanguage = () => {
        const newLanguage = {
            language: '',
            proficiency: ''
        };
        const newData = { ...data };
        newData[sectionKey] = [...languages, newLanguage];
        setData(newData, { recordHistory: false });
    };

    const removeLanguage = (index) => {
        const newData = { ...data };
        newData[sectionKey].splice(index, 1);
        setData(newData, { recordHistory: false });
    };

    const handleAIUpdate = async (updatedData) => {
        try {
            const prevState = [...languages];
            historyRef.current.push(JSON.stringify(prevState));

            const newData = { ...data };
            newData[sectionKey] = updatedData.languages || updatedData;
            setData(newData);

            toast.current.show({
                severity: 'success',
                summary: 'AI Updated',
                detail: 'Languages have been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update languages'
            });
        }
    };

    const handleUndo = () => {
        if (historyRef.current.length > 0) {
            const prevState = JSON.parse(historyRef.current.pop());
            const newData = { ...data };
            newData[sectionKey] = prevState;
            setData(newData, { recordHistory: false });

            toast.current.show({
                severity: 'info',
                summary: 'Undo',
                detail: 'Previous state restored'
            });
        }
    };

    const handleDelete = () => {
        if (isEditing) {
            toggleEditMode(sectionKey, 'all');
        }
        const newData = { ...data };
        newData[sectionKey] = [];
        setData(newData, { recordHistory: false });

        toast.current.show({
            severity: 'success',
            summary: 'Deleted',
            detail: 'All languages have been removed'
        });
    };

    const handleAISubmit = async () => {
        setIsAIProcessing(true);
        try {
            const response = await aiApi.post("/resumes-v2/edit_section", {
                prompt: aiPrompt,
                sectionData: { languages: languages },
                sectionTitle: "Languages",
            });
            const data = response.data;
            handleAIUpdate(data);
            setAiPrompt("");
        } catch (error) {
            console.error(error);
        }
        setIsAIProcessing(false);
    };

    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />

            {/* View Mode */}
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">Languages</h2>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    onClick={() => toggleEditMode(sectionKey, 'all')}
                    tooltip="Edit Languages"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>

            {/* View Content */}
            <div className="p-4">
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '12px' 
                }}>
                    {languages.map((lang, index) => (
                        <div key={index}>
                            <div className="flex justify-content-between align-items-center p-3 border-1 border-200 border-round hover:surface-100 transition-colors transition-duration-150 h-full">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-globe text-primary"></i>
                                    <span className="font-semibold text-900" title="Language Name">{lang.language}</span>
                                </div>
                                <span 
                                    className={`px-3 py-1 border-round text-sm font-medium ${
                                        lang.proficiency === 'Native' || lang.proficiency === 'C2' 
                                            ? 'bg-green-100 text-green-800' 
                                            : lang.proficiency === 'C1' || lang.proficiency === 'Fluent'
                                            ? 'bg-blue-100 text-blue-800'
                                            : lang.proficiency === 'B2' || lang.proficiency === 'Intermediate'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                    title="Proficiency Level"
                                >
                                    {lang.proficiency}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {languages.length === 0 && (
                    <div className="text-center py-4 text-500">
                        <i className="pi pi-globe text-3xl mb-2 block"></i>
                        <p>No languages added yet</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={() => toggleEditMode(sectionKey, 'all')}
                style={{ width: "min(90vw, 700px)" }}
                header={
                    <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
                        <h2 className="text-xl font-semibold m-0">Edit Languages</h2>
                    </div>
                }
                dismissableMask
                className="languages-editor"
            >
                <div className="flex flex-column h-full">
                    {/* Scrollable Form Area */}
                    <div className="flex flex-column gap-4 flex-grow-1 overflow-auto p-3">
                        {languages.map((lang, index) => (
                            <div key={index} className="flex align-items-center gap-2 p-3 border-1 border-200 border-round">
                                <InputText
                                    placeholder="Language"
                                    value={lang.language}
                                    onChange={(e) => handleLanguageChange(index, 'language', e)}
                                    className="flex-1"
                                    tooltip="Language Name"
                                    tooltipOptions={{ position: 'top' }}
                                />
                                <Dropdown
                                    placeholder="Proficiency"
                                    value={lang.proficiency}
                                    options={fluencyOptions}
                                    onChange={(e) => handleLanguageChange(index, 'proficiency', e.value)}
                                    className="w-10rem"
                                    tooltip="Proficiency Level"
                                    tooltipOptions={{ position: 'top' }}
                                />
                                <Button
                                    icon="pi pi-times"
                                    className="p-button-rounded p-button-text p-button-danger"
                                    onClick={() => removeLanguage(index)}
                                    tooltip="Remove Language"
                                    tooltipOptions={{ position: 'top' }}
                                />
                            </div>
                        ))}
                        
                        <Button
                            icon="pi pi-plus"
                            label="Add Language"
                            className="p-button-outlined"
                            onClick={addLanguage}
                        />
                    </div>

                    {/* Sticky AI Assistant and Undo Button at the Bottom */}
                    <div className="sticky bottom-0 bg-surface-0 bg-white border-top-1 surface-border pt-3">
                        <div className="flex align-items-center justify-content-between gap-2 p-3">
                            <div className="flex-grow-1">
                                <AIAssistant
                                    prompt={aiPrompt}
                                    setPrompt={setAiPrompt}
                                    onSubmit={handleAISubmit}
                                    isProcessing={isAIProcessing}
                                />
                            </div>
                            <Button
                                icon="pi pi-undo"
                                className="p-button-rounded p-button-text"
                                onClick={handleUndo}
                                disabled={!historyRef.current.length}
                                tooltip="Undo"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Languages;