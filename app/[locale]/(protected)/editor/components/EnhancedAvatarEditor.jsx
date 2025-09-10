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
    FiMove, FiMaximize2, FiSave, FiImage
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
    const [previewMode, setPreviewMode] = useState(true); // Show preview by default
    const [previewImage, setPreviewImage] = useState(null);
    
    const fileInputRef = useRef(null);
    const toast = useRef(null);
    const dropRef = useRef(null);

    // Generate preview image when crop changes (debounced)
    useEffect(() => {
        const generatePreview = async () => {
            if (croppedAreaPixels && imageSrc) {
                try {
                    // Always use the same exact cropping function for both preview and final image
                    // to ensure they match perfectly
                    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
                    setPreviewImage(croppedImage);
                } catch (error) {
                    console.error('Error generating preview:', error);
                    setPreviewImage(null);
                }
            } else {
                setPreviewImage(null);
            }
        };

        // Use a shorter debounce time for more responsive preview
        const timeoutId = setTimeout(generatePreview, 150);
        return () => clearTimeout(timeoutId);
    }, [croppedAreaPixels, imageSrc, rotation]);

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
                detail: 'Please select an image file (JPEG, PNG, WebP, or GIF)'
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
            // Clear previous preview
            setPreviewImage(null);
        };
        reader.onerror = () => {
            toast.current?.show({
                severity: 'error',
                summary: 'File Error',
                detail: 'Failed to read the selected file'
            });
        };
        reader.readAsDataURL(file);
    }, []);

    const resetControls = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        setPreviewImage(null);
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    /**
     * Creates a cropped image from the source image using the crop area pixels
     * @param {string} imageSrc - Base64 or URL of the source image
     * @param {Object} pixelCrop - Crop area pixels from react-easy-crop
     * @param {number} rotation - Rotation angle in degrees
     * @returns {Promise<string>} - Base64 string of the cropped image
     */
    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        const rotRad = getRadianAngle(rotation);

        // calculate bounding box of the rotated image
        const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
            image.width,
            image.height,
            rotation
        );

        // set canvas size to match the bounding box
        canvas.width = bBoxWidth;
        canvas.height = bBoxHeight;

        // translate canvas context to a central location to allow rotating and flipping around the center
        ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
        ctx.rotate(rotRad);
        ctx.translate(-image.width / 2, -image.height / 2);

        // draw rotated image
        ctx.drawImage(image, 0, 0);

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) {
            throw new Error('No 2d context');
        }

        // Set the size of the cropped canvas
        croppedCanvas.width = pixelCrop.width;
        croppedCanvas.height = pixelCrop.height;

        // Draw the cropped image onto the new canvas
        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return croppedCanvas.toDataURL('image/jpeg', 0.95);
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getRadianAngle = (degreeValue) => {
        return (degreeValue * Math.PI) / 180;
    };

    const rotateSize = (width, height, rotation) => {
        const rotRad = (rotation * Math.PI) / 180;
        return {
            width:
                Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
            height:
                Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
        };
    };


    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return;

        setIsProcessing(true);
        setUploadProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 8, 85));
            }, 150);

            // Wait a bit to show progress
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Always generate a fresh image on save to ensure accuracy
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            
            clearInterval(progressInterval);
            setUploadProgress(95);

            await onAvatarChange(croppedImage);
            
            setUploadProgress(100);
            
            toast.current?.show({
                severity: 'success',
                summary: 'Avatar Updated',
                detail: 'Your profile photo has been updated successfully',
                life: 3000
            });

            // Small delay to show completion
            setTimeout(() => {
                setIsEditing(false);
                setImageSrc(null);
                setPreviewImage(null); // Clear preview
                resetControls();
            }, 300);
            
        } catch (error) {
            console.error('Error saving avatar:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Upload Failed',
                detail: error.message || 'Failed to update avatar. Please try again.'
            });
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
                setUploadProgress(0);
            }, 300);
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
        setPreviewImage(null); // Clear preview
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
                            w-full h-full border-circle border-dashed
                            bg-gray-50 hover:bg-gray-100 transition-all duration-300
                            flex flex-column align-items-center justify-content-center gap-2
                            ${isDragOver ? 'border-primary bg-primary-50' : 'border-300'}
                        `} style={{ borderWidth: '2px' }}>
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
                                    aspect={1} // Perfect square aspect ratio
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    cropShape="round"
                                    showGrid={false}
                                    zoomSpeed={0.1}
                                    wheelZoomDisabled={false}
                                    restrictPosition={true} // Keep crop area within image bounds
                                    style={{
                                        containerStyle: {
                                            background: 'transparent',
                                            borderRadius: '0.75rem'
                                        },
                                        cropAreaStyle: {
                                            border: '3px solid var(--primary-color)',
                                            borderRadius: '50%',
                                            boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.7)'
                                        },
                                        mediaStyle: {
                                            borderRadius: '0.75rem'
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
                            {/* Preview Section */}
                            <div className="col-12 mb-3">
                                <div className="flex align-items-center justify-content-between mb-3">
                                    <h4 className="m-0 text-lg font-semibold">Preview</h4>
                                    <Button
                                        icon={<FiMaximize2 />}
                                        className="p-button-text p-button-sm"
                                        onClick={() => setPreviewMode(!previewMode)}
                                        tooltip={previewMode ? "Hide Preview" : "Show Preview"}
                                    />
                                </div>
                                {(previewMode && croppedAreaPixels && previewImage) && (
                                    <div className="preview-main flex flex-column align-items-center gap-3 p-4 bg-white border-round shadow-1">
                                        <div className="preview-avatar-container">
                                            <div className="w-8rem h-8rem border-circle border-3 border-primary bg-white shadow-3 overflow-hidden mx-auto position-relative">
                                                <img 
                                                    src={previewImage} 
                                                    alt="Avatar preview" 
                                                    className="w-full h-full object-cover"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="preview-info text-center">
                                            <div className="text-sm font-semibold text-gray-700 mb-1">Final Avatar</div>
                                            <div className="text-xs text-gray-500">
                                                This preview matches exactly what will be saved
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                        step={0.02}
                                        className="flex-grow-1"
                                    />
                                    <span className="min-w-max text-sm font-mono bg-white px-2 py-1 border-round">
                                        {zoom.toFixed(2)}x
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
                                    disabled={!croppedAreaPixels || !previewImage}
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
