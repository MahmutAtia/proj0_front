import { useRouter } from 'next/router';
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

export function useTranslation() {
  const { locale = 'en' } = useRouter();

  const isRTL = useMemo(() => rtlLanguages.includes(locale), [locale]);

  // Set document direction
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
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
