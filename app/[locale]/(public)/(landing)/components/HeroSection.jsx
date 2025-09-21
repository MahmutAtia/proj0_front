"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield } from 'react-icons/fi';
import styles from '../styles/HeroSection.module.css';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation'; // Add translation hook
import HeroGallery from './HeroGallery';


// Animation Variants (unchanged)
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
    hover: {
        scale: 1.04,
        boxShadow: "0 5px 15px rgba(88, 28, 135, 0.3)",
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.96 },
};

const primaryButtonPulse = {
    scale: [1, 1.02, 1],
    transition: {
        duration: 1.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 2.5,
    }
};

const HeroSection = () => {
    const router = useRouter();
    const { t, isRTL } = useTranslation();

    return (
        <section id="hero" className={`${styles.heroSection} section-padding`}>
            <div className={`container ${styles.heroContainer} ${isRTL ? styles.rtl : ''}`}>
                <motion.div
                    className={`${styles.heroContent} ${isRTL ? styles.rtl : ''}`}
                    variants={staggerContainer(0.15, 0.1)}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Reconstruct the title with translated parts */}
                    <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                        {t('hero.title_part1')}
                        <span className={styles.highlightRejected}>{t('hero.rejected')}</span>
                        {t('hero.title_part2')}
                        <br />
                        {t('hero.title_part3')}
                    </motion.h1>

                    {/* This part is already correct */}
                    <motion.p variants={fadeInUp} className={styles.heroSubtitle}>
                        {t('hero.subtitle_part1')}
                        <span className="gradient-text">{t('hero.subtitle_styled')}</span>
                        {t('hero.subtitle_part2')}
                    </motion.p>

                    <motion.p variants={fadeInUp} className={styles.heroParagraph}>
                        {t('hero.description')}
                    </motion.p>

                    <motion.div variants={fadeInUp} className={`${styles.heroActions} ${isRTL ? styles.rtl : ''}`}>
                        <motion.button
                            className={`button button-primary ${styles.heroButton}`}
                            variants={buttonHoverTap}
                            whileHover="hover"
                            whileTap="tap"
                            animate={primaryButtonPulse}
                            onClick={() => router.push('/ats')}>
                            {isRTL ? <FiArrowRight size="1.1em" /> : null}
                            {t('hero.startFreeResume')}
                            {!isRTL ? <FiArrowRight size="1.1em" /> : null}
                        </motion.button>
                        <motion.button
                            className={`button button-secondary ${styles.heroButton}`}
                            variants={buttonHoverTap}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => router.push('/ats')}>
                            {isRTL ? <FiShield size="1.1em" /> : null}
                            {t('hero.checkScore')}
                            {!isRTL ? <FiShield size="1.1em" /> : null}
                        </motion.button>
                    </motion.div>
                </motion.div>

                    <HeroGallery />
            </div>
        </section>
    );
};

export default HeroSection;
