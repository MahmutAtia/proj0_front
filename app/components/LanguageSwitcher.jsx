'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { locale } = useTranslation();

    const languages = [
        { label: 'English', value: 'en', flag: '🇺🇸' },
        { label: 'Türkçe', value: 'tr', flag: '🇹🇷' },
        { label: 'العربية', value: 'ar', flag: '🇸🇦' }
    ];

    const handleLanguageChange = (e) => {
        const newLocale = e.value;

        // Remove current locale from pathname
        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

        // Navigate to new locale
        const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;
        router.push(newPath);
    };

    const itemTemplate = (option) => {
        return (
            <div className="flex align-items-center">
                <span className="mr-2">{option.flag}</span>
                <span>{option.label}</span>
            </div>
        );
    };

    return (
        <Dropdown
            value={locale}
            options={languages}
            onChange={handleLanguageChange}
            itemTemplate={itemTemplate}
            valueTemplate={itemTemplate}
            className="w-full md:w-auto"
        />
    );
};

export default LanguageSwitcher;
