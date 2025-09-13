'use client'; // This component is a client component
import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiUploadCloud } from 'react-icons/fi';
import styles from '../styles/ATSCheckerSection.module.css';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../hooks/useTranslation'; // Add translation hook

// --- Framer Motion Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }
};

const buttonHover = {
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
    tap: { scale: 0.95 }
};

// --- ATS Checker Section ---
const ATSCheckerSection = () => {
    const router = useRouter();
    const { t, isRTL } = useTranslation(); // Add translation hook

    return (
        <section id="ats-checker" className={`${styles.sectionBgDark} section-padding`}>
            <div className={`${styles.container} ${styles.atsContainer} ${isRTL ? styles.rtl : ''}`}>
                <motion.div className={`${styles.atsContent} ${isRTL ? styles.rtl : ''}`} variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
                    <FiShield className={styles.iconShield} />
                    <h2 className={styles.heading}>
                        <span className={styles.heading}>{t('atsChecker.title_part1')} </span>
                        <span className={styles.accentText}>{t('atsChecker.ghosted')}</span>
                        {t('atsChecker.title_part2')}
                    </h2>
                    <p>
                        <span className={styles.subheading}>{t('atsChecker.subtitle')}</span>
                    </p>

                    <motion.button
                        className={`button ${styles.buttonAccent}`}
                        variants={buttonHover}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => {
                            router.push('/ats');
                        }}
                    >
                        {t('atsChecker.scanResume')}
                        <FiUploadCloud
                            style={{
                                marginLeft: isRTL ? '0' : '0.5rem',
                                marginRight: isRTL ? '0.5rem' : '0'
                            }}
                        />
                    </motion.button>
                    <p className={styles.disclaimerText}>{t('atsChecker.disclaimer')}</p>
                </motion.div>
                <motion.div className={styles.atsVisual} initial={{ opacity: 0, x: isRTL ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }} viewport={{ once: true }}>
                    <img src="https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600" alt={t('atsChecker.imageAlt')} className={styles.atsImage} />
                </motion.div>
            </div>
        </section>
    );
};

export default ATSCheckerSection;
