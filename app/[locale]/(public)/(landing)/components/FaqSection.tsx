"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import styles from '../styles/FaqSection.module.css';

// Reusable FAQ Item component
const FaqItem = ({ item, isOpen, onClick }: { item: any; isOpen: boolean; onClick: () => void; }) => {
    return (
        <div className={styles.faqItem}>
            <button className={styles.faqQuestion} onClick={onClick}>
                <span>{item.question}</span>
                {isOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.faqAnswer}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <p>{item.answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FaqSection = () => {
    const { t } = useTranslation();
    const faqData = t('faq');
    const [openId, setOpenId] = useState(null);

    const toggleItem = (id: any) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        // The ID is crucial for direct navigation
        <section id="faq" className={`${styles.faqSection} section-padding`}>
            <div className="container">
                <h2 className="section-title">{faqData.title}</h2>
                <p className="section-subtitle">{faqData.subtitle}</p>
                <div className={styles.faqList}>
                    {faqData.questions.map((item: any) => (
                        <FaqItem
                            key={item.id}
                            item={item}
                            isOpen={openId === item.id}
                            onClick={() => toggleItem(item.id)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FaqSection;