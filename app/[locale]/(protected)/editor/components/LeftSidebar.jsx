import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ECDH } from 'crypto';

const LeftSidebar = ({
    visible,
    onHide,
    sections,
    onAddSection,
    onReorderSections
}) => {
    const inactiveSections = sections.filter(section => !section.active);
    const activeSections = sections.filter(section => section.active);

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            position="left"
            className="w-25rem"
        >
            <div className="flex flex-column h-full">
                <h2 className="text-xl font-semibold mb-4">Resume Sections</h2>

                <Accordion multiple>
                    <AccordionTab header="Available Sections">
                        <div className="flex flex-column gap-2">
                            {inactiveSections.map(section => (
                                <Button
                                    key={section.key}
                                    label={section.title}
                                    icon="pi pi-plus"
                                    className="p-button-outlined w-full text-left justify-content-start"
                                    onClick={() => onAddSection(section.key)}
                                />
                            ))}
                        </div>
                    </AccordionTab>

                    <AccordionTab header="Active Sections">
                        <DragDropContext
                            onDragEnd={(result) => {
                                if (!result.destination) return;
                                const sourceIdx = result.source.index;
                                const destIdx = result.destination.index;
                                if (sourceIdx !== destIdx) {
                                    onReorderSections(sourceIdx, destIdx);
                                }
                            }}
                        >
                            <Droppable droppableId="active-sections">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex flex-column gap-2"
                                    >
                                        {activeSections.map((section, index) => (
                                            <Draggable
                                                key={section.key}
                                                draggableId={section.key}
                                                index={index}
                                                isDragDisabled={false}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`surface-card p-3 border-round flex align-items-center justify-content-between ${
                                                            snapshot.isDragging ? 'shadow-8' : ''
                                                        }`}
                                                    >
                                                        <span>{section.title}</span>
                                                        <i className="pi pi-bars" />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </AccordionTab>
                </Accordion>
            </div>
        </Sidebar>
    );
};

export default LeftSidebar;
