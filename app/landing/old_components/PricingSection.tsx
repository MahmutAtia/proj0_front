import React from 'react';
import PricingCard from './PricingCard';

const PricingSection: React.FC = () => {
    const pricingPlans = [
        {
            title: 'Free',
            price: '$0',
            features: ['Responsive Layout', 'Unlimited Push Messages', '50 Support Ticket'],
            buttonLabel: 'Get Started',
            imageSrc: '/demo/images/landing/free.svg',
            altText: 'free'
        },
        {
            title: 'Pro',
            price: '$29',
            features: ['Responsive Layout', 'Unlimited Push Messages', 'Priority Support'],
            buttonLabel: 'Get Started',
            imageSrc: '/demo/images/landing/startup.svg',
            altText: 'pro'
        },
        {
            title: 'Enterprise',
            price: '$99',
            features: ['Responsive Layout', 'Unlimited Push Messages', 'Dedicated Support'],
            buttonLabel: 'Get Started',
            imageSrc: '/demo/images/landing/enterprise.svg',
            altText: 'enterprise'
        }
    ];

    return (
        <div id="pricing" className="py-4 px-4 lg:px-8 my-2 md:my-4">
            <div className="text-center">
                <h2 className="text-900 font-normal mb-2">Matchless Pricing</h2>
                <span className="text-600 text-2xl">Amet consectetur adipiscing elit...</span>
            </div>

            <div className="grid justify-content-between mt-8 md:mt-0">
                {pricingPlans.map((plan, index) => (
                    <PricingCard
                        key={index}
                        title={plan.title}
                        price={plan.price}
                        features={plan.features}
                        buttonLabel={plan.buttonLabel}
                        imageSrc={plan.imageSrc}
                        altText={plan.altText}
                    />
                ))}
            </div>
        </div>
    );
};

export default PricingSection;
