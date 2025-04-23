import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import styles from '../styles/Footer.module.css'; // Import the CSS module

// --- Framer Motion Variants (assuming these are defined elsewhere or pass as props) ---
const buttonHover = { // Assuming this is for social icons
    hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { scale: 0.9 },
};

// --- Footer ---
const Footer = () => {
    const footerLinkSections = [
        {
            title: "Product",
            links: [
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "ATS Checker", href: "#ats-checker" },
                { label: "Templates", href: "#" }, // Placeholder href
            ]
        },
        {
            title: "Resources",
            links: [
                { label: "Blog", href: "#" },
                { label: "Guides", href: "#" },
                { label: "FAQ", href: "#" },
                { label: "Support", href: "#" },
            ]
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Contact", href: "#" },
            ]
        },
        {
            title: "Legal",
            links: [
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
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
                    <p className={styles.aboutText}>
                        Empowering job seekers and students with AI to create opportunities and build brighter futures.
                    </p>
                    <div className={styles.socialLinks}>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap"><FaLinkedin /></motion.a>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap"><FaTwitter /></motion.a>
                        <motion.a href="#" target="_blank" rel="noopener noreferrer" className={styles.socialLink} variants={buttonHover} whileHover="hover" whileTap="tap"><FaGithub /></motion.a>
                    </div>
                </div>

                <div className={styles.footerLinks}>
                    {footerLinkSections.map((section) => (
                        <div key={section.title} className={styles.linkColumn}>
                            <h5>{section.title}</h5>
                            <ul>
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.footerBottom}>
                <div className={styles.container}> {/* Wrap bottom content in container too */}
                    <p className={styles.copyrightText}>
                        © {new Date().getFullYear()} CareerFlow AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; // Make sure to export
