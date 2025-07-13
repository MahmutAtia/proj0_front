"use client";
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useResume } from '../ResumeContext';
import AIAssistant from './AIAssistant';
import api from '@/lib/axios';

const Languages = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode } = useResume();
    const languages = data[sectionKey] || [];
    const isEditing = editMode[sectionKey]?.all;
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

    const handleLanguageChange = (index, field, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field] = value.target?.value ?? value;
        setData(newData);
    };

    const addLanguage = () => {
        const newLanguage = {
            language: '',
            proficiency: ''
        };
        const newData = { ...data };
        newData[sectionKey] = [...languages, newLanguage];
        setData(newData);
    };

    const removeLanguage = (index) => {
        const newData = { ...data };
        newData[sectionKey].splice(index, 1);
        setData(newData);
    };

    const saveToHistory = (newData) => {
        historyRef.current.push(JSON.stringify(languages));
        setData(newData);
    };

    const handleUndo = () => {
        if (historyRef.current.length > 0) {
            const previousState = JSON.parse(historyRef.current.pop());
            const newData = { ...data };
            newData[sectionKey] = previousState;
            setData(newData);
            toast.current.show({
                severity: "info",
                summary: "Undo",
                detail: "Previous state restored",
            });
        }
    };

    const handleAIUpdate = (updatedData) => {
        saveToHistory({
            ...data,
            [sectionKey]: updatedData.languages || updatedData,
        });
        toast.current.show({
            severity: "success",
            summary: "AI Updated",
            detail: "Languages have been updated",
        });
    };

    const handleAISubmit = async () => {
        setIsAIProcessing(true);
        try {
            const response = await api.post("/api/resumes/edit/", {
                prompt: aiPrompt,
                sectionData: languages,
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

    const dialogHeader = (
        <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
            <h2 className="text-xl font-semibold m-0">Edit Languages</h2>
        </div>
    );

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
                />
            </div>

            <div className="flex flex-column gap-3 p-4">
                {languages.map((lang, index) => (
                    <div key={index} className="flex justify-content-between align-items-center p-3 border-1 border-200 border-round hover:surface-100 transition-colors transition-duration-150">
                        <div className="flex align-items-center gap-3">
                            <div className="flex align-items-center justify-content-center w-2rem h-2rem bg-primary-50 border-circle">
                                <i className="pi pi-globe text-primary text-sm"></i>
                            </div>
                            <span className="font-semibold text-900 text-lg" title="Language Name">{lang.language}</span>
                        </div>
                        <span 
                            className={`px-3 py-2 border-round-lg text-sm font-semibold shadow-1 ${
                                lang.proficiency === 'Native' || lang.proficiency === 'C2' 
                                    ? 'bg-green-500 text-white' 
                                    : lang.proficiency === 'C1' || lang.proficiency === 'Fluent'
                                    ? 'bg-blue-500 text-white'
                                    : lang.proficiency === 'B2' || lang.proficiency === 'Intermediate'
                                    ? 'bg-orange-500 text-white'
                                    : lang.proficiency === 'B1'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-400 text-white'
                            }`}
                            title="Proficiency Level"
                        >
                            {lang.proficiency}
                        </span>
                    </div>
                ))}
                
                {languages.length === 0 && (
                    <div className="text-center py-6 text-500">
                        <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-gray-100 border-circle mx-auto mb-3">
                            <i className="pi pi-globe text-gray-400 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-medium text-600 mb-2">No languages added yet</h3>
                        <p className="text-sm text-500">Click edit to add your language skills</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={() => toggleEditMode(sectionKey, 'all')}
                style={{ width: "min(90vw, 700px)" }}
                header={dialogHeader}
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
                            />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Languages;