'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiGlobe } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import styles from './styles/LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { locale } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { label: 'English', value: 'en', flag: '🇺🇸', nativeName: 'English' },
        { label: 'Türkçe', value: 'tr', flag: '🇹🇷', nativeName: 'Türkçe' },
        { label: 'العربية', value: 'ar', flag: '🇸🇦', nativeName: 'العربية' },
        { label: 'Deutsch', value: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
        { label: 'Español', value: 'es', flag: '🇪🇸', nativeName: 'Español' },
        { label: 'Français', value: 'fr', flag: '🇫🇷', nativeName: 'Français' }
    ];

    const currentLanguage = languages.find((lang) => lang.value === locale) || languages[0];

    const handleLanguageChange = (newLocale) => {
        // Set a cookie to remember the user's choice
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        const pathSegments = pathname.split('/');
        // The first segment is empty, the second is the locale.
        // e.g., "/en/main" -> ["", "en", "main"]
        pathSegments[1] = newLocale;
        const newPath = pathSegments.join('/');
        
        router.push(newPath);
        setIsOpen(false);
    };


    const dropdownVariants = {
        hidden: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: { duration: 0.2 }
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.2 }
        }
    };

    return (
        <div className={styles.languageSwitcher}>
            <motion.button className={styles.trigger} onClick={() => setIsOpen(!isOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiGlobe size={16} />
                <span className={styles.currentFlag}>{currentLanguage.flag}</span>
                <span className={styles.currentLabel}>{currentLanguage.nativeName}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FiChevronDown size={14} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} />
                        <motion.div className={styles.dropdown} variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden">
                            {languages.map((language) => (
                                <motion.button
                                    key={language.value}
                                    className={`${styles.option} ${locale === language.value ? styles.active : ''}`}
                                    onClick={() => handleLanguageChange(language.value)}
                                    whileHover={{ backgroundColor: 'rgba(88, 28, 135, 0.05)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className={styles.flag}>{language.flag}</span>
                                    <span className={styles.name}>{language.nativeName}</span>
                                    {locale === language.value && (
                                        <motion.div className={styles.checkmark} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                                            ✓
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSwitcher;
