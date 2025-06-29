'use client';

import { usePathname, useParams } from 'next/navigation'; // App Router hooks
import { useMemo, useEffect } from 'react';

// Translation data
const translations = {
  en: require('../locales/en.json'),
  tr: require('../locales/tr.json'),
  ar: require('../locales/ar.json'),
  de: require('../locales/de.json'),
  es: require('../locales/es.json'),
};

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

// Supported locales
const supportedLocales = ['en', 'tr', 'ar', 'de', 'es'];

export function useTranslation() {
  const params = useParams();
  const pathname = usePathname();

  // Extract locale from URL
  const locale = useMemo(() => {
    // First try to get from params (dynamic route)
    if (params?.locale && supportedLocales.includes(params.locale)) {
      console.log('Locale from params:', params.locale);
      return params.locale;
    }

    // Fallback: extract from pathname
    const segments = pathname.split('/');
    const firstSegment = segments[1];
    if (supportedLocales.includes(firstSegment)) {
      console.log('Locale from pathname:', firstSegment);
      return firstSegment;
    }

    console.log('Defaulting to English');
    return 'en';
  }, [params?.locale, pathname]);

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
    console.log('Using translations for locale:', locale, 'Messages loaded:', !!messages);

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
