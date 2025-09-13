'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useEffect } from 'react';

// Translation data - only load the ones you have
const translations = {
    en: require('../locales/en.json'),
    tr: require('../locales/tr.json'),
    ar: require('../locales/ar.json'),
    // Add these when you create the files
    fr: require('../locales/fr.json')
    // es: require('../locales/es.json'),
};

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

// Supported locales (match what you have in translations)
const supportedLocales = ['en', 'tr', 'ar', 'fr'];

export function useTranslation() {
    const pathname = usePathname();

    // Extract locale from pathname
    const locale = useMemo(() => {
        const segments = pathname.split('/');
        const firstSegment = segments[1];
        return supportedLocales.includes(firstSegment) ? firstSegment : 'en';
    }, [pathname]);

    const isRTL = useMemo(() => rtlLanguages.includes(locale), [locale]);

    // Set document direction and language
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
            document.documentElement.lang = locale;

            // Add RTL class to body for easier CSS targeting
            if (isRTL) {
                document.body.classList.add('rtl');
                document.body.classList.remove('ltr');
            } else {
                document.body.classList.add('ltr');
                document.body.classList.remove('rtl');
            }
        }
    }, [locale, isRTL]);

    const t = useMemo(() => {
        const messages = translations[locale] || translations.en;

        return (key, params = {}) => {
            const keys = key.split('.');
            let value = messages;

            for (const k of keys) {
                value = value?.[k];
            }

            if (typeof value === 'string' && params) {
                return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
                    return params[paramKey] || match;
                });
            }

            return value || key;
        };
    }, [locale]);

    return { t, locale, isRTL };
}
