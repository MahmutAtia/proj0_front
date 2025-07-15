import React from 'react';
import SectionWrapper from './SectionWrapper';
import ItemWrapper from './ItemWrapper';

const BaseSection = ({
    type = 'array',
    sectionKey,
    title,
    items,
    renderEditContent,
    renderViewContent,
    onAdd,
    onEdit,
    onDelete,
    onUndo,
    onAIUpdate
}) => {
    if (type === 'single') {
        return (
            <ItemWrapper
                isEditing={items.isEditing}
                onEdit={onEdit}
                onUndo={onUndo}
                onDelete={onDelete}
                onAIUpdate={onAIUpdate}
                sectionData={items}
                editContent={renderEditContent(items)}
                viewContent={renderViewContent(items)}
            />
        );
    }

    return (
        <SectionWrapper title={title} onAdd={onAdd}>
            {items.map((item, index) => (
                <ItemWrapper
                    key={index}
                    isEditing={item.isEditing}
                    onEdit={() => onEdit(index)}
                    onUndo={() => onUndo(index)}
                    onDelete={() => onDelete(index)}
                    onAIUpdate={(data) => onAIUpdate(index, data)}
                    sectionData={item}
                    editContent={renderEditContent(item, index)}
                    viewContent={renderViewContent(item, index)}
                />
            ))}
        </SectionWrapper>
    );
};

export default BaseSection;
