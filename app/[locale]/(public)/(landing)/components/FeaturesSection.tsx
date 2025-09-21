'use client'; // This component is a client component

import React from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiShield, FiGlobe, FiEdit, FiZap } from 'react-icons/fi';
import styles from '../styles/FeaturesSection.module.css'; // Import the CSS module
import { useTranslation } from '@/hooks/useTranslation'; // Add translation hook

// --- Framer Motion Variants (assuming these are defined elsewhere or pass as props) ---
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }
};

const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    initial: {},
    animate: {
        transition: {
            staggerChildren: staggerChildren,
            delayChildren: delayChildren
        }
    }
});

// --- Features Section (Your Edge) ---
const FeaturesSection = () => {
    const { t, isRTL } = useTranslation();
    const features = [
        { icon: FiCpu, title: t('features.hyperPersonalized.title'), text: t('features.hyperPersonalized.text') },
        { icon: FiShield, title: t('features.conquerAts.title'), text: t('features.conquerAts.text') },
        { icon: FiGlobe, title: t('features.ownCorner.title'), text: t('features.ownCorner.text') },
        { icon: FiEdit, title: t('features.aiEditing.title'), text: t('features.aiEditing.text') }
    ];

    return (
        <section id="features" className={`${styles.sectionBgGradient} section-padding`}>
            <div className={styles.container}>
                <motion.div className={`${styles.textCenter} ${styles.marginBottom6}`} variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
                    <FiZap className={styles.iconZap} />
                    <h2 className={styles.heading}>
                        {t('features.title')}
                        <span className={styles.gradientText}>{t('features.aiAndBrilliance')}</span>
                    </h2>

                    <p className={styles.subheading}>{t('features.subtitle')}</p>
                </motion.div>

                <motion.div
                    className={styles.featuresGrid}
                    variants={staggerContainer(0.15)} // Slightly increased stagger
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            className={styles.featureCard}
                            variants={fadeInUp} // Use fadeInUp for individual card animation
                            whileHover={{ y: -5 }} // Framer Motion hover effect (optional, CSS handles transform)
                            transition={{ type: 'spring', stiffness: 300 }} // Springy effect on hover
                        >
                            <div className={styles.featureIconWrapper}>
                                <feature.icon className={styles.featureIcon} />
                            </div>
                            <h4 className={styles.featureTitle}>{feature.title}</h4>
                            <p className={styles.featureText}>{feature.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturesSection; // Make sure to export if it's in its own file
