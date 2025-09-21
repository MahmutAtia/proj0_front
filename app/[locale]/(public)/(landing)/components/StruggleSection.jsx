"use client"; // This component is a client component

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
// Import different / more relevant icons
import { FiXCircle, FiClock, FiEyeOff, FiAlertTriangle, FiTarget, FiThumbsDown } from 'react-icons/fi'; // Added FiEyeOff, FiAlertTriangle, FiTarget
import styles from '../styles/StruggleSection.module.css'; // Import the CSS Module
import { useTranslation } from '@/hooks/useTranslation'; // Add translation hook

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
    const { t, isRTL } = useTranslation(); // Add translation hook
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
        { icon: FiThumbsDown, title: t('struggle.painPoints.blackHole.title'), text: t('struggle.painPoints.blackHole.text'), colorVar: "var(--danger)" },
        { icon: FiClock, title: t('struggle.painPoints.timeSink.title'), text: t('struggle.painPoints.timeSink.text'), colorVar: "var(--warning)" },
        { icon: FiEyeOff, title: t('struggle.painPoints.visibility.title'), text: t('struggle.painPoints.visibility.text'), colorVar: "var(--primary-light)" },
        { icon: FiAlertTriangle, title: t('struggle.painPoints.atsGauntlet.title'), text: t('struggle.painPoints.atsGauntlet.text'), colorVar: "var(--accent)" },
    ];

    return (
        // Assign ref for scroll tracking
        <section id="struggle" className={`${styles.struggleSection} ${isRTL ? styles.rtl : ''}`} ref={scrollRef}>
            <div className="container"> {/* Use global container class */}

                {/* Section Header */}
                <motion.div
                    className={`${styles.header} ${isRTL ? styles.rtl : ''}`}
                    initial="hidden"
                    whileInView="visible" // Trigger when in view
                    viewport={{ once: true, amount: 0.3 }} // Trigger early
                    variants={fadeInUp}
                >
                    {/* Changed Icon & removed inline style */}
                    <FiAlertTriangle className={styles.headerIcon} />
                    <h2 className={styles.title}>
                        {t('struggle.title_part1')}
                        <span className={styles.strikethrough}>{t('struggle.abyss')}</span>
                        {t('struggle.title_part2')}
                    </h2>
                    <p className={styles.subtitle}>
                        {t('struggle.subtitle')}
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
                    className={`${styles.missingOutBox} ${isRTL ? styles.rtl : ''}`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }} // Trigger when ~half visible
                    variants={fadeInUp}
                >
                    {/* Changed Icon */}
                    <FiTarget className={styles.missingOutIcon} />
                    <div className={styles.missingOutContent}>
                        {/* Using h3 and p tags styled by the CSS Module */}
                        <h3>{t('struggle.missingOut.title')}</h3>
                        <p>
                            {t('struggle.missingOut.text', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </motion.div>

            </div> {/* End Container */}
        </section>
    );
};

export default StruggleSection;
