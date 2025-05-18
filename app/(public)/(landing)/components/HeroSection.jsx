"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield } from 'react-icons/fi';
import styles from '../styles/HeroSection.module.css'; // Import CSS Module
import { useRouter } from 'next/navigation'; // Import useRouter

// Animation Variants
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

// --- Enhanced Button Hover/Tap ---
const buttonHoverTap = {
    hover: {
        scale: 1.04, // Slightly larger scale
        boxShadow: "0 5px 15px rgba(88, 28, 135, 0.3)", // Add subtle purple shadow on hover
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.96 }, // Slightly more pronounced tap
};

// --- New: Idle Pulse for Primary Button ---
const primaryButtonPulse = {
    scale: [1, 1.02, 1], // Subtle scale pulse
    transition: {
        duration: 1.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 2.5,
    }
};


const HeroSection = () => {
    const router = useRouter(); // Initialize useRouter

    return (
        <section id="hero" className={`${styles.heroSection} section-padding`}>
            <div className={`container ${styles.heroContainer}`}>
                <motion.div
                    className={styles.heroContent}
                    variants={staggerContainer(0.15, 0.1)}
                    initial="hidden"
                    animate="visible"
                >
                    {/* --- Content remains the same --- */}
                    <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                        Resume <span className={styles.highlightRejected}>Rejected</span>? Again? <br /> Let&apos;s Fix That.
                    </motion.h1>
                    <motion.p variants={fadeInUp} className={styles.heroSubtitle}>
                        Escape the soul-crushing job hunt. Did you know most jobs need a <span className="gradient-text">tailored resume</span> just to pass the bots? We build them *with* you, using AI.
                    </motion.p>
                    <motion.p variants={fadeInUp} className={styles.heroParagraph}>
                        You&apos;re brilliant, skilled, and ready. But your application vanishes into the ATS abyss. It&apos;s not you, it&apos;s the system. CareerFlow AI crafts resumes & portfolios that get you noticed.
                    </motion.p>
                    <motion.div variants={fadeInUp} className={styles.heroActions}>
                        {/* --- Apply new animations --- */}
                        <motion.button
                            className={`button button-primary ${styles.heroButton}`}
                            variants={buttonHoverTap} // Use enhanced hover/tap
                            whileHover="hover"
                            whileTap="tap"
                            animate={primaryButtonPulse} // Add idle pulse animation
                            onClick={() => router.push('/ats')}>
                            Start My Free AI Resume <FiArrowRight size="1.1em" />
                        </motion.button>
                        <motion.button
                            className={`button button-secondary ${styles.heroButton}`}
                            variants={buttonHoverTap} // Use enhanced hover/tap
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => router.push('/ats')}>
                            Check My ATS Score <FiShield size="1.1em" />
                        </motion.button>
                    </motion.div>
                </motion.div>
                {/* --- Image Container remains the same --- */}
                <motion.div
                    className={styles.heroImageContainer}
                    initial={{ opacity: 0, scale: 0.9, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Professionals collaborating and achieving career success with technology"
                        loading="eager"
                        width="1740"
                        height="1160"
                        className={styles.heroImage}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;

