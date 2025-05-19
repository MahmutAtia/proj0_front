import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const ArrayField = ({ values, onChange, onAdd, onRemove, placeholder }) => {
  return (
    <div className="flex flex-column gap-3 p-4 border-1 surface-border border-round-xl surface-ground">
      {values.map((value, index) => (
        <div key={index} className="flex align-items-center gap-2">
          <div className="flex-1">
            <InputText
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(index, e)}
              className="w-full"
            />
          </div>
          <Button
            icon="pi pi-minus"
            severity="danger"
            rounded
            size="small"
            onClick={() => onRemove(index)}
            className="flex-none"
          />
        </div>
      ))}
      <div className="flex justify-content-end">
        <Button
          icon="pi pi-plus"
          severity="success"
          rounded
          size="small"
          onClick={onAdd}
          className="flex-none"
        />
      </div>
    </div>
  );
};

export default ArrayField;
