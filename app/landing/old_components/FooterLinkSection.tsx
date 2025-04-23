import React from 'react';

interface FooterLinkSectionProps {
    title: string;
    links: { label: string; href: string; newBadge?: boolean }[];
}

const FooterLinkSection: React.FC<FooterLinkSectionProps> = ({ title, links }) => {
    return (
        <div className="col-12 md:col-3 mt-4 md:mt-0">
            <h4 className="font-medium text-2xl line-height-3 mb-3 text-900">{title}</h4>
            {links.map((link, index) => (
                <a key={index} className="line-height-3 text-xl block cursor-pointer mb-2 text-700" href={link.href}>
                    {link.label}
                    {link.newBadge && <img src="/demo/images/landing/new-badge.svg" className="ml-2" alt="badge" />}
                </a>
            ))}
        </div>
    );
};

export default FooterLinkSection;