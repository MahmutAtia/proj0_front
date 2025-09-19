"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import styles from '../styles/PreviewModal.module.css';

const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 50 },
    visible: { 
        scale: 1, 
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' } 
    },
    exit: { 
        scale: 0.95, 
        opacity: 0,
        y: 30,
        transition: { duration: 0.2, ease: 'easeIn' } 
    },
};

const PreviewModal = ({ item, onClose }) => {
    // Stop the background from scrolling when the modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    if (!item) return null;

    return (
        <motion.div
            className={styles.modalBackdrop}
            onClick={onClose} // Close modal on backdrop click
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
<motion.div
    className={`${styles.modalContent} ${item.type === 'iframe' ? styles.iframeContainer : ''}`}
    
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
                variants={modalVariants}
            >
                <button className={styles.closeButton} onClick={onClose}>
                    <FiX size={24} />
                </button>
                
                {item.type === 'iframe' ? (
                    <iframe 
                        src={item.url} 
                        title={item.alt}
                        className={styles.iframeContent}
                    />
                ) : (
                    <img 
                        src={item.src} 
                        alt={item.alt}
                        className={styles.imageContent}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

export default PreviewModal;