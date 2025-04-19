"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // Import ConfirmDialog
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import AIAssistant from '../../main/editor/components/AIAssistant';

const initialYamlState = {
    global: { name: "global", js: "", css: "", html: "", feedback: "Global styles and settings." },
    code_bloks: []
};

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
const PersonalSiteEditorPage = ({ params }) => {
    const resumeId = params.id;
    const [yamlData, setYamlData] = useState(initialYamlState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [currentBlock, setCurrentBlock] = useState(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [artifacts, setArtifacts] = useState([{ key: '', value: '' }]);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const toast = useRef(null);
    const [hoveredBlock, setHoveredBlock] = useState(null);

    // history
    const [blockHistory, setBlockHistory] = useState({}); // Stores array of states {html, css, js} for each block
    const [historyIndex, setHistoryIndex] = useState({}); // Stores the index of the current state in the history array


    // New State for Save & Local Storage & Unsaved Changes
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialDataRef = useRef(null); // To compare for unsaved changes
    const [isRestoring, setIsRestoring] = useState(false); // Flag during restore confirmation

    // --- Local Storage Key ---
    const getLocalStorageKey = useCallback(() => `personalSiteEditorBackup_${resumeId}`, [resumeId]);
    // --- Helper to Initialize History --- (Run after setting yamlData)
    const initializeHistory = useCallback((data) => {
        if (!data || !data.code_bloks) return;
        const initialHistory = {};
        const initialIndices = {};
        data.code_bloks.forEach(block => {
            const initialState = { html: block.html, css: block.css, js: block.js };
            initialHistory[block.name] = [initialState];
            initialIndices[block.name] = 0;
        });
        if (data.global) {
            const globalInitialState = { html: data.global.html, css: data.global.css, js: data.global.js };
            initialHistory[data.global.name] = [globalInitialState];
            initialIndices[data.global.name] = 0;
        }
        setBlockHistory(initialHistory);
        setHistoryIndex(initialIndices);
        console.log("History Initialized:", initialHistory);
    }, []); // No dependencies needed if it only uses the 'data' argument



    // --- Initial Load & Restore Logic ---
    useEffect(() => {
        if (!resumeId || isRestoring) return; // Don't run if no ID or during restore prompt

        const localStorageKey = getLocalStorageKey();
        const backup = localStorage.getItem(localStorageKey);

        const processFetchedData = (fetchedData) => {
            setYamlData(fetchedData);
            initialDataRef.current = JSON.stringify(fetchedData); // Store initial state for comparison
            initializeHistory(fetchedData); // Initialize history based on fetched data
            setHasUnsavedChanges(false); // Fresh data has no unsaved changes
            setLoading(false);
        };

        const fetchAndProcess = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/website-yaml/${resumeId}`);
                processFetchedData(response.data);
            } catch (err) {
                console.error("Error fetching YAML:", err);
                setError("Failed to load website data.");
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load website data.', life: 5000 });
                setLoading(false); // Stop loading on error
            }
        };

        if (backup) {
            setIsRestoring(true); // Set flag to prevent re-triggering
            confirmDialog({
                message: 'You have unsaved changes from a previous session. Do you want to restore them?',
                header: 'Restore Session?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Restore',
                rejectLabel: 'Discard & Load Saved',
                accept: () => {
                    try {
                        const parsedBackup = JSON.parse(backup);
                        setYamlData(parsedBackup);
                        initialDataRef.current = null; // Restored data IS unsaved compared to server
                        initializeHistory(parsedBackup); // Init history from backup
                        setHasUnsavedChanges(true); // Mark as having unsaved changes
                        setLoading(false); // Stop loading
                        toast.current?.show({ severity: 'info', summary: 'Restored', detail: 'Restored previous unsaved work.', life: 3000 });
                    } catch (e) {
                        console.error("Error parsing backup:", e);
                        toast.current?.show({ severity: 'warn', summary: 'Restore Failed', detail: 'Could not parse local backup. Loading saved version.', life: 4000 });
                        localStorage.removeItem(localStorageKey); // Remove corrupted backup
                        fetchAndProcess(); // Fetch fresh data
                    } finally {
                        setIsRestoring(false);
                    }
                },
                reject: () => {
                    localStorage.removeItem(localStorageKey); // Remove backup if discarded
                    toast.current?.show({ severity: 'info', summary: 'Discarded', detail: 'Discarded local changes. Loading saved version.', life: 3000 });
                    fetchAndProcess(); // Fetch fresh data
                    setIsRestoring(false);
                }
            });
        } else {
            fetchAndProcess(); // Fetch if no backup
        }

    }, [resumeId, getLocalStorageKey, initializeHistory, isRestoring]); // Dependencies

    // --- Auto Save to Local Storage ---
    const debouncedSaveToLocalStorage = useCallback(
        debounce((data) => {
            if (!loading && hasUnsavedChanges) { // Only save if loaded and changes exist
                console.log("Auto-saving to local storage...");
                const localStorageKey = getLocalStorageKey();
                localStorage.setItem(localStorageKey, JSON.stringify(data));
            }
        }, 1500), // Debounce for 1.5 seconds
        [loading, hasUnsavedChanges, getLocalStorageKey] // Dependencies for useCallback
    );

    useEffect(() => {
        // Trigger debounce function when yamlData changes
        debouncedSaveToLocalStorage(yamlData);
    }, [yamlData, debouncedSaveToLocalStorage]);



    // --- Manual Save to Backend ---
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Prepare data payload (send only necessary parts)
            const payload = {
                global: yamlData.global,
                code_bloks: yamlData.code_bloks
            };
            await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/website-yaml/update/${resumeId}/`, payload); // Use PUT for overwrite

            const localStorageKey = getLocalStorageKey();
            localStorage.removeItem(localStorageKey); // Clear backup on successful save
            initialDataRef.current = JSON.stringify(yamlData); // Update the reference for "saved" state
            setHasUnsavedChanges(false); // Mark changes as saved
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Website changes saved successfully!', life: 3000 });

        } catch (err) {
            console.error("Error saving changes:", err);
            let detail = 'Failed to save changes to the server.';
            if (err.response?.data?.detail) {
                detail += ` Error: ${err.response.data.detail}`;
            }
            toast.current?.show({ severity: 'error', summary: 'Save Error', detail: detail, life: 5000 });
            // Keep hasUnsavedChanges as true if save failed
        } finally {
            setIsSaving(false);
        }
    };


    // --- Modify functions that change yamlData to set hasUnsavedChanges ---
    const updateYamlDataAndHistory = (blockName, newState, newFeedback) => {
        // Logic to update yamlData, blockHistory, historyIndex
        // ... (as implemented in previous steps for AI edit, rollback, forward) ...

        // ** Add this line in handleAIEditSubmit, rollbackBlock, forwardBlock
        // ** AFTER the state updates are scheduled
        setHasUnsavedChanges(true);
    };




    const handleMouseEnter = (blockName) => {
        setHoveredBlock(blockName);
    };

    const handleMouseLeave = () => {
        setHoveredBlock(null);
    };

    // --- AI Dialog Handlers ---
    const openEditDialog = (block) => { // Now accepts any block object
        setCurrentBlock(block);
        setAiPrompt(''); // Reset prompt for new dialog opening
        setArtifacts([{ key: '', value: '' }]); // Reset artifacts
        setIsAiDialogOpen(true);
    };
    const closeEditDialog = () => {
        setIsAiDialogOpen(false);
        setCurrentBlock(null); // Clear current block on close
        setAiPrompt('');
        setArtifacts([{ key: '', value: '' }]);
    };

    const handleAIEditSubmit = async () => {
        if (!currentBlock || !aiPrompt.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select a block and enter a prompt.', life: 3000 });
            return;
        }

        setIsAiProcessing(true);
        let responseData = null; // Initialize variable to hold response data

        try {
            const validArtifacts = artifacts.filter(art => art.key.trim() !== '');
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/website-yaml/edit-block/`, {
                resumeId: resumeId,
                blockName: currentBlock.name,
                currentHtml: currentBlock.html,
                currentCss: currentBlock.css,
                currentJs: currentBlock.js,
                prompt: aiPrompt,
                artifacts: validArtifacts,
            });

            // --- Correctly assign response data ---
            responseData = response.data;

            // --- Validate response data (basic check) ---
            if (!responseData || typeof responseData !== 'object') {
                console.error("Invalid response data structure:", responseData);
                throw new Error("Received invalid data from AI edit endpoint.");
            }

            const blockName = currentBlock.name;

            // --- Create the new state object using response data safely ---
            const newState = {
                html: responseData?.html ?? currentBlock.html, // Fallback to current if null/undefined
                css: responseData?.css ?? currentBlock.css,   // Fallback to current
                js: responseData?.js ?? currentBlock.js,     // Fallback to current
            };
            // --- Get the new feedback separately ---
            const newFeedback = responseData?.feedback ?? currentBlock.feedback; // Fallback to current

            let finalNewIndex = 0; // To store the calculated index

            // --- Update History State ---
            setBlockHistory(prevHistory => {
                const currentHistory = prevHistory[blockName] || [];
                // Use the current historyIndex state value for slicing
                const currentIndex = historyIndex[blockName] ?? -1;

                // Slice history up to the current index + 1
                const relevantHistory = currentHistory.slice(0, currentIndex + 1);

                // Add the new state object to the history
                const updatedHistory = [...relevantHistory, newState]; // Add the CONTENT state

                // --- Calculate the index of the newly added state ---
                finalNewIndex = updatedHistory.length - 1;

                console.log(`[${blockName}] History updated. New calculated index: ${finalNewIndex}`, updatedHistory);

                return {
                    ...prevHistory,
                    [blockName]: updatedHistory,
                };
            });

            // --- Update History Index State ---
            // This setter receives the *calculated* finalNewIndex from the scope above
            setHistoryIndex(prevIndex => {
                console.log(`[${blockName}] Setting history index state to: ${finalNewIndex}`);
                return {
                    ...prevIndex,
                    [blockName]: finalNewIndex
                };
            });

            // --- Update Main Data State (yamlData) ---
            // This needs to run to reflect the changes visually
            setYamlData(prevData => {
                console.log(`[${blockName}] Updating yamlData with newState and newFeedback.`);
                const updatedBlocks = prevData.code_bloks.map(block => {
                    if (block.name === blockName) {
                        return {
                            ...block,
                            ...newState,      // Apply the new HTML, CSS, JS
                            feedback: newFeedback // Apply the new feedback
                        };
                    }
                    return block;
                });
                const updatedGlobal = prevData.global.name === blockName ?
                    {
                        ...prevData.global,
                        ...newState,      // Apply the new HTML, CSS, JS
                        feedback: newFeedback // Apply the new feedback
                    } : prevData.global;

                return {
                    ...prevData,
                    global: updatedGlobal,
                    code_bloks: updatedBlocks
                };
            });

            // --- Mark changes as unsaved ---
            setHasUnsavedChanges(true);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: `${blockName} updated!`, life: 3000 });
            closeEditDialog();

        } catch (err) {
            console.error("Error during AI edit submission:", err);
            const blockNameToToast = currentBlock?.name || 'Block';
            // Improved error message
            let detailMessage = `Failed to update ${blockNameToToast}.`;
            if (err.response?.data?.detail) {
                detailMessage += ` Server Error: ${err.response.data.detail}`;
            } else if (err.message) {
                detailMessage += ` Error: ${err.message}`;
            }
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detailMessage, life: 6000 });
        } finally {
            setIsAiProcessing(false);
        }
    };

    const rollbackBlock = (blockName) => {
        const history = blockHistory[blockName] || [];
        const currentIndex = historyIndex[blockName];

        console.log(`[${blockName}] Rollback Attempt - Current Index: ${currentIndex}, History Length: ${history.length}`);

        // Can rollback if the current index is greater than 0
        if (currentIndex > 0) {
            const previousIndex = currentIndex - 1;
            const previousState = history[previousIndex];

            console.log(`[${blockName}] Rolling back to Index: ${previousIndex}`);

            // Update yamlData to the previous state
            setYamlData(prevData => {
                const updatedBlocks = prevData.code_bloks.map(block => {
                    if (block.name === blockName) {
                        // Restore html, css, js. Keep current feedback or restore it too if it's in history state
                        return { ...block, ...previousState };
                    }
                    return block;
                });
                const updatedGlobal = prevData.global.name === blockName ?
                    { ...prevData.global, ...previousState } : prevData.global;

                return { ...prevData, global: updatedGlobal, code_bloks: updatedBlocks };
            });

            // Update the history index
            setHistoryIndex(prevIndex => ({
                ...prevIndex,
                [blockName]: previousIndex,
            }));

            // --- Mark changes as unsaved ---
            setHasUnsavedChanges(true);

            toast.current?.show({ severity: 'info', summary: 'Rolled Back', detail: `Rolled back ${blockName}`, life: 1500 });

        } else {
            console.log(`[${blockName}] Rollback impossible: Already at the beginning of history.`);
            toast.current?.show({ severity: 'warn', summary: 'No More History', detail: `Cannot roll back ${blockName} further`, life: 2000 });
        }
    };
    const forwardBlock = (blockName) => {
        const history = blockHistory[blockName] || [];
        const currentIndex = historyIndex[blockName];

        console.log(`[${blockName}] Forward Attempt - Current Index: ${currentIndex}, History Length: ${history.length}`);

        // Can forward if the current index is less than the last index in the history array
        if (currentIndex < history.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextState = history[nextIndex];

            console.log(`[${blockName}] Forwarding to Index: ${nextIndex}`);

            // Update yamlData to the next state
            setYamlData(prevData => {
                const updatedBlocks = prevData.code_bloks.map(block => {
                    if (block.name === blockName) {
                        // Restore html, css, js from the next state
                        return { ...block, ...nextState };
                    }
                    return block;
                });
                const updatedGlobal = prevData.global.name === blockName ?
                    { ...prevData.global, ...nextState } : prevData.global;

                return { ...prevData, global: updatedGlobal, code_bloks: updatedBlocks };
            });

            // Update the history index
            setHistoryIndex(prevIndex => ({
                ...prevIndex,
                [blockName]: nextIndex,
            }));

            // --- Mark changes as unsaved ---
            setHasUnsavedChanges(true);

            toast.current?.show({ severity: 'info', summary: 'Forwarded', detail: `Forwarded ${blockName}`, life: 1500 });
        } else {
            console.log(`[${blockName}] Forward impossible: Already at the latest state.`);
            toast.current?.show({ severity: 'warn', summary: 'Latest State', detail: `Already at the latest version of ${blockName}`, life: 2000 });
        }
    };

    const handleArtifactKeyChange = (index, value) => {
        const newArtifacts = [...artifacts];
        newArtifacts[index].key = value;
        setArtifacts(newArtifacts);
    };

    const handleArtifactValueChange = (index, value) => {
        const newArtifacts = [...artifacts];
        newArtifacts[index].value = value;
        setArtifacts(newArtifacts);
    };

    const addArtifactPair = () => {
        setArtifacts([...artifacts, { key: '', value: '' }]);
    };

    const removeArtifactPair = (index) => {
        const newArtifacts = artifacts.filter((_, i) => i !== index);
        setArtifacts(newArtifacts);
    };


    // --- Render Logic ---
    if (loading && !isRestoring) { // Show loading only if not handling restore prompt
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="p-ml-3">Loading website editor...</p>
            </div>
        );
    }


    if (error) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen text-red-500">
                <i className="pi pi-times-circle p-mr-2" style={{ fontSize: '2rem' }}></i>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="personal-site-editor relative">
            <Toast ref={toast} />
            <ConfirmDialog /> {/* Add this for the restore prompt */}

            {/* --- Render the Toolbar --- */}
            {!loading && yamlData.global && ( // Render toolbar only when data is loaded
                <EditorToolbar
                    resumeId={resumeId}
                    onSave={handleSaveChanges}
                    isSaving={isSaving}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onEditGlobal={() => openEditDialog(yamlData.global)} // Pass global block
                />
            )}


            {yamlData.code_bloks.map((block, index) => (
                <div
                    key={block.name || index}
                    className="website-block-container relative"
                    onMouseEnter={() => handleMouseEnter(block.name)}
                    onMouseLeave={handleMouseLeave}
                    style={{ minHeight: '50px', outline: hoveredBlock === block.name ? '2px dashed var(--primary-color)' : 'none', transition: 'outline-color 0.2s' }}
                >
                    <iframe
                        title={`Preview ${block.name}`}
                        style={{ width: '100%', border: 'none', minHeight: 'inherit' }}
                        sandbox="allow-scripts allow-same-origin"
                        srcDoc={`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                /* Include a CSS reset or normalize here */
                body, h1, h2, h3, p, ul, li { margin: 0; padding: 0; } /* Example reset */

                ${yamlData.global?.css || ''}
                ${block.css || ''}
            </style>
            ${yamlData.global?.html ? `<div style="display:none !important;" dangerouslySetInnerHTML={{ __html: '${yamlData.global.html}' }}></div>` : ''}
        </head>
        <body style="margin: 0;">
            ${block.html || ''}
            <script>
                ${yamlData.global?.js || ''}
                ${block.js || ''}
            </script>
        </body>
        </html>
    `}
                        onLoad={(e) => {
                            try {
                                const iframe = e.target;
                                const body = iframe.contentDocument.body;
                                const htmlElement = iframe.contentDocument.documentElement;

                                // Calculate the maximum of scrollHeight and clientHeight to account for content and viewport
                                const contentHeight = Math.max(body.scrollHeight, body.offsetHeight, htmlElement.clientHeight, htmlElement.scrollHeight, htmlElement.offsetHeight);

                                // Get the computed styles of the body to account for margins
                                const bodyStyle = window.getComputedStyle(body);
                                const marginTop = parseInt(bodyStyle.marginTop, 10) || 0;
                                const marginBottom = parseInt(bodyStyle.marginBottom, 10) || 0;

                                iframe.style.height = `${contentHeight + marginTop + marginBottom}px`;
                            } catch (error) {
                                console.error("Error adjusting iframe height with margins:", error);
                            }
                        }}
                        scrolling="no"
                    />
                    {hoveredBlock === block.name && (
                        <div
                            className="edit-overlay absolute top-0 right-0 p-2 flex flex-column align-items-end gap-2 z-1000"
                            style={{ zIndex: 1000 }}
                        >
                            {block.feedback && (
                                <React.Fragment>
                                    <span
                                        className="p-tag p-tag-info border-round-sm text-sm font-normal cursor-help feedback-tooltip-target"
                                        data-pr-tooltip={block.feedback}
                                        data-pr-position="left"
                                        style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {block.feedback}
                                    </span>
                                    <Tooltip target=".feedback-tooltip-target" />
                                </React.Fragment>
                            )}
                            <div className="flex align-items-center gap-2">
                                <Button
                                    icon="pi pi-undo"
                                    className="p-button-rounded p-button-secondary"
                                    onClick={() => rollbackBlock(block.name)}
                                    tooltip={`Rollback ${block.name}`}
                                    tooltipOptions={{ position: 'left' }}
                                    style={{ zIndex: 1001 }}
                                    // Disable if history doesn't exist or index is 0 (or less)
                                    disabled={!blockHistory[block.name] || (historyIndex[block.name] ?? 0) <= 0}
                                />
                                <Button
                                    icon="pi pi-redo"
                                    className="p-button-rounded p-button-secondary"
                                    onClick={() => forwardBlock(block.name)}
                                    tooltip={`Forward ${block.name}`}
                                    tooltipOptions={{ position: 'left' }}
                                    style={{ zIndex: 1001 }}
                                    // Disable if history doesn't exist or index is already the last one
                                    disabled={!blockHistory[block.name] || (historyIndex[block.name] ?? 0) >= blockHistory[block.name].length - 1}
                                />
                                <Button
                                    icon="pi pi-pencil"
                                    className="p-button-rounded p-button-secondary"
                                    onClick={() => openEditDialog(block)}
                                    tooltip={`Edit ${block.name}`}
                                    tooltipOptions={{ position: 'left' }}
                                    style={{ zIndex: 1001 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {/* AI Editor Dialog */}
            <Dialog
                header={`Edit Block: ${currentBlock?.name || ''}`}
                visible={isAiDialogOpen}
                style={{ width: '50vw' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                modal
                className="p-fluid"
                onHide={closeEditDialog}
            >
                <div className="p-mb-4">
                    <p className="text-600">Current Block Feedback: {currentBlock?.feedback || 'No feedback available.'}</p>
                    <small className="text-500">Enter your prompt to modify the HTML, CSS, or JS of this specific block.</small>
                </div>

                <Divider />

                {/* AI Assistant Component */}
                <div className="p-mb-4">
                    <h6 className="p-mb-3">AI Prompt</h6>
                    <AIAssistant
                        prompt={aiPrompt}
                        setPrompt={setAiPrompt}
                        onSubmit={handleAIEditSubmit}
                        isProcessing={isAiProcessing}
                    />
                </div>

                <Divider />

                {/* Artifacts (Key-Value Pairs) */}
                <div className="p-mb-4">
                    <h6 className="p-mb-3">Artifacts (Optional)</h6>
                    <small className="p-d-block p-mb-3 text-500">Add key-value pairs for specific data like image URLs, video links, specific text snippets, etc.</small>
                    <div className="p-grid p-formgrid nested-grid">
                        {artifacts.map((artifact, index) => (
                            <div key={index} className="p-col-12 p-md-6 flex align-items-center p-mb-2">
                                <div className="p-field p-col p-m-0">
                                    <InputText
                                        value={artifact.key}
                                        onChange={(e) => handleArtifactKeyChange(index, e.target.value)}
                                        placeholder="Key (e.g., avatar_url)"
                                        className="w-full"
                                    />
                                </div>
                                <div className="p-field p-col p-m-0 p-px-2">
                                    <InputText
                                        value={artifact.value}
                                        onChange={(e) => handleArtifactValueChange(index, e.target.value)}
                                        placeholder="Value (e.g., https://...)"
                                        className="w-full"
                                    />
                                </div>
                                {artifacts.length > 1 && (
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-rounded p-button-danger p-button-text"
                                        onClick={() => removeArtifactPair(index)}
                                        tooltip="Remove artifact"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-text-right p-mt-2">
                        <Button
                            label="Add Artifact"
                            icon="pi pi-plus"
                            className="p-button-text p-button-sm"
                            onClick={addArtifactPair}
                        />
                    </div>
                </div>
                {/* Dialog footer is handled by the Button's onSubmit triggered by AIAssistant */}
            </Dialog>
        </div>
    );
};

export default PersonalSiteEditorPage;




const EditorToolbar = ({
    resumeId,
    onSave,
    isSaving,
    hasUnsavedChanges, // New prop to indicate pending changes
    onEditGlobal
}) => {
    // Construct the URL for the live site preview
    // Ensure the base URL ends with a slash if needed, or adjust accordingly
    const siteUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${resumeId}/`;

    return (
        <div className="p-3 surface-ground border-bottom-1 surface-border flex flex-wrap justify-content-between align-items-center sticky top-0 z-5 gap-2" style={{ zIndex: 1010 }}> {/* Higher z-index */}
            {/* Left Side: Global Edit */}
            <div>
                <Button
                    label="Edit Global Settings"
                    icon="pi pi-cog"
                    className="p-button-secondary p-button-sm"
                    onClick={onEditGlobal}
                    tooltip="Edit sitewide CSS, JS, or Head HTML"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>

            {/* Right Side: View Site & Save */}
            <div className="flex align-items-center gap-2">
                {/* Link to Live Site */}
                <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button
                        label="View My Site"
                        icon="pi pi-external-link"
                        className="p-button-outlined p-button-sm"
                        tooltip="Open your generated website in a new tab"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </a>

                {/* Save Button */}
                <Button
                    label={isSaving ? 'Saving...' : 'Save Changes'}
                    icon={isSaving ? <ProgressSpinner style={{ width: '18px', height: '18px' }} strokeWidth="8" /> : "pi pi-save"}
                    className="p-button-sm p-button-success" // Make save button prominent
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges} // Disable if saving or no changes
                    tooltip={hasUnsavedChanges ? "Save your latest changes to the server" : "No changes to save"}
                    tooltipOptions={{ position: 'bottom' }}
                />
                {/* Optional: Visual indicator for unsaved changes */}
                {hasUnsavedChanges && !isSaving && (
                    <i className="pi pi-circle-fill text-orange-500 p-ml-1 animation-pulse" style={{ fontSize: '0.7rem' }} title="Unsaved changes"></i>
                )}
            </div>
            <style jsx>{`
                .animation-pulse {
                    animation: pulse 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};

