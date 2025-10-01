"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Slider } from 'primereact/slider';
import { FileUpload } from 'primereact/fileupload';
import { Checkbox } from 'primereact/checkbox';
import Cropper from 'react-easy-crop';
import { useResume } from '../ResumeContext';
import { useAvatar } from '../hooks/useAvatar';
import EnhancedAvatarEditor from './EnhancedAvatarEditor';
import AIAssistant from './AIAssistant';
import { aiApi } from "@/lib/axios";
import './styles.css';

const PersonalInformation = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, aboutCandidate, setData, toggleEditMode, editMode } = useResume();
    const { avatar, uploadAvatar, removeAvatar } = useAvatar();
    const personalInfo = data[sectionKey];
    const isEditing = editMode[sectionKey]?.all;
    const historyRef = useRef([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    // Photo editing states - now handled by EnhancedAvatarEditor
    // Removed: isPhotoEditing, imageSrc, crop, zoom, croppedAreaPixels, rotation

    // Use avatar from hook instead of local data
    const currentAvatar = avatar;

    // Existing personal info handlers...
    const handleInputChange = (field, e) => {
        const value = e.target?.value ?? e;
        const newData = { ...data };
        newData[sectionKey][field] = value;
        setData(newData);
    };

    // Handle avatar inclusion preference toggle
    const handleAvatarInclusionChange = (e) => {
        const newData = { ...data };
        if (!newData[sectionKey]) newData[sectionKey] = {};
        newData[sectionKey].includeAvatarInPDF = e.checked;
        setData(newData);
    };

    // Get avatar inclusion preference with default fallback
    const getAvatarInclusionPreference = () => {
        return personalInfo.includeAvatarInPDF !== undefined ? personalInfo.includeAvatarInPDF : false;
    };

    const handlePhoneChange = (index, e) => {
        const value = e.target?.value ?? e;
        const newData = { ...data };
        if (!newData[sectionKey].phones) newData[sectionKey].phones = [];
        newData[sectionKey].phones[index] = value;
        setData(newData);
    };

    const addPhone = () => {
        const newData = { ...data };
        if (!newData[sectionKey].phones) newData[sectionKey].phones = [];
        newData[sectionKey].phones.push('');
        setData(newData);
    };

    const handleLocationChange = (field, e) => {
        const value = e.target?.value ?? e;
        const newData = { ...data };
        if (!newData[sectionKey].location) newData[sectionKey].location = {};
        newData[sectionKey].location[field] = value;
        setData(newData);
    };

    const handleProfileChange = (field, e) => {
        const value = e.target?.value ?? e;
        const newData = { ...data };
        if (!newData[sectionKey].profiles) newData[sectionKey].profiles = {};
        newData[sectionKey].profiles[field] = value;
        setData(newData);
    };

    // Photo editing functions are now handled by EnhancedAvatarEditor component

    // Existing AI handlers...
    const saveToHistory = (newData) => {
        historyRef.current.push(JSON.stringify(data[sectionKey]));
        if (historyRef.current.length > 10) {
            historyRef.current.shift();
        }
    };

    const handleUndo = () => {
        if (historyRef.current.length > 0) {
            const prevState = JSON.parse(historyRef.current.pop());
            const newData = { ...data };
            newData[sectionKey] = prevState;
            setData(newData);
        }
    };

    const handleAIUpdate = (updatedData) => {
        saveToHistory(data);
        const newData = { ...data };
        newData[sectionKey] = { ...newData[sectionKey], ...updatedData };
        setData(newData);
    };

    const handleAISubmit = async () => {
        setIsAIProcessing(true);
        try {

            const response = await aiApi.post("/resumes-v2/edit_section", {
                prompt: aiPrompt,
                sectionData: personalInfo,
                sectionTitle: "Personal Information",
                aboutCandidate: aboutCandidate

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
            <h2 className="text-xl font-semibold m-0">Edit Personal Information</h2>

        </div>
    );

    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />

            {/* View Mode */}
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">{personalInfo.name || 'Personal Information'}</h2>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    onClick={() => toggleEditMode(sectionKey)}
                    tooltip="Edit Information"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>

            {/* View Content with Photo */}
            <div className="flex gap-4 p-4">
                {/* Left side - Personal Info */}
                <div className="flex-grow-1">
                    <div className="flex flex-column gap-2">
                        <p className="m-0" title="Email Address">{personalInfo.email}</p>
                        {personalInfo.phone && (
                            <p className="m-0" title="Phone Number">{personalInfo.phone}</p>
                        )}
                        {personalInfo.location?.address && (
                            <p className="m-0" title="Address">{personalInfo.location.address}</p>
                        )}
                        {personalInfo.location?.city && (
                            <p className="m-0" title="Location">
                                {personalInfo.location.city}, {personalInfo.location.state}{" "}
                                {personalInfo.location.postal_code}
                            </p>
                        )}
                        {Object.entries(personalInfo.profiles || {}).map(
                            ([key, value]) =>
                                value && (
                                    <p key={key} className="m-0" title={`${key.charAt(0).toUpperCase() + key.slice(1)} Profile`}>
                                        <a href={value} target="_blank" rel="noopener noreferrer">
                                            {key}: {value}
                                        </a>
                                    </p>
                                )
                        )}
                    </div>
                </div>

                {/* Right side - Enhanced Profile Photo */}
                <div className="flex flex-column align-items-center">
                    <EnhancedAvatarEditor
                        avatar={currentAvatar}
                        onAvatarChange={async (avatarData) => {
                            if (avatarData) {
                                const result = await uploadAvatar(avatarData);
                                if (!result.success) {
                                    throw new Error(result.error);
                                }
                            } else {
                                await removeAvatar();
                            }
                        }}
                        isLoading={false} // You can pass loading state from useAvatar if available
                        includeInPDF={getAvatarInclusionPreference()}
                        onIncludeInPDFChange={(checked) => {
                            const newData = { ...data };
                            if (!newData[sectionKey]) newData[sectionKey] = {};
                            newData[sectionKey].includeAvatarInPDF = checked;
                            setData(newData);
                        }}
                        size="large"
                        className="mb-3"
                    />
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={() => toggleEditMode(sectionKey)}
                style={{ width: "min(90vw, 800px)" }}
                header="Edit Personal Information"
                dismissableMask
            >
                <div className="flex flex-column gap-4 flex-grow-1 overflow-auto p-3">
                    <div className="field">
                        <label className="block mb-2">Full Name</label>
                        <InputText
                            value={personalInfo.name}
                            onChange={(e) => handleInputChange("name", e)}
                            className="w-full"
                            tooltip="Full Name"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>

                    <div className="field">
                        <label className="block mb-2">Email Address</label>
                        <InputText
                            value={personalInfo.email}
                            onChange={(e) => handleInputChange("email", e)}
                            className="w-full"
                            tooltip="Email Address"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>

                    <div className="field">
                        <label className="block mb-2">Phone Number</label>
                        <InputText
                            value={personalInfo.phone || ""}
                            onChange={(e) => handlePhoneChange(0, e)}
                            className="w-full"
                            tooltip="Phone Number"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>

                    <div className="field">
                        <label className="block mb-2">Address</label>
                        <InputText
                            value={personalInfo.location?.address || ""}
                            onChange={(e) => handleLocationChange("address", e)}
                            className="w-full"
                            tooltip="Street Address"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="col-4">
                            <label className="block mb-2">City</label>
                            <InputText
                                value={personalInfo.location?.city || ""}
                                onChange={(e) => handleLocationChange("city", e)}
                                className="w-full"
                                tooltip="City"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                        <div className="col-4">
                            <label className="block mb-2">State</label>
                            <InputText
                                value={personalInfo.location?.state || ""}
                                onChange={(e) => handleLocationChange("state", e)}
                                className="w-full"
                                tooltip="State/Province"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                        <div className="col-4">
                            <label className="block mb-2">Postal Code</label>
                            <InputText
                                value={personalInfo.location?.postal_code || ""}
                                onChange={(e) => handleLocationChange("postal_code", e)}
                                className="w-full"
                                tooltip="Postal/ZIP Code"
                                tooltipOptions={{ position: 'top' }}
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
                                tooltip="LinkedIn Profile URL"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="GitHub URL"
                                value={personalInfo.profiles.github || ""}
                                onChange={(e) => handleProfileChange("github", e)}
                                className="w-full"
                                tooltip="GitHub Profile URL"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Personal Website"
                                value={personalInfo.profiles.website || ""}
                                onChange={(e) => handleProfileChange("website", e)}
                                className="w-full"
                                tooltip="Personal Website URL"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <InputText
                                placeholder="Portfolio URL"
                                value={personalInfo.profiles.portfolio || ""}
                                onChange={(e) => handleProfileChange("portfolio", e)}
                                className="w-full"
                                tooltip="Portfolio Website URL"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>

                    {/* Avatar Inclusion Preference */}
                    {currentAvatar && (
                        <div className="field">
                            <div className="flex align-items-center gap-2">
                                <Checkbox
                                    inputId="includeAvatarInPDFDialog"
                                    checked={getAvatarInclusionPreference()}
                                    onChange={handleAvatarInclusionChange}
                                />
                                <label htmlFor="includeAvatarInPDFDialog" className="text-sm font-medium">
                                    Include avatar in generated PDFs and websites
                                </label>
                            </div>
                            <small className="text-gray-500">
                                Uncheck this if you prefer to exclude your photo from professional documents
                            </small>
                        </div>
                    )}
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
            </Dialog>

            {/* Photo editing is now handled by EnhancedAvatarEditor component */}
        </div>
    );
};

export default PersonalInformation;




