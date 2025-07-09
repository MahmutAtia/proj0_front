"use client"; // This component is a client component

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles } from "react-icons/io5";
import { FiMenu, FiX, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';
import { smoothScrollTo } from '../utils';
import styles from '../styles/Header.module.css';
// from app /components/LanguageSwitcher.tsx

import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import { useTranslation } from '@/app/hooks/useTranslation';

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

// Auto-pulse animation for the special link
const autoPulse = {
    scale: [1, 1.04, 1],
    transition: {
        duration: 1.3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.8,
    }
};

const Header = () => {
    const { t, isRTL } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [tooltipText, setTooltipText] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout[]>([]);

    // Sticky Logic
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50);
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

    // ATS Tooltip Animation
    const fullExplanation = t('header.atsTooltipText');
    const wordDelay = 100;

    useEffect(() => {
        const clearTimeouts = () => {
            timeoutRef.current.forEach(clearTimeout);
            timeoutRef.current = [];
        };

        if (isTooltipVisible) {
            clearTimeouts();
            const words = fullExplanation.split(' ');
            let currentText = '';
            setTooltipText('');

            words.forEach((word: string, index: number) => {
                const timeoutId = setTimeout(() => {
                    if (timeoutRef.current.includes(timeoutId)) {
                        currentText += (index > 0 ? ' ' : '') + word;
                        setTooltipText(currentText);
                    }
                }, index * wordDelay);
                timeoutRef.current.push(timeoutId);
            });
        } else {
            clearTimeouts();
        }

        return clearTimeouts;
    }, [isTooltipVisible, fullExplanation]);

    // Navigation items with translations
    const navItems = [
        { label: t('header.theStruggle'), targetId: 'struggle' },
        { label: t('header.yourEdge'), targetId: 'features' },
        { label: t('header.howItWorks'), targetId: 'how-it-works' },
        { label: t('header.pricing'), targetId: 'pricing' },
        { label: t('header.atsCheck'), targetId: 'ats-checker', special: true },
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
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className={`container ${styles.headerContainer}`}>
                    {/* Logo */}
                    <Link href="/" passHref legacyBehavior>
                       <a className={styles.logo}>
                            <div className={styles.logoIconContainer}>
                                <IoSparkles className={styles.logoIcon} />
                            </div>
                            <span className={styles.logoText}>{t('header.logo')}</span>
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
                                        variants={item.special ? specialLinkHover : {}}
                                        whileHover="hover"
                                        animate={item.special ? autoPulse : {}}
                                    >
                                        {item.label}
                                    </motion.button>
                                    {/* ATS Tooltip */}
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
                                                <div className={styles.tooltipContent}>
                                                    <strong className={styles.tooltipHeadline}>
                                                        {t('header.atsTooltipTitle')}
                                                    </strong>
                                                    {tooltipText}
                                                    {tooltipText !== fullExplanation && <span className={styles.blinkingCursor}>|</span>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Desktop Actions */}
                    <div className={styles.desktopActions}>
                        <LanguageSwitcher />
                        <Link href="/login" passHref legacyBehavior>
                            <motion.a
                                className="button button-secondary button-sm"
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                {t('header.login')}
                            </motion.a>
                        </Link>
                        <Link href="/ats" passHref legacyBehavior>
                            <motion.a
                                className="button button-primary button-sm"
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                {t('header.getStarted')}
                                {!isRTL ? (
                                    <FiArrowRight size="1em" style={{ marginLeft: '4px' }}/>
                                ) : (
                                    <FiArrowRight size="1em" style={{ marginRight: '4px', transform: 'scaleX(-1)' }}/>
                                )}
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
                                <LanguageSwitcher />
                                <Link href="/login" passHref legacyBehavior>
                                    <motion.a
                                        className="button button-secondary"
                                        style={{ width: '100%' }}
                                        variants={buttonHoverTap}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        {t('header.login')}
                                    </motion.a>
                                </Link>
                                <Link href="/ats" passHref legacyBehavior>
                                    <motion.a
                                        className="button button-primary"
                                        style={{ width: '100%' }}
                                        variants={buttonHoverTap}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        {t('header.getStarted')}
                                    </motion.a>
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
