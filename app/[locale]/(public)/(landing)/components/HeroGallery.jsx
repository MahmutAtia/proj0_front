"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/HeroGallery.module.css';
import PreviewModal from './PreviewModal';

// Data remains the same
const portfolios = [
    { src: '/images/john-1-high.gif', alt: 'Animated portfolio preview', type: 'iframe', url: 'https://vbs.attiais.me/site/mohamed-attia/' },
    { src: '/images/john-2-high.gif', alt: 'Animated portfolio preview', type: 'iframe', url: 'https://vbs.attiais.me/site/mohamed-attia-20/' },
    { src: '/images/john-3-high.gif', alt: 'Animated portfolio preview', type: 'iframe', url: 'https://vbs.attiais.me/site/mohamed-attia-21/' },
    { src: '/images/john-4-high.gif', alt: 'Animated portfolio preview 4', type: 'iframe', url: 'https://vbs.attiais.me/site/mohamed-attia-22/' },
    { src: '/images/john-5-high.gif', alt: 'Animated portfolio preview 5', type: 'iframe', url: 'https://vbs.attiais.me/site/mohamed-attia-23/' },
];
const resumes = [
    { src: 'https://picsum.photos/seed/new-resume-1/600/800', alt: 'ATS-friendly resume template', type: 'image' },
    { src: 'https://picsum.photos/seed/new-resume-2/600/800', alt: 'Modern resume design', type: 'image' },
    { src: 'https://picsum.photos/seed/new-resume-3/600/800', alt: 'Creative resume layout', type: 'image' },
];
const documents = [
    { src: 'https://picsum.photos/seed/new-doc-1/600/850', alt: 'Professional cover letter', type: 'image' },
    { src: 'https://picsum.photos/seed/new-doc-2/600/850', alt: 'Recommendation letter format', type: 'image' },
    { src: 'https://picsum.photos/seed/new-doc-3/600/850', alt: 'Clean cover letter example', type: 'image' },
];

const GalleryCard = ({ src, alt, onClick, type }) => (
    <div className={`${styles.card} ${styles[type]}`} onClick={onClick}>
        <img src={src} alt={alt} loading="lazy" className={styles.cardImage} />
    </div>
);

// --- UPDATED: Now accepts a className prop ---
const GalleryRow = ({ items, animationDuration, onCardClick, className = '', isRTL }) => (
    <div className={`${styles.galleryRow} ${className}`}>
        <div 
            className={`${styles.scrollWrapper} ${isRTL ? styles.scrollWrapperRTL : ''}`} 
            style={{ '--duration': `${animationDuration}s` }}
        >
            {[...items, ...items].map((item, index) => (
                <GalleryCard
                    key={`item-${index}`}
                    src={item.src}
                    alt={item.alt}
                    type={item.type}
                    onClick={() => onCardClick(item)}
                />
            ))}
        </div>
    </div>
);

const HeroGallery = ({ isRTL }) => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCardClick = (item) => setSelectedItem(item);
    const handleCloseModal = () => setSelectedItem(null);

    return (
        <>
            <motion.div
                className={styles.galleryContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            >
                {/* --- UPDATED: Faster animation durations --- */}
                <GalleryRow 
                    items={portfolios} 
                    /* CHANGED: Faster duration */
                    animationDuration={40} 
                    onCardClick={handleCardClick}
                    className={styles.portfolioRow} 
                    isRTL={isRTL}
                />
                <GalleryRow 
                    items={resumes} 
                    /* CHANGED: Faster duration */
                    animationDuration={65} 
                    onCardClick={handleCardClick}
                    className={styles.documentRow} 
                    isRTL={isRTL}
                />
                <GalleryRow 
                    items={documents} 
                    /* CHANGED: Faster duration */
                    animationDuration={50} 
                    onCardClick={handleCardClick}
                    className={styles.documentRow} 
                    isRTL={isRTL}
                />
            </motion.div>

            <AnimatePresence>
                {selectedItem && <PreviewModal item={selectedItem} onClose={handleCloseModal} />}
            </AnimatePresence>
        </>
    );
};

export default HeroGallery;