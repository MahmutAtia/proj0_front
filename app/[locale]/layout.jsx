import { notFound } from 'next/navigation';
import { Providers } from '@/contexts/providers';

const locales = ['en', 'tr', 'ar', 'de', 'es'];

export default async function LocaleLayout({ children, params }) {
  // Await params before using its properties
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={isRTL ? 'rtl' : 'ltr'}>
      {children}
      </body>
    </html>
  );
}

// Generate static params for all supported locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
