import type { Metadata } from 'next';

const siteBaseUrl = 'https://www.yourdomain.com'; // <-- REPLACE with your actual domain

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: 'CareerFlow AI | Your AI Career Co-Pilot for Resumes & Portfolios',
  description:
    "Stop the job search struggle. CareerFlow's AI crafts tailored resumes, builds portfolios, and finds jobs FOR YOU. Land your dream job faster. Try it free.",
  keywords: [
    'AI resume builder',
    'AI career co-pilot', // Add this
    'automated job search', // Add this
    'ATS resume checker',
    'AI portfolio generator',
    'job application automation', // Add this
    'AI cover letter generator',
    'resume optimization',
    'get past ATS',
    'land interviews',
  ],
  openGraph: {
    title: 'Stop Applying. Start Interviewing. Meet Your AI Career Co-Pilot.',
    description:
      'CareerFlow AI automates your job hunt. Get perfectly tailored resumes, instant portfolios, and curated job alerts. See why it’s the secret weapon for top candidates.',
    url: '/',
    siteName: 'CareerFlow AI',
    images: [ { url: '/og-image.png', width: 1200, height: 630, alt: 'An AI co-pilot helping a job seeker land their dream job.' } ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stop Applying. Start Interviewing. Meet Your AI Career Co-Pilot.',
    description:
      'CareerFlow AI automates your job hunt with AI-powered resumes, portfolios, and job searching.',
    // images: ['/twitter-image.png'],
  },
  alternates: { canonical: '/' },

  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest',
};

// import components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StruggleSection from './components/StruggleSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import HowItWorksSection from './components/HowItWorksSection';
import ATSCheckerSection from './components/ATSCheckerSection';
import Footer from './components/Footer';
import AdvantageSection from './components/AdvantageSection';
import FaqSection from './components/FaqSection';
import FloatingOfferBanner from './components/FloatingOfferBanner';
import './styles/globals.css';

const LandingPage = () => {
  return (
    <div className="landing-page-wrapper">
      <Header />
      <main>
        <HeroSection />
        <FloatingOfferBanner />
        <StruggleSection />
        <AdvantageSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ATSCheckerSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

// we make building career fun and comfortable easy process for you
