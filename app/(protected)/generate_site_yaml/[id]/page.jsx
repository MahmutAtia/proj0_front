"use client";
// pages/resumes/[resumeId]/create-portfolio.js
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

// PrimeReact Components
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { RadioButton } from 'primereact/radiobutton';
import { Message } from 'primereact/message'; // For the hint/warning
import { useSession } from 'next-auth/react';
// CSS Modules
import styles from './CreatePortfolioPage.module.css';

// Importing design concept options, color styles, and add-on features
import { designConceptOptions, colorStyleOptions, addOnFeatureOptions } from './prefrences'




export default function CreatePortfolioPage({ params: paramsPromise }) {
    const params = React.use(paramsPromise);
    const resumeId = params.id;
    const toast = useRef(null);
    const router = useRouter(); // Ensure useRouter is initialized
    const token =  useSession()?.data?.accessToken || null; // Get the access token from session

    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [selectedColorStyle, setSelectedColorStyle] = useState(null);
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generationResult, setGenerationResult] = useState(null);
    const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Crafting your unique layout...",
        "Selecting the perfect color harmonies...",
        "Integrating your chosen features...",
        "Polishing the pixels...",
        "Almost there, preparing the final touches!",
        "Just a little longer, good things take time!",
        "Our AI is working its magic for you...",
        "Finalizing the design blueprint..."
    ];

    useEffect(() => {
        if (!resumeId) {
            console.error('Resume ID is missing from params.');
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Resume ID is missing. Please check the URL.', life: 3000 });
        }
    }, [resumeId]);

    useEffect(() => {
        let intervalId;
        if (isLoading) {
            setCurrentLoadingMessageIndex(0); // Reset to the first message when loading starts
            intervalId = setInterval(() => {
                setCurrentLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
            }, 3500); // Change message every 3.5 seconds
        }
        return () => {
            clearInterval(intervalId);
        };
    }, [isLoading, loadingMessages.length]);

    const stepperItems = [
        { label: 'Design Concept', command: () => setActiveIndex(0) },
        { label: 'Color Palette', command: () => setActiveIndex(1) },
        { label: 'Add-on Features', command: () => setActiveIndex(2) },
        { label: 'Review & Generate', command: () => setActiveIndex(3) }
    ];

    const handleAddOnSelection = (e) => {
        let _selectedAddOns = [...selectedAddOns];
        if (e.checked) {
            _selectedAddOns.push(e.value);
        } else {
            _selectedAddOns = _selectedAddOns.filter(item => item.id !== e.value.id);
        }
        setSelectedAddOns(_selectedAddOns);
    };

    const constructPreferencesPayload = () => {
        const lines = [];

        // Intro
        lines.push("Generate a personal website design concept for a designer/frontend developer. The design must be fresh, highly creative, and visually striking...");

        // Design Concept
        if (selectedConcept) {
            if (lines.length > 0 && lines[0] !== "") lines.push(""); // Add a blank line if there's preceding content (intro)
            lines.push(`${selectedConcept.aiInstructions.core} (from ${selectedConcept.userFacingText} Concept Core)`);
            lines.push(`${selectedConcept.aiInstructions.animation} (from ${selectedConcept.userFacingText} Animation)`);
        }

        // Color Style
        if (selectedColorStyle) {
            if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push(""); // Add a blank line if there's preceding content and it's not already a blank line
            lines.push(`Apply a '${selectedColorStyle.userFacingText}' color style.`);
            lines.push(`For light mode: ${selectedColorStyle.aiInstructions.light}`);
            lines.push(`For dark mode: ${selectedColorStyle.aiInstructions.dark} (from ${selectedColorStyle.userFacingText} Color Style)`);
        }

        // Add-on Features
        if (selectedAddOns && selectedAddOns.length > 0) {
            if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push(""); // Add a blank line if there's preceding content and it's not already a blank line
            selectedAddOns.forEach((addon) => {
                lines.push(`${addon.aiInstruction} (from ${addon.userFacingText} Add-on)`);
            });
        }

        return lines.join('\n');
    };

    const handleSubmitPreferences = async () => {
        if (!selectedConcept || !selectedColorStyle) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Selections', detail: 'Please select a Design Concept and Color Palette.', life: 3000 });
            return;
        }
        setIsLoading(true);
        setGenerationResult(null);
        const preferences = constructPreferencesPayload();

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await axios.post(
                `${backendUrl}/api/resumes/generate_website_yaml/`,
                { resumeId: resumeId, preferences: preferences },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''

                    }
                }
            );
            setGenerationResult({ success: true, data: response.data });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Website preferences submitted! Generation started.', life: 5000 });
            // Navigate to the site editor page on success
            if (response.data && response.data.website_uuid) {
                router.push(`/site-editor/${response.data.website_uuid}/`);
            } else {
                // Fallback or error if website_uuid is not in the response
                console.error("website_uuid not found in response data");
                toast.current?.show({ severity: 'error', summary: 'Navigation Error', detail: 'Could not retrieve website ID for navigation.', life: 5000 });
            }
        } catch (error) {
            console.error("Error submitting preferences:", error);
            let detail = 'An error occurred while submitting preferences.';
            if (error.response) {
                detail = `Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`;
            } else if (error.request) {
                detail = 'No response from server. Check connection or try later.';
            }
            setGenerationResult({ success: false, error: detail });
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detail, life: 7000 });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeIndex) {
            case 0: // Design Concept
                return (
                    <div className="grid">
                        {designConceptOptions.map(concept => (
                            <div key={concept.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <Card
                                    className={`${styles.selectionCard} ${selectedConcept?.id === concept.id ? styles.selectedCard : ''}`}
                                    onClick={() => setSelectedConcept(concept)}
                                >
                                    <div className="flex flex-column align-items-center text-center h-full">
                                        <div className={styles.visualElementContainer}>
                                            {concept.visualElement()}
                                        </div>
                                        <h3 className="mt-3 mb-2 text-lg font-semibold">{concept.userFacingText}</h3>
                                        <p className="text-sm text-600 px-2 flex-grow-1">{concept.description}</p>
                                        <RadioButton
                                            inputId={`concept_${concept.id}`} // Ensure unique inputId
                                            name="concept"
                                            value={concept}
                                            onChange={(e) => setSelectedConcept(e.value)}
                                            checked={selectedConcept?.id === concept.id}
                                            className="mt-3"
                                        />
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                );
            case 1: // Color Palette
                return (
                    <div className="grid">
                        {colorStyleOptions.map(style => (
                            <div key={style.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <Card
                                    className={`${styles.selectionCard} ${selectedColorStyle?.id === style.id ? styles.selectedCard : ''}`}
                                    onClick={() => setSelectedColorStyle(style)}
                                >
                                    <div className="flex flex-column align-items-center text-center h-full">
                                        <div className={`${styles.visualElementContainer} ${styles.colorPalettePreview}`}>
                                            {style.visualElement()}
                                        </div>
                                        <h3 className="mt-3 mb-2 text-lg font-semibold">{style.userFacingText}</h3>
                                        <p className="text-sm text-600 px-2 flex-grow-1">{style.description}</p>
                                        <RadioButton
                                            inputId={`style_${style.id}`} // Ensure unique inputId
                                            name="colorStyle"
                                            value={style}
                                            onChange={(e) => setSelectedColorStyle(e.value)}
                                            checked={selectedColorStyle?.id === style.id}
                                            className="mt-3"
                                        />
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                );
            case 2: // Add-on Features
                return (
                    <div className="grid">
                        {addOnFeatureOptions.map(feature => (
                            <div key={feature.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <div
                                    className={`${styles.addOnCard} ${selectedAddOns.some(item => item.id === feature.id) ? styles.selectedAddOnCard : ''}`}
                                    onClick={() => {
                                        const isSelected = selectedAddOns.some(item => item.id === feature.id);
                                        handleAddOnSelection({ value: feature, checked: !isSelected });
                                    }}
                                >
                                    <div className="flex align-items-center">
                                        <div className={styles.addOnVisualElementContainer}>
                                            {feature.visualElement()}
                                        </div>
                                        <div className="ml-3 flex-grow-1">
                                            <span className="font-medium text-lg">{feature.userFacingText}</span>
                                            <p className="text-sm text-600 mt-1 mb-0">{feature.description}</p>
                                        </div>
                                        <Checkbox
                                            inputId={`feature_${feature.id}`} // Ensure unique inputId
                                            value={feature}
                                            onChange={handleAddOnSelection}
                                            checked={selectedAddOns.some(item => item.id === feature.id)}
                                            className="ml-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 3: // Review & Generate
                if (isLoading) {
                    return (
                        <div className="text-center p-5">
                            <ProgressSpinner style={{ width: '80px', height: '80px' }} strokeWidth="4" />
                            <h3 className="mt-4 text-xl font-semibold">Generating Your Design...</h3>
                            <p className="text-lg text-600 mt-2">{loadingMessages[currentLoadingMessageIndex]}</p>
                            <p className="text-sm text-500 mt-4">This can take up to a few minutes. Please don&apos;t close this page.</p>
                        </div>
                    );
                }
                if (generationResult?.success) {
                    return (
                        <div className="text-center p-5">
                            <i className="pi pi-check-circle text-green-500 text-6xl mb-3"></i>
                            <h3 className="mt-3 text-xl font-semibold">Preferences Submitted Successfully!</h3>
                            <p className="text-lg text-600">Your unique website design generation has been initiated.</p>
                            <p className="text-sm text-500 mt-2">You will be notified once it&apos;s ready, or check your dashboard.</p>
                            <Button label="Start New Design" icon="pi pi-plus" className="p-button-outlined mt-4" onClick={() => { setActiveIndex(0); setGenerationResult(null); setSelectedConcept(null); setSelectedColorStyle(null); setSelectedAddOns([]); }} />
                        </div>
                    );
                }
                if (generationResult?.error) {
                    return (
                        <div className="text-center p-5">
                            <i className="pi pi-times-circle text-red-500 text-6xl mb-3"></i>
                            <h3 className="mt-3 text-xl font-semibold">Generation Failed</h3>
                            <p className="text-lg text-red-700">{generationResult.error}</p>
                            <Button label="Try Again" icon="pi pi-refresh" className="p-button-danger mt-4" onClick={() => { setIsLoading(false); setGenerationResult(null); }} />
                        </div>
                    );
                }

                return (
                    <Card className="shadow-1">
                        <div className="p-4">
                            <h4 className="font-semibold text-2xl mb-4 text-center">Review Your Selections</h4>
                            <div className="surface-section p-4 border-round border-1 surface-border">
                                <div className="mb-3">
                                    <strong className="text-gray-700 block mb-1">Design Concept:</strong>
                                    <p className="text-gray-600 text-lg">{selectedConcept ? selectedConcept.userFacingText : 'Not Selected'}</p>
                                </div>
                                <div className="mb-3">
                                    <strong className="text-gray-700 block mb-1">Color Palette:</strong>
                                    <p className="text-gray-600 text-lg">{selectedColorStyle ? selectedColorStyle.userFacingText : 'Not Selected'}</p>
                                </div>
                                <div>
                                    <strong className="text-gray-700 block mb-1">Additional Features:</strong>
                                    {selectedAddOns.length > 0 ? (
                                        <ul className="list-disc pl-5 mt-1">
                                            {selectedAddOns.map(addon => <li key={addon.id} className="text-gray-600 text-lg">{addon.userFacingText}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-600 text-lg">None</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                label="Generate Website Design"
                                icon="pi pi-sparkles"
                                className="w-full mt-5 p-button-lg p-button-success"
                                onClick={handleSubmitPreferences}
                                disabled={!selectedConcept || !selectedColorStyle || isLoading}
                            />
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className={`min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6 lg:p-8 ${styles.pageContainer}`}>
                <div className={`surface-card p-3 sm:p-5 shadow-2 border-round w-full mx-auto ${styles.contentWrapper}`}>
                    <div className="text-center mb-5">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Customize Your Portfolio</h1>
                        <p className="text-gray-600 text-lg">Follow the steps to define your website&apos;s unique style.</p>
                    </div>

                    {/* Hint/Warning Message */}
                    <div className={`${styles.hintMessage} surface-100 p-3 border-round mb-6 flex align-items-center`}>
                        <i className="pi pi-info-circle text-primary text-2xl mr-3"></i>
                        <div>
                            <span className="font-bold text-primary">Important:</span> Your selections below will guide your personal AI in crafting a unique website tailored to your preferences. Choose wisely!
                        </div>
                    </div>


                    <Steps model={stepperItems} activeIndex={activeIndex} onSelect={(e) => setActiveIndex(e.index)} readOnly={false} className="mb-6 text-sm md:text-base" />

                    <div className="p-0 md:p-4">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-content-between mt-6 p-2 md:p-4">
                        <Button
                            label="Back"
                            icon="pi pi-arrow-left"
                            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                            disabled={activeIndex === 0 || isLoading}
                            className="p-button-secondary"
                        />
                        <Button
                            label={activeIndex === stepperItems.length - 1 ? (isLoading ? 'Generating...' : 'Generate Design') : 'Next'}
                            iconPos={activeIndex === stepperItems.length - 1 ? 'left' : 'right'}
                            icon={activeIndex === stepperItems.length - 1 ? (isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check') : 'pi pi-arrow-right'}
                            onClick={() => {
                                if (activeIndex === stepperItems.length - 1) {
                                    handleSubmitPreferences();
                                } else {
                                    if (activeIndex === 0 && !selectedConcept) {
                                        toast.current?.show({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a Design Concept.', life: 3000 }); return;
                                    }
                                    if (activeIndex === 1 && !selectedColorStyle) {
                                        toast.current?.show({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a Color Palette.', life: 3000 }); return;
                                    }
                                    setActiveIndex(Math.min(stepperItems.length - 1, activeIndex + 1));
                                }
                            }}
                            disabled={isLoading || (activeIndex === 0 && !selectedConcept && activeIndex < stepperItems.length - 1) || (activeIndex === 1 && !selectedColorStyle && activeIndex < stepperItems.length - 1)}
                            className={activeIndex === stepperItems.length - 1 ? 'p-button-success' : 'p-button-primary'}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
