import type { Metadata } from 'next';
import { headers } from 'next/headers'; // Import headers to potentially get the host

// --- Define your site's base URL ---
// Option 1: Hardcode if you know it
const siteBaseUrl = 'https://www.yourdomain.com'; // <-- REPLACE with your actual domain
// Option 2: Try to get dynamically (might not work in all environments, especially build time)
// const getBaseUrl = () => {
//   const host = headers().get('host');
//   const protocol = host?.includes('localhost') ? 'http' : 'https';
//   return `${protocol}://${host}`;
// };
// const siteBaseUrl = getBaseUrl();

export const metadata: Metadata = {
  // --- Base URL for resolving relative paths ---
  metadataBase: new URL(siteBaseUrl), // <-- SET YOUR BASE URL HERE

  // --- Core SEO ---
  title: 'CareerFlow AI | AI Resume Builder & Portfolio Generator', // Slightly shorter, keyword first
  description: 'Stop getting rejected by ATS. Create AI-powered resumes, cover letters, and portfolios that land interviews. Try CareerFlow AI free!', // More action-oriented, includes ATS
  keywords: [
    'AI resume builder',
    'ATS resume checker',
    'AI portfolio generator',
    'job application help',
    'career tools',
    'AI cover letter generator',
    'resume optimization',
    'get past ATS',
    'land interviews',
    'job search AI',
  ], // Added more variations

  // --- Social Sharing (Open Graph for Facebook, LinkedIn, etc.) ---
  openGraph: {
    title: 'CareerFlow AI: Build Job-Winning Resumes & Portfolios with AI', // Slightly different for social
    description: 'Tired of rejections? Use AI to create ATS-friendly resumes and impressive portfolios that get you noticed.', // Social-focused description
    url: '/', // Canonical URL for this page relative to metadataBase
    siteName: 'CareerFlow AI', // Your site's name
    // --- IMPORTANT: Add absolute URL to your main OG image ---
    images: [
      {
        url: '/og-image.png', // Relative path to your image in the /public folder
        width: 1200,
        height: 630,
        alt: 'CareerFlow AI helping a job seeker create a resume', // Descriptive alt text
      },
      // You can add more images if needed
    ],
    locale: 'en_US', // Specify language/region
    type: 'website', // Type of content
  },

  // --- Twitter Card ---
  twitter: {
    card: 'summary_large_image', // Use 'summary_large_image' if you have a compelling image
    title: 'CareerFlow AI: Build Job-Winning Resumes & Portfolios with AI', // Consistent with OG
    description: 'Tired of rejections? Use AI to create ATS-friendly resumes and impressive portfolios that get you noticed.', // Consistent with OG
    // images: ['/twitter-image.png'], // Relative path to image in /public (can be same as OG)
    // creator: '@yourTwitterHandle', // Optional: Your Twitter handle
  },

  // --- Other Useful Metadata ---
  alternates: {
    canonical: '/', // The canonical URL for this page relative to metadataBase
  },
  // icons: { // Optional: Add favicons
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest', // Optional: For PWA features
};


// import components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
// ... rest of your imports and component code ...
import StruggleSection from './components/StruggleSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import HowItWorksSection from './components/HowItWorksSection';
import ATSCheckerSection from './components/ATSCheckerSection';
import Footer from './components/Footer';
import './styles/globals.css';

const LandingPage = () => {
    // ... your component JSX ...
     return (
        <div className="landing-page-wrapper">
            <Header />
            <main>
                <HeroSection />
                <StruggleSection />
                <FeaturesSection />
                <HowItWorksSection />
                <ATSCheckerSection />
                <PricingSection />
            </main>
            <Footer />
        </div>
    );
};
export default LandingPage;


// we mak buildng carrer fun and comfortable easy process for you
