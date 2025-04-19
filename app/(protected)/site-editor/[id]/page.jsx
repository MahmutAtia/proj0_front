"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import AIAssistant from '../../main/editor/components/AIAssistant';

const initialYamlState = {
    global: { name: "global", js: "", css: "", html: "", feedback: "Global styles and settings." },
    code_bloks: []
};

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

    useEffect(() => {
        if (!resumeId) return;
        const fetchYaml = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/website-yaml/${resumeId}`);
                setYamlData(response.data);
            } catch (err) {
                console.error("Error fetching YAML:", err);
                setError("Failed to load website data. Please try again.");
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load website data.', life: 5000 });
            } finally {
                setLoading(false);
            }
        };
        fetchYaml();
    }, [resumeId]);

    const handleMouseEnter = (blockName) => {
        setHoveredBlock(blockName);
    };

    const handleMouseLeave = () => {
        setHoveredBlock(null);
    };

    const openEditDialog = (block) => {
        setCurrentBlock(block);
        setAiPrompt('');
        setArtifacts([{ key: '', value: '' }]);
        setIsAiDialogOpen(true);
    };

    const closeEditDialog = () => {
        setIsAiDialogOpen(false);
        setCurrentBlock(null);
        setAiPrompt('');
        setArtifacts([{ key: '', value: '' }]);
    };

    const handleAIEditSubmit = async () => {
        if (!currentBlock || !aiPrompt.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select a block and enter a prompt.', life: 3000 });
            return;
        }

        setIsAiProcessing(true);
        try {
            const validArtifacts = artifacts.filter(art => art.key.trim() !== '');
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/edit-block`, {
                resumeId: resumeId,
                blockName: currentBlock.name,
                currentHtml: currentBlock.html,
                currentCss: currentBlock.css,
                currentJs: currentBlock.js,
                prompt: aiPrompt,
                artifacts: validArtifacts,
            });

            const newBlockData = response.data;

            setYamlData(prevData => {
                const updatedBlocks = prevData.code_bloks.map(block => {
                    if (block.name === currentBlock.name) {
                        return {
                            ...block,
                            html: newBlockData.newHtml || block.html,
                            css: newBlockData.newCss || block.css,
                            js: newBlockData.newJs || block.js,
                            feedback: newBlockData.newFeedback || block.feedback
                        };
                    }
                    return block;
                });
                const updatedGlobal = prevData.global.name === currentBlock.name ?
                    {
                        ...prevData.global,
                        html: newBlockData.newHtml || prevData.global.html,
                        css: newBlockData.newCss || prevData.global.css,
                        js: newBlockData.newJs || prevData.global.js,
                        feedback: newBlockData.newFeedback || prevData.global.feedback
                    } : prevData.global;

                return {
                    ...prevData,
                    global: updatedGlobal,
                    code_bloks: updatedBlocks
                };
            });

            toast.current?.show({ severity: 'success', summary: 'Success', detail: `${currentBlock.name} updated!`, life: 3000 });
            closeEditDialog();

        } catch (err) {
            console.error("Error calling AI endpoint:", err);
            setError("Failed to update block with AI.");
            toast.current?.show({ severity: 'error', summary: 'Error', detail: `Failed to update ${currentBlock?.name}.`, life: 5000 });
        } finally {
            setIsAiProcessing(false);
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

    if (loading) {
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

            {/* Inject Global CSS, scoped to the website preview container */}
            {yamlData.global?.css && (
                <style>
                    {`
                        .website-preview-container {
                            /* Any container-specific styles if needed */
                        }
                        .website-preview-container * {
                            ${yamlData.global.css}
                        }
                    `}
                </style>
            )}

            <div className="website-preview-container">
                {yamlData.code_bloks.map((block, index) => (
                    <div
                        key={block.name || index}
                        className="website-block-container relative"
                        onMouseEnter={() => handleMouseEnter(block.name)}
                        onMouseLeave={handleMouseLeave}
                        style={{ minHeight: '50px', outline: hoveredBlock === block.name ? '2px dashed var(--primary-color)' : 'none', transition: 'outline-color 0.2s' }}
                    >
                        {/* Inject Block-Specific CSS */}
                        {block.css && (
                            <style>
                                {`
                                    .website-block-container:nth-child(${index + 1}) > div {
                                        ${block.css}
                                    }
                                `}
                            </style>
                        )}

                        {/* Render Global HTML before the block's HTML */}
                        {yamlData.global?.html && (
                            <div dangerouslySetInnerHTML={{ __html: yamlData.global.html }} />
                        )}

                        {/* Render Block HTML */}
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />

                        {/* Attempt to execute Global JavaScript (with caveats) */}
                        {yamlData.global?.js && (
                            <script dangerouslySetInnerHTML={{ __html: yamlData.global.js }} />
                        )}

                        {/* Attempt to execute Block-Specific JavaScript (with caveats) */}
                        {block.js && (
                            <script dangerouslySetInnerHTML={{ __html: block.js }} />
                        )}

                        {hoveredBlock === block.name && (
                            <div
                                className="edit-overlay absolute top-0 right-0 p-2 flex flex-column align-items-end gap-2 z-1000"
                                style={{ zIndex: 1000 }}
                            >
                                {block.feedback && (
                                    <>
                                        <span
                                            className="p-tag p-tag-info border-round-sm text-sm font-normal cursor-help feedback-tooltip-target"
                                            data-pr-tooltip={block.feedback}
                                            data-pr-position="left"
                                            style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                            {block.feedback}
                                        </span>
                                        <Tooltip target=".feedback-tooltip-target" />
                                    </>
                                )}
                                <Button
                                    icon="pi pi-pencil"
                                    className="p-button-rounded p-button-secondary"
                                    onClick={() => openEditDialog(block)}
                                    tooltip={`Edit ${block.name}`}
                                    tooltipOptions={{ position: 'left' }}
                                    style={{ zIndex: 1001 }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* AI Editor Dialog remains outside the preview container */}
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
