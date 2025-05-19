"use client";
import React, { useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useResume } from "../ResumeContext";
import { Toast } from "primereact/toast";
import AIAssistant from "./AIAssistant";

const PersonalInformation = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode } = useResume();
    const personalInfo = data[sectionKey];
    const isEditing = editMode[sectionKey]?.all;
    const historyRef = useRef([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    const handleInputChange = (field, e) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[sectionKey][field] = e.target.value;
        setData(newData);
    };

    const handlePhoneChange = (index, e) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[sectionKey].phone[index] = e.target.value;
        setData(newData);
    };

    const addPhone = () => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[sectionKey].phone.push("");
        setData(newData);
    };

    const handleLocationChange = (field, e) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[sectionKey].location[field] = e.target.value;
        setData(newData);
    };

    const handleProfileChange = (field, e) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData[sectionKey].profiles[field] = e.target.value;
        setData(newData);
    };

    const saveToHistory = (newData) => {
        historyRef.current.push(JSON.stringify(data[sectionKey]));
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
            [sectionKey]: updatedData,
        });
        toast.current.show({
            severity: "success",
            summary: "AI Updated",
            detail: "Content has been updated",
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
                    sectionData: personalInfo,
                    sectionTitle: "Personal Information",
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
            <h2 className="text-xl font-semibold m-0">Edit Personal Information</h2>

        </div>
    );

    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />

            {/* View Mode */}
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">{personalInfo.name}</h2>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    onClick={() => toggleEditMode(sectionKey)}
                    tooltip="Edit Information"
                />
            </div>

            <div className="flex flex-column gap-2 p-4">
                <p className="m-0">{personalInfo.email}</p>

                {personalInfo.phone && (
                    <p className="m-0">
                        {personalInfo.phone}
                    </p>
                )}

                {personalInfo.location?.address && (
                    <p className="m-0">{personalInfo.location.address}</p>
                )}
                {personalInfo.location?.city && (
                    <p className="m-0">
                        {personalInfo.location.city}, {personalInfo.location.state}{" "}
                        {personalInfo.location.postal_code}
                    </p>
                )}
                {Object.entries(personalInfo.profiles).map(
                    ([key, value]) =>
                        value && (
                            <p key={key} className="m-0">
                                <a href={value} target="_blank" rel="noopener noreferrer">
                                    {key}: {value}
                                </a>
                            </p>
                        )
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={() => toggleEditMode(sectionKey)}
                style={{ width: "min(90vw, 700px)" }}
                header={dialogHeader}
                dismissableMask
                className="personal-info-editor"
            >
                <div className="flex flex-column h-full">
                    {/* Scrollable Form Area */}
                    <div className="flex flex-column gap-4 flex-grow-1 overflow-auto p-3">
                        <div className="field">
                            <label className="block mb-2">Full Name</label>
                            <InputText
                                value={personalInfo.name}
                                onChange={(e) => handleInputChange("name", e)}
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label className="block mb-2">Email Address</label>
                            <InputText
                                value={personalInfo.email}
                                onChange={(e) => handleInputChange("email", e)}
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label className="block mb-2">Phone Number</label>
                            <InputText
                                value={personalInfo.phone || ""}
                                onChange={(e) => handlePhoneChange(0, e)}
                                className="w-full"
                            />


                        </div>

                        <div className="field">
                            <label className="block mb-2">Address</label>
                            <InputText
                                value={personalInfo.location?.address || ""}
                                onChange={(e) => handleLocationChange("address", e)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="col-4">
                                <label className="block mb-2">City</label>
                                <InputText
                                    value={personalInfo.location?.city || ""}
                                    onChange={(e) => handleLocationChange("city", e)}
                                    className="w-full"
                                />
                            </div>
                            <div className="col-4">
                                <label className="block mb-2">State</label>
                                <InputText
                                    value={personalInfo.location?.state || ""}
                                    onChange={(e) => handleLocationChange("state", e)}
                                    className="w-full"
                                />
                            </div>
                            <div className="col-4">
                                <label className="block mb-2">Postal Code</label>
                                <InputText
                                    value={personalInfo.location?.postal_code || ""}
                                    onChange={(e) => handleLocationChange("postal_code", e)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="block mb-2">Social Profiles</label>
                            <div className="flex flex-column gap-3">
                                <InputText
                                    placeholder="LinkedIn URL"
                                    value={personalInfo.profiles.linkedin || ""}
                                    onChange={(e) => handleProfileChange("linkedin", e)}
                                    className="w-full"
                                />
                                <InputText
                                    placeholder="GitHub URL"
                                    value={personalInfo.profiles.github || ""}
                                    onChange={(e) => handleProfileChange("github", e)}
                                    className="w-full"
                                />
                                <InputText
                                    placeholder="Personal Website"
                                    value={personalInfo.profiles.website || ""}
                                    onChange={(e) => handleProfileChange("website", e)}
                                    className="w-full"
                                />
                                <InputText
                                    placeholder="Portfolio URL"
                                    value={personalInfo.profiles.portfolio || ""}
                                    onChange={(e) => handleProfileChange("portfolio", e)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sticky AI Assistant and Undo Button at the Bottom */}
                    <div className="sticky bottom-0  bg-surface-0 bg-white border-top-1 surface-border pt-3">
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

export default PersonalInformation;




