"use client"; // This component is a client component

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles } from "react-icons/io5";
import { FiMenu, FiX, FiArrowRight, FiAlertTriangle } from 'react-icons/fi'; // Added FiAlertTriangle
import { smoothScrollTo } from '../utils'; // Adjust path as necessary
import styles from '../styles/Header.module.css'; // Import CSS Module

// Animation Variants
const buttonHoverTap = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
};
const mobileMenuVariant = {
    hidden: { opacity: 0, height: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
};
// Tooltip animation
const tooltipVariant = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } }
};
// Subtle pulse/glow for the special link on hover
const specialLinkHover = {
    hover: { scale: 1.05, textShadow: "0 0 8px rgba(88, 28, 135, 0.5)", transition: { duration: 0.3 } }
};
// --- Updated: Auto-pulse animation for the special link ---
const autoPulse = {
    scale: [1, 1.04, 1], // Slightly larger scale
    transition: {
        duration: 1.3, // Slightly faster cycle
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.8, // Slightly shorter delay
    }
};

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [tooltipText, setTooltipText] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout[]>([]);

    // Sticky Logic
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50); // Threshold
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Updated ATS Tooltip Explanation ---
    const fullExplanation = "ATS = Robot Recruiter 🤖 Scans resumes. Miss keywords? 💨 Ignored! 👉 Click me to check yours! ✅";
    const wordDelay = 100;

    useEffect(() => {
        // Function to clear timeouts
        const clearTimeouts = () => {
            timeoutRef.current.forEach(clearTimeout);
            timeoutRef.current = [];
        };

        if (isTooltipVisible) {
            clearTimeouts(); // Clear any existing timeouts
            const words = fullExplanation.split(' ');
            let currentText = '';
            setTooltipText(''); // Reset text immediately

            words.forEach((word, index) => {
                const timeoutId = setTimeout(() => {
                    // Check if still visible before updating state
                    if (timeoutRef.current.includes(timeoutId)) {
                         currentText += (index > 0 ? ' ' : '') + word;
                         setTooltipText(currentText);
                    }
                }, index * wordDelay);
                timeoutRef.current.push(timeoutId);
            });
        } else {
            // Clear timeouts immediately on mouse leave
            clearTimeouts();
        }

        // Cleanup function on component unmount or if isTooltipVisible changes again
        return clearTimeouts;
    }, [isTooltipVisible]); // Re-run effect when visibility changes

    const navItems = [
        { label: 'The Struggle', targetId: 'struggle' },
        { label: 'Your Edge', targetId: 'features' },
        { label: 'How It Works', targetId: 'how-it-works' },
        { label: 'Pricing', targetId: 'pricing' },
        { label: 'ATS Check ✨', targetId: 'ats-checker', special: true },
    ];

    const handleNavClick = (targetId: string) => {
        setIsOpen(false);
        smoothScrollTo(targetId);
    };

    const handleATSHoverEnter = () => setIsTooltipVisible(true);
    const handleATSHoverLeave = () => setIsTooltipVisible(false);

    return (
        <>
            <motion.header
                className={`${styles.siteHeader} ${isSticky ? styles.isSticky : ''}`}
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className={`container ${styles.headerContainer}`}>
                    {/* Logo */}
                    <Link href="/" passHref legacyBehavior>
                       <a className={styles.logo}>
                            <div className={styles.logoIconContainer}>
                                <IoSparkles className={styles.logoIcon} />
                            </div>
                            <span className={styles.logoText}>CareerFlow</span>
                       </a>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className={styles.desktopNav}>
                        <ul>
                            {navItems.map((item) => (
                                <li key={item.label} style={{ position: 'relative' }}>
                                    <motion.button
                                        onClick={() => handleNavClick(item.targetId)}
                                        className={`${styles.navLink} ${item.special ? styles.special : ''}`}
                                        onMouseEnter={item.targetId === 'ats-checker' ? handleATSHoverEnter : undefined}
                                        onMouseLeave={item.targetId === 'ats-checker' ? handleATSHoverLeave : undefined}
                                        // Combine hover and auto-pulse animations
                                        variants={item.special ? specialLinkHover : {}}
                                        whileHover="hover"
                                        // Apply auto-pulse only to the special link
                                        animate={item.special ? autoPulse : {}}
                                    >
                                        {item.label}
                                    </motion.button>
                                    {/* --- ATS Tooltip --- */}
                                    <AnimatePresence>
                                        {item.targetId === 'ats-checker' && isTooltipVisible && (
                                            <motion.div
                                                className={styles.atsTooltip}
                                                variants={tooltipVariant}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                aria-live="polite"
                                            >
                                                <span className={styles.tooltipPointer}></span>
                                                <div className={styles.tooltipContent}> {/* Wrap text */}
                                                    <strong className={styles.tooltipHeadline}>What&apos;s an ATS? 🤔</strong>
                                                    {tooltipText}
                                                    {tooltipText !== fullExplanation && <span className={styles.blinkingCursor}>|</span>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {/* --- End ATS Tooltip --- */}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Desktop Actions */}
                    <div className={styles.desktopActions}>
                        <Link href="/login" passHref legacyBehavior>
                            <motion.a
                                className="button button-secondary button-sm"
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                Login
                            </motion.a>
                        </Link>
                        <Link href="/ats" passHref legacyBehavior>
                            <motion.a
                                className="button button-primary button-sm"
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                Get Started <FiArrowRight size="1em" style={{ marginLeft: '4px' }}/>
                            </motion.a>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <motion.button
                        className={styles.mobileMenuToggle}
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                        whileTap={{ scale: 0.9 }}
                        animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
                    >
                        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </motion.button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.nav
                            className={styles.mobileNav}
                            key="mobile-menu"
                            variants={mobileMenuVariant}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <ul>
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <button
                                            onClick={() => handleNavClick(item.targetId)}
                                            className={`${styles.navLink} ${item.special ? styles.special : ''}`}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className={styles.mobileActions}>
                                <Link href="/login" passHref legacyBehavior>
                                    <motion.a className="button button-secondary" style={{ width: '100%' }} variants={buttonHoverTap} whileHover="hover" whileTap="tap">Login</motion.a>
                                </Link>
                                <Link href="/signup" passHref legacyBehavior>
                                    <motion.a className="button button-primary" style={{ width: '100%' }} variants={buttonHoverTap} whileHover="hover" whileTap="tap">Get Started Free</motion.a>
                                </Link>
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </motion.header>
        </>
    );
};

export default Header;
