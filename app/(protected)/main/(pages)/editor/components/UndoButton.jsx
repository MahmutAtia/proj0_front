import React from 'react';
import { Button } from 'primereact/button';

const UndoButton = ({ onUndo, disabled }) => (
    <Button
        icon="pi pi-undo"
        className="p-button-rounded p-button-text"
        onClick={onUndo}
        disabled={disabled}
        tooltip="Undo"
    />
);

export default UndoButton;
