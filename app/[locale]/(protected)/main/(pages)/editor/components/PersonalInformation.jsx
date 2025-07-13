"use client";
import React, { useRef, useState, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Slider } from 'primereact/slider';
import { FileUpload } from 'primereact/fileupload';
import Cropper from 'react-easy-crop';
import { useResume } from '../ResumeContext';
import AIAssistant from './AIAssistant';
import api from '@/lib/axios';
import './styles.css';

const PersonalInformation = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, toggleEditMode, editMode } = useResume();
    const personalInfo = data[sectionKey];
    const isEditing = editMode[sectionKey]?.all;
    const historyRef = useRef([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    // Photo editing states
    const [isPhotoEditing, setIsPhotoEditing] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [rotation, setRotation] = useState(0);

    // Existing personal info handlers...
    const handleInputChange = (field, e) => {
        const value = e.target?.value ?? e;
        const newData = { ...data };
        newData[sectionKey][field] = value;
        setData(newData);
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

    // Photo handlers
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (event) => {
        const file = event.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                setIsPhotoEditing(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const handlePhotoSave = async () => {
        try {
            if (croppedAreaPixels && imageSrc) {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
                
                const newData = { ...data };
                newData[sectionKey].profilePhoto = croppedImage;
                setData(newData);

                toast.current.show({
                    severity: 'success',
                    summary: 'Photo Updated',
                    detail: 'Profile photo has been saved'
                });
            }
            setIsPhotoEditing(false);
        } catch (error) {
            console.error('Error saving photo:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save photo'
            });
        }
    };

    const handlePhotoRemove = () => {
        const newData = { ...data };
        delete newData[sectionKey].profilePhoto;
        setData(newData);
        setIsPhotoEditing(false);
        setImageSrc(null);
        
        toast.current.show({
            severity: 'info',
            summary: 'Photo Removed',
            detail: 'Profile photo has been removed'
        });
    };

    const handlePhotoCancel = () => {
        setIsPhotoEditing(false);
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

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
            const response = await api.post("/api/resumes/edit/", {
                prompt: aiPrompt,
                sectionData: personalInfo,
                sectionTitle: "Personal Information",
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

                {/* Right side - Profile Photo */}
                <div className="flex flex-column align-items-center gap-3">
                    {personalInfo.profilePhoto ? (
                        <div className="relative">
                            <img 
                                src={personalInfo.profilePhoto} 
                                alt="Profile" 
                                className="w-8rem h-8rem border-circle object-cover shadow-3"
                                title="Profile Photo"
                            />
                            <Button
                                icon="pi pi-pencil"
                                className="p-button-rounded p-button-sm absolute"
                                style={{ top: '0.5rem', right: '0.5rem' }}
                                onClick={() => {
                                    setImageSrc(personalInfo.profilePhoto);
                                    setIsPhotoEditing(true);
                                }}
                                tooltip="Edit Photo"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-column align-items-center gap-2">
                            <div className="w-8rem h-8rem border-circle bg-gray-100 flex align-items-center justify-content-center">
                                <i className="pi pi-user text-4xl text-gray-400"></i>
                            </div>
                            <FileUpload
                                mode="basic"
                                accept="image/*"
                                maxFileSize={5000000}
                                onSelect={handleFileSelect}
                                chooseLabel="Add Photo"
                                className="p-button-outlined p-button-sm"
                                auto={false}
                            />
                        </div>
                    )}
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

            {/* Photo Edit Dialog */}
            <Dialog
                visible={isPhotoEditing}
                onHide={handlePhotoCancel}
                style={{ width: "min(90vw, 800px)", height: "min(90vh, 700px)" }}
                header="Edit Profile Photo"
                dismissableMask
                className="photo-editor"
            >
                <div className="flex flex-column h-full">
                    {/* Cropper Area */}
                    <div className="flex-grow-1 relative" style={{ minHeight: '400px' }}>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                cropShape="round"
                                showGrid={false}
                            />
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-column gap-4 p-4 border-top-1 surface-border">
                        <div className="flex align-items-center gap-3">
                            <label className="font-semibold min-w-max">Zoom:</label>
                            <Slider
                                value={zoom}
                                onChange={(e) => setZoom(e.value)}
                                min={1}
                                max={3}
                                step={0.1}
                                className="flex-grow-1"
                            />
                            <span className="min-w-max text-sm">{zoom.toFixed(1)}x</span>
                        </div>

                        <div className="flex align-items-center gap-3">
                            <label className="font-semibold min-w-max">Rotation:</label>
                            <Slider
                                value={rotation}
                                onChange={(e) => setRotation(e.value)}
                                min={-180}
                                max={180}
                                step={1}
                                className="flex-grow-1"
                            />
                            <span className="min-w-max text-sm">{rotation}°</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-content-between gap-2">
                            <Button
                                label="Remove Photo"
                                icon="pi pi-trash"
                                className="p-button-danger p-button-outlined"
                                onClick={handlePhotoRemove}
                                disabled={!personalInfo.profilePhoto}
                            />
                            <div className="flex gap-2">
                                <Button
                                    label="Cancel"
                                    icon="pi pi-times"
                                    className="p-button-text"
                                    onClick={handlePhotoCancel}
                                />
                                <Button
                                    label="Save Photo"
                                    icon="pi pi-check"
                                    onClick={handlePhotoSave}
                                    disabled={!imageSrc || !croppedAreaPixels}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default PersonalInformation;




