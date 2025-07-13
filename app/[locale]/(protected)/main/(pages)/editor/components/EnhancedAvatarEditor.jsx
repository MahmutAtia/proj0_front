"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge';
import { Checkbox } from 'primereact/checkbox';
import Cropper from 'react-easy-crop';
import { 
    FiCamera, FiEdit3, FiTrash2, FiRotateCcw, FiRotateCw, 
    FiZoomIn, FiZoomOut, FiUpload, FiCheck, FiX, FiRefreshCw,
    FiMove, FiMaximize2, FiSave
} from 'react-icons/fi';

const EnhancedAvatarEditor = ({ 
    avatar, 
    onAvatarChange, 
    isLoading, 
    includeInPDF = false,
    onIncludeInPDFChange,
    className = "",
    size = "large" // small, medium, large
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewMode, setPreviewMode] = useState(false);
    
    const fileInputRef = useRef(null);
    const toast = useRef(null);
    const dropRef = useRef(null);

    // Size configurations
    const sizeConfig = {
        small: { size: '4rem', iconSize: '2xl', editButtonSize: 'sm' },
        medium: { size: '6rem', iconSize: '3xl', editButtonSize: 'sm' },
        large: { size: '8rem', iconSize: '4xl', editButtonSize: 'md' }
    };

    const config = sizeConfig[size] || sizeConfig.large;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!isEditing) return;
            
            switch(e.key) {
                case 'Escape':
                    handleCancel();
                    break;
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        handleSave();
                    }
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        resetControls();
                    }
                    break;
            }
        };

        if (isEditing) {
            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
    }, [isEditing]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileSelect = useCallback((file) => {
        if (!file.type.startsWith('image/')) {
            toast.current?.show({
                severity: 'error',
                summary: 'Invalid File',
                detail: 'Please select an image file'
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.current?.show({
                severity: 'error',
                summary: 'File Too Large',
                detail: 'Image must be smaller than 10MB'
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            setIsEditing(true);
            resetControls();
        };
        reader.readAsDataURL(file);
    }, []);

    const resetControls = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        
        return new Promise((resolve) => {
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxSize = Math.max(image.width, image.height);
                const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

                canvas.width = safeArea;
                canvas.height = safeArea;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.translate(safeArea / 2, safeArea / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-safeArea / 2, -safeArea / 2);

                ctx.drawImage(
                    image,
                    safeArea / 2 - image.width * 0.5,
                    safeArea / 2 - image.height * 0.5
                );

                const data = ctx.getImageData(0, 0, safeArea, safeArea);

                const finalSize = Math.min(pixelCrop.width, 512); // Optimize size
                canvas.width = finalSize;
                canvas.height = finalSize;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.putImageData(
                    data,
                    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
                    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
                );

                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            image.src = imageSrc;
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return;

        setIsProcessing(true);
        setUploadProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            
            clearInterval(progressInterval);
            setUploadProgress(100);

            await onAvatarChange(croppedImage);
            
            toast.current?.show({
                severity: 'success',
                summary: 'Avatar Updated',
                detail: 'Your profile photo has been updated successfully',
                life: 3000
            });

            setIsEditing(false);
            setImageSrc(null);
            
        } catch (error) {
            console.error('Error saving avatar:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Upload Failed',
                detail: error.message || 'Failed to update avatar'
            });
        } finally {
            setIsProcessing(false);
            setUploadProgress(0);
        }
    };

    const handleRemove = async () => {
        try {
            await onAvatarChange(null);
            toast.current?.show({
                severity: 'info',
                summary: 'Avatar Removed',
                detail: 'Profile photo has been removed'
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Remove Failed',
                detail: 'Failed to remove avatar'
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setImageSrc(null);
        resetControls();
    };

    const quickZoom = (delta) => {
        setZoom(prev => Math.max(1, Math.min(3, prev + delta)));
    };

    const quickRotate = (degrees) => {
        setRotation(prev => (prev + degrees) % 360);
    };

    return (
        <div className={`enhanced-avatar-editor ${className}`}>
            <Toast ref={toast} />
            
            {/* Avatar Display */}
            <div className="flex flex-column align-items-center gap-3 relative">
                <div
                    ref={dropRef}
                    className={`avatar-container relative cursor-pointer transition-all duration-300 ${
                        isDragOver ? 'scale-105 shadow-lg' : ''
                    }`}
                    style={{ width: config.size, height: config.size }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !avatar && fileInputRef.current?.click()}
                >
                    {avatar ? (
                        <div className="relative w-full h-full">
                            <img
                                src={avatar}
                                alt="Profile"
                                className="w-full h-full border-circle object-cover shadow-3 transition-all duration-300 hover:shadow-4"
                                style={{
                                    border: includeInPDF ? '3px solid var(--primary-color)' : '3px solid transparent'
                                }}
                            />
                            
                            {/* Edit Overlay */}
                            <div className="absolute inset-0 border-circle bg-black-alpha-50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex align-items-center justify-content-center">
                                <Button
                                    icon={<FiEdit3 />}
                                    className="p-button-rounded p-button-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImageSrc(avatar);
                                        setIsEditing(true);
                                    }}
                                    tooltip="Edit Photo"
                                    tooltipOptions={{ position: 'top' }}
                                />
                            </div>

                            {/* Status Badge */}
                            {includeInPDF && (
                                <Badge
                                    value="PDF"
                                    severity="success"
                                    className="absolute"
                                    style={{ top: '-0.5rem', right: '-0.5rem' }}
                                />
                            )}

                            {/* Loading Overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 border-circle bg-white-alpha-80 flex align-items-center justify-content-center">
                                    <ProgressSpinner size="small" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`
                            w-full h-full border-circle border-2 border-dashed border-300 
                            bg-gray-50 hover:bg-gray-100 transition-all duration-300
                            flex flex-column align-items-center justify-content-center gap-2
                            ${isDragOver ? 'border-primary bg-primary-50' : ''}
                        `}>
                            <FiCamera className={`text-gray-400 text-${config.iconSize}`} />
                            <span className="text-xs text-gray-500 text-center px-2">
                                Click or drag to upload
                            </span>
                        </div>
                    )}
                </div>

                {/* Upload Button for empty state */}
                {!avatar && (
                    <Button
                        label="Upload Photo"
                        icon={<FiUpload />}
                        className="p-button-outlined p-button-sm"
                        onClick={() => fileInputRef.current?.click()}
                        loading={isLoading}
                    />
                )}

                {/* PDF Inclusion Toggle */}
                {avatar && onIncludeInPDFChange && (
                    <div className="flex align-items-center gap-2">
                        <Checkbox
                            inputId="include-in-pdf"
                            checked={includeInPDF}
                            onChange={(e) => onIncludeInPDFChange(e.checked)}
                        />
                        <label htmlFor="include-in-pdf" className="text-sm cursor-pointer">
                            Include in PDF/Website
                        </label>
                    </div>
                )}

                {/* Quick Actions */}
                {avatar && (
                    <div className="flex gap-2">
                        <Button
                            icon={<FiEdit3 />}
                            className="p-button-outlined p-button-sm"
                            onClick={() => {
                                setImageSrc(avatar);
                                setIsEditing(true);
                            }}
                            tooltip="Edit Photo"
                        />
                        <Button
                            icon={<FiTrash2 />}
                            className="p-button-outlined p-button-danger p-button-sm"
                            onClick={handleRemove}
                            tooltip="Remove Photo"
                        />
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = '';
                    }}
                />
            </div>

            {/* Enhanced Photo Editor Dialog */}
            <Dialog
                visible={isEditing}
                onHide={handleCancel}
                style={{ width: "min(95vw, 900px)", height: "min(95vh, 800px)" }}
                header={
                    <div className="flex align-items-center gap-3">
                        <FiEdit3 />
                        <span>Edit Profile Photo</span>
                        {isProcessing && (
                            <Badge value={`${uploadProgress}%`} severity="info" />
                        )}
                    </div>
                }
                dismissableMask={!isProcessing}
                closable={!isProcessing}
                className="enhanced-photo-editor"
            >
                <div className="flex flex-column h-full gap-4">
                    {/* Cropper Area */}
                    <div className="crop-container flex-grow-1 relative bg-gray-900 border-round overflow-hidden" style={{ minHeight: '400px' }}>
                        {imageSrc && (
                            <>
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
                                    style={{
                                        containerStyle: {
                                            background: 'transparent'
                                        }
                                    }}
                                />
                                
                                {/* Quick Tools Overlay */}
                                <div className="absolute top-0 right-0 p-3 flex gap-2">
                                    <Button
                                        icon={<FiZoomOut />}
                                        className="p-button-rounded p-button-sm p-button-secondary"
                                        onClick={() => quickZoom(-0.2)}
                                        tooltip="Zoom Out"
                                        disabled={zoom <= 1}
                                    />
                                    <Button
                                        icon={<FiZoomIn />}
                                        className="p-button-rounded p-button-sm p-button-secondary"
                                        onClick={() => quickZoom(0.2)}
                                        tooltip="Zoom In"
                                        disabled={zoom >= 3}
                                    />
                                    <Button
                                        icon={<FiRotateCcw />}
                                        className="p-button-rounded p-button-sm p-button-secondary"
                                        onClick={() => quickRotate(-90)}
                                        tooltip="Rotate Left"
                                    />
                                    <Button
                                        icon={<FiRotateCw />}
                                        className="p-button-rounded p-button-sm p-button-secondary"
                                        onClick={() => quickRotate(90)}
                                        tooltip="Rotate Right"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Enhanced Controls */}
                    <div className="controls-panel bg-gray-50 border-round p-4">
                        <div className="grid gap-3">
                            {/* Zoom Control */}
                            <div className="col-12 md:col-6">
                                <div className="flex align-items-center gap-3">
                                    <FiZoomIn className="text-gray-600" />
                                    <label className="font-semibold min-w-max">Zoom</label>
                                    <Slider
                                        value={zoom}
                                        onChange={(e) => setZoom(e.value)}
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        className="flex-grow-1"
                                    />
                                    <span className="min-w-max text-sm font-mono bg-white px-2 py-1 border-round">
                                        {zoom.toFixed(1)}x
                                    </span>
                                </div>
                            </div>

                            {/* Rotation Control */}
                            <div className="col-12 md:col-6">
                                <div className="flex align-items-center gap-3">
                                    <FiRefreshCw className="text-gray-600" />
                                    <label className="font-semibold min-w-max">Rotate</label>
                                    <Slider
                                        value={rotation}
                                        onChange={(e) => setRotation(e.value)}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        className="flex-grow-1"
                                    />
                                    <span className="min-w-max text-sm font-mono bg-white px-2 py-1 border-round">
                                        {rotation}°
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-content-between align-items-center mt-4 pt-3 border-top-1 surface-border">
                            <div className="flex gap-2">
                                <Button
                                    label="Reset"
                                    icon={<FiRefreshCw />}
                                    className="p-button-outlined p-button-secondary"
                                    onClick={resetControls}
                                    disabled={isProcessing}
                                />
                                <Button
                                    label="Remove Photo"
                                    icon={<FiTrash2 />}
                                    className="p-button-outlined p-button-danger"
                                    onClick={handleRemove}
                                    disabled={isProcessing}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    label="Cancel"
                                    icon={<FiX />}
                                    className="p-button-text"
                                    onClick={handleCancel}
                                    disabled={isProcessing}
                                />
                                <Button
                                    label={isProcessing ? "Saving..." : "Save Photo"}
                                    icon={<FiSave />}
                                    className="p-button-primary"
                                    onClick={handleSave}
                                    loading={isProcessing}
                                    disabled={!croppedAreaPixels}
                                />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {isProcessing && uploadProgress > 0 && (
                            <div className="mt-3">
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-sm">Uploading...</span>
                                    <span className="text-sm">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 border-round h-2rem">
                                    <div 
                                        className="bg-primary h-full border-round transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Keyboard Shortcuts Help */}
                        <div className="mt-3 p-3 bg-blue-50 border-round">
                            <div className="text-sm text-gray-600">
                                <strong>Keyboard Shortcuts:</strong>
                                <span className="ml-2">Esc (Cancel)</span>
                                <span className="mx-2">•</span>
                                <span>Ctrl+Enter (Save)</span>
                                <span className="mx-2">•</span>
                                <span>Ctrl+R (Reset)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default EnhancedAvatarEditor;
