import React, { useState } from 'react';
import { Button } from 'primereact/button';


// --- Child Component: EditableSection ---
/**
 * A component that wraps a section of the document, providing editing controls.
 * @param {object} props - Component props.
 * @param {string} props.sectionId - Unique identifier for the section (e.g., 'header', 'paragraph-0').
 * @param {Function} props.onEdit - Callback function when the manual edit button is clicked.
 * @param {Function} props.onAiEdit - Callback function when the AI edit button is clicked.
 * @param {Function} props.onUndo - Callback function when the undo button is clicked.
 * @param {Function} props.onRedo - Callback function when the redo button is clicked.
 * @param {boolean} props.canUndo - Whether the undo action is currently possible for this section.
 * @param {boolean} props.canRedo - Whether the redo action is currently possible for this section.
 * @param {React.ReactNode} props.children - The content to be rendered within the editable section (usually an iframe).
 */
const EditableSection = ({
    sectionId,
    onEdit,
    onAiEdit,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    children
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="editable-section relative mb-2" // Add margin-bottom for spacing
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ outline: isHovered ? '2px dashed var(--primary-color)' : 'none', transition: 'outline-color 0.2s' }}
        >
            {/* Render the actual content (iframe) */}
            {children}

            {/* Overlay controls shown on hover */}
            {isHovered && (
                <div
                    className="edit-overlay absolute top-0 right-0 p-1 flex flex-column align-items-end gap-1 bg-black-alpha-10 border-round-sm" // Subtle background
                    style={{ zIndex: 10 }} // Ensure controls are above iframe
                >
                    <div className="flex gap-1">
                         {/* AI Edit Button */}
                         <Button
                            icon="pi pi-sparkles"
                            className="p-button-rounded p-button-info p-button-sm"
                            onClick={onAiEdit}
                            tooltip={`AI Edit ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Manual Edit Button */}
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onEdit}
                            tooltip={`Edit ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Undo Button */}
                        <Button
                            icon="pi pi-undo"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onUndo}
                            disabled={!canUndo}
                            tooltip={`Undo ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                        {/* Redo Button */}
                        <Button
                            icon="pi pi-redo"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={onRedo}
                            disabled={!canRedo}
                            tooltip={`Redo ${sectionId}`}
                            tooltipOptions={{ position: 'left', showDelay: 500 }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Export the EditableSection component ---
export default EditableSection;
