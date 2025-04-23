"use client"; // This component is a client component

import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield } from 'react-icons/fi';
import styles from '../styles/HeroSection.module.css'; // Import CSS Module

// Animation Variants (Keep existing variants)
const staggerContainer = (staggerChildren, delayChildren) => ({
    hidden: {},
    visible: {
        transition: { staggerChildren, delayChildren: delayChildren || 0 },
    },
});

const fadeInUp = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const buttonHoverTap = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
};

const HeroSection = () => {
    return (
        <section id="hero" className={`${styles.heroSection} section-padding`}>
            <div className={`container ${styles.heroContainer}`}>
                <motion.div
                    className={styles.heroContent}
                    variants={staggerContainer(0.15, 0.1)}
                    initial="hidden"
                    animate="visible"
                >
                    {/* --- Revised H1 --- */}
                    <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                        Land Your Dream Job, <span className={styles.highlightGradient}>Not the Spam Folder</span>.
                    </motion.h1>
                    {/* --- Revised Subtitle --- */}
                    <motion.p variants={fadeInUp} className={styles.heroSubtitle}>
                        Craft ATS-beating resumes and stunning portfolios with AI assistance. Turn applications into interviews.
                    </motion.p>
                    {/* --- Revised Paragraph --- */}
                    <motion.p variants={fadeInUp} className={styles.heroParagraph}>
                        Tired of the application black hole? Your skills deserve to be seen. CareerFlow AI helps you build compelling applications that stand out to recruiters and pass the bots.
                    </motion.p>
                    <motion.div variants={fadeInUp} className={styles.heroActions}>
                        {/* --- Buttons remain the same, text is clear --- */}
                        <motion.button
                           className={`button button-primary ${styles.heroButton}`}
                           variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                        >
                            Start My Free AI Resume <FiArrowRight size="1.1em" />
                        </motion.button>
                        <motion.button
                           className={`button button-secondary ${styles.heroButton}`}
                           variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                        >
                            Check My ATS Score <FiShield size="1.1em" />
                        </motion.button>
                    </motion.div>
                </motion.div>
                {/* --- Updated Image --- */}
                <motion.div
                    className={styles.heroImageContainer}
                    initial={{ opacity: 0, scale: 0.9, x: 50 }} // Slightly different entry
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }} // Adjusted delay
                >
                    <img
                        // --- New Image Source ---
                        src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Professionals collaborating and achieving career success with technology"
                        loading="eager"
                        width="1740" // Adjust width/height based on image aspect ratio if needed
                        height="1160"
                        className={styles.heroImage}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
