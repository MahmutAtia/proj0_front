import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles } from "react-icons/io5";
import { FiMenu, FiX, FiArrowRight } from 'react-icons/fi';
import { smoothScrollTo } from '../utils'; // Adjust path as necessary
import styles from '../styles/Header.module.css'; // Import CSS Module

// Simplified Animation Variants
const buttonHoverTap = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
};
const mobileMenuVariant = {
    hidden: { opacity: 0, height: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
};

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    // const headerRef = useRef<HTMLDivElement>(null); // Keep if needed for height calc

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

    return (
        <>
            {/* Use CSS Module classes */}
            <motion.header
                // ref={headerRef}
                className={`${styles.siteHeader} ${isSticky ? styles.isSticky : ''}`}
                initial={{ y: -80 }} // Start based on approx height
                animate={{ y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className={`container ${styles.headerContainer}`}>
                    {/* Logo - Simplified */}
                    <Link href="/" passHref legacyBehavior>
                       <a className={styles.logo}>
                            <div className={styles.logoIconContainer}>
                                <IoSparkles className={styles.logoIcon} />
                            </div>
                            <span className={styles.logoText}>CareerFlow</span> {/* Shortened Name? */}
                       </a>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className={styles.desktopNav}>
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
                    </nav>

                    {/* Desktop Actions */}
                    <div className={styles.desktopActions}>
                        <Link href="/login" passHref legacyBehavior>
                            <motion.a
                                className="button button-secondary button-sm" // Use global button styles
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                Login
                            </motion.a>
                        </Link>
                        <Link href="/signup" passHref legacyBehavior>
                            <motion.a
                                className="button button-primary button-sm" // Use global button styles
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
