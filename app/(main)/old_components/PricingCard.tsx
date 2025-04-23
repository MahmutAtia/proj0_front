import React from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

interface PricingCardProps {
    title: string;
    price: string;
    features: string[];
    buttonLabel: string;
    imageSrc: string;
    altText: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, buttonLabel, imageSrc, altText }) => {
    return (
        <div className="col-12 lg:col-4 p-0 md:p-3">
            <div className="p-3 flex flex-column border-200 pricing-card cursor-pointer border-2 hover:border-primary transition-duration-300 transition-all">
                <h3 className="text-900 text-center my-5">{title}</h3>
                <img src={imageSrc} className="w-10 h-10 mx-auto" alt={altText} />
                <div className="my-5 text-center">
                    <span className="text-5xl font-bold mr-2 text-900">{price}</span>
                    <span className="text-600">per month</span>
                    <Button label={buttonLabel} rounded className="block mx-auto mt-4 border-none ml-3 font-light line-height-2 bg-blue-500 text-white"></Button>
                </div>
                <Divider className="w-full bg-surface-200"></Divider>
                <ul className="my-5 list-none p-0 flex text-900 flex-column">
                    {features.map((feature, index) => (
                        <li key={index} className="py-2">
                            <i className="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                            <span className="text-xl line-height-3">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PricingCard;