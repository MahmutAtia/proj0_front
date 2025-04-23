'use client';
import React from 'react';
import Feature from './Feature'; 

const   FeaturesSection = () => {
    const featuresData = [
        {
            icon: 'pi-users',
            iconBgColor: 'bg-yellow-200',
            iconColor: 'text-yellow-700',
            title: 'Easy to Use',
            description: 'Posuere morbi leo urna molestie.',
            gradient: 'linear-gradient(90deg, rgba(253, 228, 165, 0.2), rgba(187, 199, 205, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2), rgba(187, 199, 205, 0.2))',
        },
        {
            icon: 'pi-palette',
            iconBgColor: 'bg-cyan-200',
            iconColor: 'text-cyan-700',
            title: 'Fresh Design',
            description: 'Semper risus in hendrerit.',
            gradient: 'linear-gradient(90deg, rgba(145,226,237,0.2),rgba(251, 199, 145, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2), rgba(172, 180, 223, 0.2))',
        },
        {
            icon: 'pi-map',
            iconBgColor: 'bg-indigo-200',
            iconColor: 'text-indigo-700',
            title: 'Well Documented',
            description: 'Non arcu risus quis varius quam quisque.',
            gradient: 'linear-gradient(90deg, rgba(145, 226, 237, 0.2), rgba(172, 180, 223, 0.2)), linear-gradient(180deg, rgba(172, 180, 223, 0.2), rgba(246, 158, 188, 0.2))',
        },
        {
            icon: 'pi-id-card',
            iconBgColor: 'bg-bluegray-200',
            iconColor: 'text-bluegray-700',
            title: 'Responsive Layout',
            description: 'Nulla malesuada pellentesque elit.',
            gradient: 'linear-gradient(90deg, rgba(187, 199, 205, 0.2),rgba(251, 199, 145, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2),rgba(145, 210, 204, 0.2))',
        },
        {
            icon: 'pi-star',
            iconBgColor: 'bg-orange-200',
            iconColor: 'text-orange-700',
            title: 'Clean Code',
            description: 'Condimentum lacinia quis vel eros.',
            gradient: 'linear-gradient(90deg, rgba(187, 199, 205, 0.2),rgba(246, 158, 188, 0.2)), linear-gradient(180deg, rgba(145, 226, 237, 0.2),rgba(160, 210, 250, 0.2))',
        },
        {
            icon: 'pi-moon',
            iconBgColor: 'bg-pink-200',
            iconColor: 'text-pink-700',
            title: 'Dark Mode',
            description: 'Convallis tellus id interdum velit laoreet.',
            gradient: 'linear-gradient(90deg, rgba(251, 199, 145, 0.2), rgba(246, 158, 188, 0.2)), linear-gradient(180deg, rgba(172, 180, 223, 0.2), rgba(212, 162, 221, 0.2))',
        },
        {
            icon: 'pi-shopping-cart',
            iconBgColor: 'bg-teal-200',
            iconColor: 'text-teal-700',
            title: 'Ready to Use',
            description: 'Mauris sit amet massa vitae.',
            gradient: 'linear-gradient(90deg, rgba(145, 210, 204, 0.2), rgba(160, 210, 250, 0.2)), linear-gradient(180deg, rgba(187, 199, 205, 0.2), rgba(145, 210, 204, 0.2))',
        },
        {
            icon: 'pi-globe',
            iconBgColor: 'bg-blue-200',
            iconColor: 'text-blue-700',
            title: 'Modern Practices',
            description: 'Elementum nibh tellus molestie nunc non.',
            gradient: 'linear-gradient(90deg, rgba(145, 210, 204, 0.2), rgba(212, 162, 221, 0.2)), linear-gradient(180deg, rgba(251, 199, 145, 0.2), rgba(160, 210, 250, 0.2))',
        },
        {
            icon: 'pi-eye',
            iconBgColor: 'bg-purple-200',
            iconColor: 'text-purple-700',
            title: 'Privacy',
            description: 'Neque egestas congue quisque.',
            gradient: 'linear-gradient(90deg, rgba(160, 210, 250, 0.2), rgba(212, 162, 221, 0.2)), linear-gradient(180deg, rgba(246, 158, 188, 0.2), rgba(212, 162, 221, 0.2))',
        },
    ];
    

    return (
        <div id="features" className="py-4 px-4 lg:px-8 mt-5 mx-0 lg:mx-8">
            <div className="grid justify-content-center">
                <div className="col-12 text-center mt-8 mb-4">
                    <h2 className="text-900 font-normal mb-2">Marvelous Features</h2>
                    <span className="text-600 text-2xl">Placerat in egestas erat...</span>
                </div>

                {featuresData.map((feature, index) => (
                    <div
                        key={index}
                        className="col-12 md:col-12 lg:col-4 p-0 lg:pr-5 lg:pb-5 mt-4 lg:mt-0"
                    >
                        <Feature
                            icon={feature.icon}
                            iconBgColor={feature.iconBgColor}
                            iconColor={feature.iconColor}
                            title={feature.title}
                            description={feature.description}
                            gradient={feature.gradient}
                        />
                    </div>
                ))}

                <div
                    className="col-12 mt-8 mb-8 p-2 md:p-8"
                    style={{
                        borderRadius: '20px',
                        background:
                            'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #EFE1AF 0%, #C3DCFA 100%)',
                    }}
                >
                    <div className="flex flex-column justify-content-center align-items-center text-center px-3 py-3 md:py-0">
                        <h3 className="text-gray-900 mb-2">Joséphine Miller</h3>
                        <span className="text-gray-600 text-2xl">Peak Interactive</span>
                        <p
                            className="text-gray-900 sm:line-height-2 md:line-height-4 text-2xl mt-4"
                            style={{ maxWidth: '800px' }}
                        >
                            “Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.”
                        </p>
                        <img
                            src="/demo/images/landing/peak-logo.svg"
                            className="mt-4"
                            alt="Company logo"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturesSection;
