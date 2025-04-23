// filepath: /home/e-kalite/Downloads/sakai-react/app/landing/components/ATSCheckerSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiUploadCloud } from 'react-icons/fi';
import styles from '../styles/ATSCheckerSection.module.css'; // Import the CSS module

// --- Framer Motion Variants (assuming these are defined elsewhere or pass as props) ---
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } },
};

const buttonHover = {
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
    tap: { scale: 0.95 },
};

// --- ATS Checker Section ---
const ATSCheckerSection = () => {
    return (
        <section id="ats-checker" className={`${styles.sectionBgDark} section-padding`}>
            <div className={`${styles.container} ${styles.atsContainer}`}>
                <motion.div
                    className={styles.atsContent}
                    variants={fadeInUp}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    <FiShield className={styles.iconShield} />
                    <h2 className={styles.heading}>
                        Is Your Resume Getting <span className={styles.accentText}>Ghosted by Robots?</span>
                    </h2>
                    <p className={styles.subheading}>
                        Don't guess. Upload your resume now for a 100% FREE, instant ATS compatibility check. Get actionable insights to ensure a human actually sees your application.
                    </p>
                    <motion.button
                        // Combine global button classes with module-specific accent class
                        className={`button ${styles.buttonAccent}`} // Use global .button and module .buttonAccent
                        variants={buttonHover}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        Scan My Resume FREE <FiUploadCloud style={{ marginLeft: '0.5rem' }}/>
                    </motion.button>
                    <p className={styles.disclaimerText}>
                        No tricks, no sign-up required for the scan.
                    </p>
                </motion.div>
                <motion.div
                    className={styles.atsVisual}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    {/* Replace with a relevant visual - maybe a stylized scan/report */}
                    <img
                        src="https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600" // Abstract data/scan visual
                        alt="Visual representation of an ATS resume scan"
                        className={styles.atsImage}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default ATSCheckerSection; // Make sure to export
