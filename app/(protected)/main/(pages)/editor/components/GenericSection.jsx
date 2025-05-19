import React, { useState, useRef } from 'react';
import { useResume } from '../ResumeContext';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';


const ARRAY_FIELDS = [
    'technologies', 'relevant_courses', 'keywords', 'authors',
    'inventors', 'duties', 'awards', 'benefits', 'publications',
    'collaborators'
];


const GenericSection = ({ sectionKey }) => {
    const toast = useRef(null);
    const { data, setData, editMode, toggleEditMode, removeSectionItem, getDefaultItem } = useResume();
    const items = Array.isArray(data[sectionKey]) ? data[sectionKey] : [];
    const [newItemIndex, setNewItemIndex] = useState(null);
    const firstItemRef = useRef(null);
    const lastItemRef = useRef(null);
    const historyRef = useRef([]);

    const isItemEditing = (index) => editMode[sectionKey]?.[index];

    const isArrayField = (fieldName) => ARRAY_FIELDS.includes(fieldName);
    // if the fieldName has date in it
    const isDateField = (fieldName) => fieldName.toLowerCase().includes('date');
    // if the fieldName has description in it
    const isMultilineField = (fieldName) => fieldName.toLowerCase().includes('description');
    // Get field structure from first item or default data
    const getEmptyItem = () => {
        const template = items[0] || getDefaultItem(sectionKey);
        return Object.keys(template).reduce((acc, key) => {
            acc[key] = Array.isArray(template[key]) ? [] : '';
            return acc;
        }, {});
    };

    const addItem = () => {
        const newIndex = items.length;
        const newItem = getEmptyItem();

        const newData = { ...data };
        newData[sectionKey] = [...items, newItem];
        setData(newData);
        setNewItemIndex(newIndex);
        toggleEditMode(sectionKey, items.length);

        setTimeout(() => {
            lastItemRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    };


    const handleInputChange = (index, field, value) => {
        // Save current state before changes
        if (!historyRef.current[index]) {
            historyRef.current[index] = [];
        }

        // Store complete current state
        const currentState = { ...data[sectionKey][index] };
        console.log('currentState', currentState);
        historyRef.current[index].push(currentState);

        // Update data
        const newData = { ...data };
        newData[sectionKey][index] = {
            ...newData[sectionKey][index],
            [field]: value
        };
        setData(newData);
    };
    const renderFields = (item, index) => {
        const fields = Object.keys(item).filter(key => key !== 'id'); // Filter out the 'id' field
        if (isItemEditing(index)) {
            return (
                <div className="flex flex-column gap-3">
                    {fields.map((field) => (
                        <div key={field}>
                            {renderEditField(item, index, field)}
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="flex flex-column gap-2">
                {fields.map((field) => (
                    <div key={field} className="flex justify-content-between">
                        {/* <span className="font-semibold">{field.replace('_', ' ').charAt(0).toUpperCase() + field.slice(1)}:</span> */}
                        {renderViewField(item, field)}
                    </div>
                ))}
            </div>
        );
    };


    // Add these helper methods
    const handleArrayFieldChange = (index, field, valueIndex, value) => {
        const newData = { ...data };
        newData[sectionKey][index][field][valueIndex] = value;
        setData(newData);
    };

    const addArrayItem = (index, field) => {
        const newData = { ...data };
        if (!Array.isArray(newData[sectionKey][index][field])) {
            newData[sectionKey][index][field] = [];
        }
        newData[sectionKey][index][field].push('');
        setData(newData);
    };

    const removeArrayItem = (index, field, valueIndex) => {
        const newData = { ...data };
        newData[sectionKey][index][field].splice(valueIndex, 1);
        setData(newData);
    };



    const renderEditField = (item, index, field) => {

        const label = field.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        if (isArrayField(field)) {
            return (
                <div className="flex flex-column gap-2">
                    <label>{label}</label>
                    <div className="flex flex-wrap gap-2">
                        {item[field]?.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex align-items-center gap-2">
                                <InputText
                                    value={value}
                                    onChange={(e) => handleArrayFieldChange(index, field, valueIndex, e.target.value)}
                                    className="w-8rem"
                                />
                                <Button
                                    icon="pi pi-times"
                                    className="p-button-rounded p-button-text p-button-danger"
                                    onClick={() => removeArrayItem(index, field, valueIndex)}
                                />
                            </div>
                        ))}
                        <Button
                            icon="pi pi-plus"
                            className="p-button-rounded p-button-text"
                            onClick={() => addArrayItem(index, field)}
                            tooltip={`Add ${field.replace('_', ' ')}`}
                        />
                    </div>
                </div>
            );
        }

        if (isDateField(field)) {
            return (
                <Calendar
                    placeholder={label}
                    value={item[field]}
                    onChange={(e) => handleInputChange(index, field, e.value)}
                    className="w-full"
                    monthNavigator
                    yearNavigator
                    yearRange="1900:2030"
                />
            );
        }

        if (isMultilineField(field)) {
            return (
                <InputTextarea
                    placeholder={label}
                    value={item[field]}
                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                    rows={3}
                    className="w-full"
                />
            );
        }

        return (
            <InputText
                placeholder={label}
                value={item[field]}
                onChange={(e) => handleInputChange(index, field, e.target.value)}
                className="w-full"
            />
        );
    };

    const renderViewField = (item, field) => {
        // Guard against null/undefined
        if (!item[field]) return null;

        // Handle complex objects
        const value = item[field];
        if (typeof value === 'object' && !Array.isArray(value)) {
            console.log('value', value);
            // If object has name property, use it
            if (value.name) return <span>{value.name}</span>;
            // If object has text/description property, use it
            if (value.text || value.description) return <span>{value.text || value.description}</span>;
            // Fallback to stringify
            return <span>{JSON.stringify(value)}</span>;
        }
        if (isArrayField(field) && Array.isArray(item[field])) {
            return (
                <div className="flex flex-wrap gap-2">
                    {item[field].map((value, index) => (
                        <span key={index} className="surface-200 text-700 border-round px-2 py-1">
                            {value}
                        </span>
                    ))}
                </div>
            );
        }

        if (isDateField(field) && item[field]) {
            return <span className="text-500">{new Date(item[field]).toLocaleDateString()}</span>;
        }

        if (isMultilineField(field)) {
            return <div style={{ whiteSpace: 'pre-line' }} className="text-700 line-height-4">{item[field]}</div>;
        }

        // Make first field bold
        if (field === Object.keys(item)[0]) {
            return <span className="font-semibold">{item[field]}</span>;
        }

        return <span className="text-primary">{item[field]}</span>;
    };


    const handleUndo = (index) => {
        if (historyRef.current[index]?.length > 0) {
            // Get previous state without JSON parsing
            const previousState = historyRef.current[index].pop();

            // Update data with previous state
            const newData = { ...data };
            newData[sectionKey][index] = previousState;
            setData(newData);

            toast.current.show({
                severity: 'info',
                summary: 'Undo',
                detail: 'Previous state restored'
            });
        }
    };


    const handleDelete = (index) => {
        if (isItemEditing(index)) {
            toggleEditMode(sectionKey, index);
        }
        removeSectionItem(sectionKey, index);

        setTimeout(() => {
            if (firstItemRef.current) {
                firstItemRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);

        toast.current.show({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Item has been removed'
        });
    };
    const handleAIUpdate = async (index, item) => {
        try {
            // Initialize history
            if (!historyRef.current[index]) {
                historyRef.current[index] = [];
            }

            // Store current state
            const currentState = { ...data[sectionKey][index] };
            historyRef.current[index].push(currentState);

            // Preserve field order by using template
            const template = getDefaultItem(sectionKey);
            const orderedItem = Object.keys(template).reduce((acc, key) => {
                acc[key] = item[key] || '';
                return acc;
            }, {});

            // Update data with ordered fields
            const newData = { ...data };
            newData[sectionKey][index] = orderedItem;
            setData(newData);

            toast.current.show({
                severity: 'success',
                summary: 'AI Updated',
                detail: 'Content has been updated'
            });
        } catch (error) {
            console.error('AI Update Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Failed to update content'
            });
        }
    };

    return (
        <SectionWrapper title={sectionKey.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')} onAdd={addItem} toast={toast}>
            {items.map((item, index) => (
                <ItemWrapper
                    key={index}
                    sectionTitle={sectionKey.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    itemRef={index === 0 ? firstItemRef : index === items.length - 1 ? lastItemRef : null}
                    isNewItem={index === newItemIndex}
                    isEditing={isItemEditing(index)}
                    onEdit={() => toggleEditMode(sectionKey, index)}
                    onUndo={() => handleUndo(index)}
                    onAIUpdate={(updatedData) => handleAIUpdate(index, updatedData)}
                    canUndo={historyRef.current[index]?.length > 0} sectionData={item}
                    onDelete={() => handleDelete(index)}

                    editContent={
                        <div className="flex flex-column gap-3">
                            {renderFields(item, index)}
                        </div>
                    }
                    viewContent={
                        <div className="flex flex-column gap-2">
                            {renderFields(item, index)}
                        </div>
                    }
                />
            ))}
        </SectionWrapper>
    );
};

export default GenericSection;
