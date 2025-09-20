"use client";
import React, { useState } from 'react'; // Import useState
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import styles from '../styles/HeroGallery.module.css';
import PreviewModal from './PreviewModal'; // Import the new modal

// --- Enhanced Data for our gallery items ---
const portfolios = [
    { 
        // New: Placeholder that supports GIF format with custom text.
        src: 'https://placehold.co/600x400/000000/FFFFFF/gif?text=Animated+Portfolio', 
        alt: 'Animated portfolio preview', 
        type: 'iframe', 
        // New: A safe, publicly-accessible URL designed for iframe testing.
        url: 'https://practice.expandtesting.com/iframe' 
    },
    { 
        // New: Placeholder for a static PNG image with custom text.
        src: 'https://placehold.co/600x400/3498db/FFFFFF/png?text=Sleek+Portfolio', 
        alt: 'Sleek portfolio design',
        type: 'iframe',
        // New: A safe, publicly-accessible URL designed for iframe testing.
        url: 'https://practice.expandtesting.com/iframe' 
    },
        { 
        // New: Placeholder for a static PNG image with custom text.
        src: 'https://placehold.co/600x400/3498db/FFFFFF/png?text=Sleek+Portfolio', 
        alt: 'Sleek portfolio design',
        type: 'iframe',
        // New: A safe, publicly-accessible URL designed for iframe testing.
        url: 'https://practice.expandtesting.com/iframe' 
    },
        { 
        // New: Placeholder for a static PNG image with custom text.
        src: '/images/image.png', 
        alt: 'Sleek portfolio design',
        type: 'iframe',
        // New: A safe, publicly-accessible URL designed for iframe testing.
        url: 'https://practice.expandtesting.com/iframe' 
    },
        { 
        // New: Placeholder for a static PNG image with custom text.
        src: '/images/image.png', 
        alt: 'Sleek portfolio design',
        type: 'iframe',
        // New: A safe, publicly-accessible URL designed for iframe testing.
        url: 'https://practice.expandtesting.com/iframe' 
    },
    // ... add more portfolios
];

const resumes = [
    // New: Using Picsum with new 'seeds' and dimensions (600x800) for consistent, portrait-style resume mockups.
    { src: 'https://picsum.photos/seed/new-resume-1/600/800', alt: 'ATS-friendly resume template', type: 'image' },
    { src: 'https://picsum.photos/seed/new-resume-2/600/800', alt: 'Modern resume design', type: 'image' },
    { src: 'https://picsum.photos/seed/new-resume-3/600/800', alt: 'Creative resume layout', type: 'image' },
];

const documents = [
    // Updated: Using Picsum with new 'seeds' to ensure unique images for documents (600x850 ratio retained).
    { src: 'https://picsum.photos/seed/new-doc-1/600/850', alt: 'Professional cover letter', type: 'image' },
    { src: 'https://picsum.photos/seed/new-doc-2/600/850', alt: 'Recommendation letter format', type: 'image' },
    { src: 'https://picsum.photos/seed/new-doc-3/600/850', alt: 'Clean cover letter example', type: 'image' },
];
// --- UPDATE GalleryCard Component ---
// It now needs an onClick prop
const GalleryCard = ({ src, alt, onClick, type }) => (
    <div className={`${styles.card} ${styles[type]}`} onClick={onClick}>
        <img src={src} alt={alt} loading="lazy" className={styles.cardImage} />
    </div>
);

// --- UPDATE GalleryColumn Component ---
// It needs to pass down the onClick handler
const GalleryColumn = ({ items, animationDuration, onCardClick }) => (
    <div className={styles.column}>
        <div className={styles.scrollWrapper} style={{ '--duration': `${animationDuration}s` }}>
            {[...items, ...items].map((item, index) => (
    <GalleryCard 
        key={index} 
        src={item.src} 
        alt={item.alt} 
        type={item.type} // <-- ADD THIS PROP
        onClick={() => onCardClick(item)} 
    />
            ))}
        </div>
    </div>
);

// --- UPDATE THE MAIN HeroGallery COMPONENT ---
const HeroGallery = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCardClick = (item) => {
        setSelectedItem(item);
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
    };

    return (
        <>
            <motion.div 
                className={styles.galleryContainer}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            >
                <GalleryColumn items={portfolios} animationDuration={40} onCardClick={handleCardClick} />
                <GalleryColumn items={resumes} animationDuration={60} onCardClick={handleCardClick} />
                <GalleryColumn items={documents} animationDuration={45} onCardClick={handleCardClick} />
                <div className={styles.overlay}></div>
            </motion.div>

            <AnimatePresence>
                {selectedItem && (
                    <PreviewModal item={selectedItem} onClose={handleCloseModal} />
                )}
            </AnimatePresence>
        </>
    );
};

export default HeroGallery;