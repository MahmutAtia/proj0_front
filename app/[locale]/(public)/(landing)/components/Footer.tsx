'use client'; // This component is a client component

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import styles from '../styles/Footer.module.css'; // Import the CSS module
import { useTranslation } from '@/hooks/useTranslation'; // Add translation hook

// --- Framer Motion Variants ---
const buttonHover = {
    hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { scale: 0.9 }
};

// --- Footer ---
const Footer = () => {
    const { t, isRTL } = useTranslation();
    const footerLinkSections = [
        {
            title: t('footer.product'),
            links: [
                { label: t('footer.features'), href: '#features' },
                { label: t('footer.pricing'), href: '#pricing' },
                { label: t('footer.atsChecker'), href: '/ats' },
                { label: t('footer.templates'), href: '#' } // Placeholder href
            ]
        },
        {
            title: t('footer.resources'),
            links: [
                { label: t('footer.blog'), href: '#' },
                { label: t('footer.guides'), href: '#' },
                { label: t('footer.faq'), href: '#' },
                { label: t('footer.support'), href: '#' }
            ]
        },
        {
            title: t('footer.company'),
            links: [
                { label: t('footer.aboutUs'), href: '#' },
                { label: t('footer.careers'), href: '#' },
                { label: t('footer.contact'), href: '#' }
            ]
        },
        {
            title: t('footer.legal'),
            links: [
                { label: t('footer.privacyPolicy'), href: '/privacy' },
                { label: t('footer.termsOfService'), href: '/terms' }
            ]
        }
    ];

    return (
        <footer className={styles.footer}>
            <div className={`${styles.container} ${styles.footerContainer}`}>
                <div className={styles.footerAbout}>
                    <Link href="/" className={styles.logo}>
                        <IoSparkles className={styles.logoIcon} />
                        <span>CareerFlow AI</span>
                    </Link>
                    <p className={styles.aboutText}>{t('footer.tagline')}</p>
                    <div className={styles.socialLinks}>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap">
                            <FaLinkedin />
                        </motion.a>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap">
                            <FaTwitter />
                        </motion.a>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap">
                            <FaGithub />
                        </motion.a>
                    </div>
                </div>

                <div className={styles.footerLinks}>
                    {footerLinkSections.map((section) => (
                        <div key={section.title} className={styles.linkColumn}>
                            <h5>{section.title}</h5>
                            <ul>
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        {link.href === '#' ? (
                                            <span className={styles.disabledLink}>
                                                {link.label}
                                                <span className={styles.comingSoonBadge}>Coming Soon</span>
                                            </span>
                                        ) : (
                                            <Link href={link.href}>{link.label}</Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.footerBottom}>
                <div className={styles.container}>
                    <p className={styles.copyrightText}>
                        {new Date().getFullYear()} {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
