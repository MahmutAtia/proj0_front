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
                    header="Edit Item"
                    footer={
                        <div>
                            <Button label="Cancel" icon="pi pi-times" onClick={onEdit} />
                            <Button label="Save" icon="pi pi-check" onClick={onSave} />
                        </div>
                    }
                >
                    <div className="p-fluid">
                        <div className="p-field">
                            <label htmlFor="itemName">Item Name</label>
                            <InputText
                                id="itemName"
                                value={editedItem.name}
                                onChange={(e) => onInputChange(e, 'name')}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="p-field">
                            <label htmlFor="itemDescription">Description</label>
                            <InputTextarea
                                id="itemDescription"
                                value={editedItem.description}
                                onChange={(e) => onInputChange(e, 'description')}
                                rows={3}
                            />
                        </div>
                        <div className="p-field">
                            <label htmlFor="itemQuantity">Quantity</label>
                            <InputNumber
                                id="itemQuantity"
                                value={editedItem.quantity}
                                onValueChange={(e) => onInputNumberChange(e, 'quantity')}
                                min={1}
                            />
                        </div>
                        <div className="p-field">
                            <label htmlFor="itemPrice">Price</label>
                            <InputNumber
                                id="itemPrice"
                                value={editedItem.price}
                                onValueChange={(e) => onInputNumberChange(e, 'price')}
                                mode="currency"
                                currency="USD"
                                min={0}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    };

    export default YourComponent;