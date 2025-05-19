import React from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

const SectionWrapper = ({ title, onAdd, children, toast }) => {
    return (
        <div className="surface-card p-4 border-round-xl shadow-2">
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-3">
                <h2 className="text-xl font-semibold m-0">{title}</h2>
                <Button
                    icon="pi pi-plus"
                    className="p-button-rounded p-button-success"
                    onClick={onAdd}
                    tooltip={`Add ${title}`}
                />
            </div>
            <div className="flex flex-column gap-4 mt-3">
                {children}
            </div>
        </div>
    );
};

export default SectionWrapper;
