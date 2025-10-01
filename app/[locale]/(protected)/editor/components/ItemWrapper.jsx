import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useState } from 'react';
import { aiApi } from '@/lib/axios';
import AIAssistant from './AIAssistant';
import { useResume } from '../ResumeContext';

const ItemWrapper = ({
    sectionTitle,
    isEditing,
    onEdit,
    onUndo,
    onDelete,
    canUndo,
    onAIUpdate,
    sectionData,
    editContent,
    viewContent,
    itemRef,
    isNewItem,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    itemId // <-- Use itemId prop
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const { aboutCandidate, toggleItemVisibility } = useResume(); // <-- Get toggle function

    const handleAISubmit = async () => {
        setIsAIProcessing(true);
        try {
            const response = await aiApi.post("/resumes-v2/edit_section", {
                prompt: aiPrompt,
                sectionData: sectionData,
                sectionTitle: sectionTitle,
                aboutCandidate: aboutCandidate
            });
            const data = response.data;
            onAIUpdate(data);
            setAiPrompt('');
        } catch (error) {
            console.error(error);
        }
        setIsAIProcessing(false);
    };

    const dialogHeader = (
        <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
            <h2 className="text-xl font-semibold m-0">
                Edit {sectionTitle}
            </h2>
        </div>
    );

    const itemIsHidden = sectionData && sectionData.hidden;

    return (
        <div
            ref={itemRef}
            className={`relative scroll-mt-[100px] ${isNewItem ? 'animate-fadeIn' : ''}`}
        >
            <div className={`surface-card p-3 border-1 surface-border border-round shadow-1 hover:shadow-3 transition-shadow ${itemIsHidden ? 'opacity-50 bg-surface-100' : ''}`}>
                <ConfirmDialog />
                <div className="flex justify-content-between align-items-center mb-3">
                    <div className="flex align-items-center">
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-text tour-edit-section"
                            onClick={onEdit}
                            tooltip="Edit Section"
                        />
                         {itemId && ( // <-- Check if itemId exists
                            <Button
                                icon={itemIsHidden ? "pi pi-eye-slash" : "pi pi-eye"}
                                className="p-button-rounded p-button-text p-button-secondary"
                                onClick={() => toggleItemVisibility(sectionTitle.toLowerCase(), itemId)}
                                tooltip={itemIsHidden ? "Show Item" : "Hide Item"}
                            />
                        )}
                    </div>
                    <div className="flex align-items-center gap-1">
                         <Button
                            icon="pi pi-arrow-up"
                            className="p-button-rounded p-button-text p-button-secondary tour-sort-items"
                            onClick={onMoveUp}
                            disabled={isFirst}
                            tooltip="Move Up"
                        />
                        <Button
                            icon="pi pi-arrow-down"
                            className="p-button-rounded p-button-text p-button-secondary"
                            onClick={onMoveDown}
                            disabled={isLast}
                            tooltip="Move Down"
                        />
                        <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-danger p-button-text tour-delete-section"
                            onClick={() => setShowDeleteDialog(true)}
                            tooltip="Delete Section"
                        />
                    </div>
                </div>

                {itemIsHidden && (
                    <div className="text-center p-2 mb-3 bg-gray-100 text-gray-700 border-round text-sm">
                        <i className="pi pi-eye-slash mr-2"></i>
                        Item is hidden and will not be shown in the final document.
                    </div>
                )}

                {viewContent}

                <Dialog
                    visible={isEditing}
                    onHide={onEdit}
                    style={{ width: "min(90vw, 800px)" }}
                    dismissableMask
                    className="resume-editor-dialog"
                    header={dialogHeader}
                >
                    <div className="flex flex-column h-full">
                        {/* Scrollable Chat-like Edit Section */}
                        <div className="flex flex-column gap-3 flex-grow-1 overflow-auto p-3 surface-0 border-round">
                            {/* Edit Content (Messages) */}
                            <div className="flex flex-column gap-3">
                                {editContent}
                            </div>
                        </div>

                        {/* Sticky AI Assistant and Undo Button at the Bottom */}
                        <div className="sticky bottom-0 bg-surface-0 border-top-1 surface-border pt-3">
                            <div className="flex align-items-center justify-content-between gap-2 p-3">
                                <div className="flex-grow-1 tour-ai-edit">
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
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    tooltip="Undo"
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>
                <ConfirmDialog
                    visible={showDeleteDialog}
                    onHide={() => setShowDeleteDialog(false)}
                    message="Are you sure you want to delete this section?"
                    header="Confirm Deletion"
                    icon="pi pi-exclamation-triangle"
                    acceptClassName="p-button-danger"
                    accept={onDelete}
                    reject={() => setShowDeleteDialog(false)}
                />
            </div>
        </div>
    );
};

export default ItemWrapper;
