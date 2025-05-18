"use client"; // This component is a client component

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiUploadCloud, FiCpu, FiEdit } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import styles from '../styles/HowItWorksSection.module.css'; // Import the CSS module

// --- Framer Motion Variants (assuming these are defined elsewhere or pass as props) ---
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } },
};

// --- How It Works / AI + You Section ---
const HowItWorksSection = () => {
    const scrollRef = useRef(null);
    // Example: Animate background color based on scroll
    const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start end", "end start"] });
    const backgroundColor = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1], // Add more points for smoother transition
        ["var(--bg-light)", "#f3e8ff", "#f3e8ff", "var(--bg-light)"] // bg-light -> light purple -> bg-light
    );

    const steps = [
        { icon: FiUploadCloud, title: "Input & Context", text: "Provide your details, experiences, and the target job/scholarship description. Give the AI the fuel it needs." },
        { icon: FiCpu, title: "AI Magic Drafts", text: "Our AI generates tailored first drafts of resumes, letters, and website content in moments, optimized for ATS and impact." },
        { icon: FiEdit, title: "Refine & Personalize", text: "Use intuitive tools and AI prompts ('Make this sound more confident') to polish, add your unique flair, and make it perfect." }
    ];

    return (
        // Apply motion style directly to the section
        <motion.section
            id="how-it-works"
            className={styles.container}
            ref={scrollRef}
            style={{ backgroundColor }} // Animate background
        >
            <motion.div
                className={`${styles.textCenter} ${styles.marginBottom6}`}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
            >
                <IoSparkles className={styles.iconSparkles} />
                <h2 className={styles.heading}>AI Is Your Co-Pilot, Not the Pilot</h2>
                <p className={styles.subheading}>
                Forget robotic templates. We blend AI&apos;s speed with your unique voice. You&apos;re always in control, crafting applications that are both effective and authentically *you*.                </p>
            </motion.div>

            <div className={styles.howItWorksGrid}>
                {steps.map((step, index) => (
                    <motion.div
                        key={step.title}
                        className={styles.stepCard}
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, amount: 0.3 }} // Trigger animation sooner
                        custom={index} // Pass index for potential stagger delay in variants
                        transition={{ delay: index * 0.1 }} // Simple stagger delay
                    >
                        <div className={styles.stepNumber}>{index + 1}</div>
                        <step.icon className={styles.stepIcon} />
                        <h4 className={styles.stepTitle}>{step.title}</h4>
                        <p className={styles.stepText}>{step.text}</p>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};

export default HowItWorksSection; // Make sure to export
