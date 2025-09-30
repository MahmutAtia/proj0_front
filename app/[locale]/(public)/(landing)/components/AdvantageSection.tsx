"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import styles from '../styles/AdvantageSection.module.css';

const fadeInUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const AdvantageSection = () => {
    const { t } = useTranslation();
    const advantageData = t('advantage');

    return (
        // The ID is crucial for direct navigation
        <section id="advantage" className={`${styles.advantageSection} section-padding`}>
            <div className="container">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp}>
                    <h2 className="section-title">{advantageData.title}</h2>
                </motion.div>
                
                <div className={styles.comparisonContainer}>
                    {advantageData.items.map((item: any, index: number) => (
                        <motion.div
                            key={index}
                            className={styles.advantageColumn}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={fadeInUp}
                            transition={{ delay: 0.2 * (index + 1) }}
                        >
                            <h3 className={styles.columnTitle}>{item.title}</h3>
                            <ul className={styles.pointList}>
                                {item.points.map((point: string, pointIndex: number) => (
                                    <li key={pointIndex} className={styles.pointItem}>
                                        {item.isDisadvantage ? (
                                            <FiXCircle className={`${styles.icon} ${styles.iconDisadvantage}`} />
                                        ) : (
                                            <FiCheckCircle className={`${styles.icon} ${styles.iconAdvantage}`} />
                                        )}
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AdvantageSection;