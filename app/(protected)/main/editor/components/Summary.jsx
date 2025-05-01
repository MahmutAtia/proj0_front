"use client";
import React, { useRef, useState } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useResume } from "../ResumeContext";
import AIAssistant from "./AIAssistant";

const Summary = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode } = useResume();
    const summary = data[sectionKey];
    const isEditing = editMode[sectionKey]?.all;
    const historyRef = useRef([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    const handleInputChange = (e) => {
        saveToHistory();
        const newData = { ...data };
        newData[sectionKey] = e.target.value;
        setData(newData);
    };

    const saveToHistory = () => {
        historyRef.current.push(JSON.stringify(data[sectionKey]));
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
        saveToHistory();
        const newData = { ...data };
        newData[sectionKey] = updatedData.summary; // Extract the summary value
        setData(newData);
        toast.current.show({
            severity: "success",
            summary: "AI Updated",
            detail: "Summary has been updated",
        });
    };

    const handleAISubmit = async () => {
        setIsAIProcessing(true);
        try {
            const response = await fetch("http://localhost:8000/api/resumes/edit/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    sectionData: summary,
                    sectionTitle: sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                }),
            });
            const data = await response.json();
            handleAIUpdate(data);
            setAiPrompt("");
        } catch (error) {
            console.error(error);
        }
        setIsAIProcessing(false);
    };

    const dialogHeader = (
        <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
            < h2 className="text-xl font-semibold m-0">Edit {sectionKey.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}</h2>
        </div >
    );

    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />

            {/* View Mode */}
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">{sectionKey.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}</h2>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    onClick={() => toggleEditMode(sectionKey)}
                    tooltip="Edit Summary"
                />
            </div>

            <div className="mt-3">
                <p className="text-700 line-height-3 m-0">{summary}</p>
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={() => toggleEditMode(sectionKey)}
                style={{ width: "min(90vw, 800px)" }}
                header={dialogHeader}
                dismissableMask
                className="summary-editor-dialog"
            >
                <div className="flex flex-column h-full">
                    {/* Scrollable Edit Section */}
                    <div className="flex flex-column gap-3 flex-grow-1 overflow-auto p-3 surface-50 border-round">
                        <InputTextarea
                            value={summary}
                            onChange={handleInputChange}
                            rows={10}
                            className="w-full"
                            autoResize
                        />
                    </div>

                    {/* Sticky AI Assistant and Undo Button at the Bottom */}
                    <div className="sticky bottom-0 bg-surface-0 border-top-1 surface-border pt-3">
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

export default Summary;
