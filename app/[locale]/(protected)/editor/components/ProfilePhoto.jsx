"use client";
import React, { useRef, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Slider } from 'primereact/slider';
import { FileUpload } from 'primereact/fileupload';
import Cropper from 'react-easy-crop';
import { useResume } from '../ResumeContext';
import './styles.css';

const ProfilePhoto = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData } = useResume();
    const profilePhoto = data[sectionKey]?.profilePhoto || null;
    
    const [isEditing, setIsEditing] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [rotation, setRotation] = useState(0);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (event) => {
        const file = event.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                setIsEditing(true);
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

    const handleSave = async () => {
        try {
            if (croppedAreaPixels && imageSrc) {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
                
                const newData = { ...data };
                if (!newData[sectionKey]) {
                    newData[sectionKey] = {};
                }
                newData[sectionKey].profilePhoto = croppedImage;
                setData(newData);

                toast.current.show({
                    severity: 'success',
                    summary: 'Photo Updated',
                    detail: 'Profile photo has been saved'
                });
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving photo:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save photo'
            });
        }
    };

    const handleRemove = () => {
        const newData = { ...data };
        if (newData[sectionKey]) {
            delete newData[sectionKey].profilePhoto;
        }
        setData(newData);
        setIsEditing(false);
        setImageSrc(null);
        
        toast.current.show({
            severity: 'info',
            summary: 'Photo Removed',
            detail: 'Profile photo has been removed'
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    const editHeader = (
        <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
            <h2 className="text-xl font-semibold m-0">Edit Profile Photo</h2>
        </div>
    );

    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />
            
            {/* View Mode */}
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">Profile Photo</h2>
                <div className="flex gap-2">
                    {profilePhoto && (
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-text"
                            onClick={() => {
                                setImageSrc(profilePhoto);
                                setIsEditing(true);
                            }}
                            tooltip="Edit Photo"
                            tooltipOptions={{ position: 'top' }}
                        />
                    )}
                </div>
            </div>

            {/* Photo Display */}
            <div className="flex flex-column align-items-center gap-3 p-4">
                {profilePhoto ? (
                    <div className="relative">
                        <img 
                            src={profilePhoto} 
                            alt="Profile" 
                            className="w-8rem h-8rem border-circle object-cover shadow-3"
                            title="Profile Photo"
                        />
                    </div>
                ) : (
                    <div className="flex flex-column align-items-center gap-3">
                        <div className="w-8rem h-8rem border-circle bg-gray-100 flex align-items-center justify-content-center">
                            <i className="pi pi-user text-4xl text-gray-400"></i>
                        </div>
                        <p className="text-500 text-center m-0">No profile photo</p>
                    </div>
                )}
                
                <FileUpload
                    mode="basic"
                    accept="image/*"
                    maxFileSize={5000000}
                    onSelect={handleFileSelect}
                    chooseLabel={profilePhoto ? "Change Photo" : "Upload Photo"}
                    className="p-button-outlined"
                    auto={false}
                />
            </div>

            {/* Edit Dialog */}
            <Dialog
                visible={isEditing}
                onHide={handleCancel}
                style={{ width: "min(90vw, 800px)", height: "min(90vh, 700px)" }}
                header={editHeader}
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
                                onClick={handleRemove}
                                disabled={!profilePhoto}
                            />
                            <div className="flex gap-2">
                                <Button
                                    label="Cancel"
                                    icon="pi pi-times"
                                    className="p-button-text"
                                    onClick={handleCancel}
                                />
                                <Button
                                    label="Save Photo"
                                    icon="pi pi-check"
                                    onClick={handleSave}
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

export default ProfilePhoto;