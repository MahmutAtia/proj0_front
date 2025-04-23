'use client';
import React from 'react';

interface FeatureProps {
    icon: string;
    iconBgColor: string;
    iconColor: string;
    title: string;
    description: string;
    gradient: string;
}

const Feature = ({ icon, iconBgColor, iconColor, title, description, gradient }: FeatureProps) => {
    return (
        <div
            style={{
                height: '160px',
                padding: '2px',
                borderRadius: '10px',
                background: gradient
            }}
        >
            <div className="p-3 surface-card h-full" style={{ borderRadius: '8px' }}>
                <div
                    className={`flex align-items-center justify-content-center ${iconBgColor} mb-3`}
                    style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '10px'
                    }}
                >
                    <i className={`pi pi-fw ${icon} text-2xl ${iconColor}`}></i>
                </div>
                <h5 className="mb-2 text-900">{title}</h5>
                <span className="text-600">{description}</span>
            </div>
        </div>
    );
};

export default Feature;
