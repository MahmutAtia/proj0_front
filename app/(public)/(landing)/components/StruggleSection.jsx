"use client"; // This component is a client component

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
// Import different / more relevant icons
import { FiXCircle, FiClock, FiEyeOff, FiAlertTriangle, FiTarget, FiThumbsDown } from 'react-icons/fi'; // Added FiEyeOff, FiAlertTriangle, FiTarget
import styles from '../styles/StruggleSection.module.css'; // Import the CSS Module

// Animation Variants (can be moved to a shared file)
const staggerContainer = (staggerChildren) => ({
    hidden: {},
    visible: {
        transition: { staggerChildren: staggerChildren || 0.1, delayChildren: 0 },
    },
});
const fadeInUp = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const StruggleSection = () => {
    const scrollRef = useRef(null);
    // Adjust offset to trigger animations/parallax when the section is more centered
    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start end", "end center"] // Start when bottom hits top, end when top hits center
    });

    // Smoother parallax effect values
    const yFast = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']); // Less extreme
    const ySlow = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);

    // Define Pain Points with adjusted text/icons/colors
    const painPoints = [
        { icon: FiThumbsDown, title: "The Resume Black Hole", text: "Endless applications, deafening silence. Feel like your resume vanishes? It's a common frustration.", colorVar: "var(--danger)" },
        { icon: FiClock, title: "The Time Sink", text: "Constantly tweaking resumes, writing cover letters... Job searching shouldn't consume your entire life.", colorVar: "var(--warning)" },
        { icon: FiEyeOff, title: "The Visibility Problem", text: "Generic resume? No portfolio? Struggling to showcase your unique skills and stand out from the crowd?", colorVar: "var(--primary-light)" },
        { icon: FiAlertTriangle, title: "The ATS Gauntlet", text: "Confused by keywords? Worried about formatting? Getting past the bots feels like a losing battle.", colorVar: "var(--accent)" },
    ];

    return (
        // Assign ref for scroll tracking
        <section id="struggle" className={styles.struggleSection} ref={scrollRef}>
            <div className="container"> {/* Use global container class */}

                {/* Section Header */}
                <motion.div
                    className={styles.header}
                    initial="hidden"
                    whileInView="visible" // Trigger when in view
                    viewport={{ once: true, amount: 0.3 }} // Trigger early
                    variants={fadeInUp}
                >
                    {/* Changed Icon & removed inline style */}
                    <FiAlertTriangle className={styles.headerIcon} />
                    <h2 className={styles.title}>
                        Stuck in the Application <span className={styles.strikethrough}>Abyss?</span>
                    </h2>
                    <p className={styles.subtitle}>
                        You&#39;re qualified, driven, and ready. Yet, the cycle repeats: effort, rejection, doubt. Let&#39;s break free from what&#39;s holding you back.
                    </p>
                </motion.div>

                {/* Pain Points Grid */}
                <motion.div
                    className={styles.struggleGrid}
                    variants={staggerContainer(0.1)} // Slightly faster stagger
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }} // Trigger very early
                >
                    {painPoints.map((point, index) => (
                        <motion.div
                            key={point.title}
                            className={styles.painCard}
                            variants={fadeInUp}
                            style={{
                                y: index % 2 === 0 ? ySlow : yFast, // Apply parallax
                                // Pass the color variable to CSS via custom property
                                '--card-accent-color': point.colorVar
                            }}
                        >
                            {/* Render icon component, styled via CSS */}
                            <point.icon className={styles.painIcon} />
                            <h4 className={styles.painTitle}>{point.title}</h4>
                            <p className={styles.painText}>{point.text}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* "Missing Out" Box */}
                <motion.div
                    className={styles.missingOutBox}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }} // Trigger when ~half visible
                    variants={fadeInUp}
                >
                    {/* Changed Icon */}
                    <FiTarget className={styles.missingOutIcon} />
                    <div className={styles.missingOutContent}>
                        {/* Using h3 and p tags styled by the CSS Module */}
                        <h3>Don&#39;t Let Outdated Tactics Cost You</h3>
                        <p>
                            A generic application isn&apos;t enough in {new Date().getFullYear()}. Standout portfolios, targeted resumes, and showcasing your unique value are essential. Are your materials truly competitive?
                        </p>
                    </div>
                </motion.div>

            </div> {/* End Container */}
        </section>
    );
};

export default StruggleSection;
