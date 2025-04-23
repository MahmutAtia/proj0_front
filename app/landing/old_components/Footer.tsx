import React from 'react';
import FooterLinkSection from './FooterLinkSection';
import Link from 'next/link';

const Footer: React.FC<{ layoutConfig: any }> = ({ layoutConfig }) => {
    const footerLinks = [
        {
            title: 'Company',
            links: [
                { label: 'About Us', href: '/' },
                { label: 'News', href: '/' },
                { label: 'Investor Relations', href: '/' },
                { label: 'Careers', href: '/' },
                { label: 'Media Kit', href: '/' }
            ]
        },
        {
            title: 'Resources',
            links: [
                { label: 'Get Started', href: '/' },
                { label: 'Learn', href: '/' },
                { label: 'Case Studies', href: '/' }
            ]
        },
        {
            title: 'Community',
            links: [
                { label: 'Discord', href: '/' },
                { label: 'Events', href: '/', newBadge: true },
                { label: 'FAQ', href: '/' },
                { label: 'Blog', href: '/' }
            ]
        },
        {
            title: 'Legal',
            links: [
                { label: 'Brand Policy', href: '/' },
                { label: 'Privacy Policy', href: '/' },
                { label: 'Terms of Service', href: '/' }
            ]
        }
    ];

    return (
        <div className="py-4 px-4 mx-0 mt-8 lg:mx-8">
            <div className="grid justify-content-between">
                <div className="col-12 md:col-2" style={{ marginTop: '-1.5rem' }}>
                    <Link href="/" className="flex flex-wrap align-items-center justify-content-center md:justify-content-start md:mb-0 mb-3 cursor-pointer">
                        <img src={`/layout/images/${layoutConfig.colorScheme === 'light' ? 'logo-dark' : 'logo-white'}.svg`} alt="footer sections" width="50" height="50" className="mr-2" />
                        <span className="font-medium text-3xl text-900">SAKAI</span>
                    </Link>
                </div>

                <div className="col-12 md:col-10 lg:col-7">
                    <div className="grid text-center md:text-left">
                        {footerLinks.map((section, index) => (
                            <FooterLinkSection key={index} title={section.title} links={section.links} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;