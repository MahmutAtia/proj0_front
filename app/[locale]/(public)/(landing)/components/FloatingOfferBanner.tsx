"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useTranslation } from '@/hooks/useTranslation';
import styles from '../styles/FloatingOfferBanner.module.css';

const FloatingOfferBanner = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className={styles.banner}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <div className={styles.content}>
                    <p>
                        {t('floatingOffer.text')}{' '}
                        <strong className={styles.code}>{t('floatingOffer.code')}</strong>{' '}
                        {t('floatingOffer.text2')}
                    </p>
                </div>
                <button onClick={() => setIsVisible(false)} className={styles.closeButton} aria-label="Dismiss">
                    <FiX />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingOfferBanner;