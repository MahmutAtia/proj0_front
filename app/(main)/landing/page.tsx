'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import { Ripple } from 'primereact/ripple';
import { Menubar } from 'primereact/menubar';
import { TieredMenu } from 'primereact/tieredmenu'; // For mobile menu if needed
import { StyleClass } from 'primereact/styleclass';

// --- Global Styles & Animations ---
// NOTE: For fonts, you'd typically link Google Fonts in your main layout/HTML file.
// Example: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Lexend:wght@600;700&display=swap" rel="stylesheet">
const GlobalStyles = () => (
    <style jsx global>{`
        :root {
            --primary-color: #6366F1; /* Indigo */
            --primary-light: #818CF8;
            --primary-dark: #4F46E5;
            --secondary-color: #14B8A6; /* Teal */
            --accent-color: #F59E0B; /* Amber */
            --highlight-bg: rgba(99, 102, 241, 0.05); /* Light Indigo background */

            --surface-ground: #F9FAFB; /* Off-white */
            --surface-section: #FFFFFF;
            --surface-card: #FFFFFF;
            --surface-border: #E5E7EB;

            --text-color: #1F2937; /* Dark Gray */
            --text-color-secondary: #4B5563; /* Medium Gray */
            --heading-color: #111827; /* Near Black */

            --font-family-primary: 'Inter', sans-serif;
            --font-family-headings: 'Lexend', sans-serif;

            --border-radius: 8px;
            --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08);
            --card-hover-shadow: 0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.08);
            --button-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        body {
            font-family: var(--font-family-primary);
            color: var(--text-color);
            background-color: var(--surface-ground);
            line-height: 1.6;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-family-headings);
            color: var(--heading-color);
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 0.75em; /* Consistent spacing */
        }

        h1 { font-size: 2.8rem; } /* ~45px */
        h2 { font-size: 2rem; }   /* ~32px */
        h3 { font-size: 1.5rem; } /* ~24px */
        h4 { font-size: 1.25rem; }/* ~20px */

        @media (min-width: 768px) {
            h1 { font-size: 3.5rem; } /* ~56px */
            h2 { font-size: 2.5rem; } /* ~40px */
            h3 { font-size: 1.75rem; }/* ~28px */
        }

        p {
            color: var(--text-color-secondary);
            font-size: 1rem; /* ~16px */
            margin-bottom: 1rem;
        }

        .p-button-primary {
            background: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: var(--button-shadow);
        }
        .p-button-primary:enabled:hover {
            background: var(--primary-dark) !important;
            border-color: var(--primary-dark) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
        }
        .p-button-secondary, .p-button-outlined {
             color: var(--primary-color) !important;
             border-color: var(--primary-color) !important;
             transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
         .p-button-secondary:enabled:hover, .p-button-outlined:enabled:hover {
             background: var(--highlight-bg) !important;
             color: var(--primary-dark) !important;
             border-color: var(--primary-dark) !important;
             transform: translateY(-2px);
         }

         .p-card {
            border-radius: var(--border-radius);
            box-shadow: var(--card-shadow);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid var(--surface-border);
         }
         .p-card:hover {
             transform: translateY(-5px);
             box-shadow: var(--card-hover-shadow);
         }

         .section-padding {
             padding: 4rem 1rem; /* Mobile padding */
         }
         @media (min-width: 992px) { /* lg breakpoint */
            .section-padding {
                 padding: 6rem 2rem; /* Desktop padding */
             }
         }

         .animated-gradient-text {
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
            background-size: 200% auto;
            color: #000;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient-animation 4s linear infinite;
         }

        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

         .icon-feature {
            font-size: 2.5rem;
            padding: 1rem;
            border-radius: 50%;
            margin-bottom: 1rem;
            display: inline-block;
            transition: transform 0.3s ease, background-color 0.3s ease;
         }
         .icon-feature:hover {
             transform: scale(1.1);
         }
         .icon-feature.bg-primary-light { background-color: rgba(99, 102, 241, 0.15); color: var(--primary-dark); }
         .icon-feature.bg-secondary-light { background-color: rgba(20, 184, 166, 0.15); color: #047857; } /* Teal */
         .icon-feature.bg-accent-light { background-color: rgba(245, 158, 11, 0.15); color: #B45309; } /* Amber */
         .icon-feature.bg-red-light { background-color: rgba(239, 68, 68, 0.15); color: #B91C1C; } /* Red */


         /* Subtle fade-in animation (requires element visibility tracking, harder in pure CSS/single file) */
         .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
         }
         .fade-in-visible {
            opacity: 1;
            transform: translateY(0);
         }

         /* Header styling */
        .landing-menubar {
            border: none !important;
            background: rgba(255, 255, 255, 0.8) !important; /* Semi-transparent */
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 1rem 1.5rem !important;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
            transition: background-color 0.3s ease;
        }
         .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link {
             transition: background-color 0.2s ease, color 0.2s ease;
             border-radius: var(--border-radius);
         }
         .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:hover {
             background-color: var(--highlight-bg) !important;
             color: var(--primary-dark) !important;
         }
        .p-menubar .p-menuitem.p-menuitem-active > .p-menuitem-link {
            background: var(--highlight-bg) !important; /* Highlight active section if possible */
        }


    `}</style>
);

// --- Header Component ---
const Header = () => {
    const items = [
        { label: 'Home', command: () => window.scrollTo({ top: document.getElementById('hero')?.offsetTop, behavior: 'smooth' }) },
        { label: 'The Struggle', command: () => window.scrollTo({ top: document.getElementById('struggle')?.offsetTop, behavior: 'smooth' }) },
        { label: 'Features', command: () => window.scrollTo({ top: document.getElementById('features')?.offsetTop, behavior: 'smooth' }) },
        { label: 'Pricing', command: () => window.scrollTo({ top: document.getElementById('pricing')?.offsetTop, behavior: 'smooth' }) },
        { label: 'ATS Check', url: '#ats-checker', className: 'text-primary font-semibold' } // Make it stand out
    ];

    const start = (
        <Link href="/" className="flex align-items-center mr-6">
            <i className="pi pi-send mr-2 text-primary" style={{ fontSize: '1.8rem', transform: 'rotate(-45deg)' }}></i> {/* Different Icon */}
            <span className="font-bold text-2xl" style={{ fontFamily: 'var(--font-family-headings)' }}>CareerFlow AI</span>
        </Link>
    );

    const end = (
        <div className="flex align-items-center gap-2">
            <Button label="Login" text className="p-button-sm" />
            <Button label="Get Started Free" className="p-button-primary p-button-sm" />
        </div>
    );

    return (
        <Menubar model={items} start={start} end={end} className="landing-menubar" />
    );
};


// --- Hero Section Component ---
const HeroSection = () => {
    return (
        <div id="hero" className="grid grid-nogutter text-center lg:text-left section-padding overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--surface-ground) 70%, var(--highlight-bg) 100%)' }}>
             <div className="col-12 lg:col-6 my-auto pr-0 lg:pr-6">
                <h1 className="text-4xl md:text-6xl font-bold mb-3">
                    Tired of the <span className="text-primary">Resume Black Hole?</span> <i className="pi pi-sync text-primary"></i>
                </h1>
                 <h2 className="font-normal text-xl md:text-2xl line-height-3 text-color-secondary mb-5">
                    Endless applications, generic resumes, deafening silence... Sound familiar? Stop the cycle. <span className="font-semibold text-color">It's time to stand out and land the job you deserve.</span>
                </h2>
                <div className="flex gap-3 justify-content-center lg:justify-content-start">
                    <Button label="Create My AI Resume Now" type="button" className="p-button-primary p-button-lg" />
                    <Button label="Free ATS Check" type="button" className="p-button-secondary p-button-lg" />
                </div>
                <p className="text-sm mt-4 text-color-secondary">Get your first resume & personal website FREE. Beat the ATS today!</p>
            </div>
             <div className="col-12 lg:col-6 mt-5 lg:mt-0 flex justify-content-center align-items-center">
                 {/* More engaging, creative image */}
                <img
                    src="https://images.unsplash.com/photo-1554774853-719586f82d77?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600" // Abstract Flowing lines/shapes
                    alt="Abstract representation of career flow and breaking barriers"
                    className="w-full lg:w-10 border-round" // Slightly smaller on large screens
                    style={{
                        maxWidth: '600px', // Max width for very large screens
                        aspectRatio: '1/1', // Make it square-ish
                        objectFit: 'cover',
                         boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)', // Softer, larger shadow
                        borderRadius: '50px 10px 50px 10px' // Creative border radius
                    }}
                />
            </div>
        </div>
    );
};

// --- The Struggle Section ---
const StruggleSection = () => {
    return (
        <div id="struggle" className="section-padding surface-section">
            <div className="text-center mb-6">
                 <i className="pi pi-exclamation-triangle text-4xl text-amber-500 mb-3"></i>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Let's Be Honest, Job Hunting is <span className="text-primary">Tough</span>.</h2>
                <p className="text-lg md:text-xl text-color-secondary max-w-3xl mx-auto">
                    You pour hours into crafting the "perfect" resume, tailor cover letters, hit 'Apply', and then... crickets <i className="pi pi-volume-off"></i>. It's demoralizing. You start to wonder:
                </p>
            </div>

            <div className="grid text-center md:text-left">
                {/* Pain Point 1: Rejection & ATS */}
                <div className="col-12 md:col-6 lg:col-4 p-4 flex">
                    <Card className="w-full flex flex-column">
                         <i className="pi pi-shield-check text-3xl text-red-500 mb-3"></i>
                        <h4 className="font-semibold text-xl mb-2">The ATS Gatekeeper</h4>
                        <p className="text-color-secondary text-sm flex-grow-1">
                            "Is my resume even being seen by a human? Am I just keywords on a screen?" You feel like you're shouting into the void, judged by robots.
                        </p>
                    </Card>
                </div>
                 {/* Pain Point 2: Time Sink */}
                <div className="col-12 md:col-6 lg:col-4 p-4 flex">
                     <Card className="w-full flex flex-column">
                        <i className="pi pi-spin pi-spinner text-3xl text-blue-500 mb-3"></i>
                        <h4 className="font-semibold text-xl mb-2">The Customization Grind</h4>
                         <p className="text-color-secondary text-sm flex-grow-1">
                            "Another Saturday spent tweaking resumes... for *one* application?" It's exhausting, repetitive, and steals time you could use for networking or upskilling.
                        </p>
                     </Card>
                </div>
                 {/* Pain Point 3: Feeling Generic / Lost */}
                <div className="col-12 md:col-6 lg:col-4 p-4 flex">
                     <Card className="w-full flex flex-column">
                         <i className="pi pi-map text-3xl text-gray-500 mb-3"></i>
                        <h4 className="font-semibold text-xl mb-2">Standing Out Feels Impossible</h4>
                         <p className="text-color-secondary text-sm flex-grow-1">
                            "Everyone's resume looks the same. How do I show *my* unique value?" You lack a portfolio, a personal site, that extra edge to truly impress. You feel lost in the crowd.
                         </p>
                     </Card>
                </div>
                 {/* Pain Point 4: Students/Internships */}
                <div className="col-12 md:col-6 lg:col-4 p-4 flex">
                     <Card className="w-full flex flex-column">
                         <i className="pi pi-book text-3xl text-green-500 mb-3"></i>
                        <h4 className="font-semibold text-xl mb-2">Students & Intern Seekers</h4>
                         <p className="text-color-secondary text-sm flex-grow-1">
                             Applying for internships or scholarships? You need to showcase potential and projects professionally, but building that first impressive profile feels overwhelming.
                         </p>
                     </Card>
                </div>
                 {/* Missing Out */}
                <div className="col-12 lg:col-8 p-4 flex items-center justify-center">
                    <div className="text-center lg:text-left bg-primary-reverse p-5 border-round" style={{ background: 'var(--highlight-bg)', borderLeft: `4px solid var(--primary-color)` }}>
                        <h3 className="mt-0 text-primary">Are You Missing Opportunities?</h3>
                        <p className="text-color-secondary m-0">
                             Without tailored materials for each application, a professional portfolio, or a personal website, you might be. Don't let outdated methods hold you back. It's time to leverage modern tools.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
    );
};


// --- Features Section Component (Solution Focused) ---
const FeaturesSection = () => {
    return (
        <div id="features" className="section-padding surface-ground">
            <div className="text-center mb-6">
                <i className="pi pi-bolt text-4xl text-secondary-color mb-3"></i>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Introducing CareerFlow AI: Your <span className="animated-gradient-text">Unfair Advantage</span></h2>
                <p className="text-lg md:text-xl text-color-secondary max-w-3xl mx-auto">
                    Stop struggling, start flowing. We combine the power of AI with your unique story to create application materials that don't just pass the test – they impress. ✨
                </p>
            </div>

             <div className="grid text-center">
                {/* Feature 1: AI Creation */}
                <div className="col-12 md:col-6 lg:col-3 p-3">
                    <i className="pi pi-file-edit icon-feature bg-primary-light"></i>
                    <h4 className="font-semibold text-xl mb-2">AI-Powered Tailoring</h4>
                    <p className="text-color-secondary text-sm">
                        Instantly generate resumes, cover letters, and more, perfectly matched to the job description. No more generic content!
                    </p>
                </div>
                 {/* Feature 2: ATS & Beyond */}
                <div className="col-12 md:col-6 lg:col-3 p-3">
                     <i className="pi pi-shield-check icon-feature bg-secondary-light"></i>
                    <h4 className="font-semibold text-xl mb-2">Beat ATS & Impress Humans</h4>
                    <p className="text-color-secondary text-sm">
                        Built-in ATS optimization gets you seen. Professional designs & tailored content win over recruiters. Plus, a FREE ATS checker!
                    </p>
                </div>
                 {/* Feature 3: Website/Portfolio */}
                <div className="col-12 md:col-6 lg:col-3 p-3">
                    <i className="pi pi-globe icon-feature bg-accent-light"></i>
                    <h4 className="font-semibold text-xl mb-2">Instant Personal Website</h4>
                    <p className="text-color-secondary text-sm">
                         AI creates a sleek, editable website from your resume in minutes. Showcase projects, tell your story, get a shareable link.
                    </p>
                </div>
                 {/* Feature 4: AI Editing */}
                <div className="col-12 md:col-6 lg:col-3 p-3">
                     <i className="pi pi-sparkles icon-feature bg-red-light"></i> {/* Using sparkles */}
                    <h4 className="font-semibold text-xl mb-2">Effortless AI Editing</h4>
                    <p className="text-color-secondary text-sm">
                        "Rewrite this section to sound more confident." Just ask! Edit anything in real-time with simple prompts. Magic!
                    </p>
                </div>
            </div>

            {/* AI + You Section */}
            <div className="grid mt-6 align-items-center surface-section p-4 md:p-6 border-round" style={{ border: `1px solid var(--surface-border)`}}>
                 <div className="col-12 md:col-6">
                      <img
                        src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" // Collaborative / Creative Tech
                        alt="AI enhancing human creativity on a screen"
                        className="w-full border-round"
                        style={{
                             boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
                             maxHeight: '400px',
                             objectFit: 'cover'
                        }}
                    />
                 </div>
                <div className="col-12 md:col-6 pl-0 md:pl-5 mt-4 md:mt-0">
                     <h3 className="text-2xl md:text-3xl font-bold mb-3 text-primary">It's <span className="underline decoration-secondary-color decoration-4">Your</span> Story, Amplified by AI <i className="pi pi-megaphone"></i></h3>
                    <p className="text-color-secondary mb-4">
                        This isn't about replacing you. CareerFlow AI is your co-pilot. We handle the tedious parts – formatting, keyword optimization, initial drafts – freeing you to inject your personality, refine your narrative, and showcase what makes you unique.
                    </p>
                    <ul className="list-none p-0 m-0">
                        <li className="flex align-items-center mb-2"><i className="pi pi-check-circle text-secondary-color mr-2"></i><span>Combine AI efficiency with your creativity.</span></li>
                        <li className="flex align-items-center mb-2"><i className="pi pi-check-circle text-secondary-color mr-2"></i><span>Easily edit and personalize every detail.</span></li>
                        <li className="flex align-items-center"><i className="pi pi-check-circle text-secondary-color mr-2"></i><span>Create materials that truly reflect *you*.</span></li>
                    </ul>
                     <Button label="See AI Editing in Action" icon="pi pi-video" className="p-button-secondary mt-4" />
                </div>
            </div>
        </div>
    );
};


// --- Free ATS Checker Callout ---
const ATSCheckerSection = () => {
    return (
        <div id="ats-checker" className="section-padding text-center" style={{ background: 'linear-gradient(180deg, var(--primary-color), var(--primary-dark))', color: '#FFF' }}>
            <i className="pi pi-shield text-6xl mb-4"></i>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Still Wondering About Your Resume Score?</h2>
            <p className="text-lg md:text-xl line-height-3 mb-5 max-w-3xl mx-auto text-indigo-100">
                Stop guessing! Upload your current resume (yes, even that old one!) and get an instant, 100% FREE ATS compatibility check with actionable feedback. Know where you stand in seconds.
            </p>
            <Button label="Check My Resume Score Now - FREE!" icon="pi pi-upload" className="p-button-lg p-button-secondary" style={{ color: '#FFF !important', borderColor: '#FFF !important', background: 'rgba(255,255,255,0.1) !important' }} />
             <p className="text-sm mt-3 text-indigo-200">No signup required for the check!</p>
        </div>
    );
}


// --- Pricing Section Component ---
const PricingSection = () => {
    // Add state for potential toggle (Monthly/Yearly) if needed later
    // const [billingCycle, setBillingCycle] = useState('monthly');

    return (
        <div id="pricing" className="section-padding surface-section">
            <div className="text-center mb-6">
                <i className="pi pi-tag text-4xl text-primary mb-3"></i>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Flexible Plans for Your Journey</h2>
                <p className="text-lg md:text-xl text-color-secondary max-w-3xl mx-auto">
                    Start free, upgrade when you're ready to accelerate. Simple, transparent pricing.
                    {/* Add Monthly/Yearly toggle here if desired */}
                </p>
            </div>

            <div className="grid justify-content-center">
                 {/* Free Plan */}
                <div className="col-12 md:col-6 lg:col-4 p-3 flex">
                    <Card className="p-4 h-full flex flex-column border-1 surface-border w-full">
                        <div className="text-center mb-4">
                            <div className="text-900 font-medium text-xl mb-2">Free Forever</div>
                             <i className="pi pi-gift text-4xl text-secondary-color"></i>
                         </div>
                        <Divider className="my-3 mx-0" />
                         <div className="text-center">
                             <span className="font-bold text-4xl text-900">$0</span>
                         </div>
                        <Divider className="my-3 mx-0" />
                        <ul className="list-none p-0 m-0 flex-grow-1 text-sm">
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>1 AI Resume</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>1 AI Personal Website</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Unlimited Free ATS Checks</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Basic Templates</span></li>
                             <li className="flex align-items-center mb-2 text-color-secondary"><i className="pi pi-times text-red-500 mr-2"></i><span>Limited AI Edits</span></li>
                        </ul>
                         <div className="mt-auto pt-3">
                            <Button label="Start Free Now" className="w-full p-button-secondary mt-3" />
                        </div>
                    </Card>
                </div>

                 {/* Pro Plan (Highlighted) */}
                <div className="col-12 md:col-6 lg:col-4 p-3 flex">
                     <Card className="p-4 h-full flex flex-column border-2 border-primary w-full relative overflow-hidden" style={{ transform: 'scale(1.03)' }}>
                        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1" style={{ borderBottomLeftRadius: 'var(--border-radius)' }}>MOST POPULAR</div>
                        <div className="text-center mb-4">
                             <div className="text-900 font-medium text-xl mb-2">Pro Power</div>
                             <i className="pi pi-rocket text-4xl text-primary"></i>
                        </div>
                        <Divider className="my-3 mx-0" />
                         <div className="text-center">
                             <span className="font-bold text-4xl text-900">$19</span> {/* Example Price */}
                            <span className="ml-1 font-medium text-600">/mo</span>
                        </div>
                        <Divider className="my-3 mx-0" />
                        <ul className="list-none p-0 m-0 flex-grow-1 text-sm">
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span><strong>Unlimited</strong> AI Resumes & Docs</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span><strong>Unlimited</strong> AI Websites & Portfolios</span></li>
                             <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Advanced AI Editing & Prompts</span></li>
                             <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Premium ATS Templates</span></li>
                             <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Portfolio Collections per Job</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Priority Support</span></li>
                        </ul>
                        <div className="mt-auto pt-3">
                             <Button label="Unlock Pro Power" className="w-full p-button-primary mt-3" />
                         </div>
                    </Card>
                </div>

                 {/* Teams Plan */}
                 <div className="col-12 md:col-6 lg:col-4 p-3 flex">
                    <Card className="p-4 h-full flex flex-column border-1 surface-border w-full">
                         <div className="text-center mb-4">
                             <div className="text-900 font-medium text-xl mb-2">Teams & Orgs</div>
                             <i className="pi pi-users text-4xl text-accent-color"></i>
                         </div>
                        <Divider className="my-3 mx-0" />
                         <div className="text-center">
                             <span className="font-bold text-4xl text-900">Custom</span>
                         </div>
                        <Divider className="my-3 mx-0" />
                        <ul className="list-none p-0 m-0 flex-grow-1 text-sm">
                             <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Everything in Pro, plus:</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Team Seats & Management</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Custom Branding Options</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Usage Analytics</span></li>
                            <li className="flex align-items-center mb-2"><i className="pi pi-check text-green-500 mr-2"></i><span>Dedicated Support</span></li>
                         </ul>
                         <div className="mt-auto pt-3">
                             <Button label="Contact Sales" className="w-full p-button-outlined mt-3" />
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};


// --- Footer Component ---
const Footer = () => {
    return (
        <div className="py-6 px-4 lg:px-8 mx-0 mt-8 surface-ground">
            <div className="grid">
                <div className="col-12 md:col-4 mb-4 md:mb-0">
                     <Link href="/" className="flex align-items-center mb-3">
                        <i className="pi pi-send mr-2 text-primary" style={{ fontSize: '1.5rem', transform: 'rotate(-45deg)' }}></i>
                        <span className="font-bold text-xl text-color">CareerFlow AI</span>
                    </Link>
                    <p className="text-sm text-color-secondary line-height-3">
                        Stop the job hunt grind. Start landing interviews with AI-powered resumes, cover letters, and portfolios.
                    </p>
                     <div className="mt-3 flex gap-2">
                        <Button icon="pi pi-linkedin" className="p-button-rounded p-button-text text-color-secondary" />
                        <Button icon="pi pi-twitter" className="p-button-rounded p-button-text text-color-secondary" />
                        <Button icon="pi pi-github" className="p-button-rounded p-button-text text-color-secondary" />
                     </div>
                 </div>

                 <div className="col-12 md:col-8">
                     <div className="grid">
                        <div className="col-6 md:col-3">
                            <h5 className="font-semibold text-lg mt-0 mb-3 text-color">Product</h5>
                            <ul className="list-none p-0 m-0">
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Features</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Pricing</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">ATS Checker</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Templates</a></li>
                            </ul>
                        </div>
                         <div className="col-6 md:col-3">
                            <h5 className="font-semibold text-lg mt-0 mb-3 text-color">Resources</h5>
                             <ul className="list-none p-0 m-0">
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Blog</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Guides</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">FAQ</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Support</a></li>
                            </ul>
                        </div>
                        <div className="col-6 md:col-3 mt-4 md:mt-0">
                             <h5 className="font-semibold text-lg mt-0 mb-3 text-color">Company</h5>
                             <ul className="list-none p-0 m-0">
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">About Us</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Careers</a></li>
                                <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Contact</a></li>
                             </ul>
                        </div>
                        <div className="col-6 md:col-3 mt-4 md:mt-0">
                            <h5 className="font-semibold text-lg mt-0 mb-3 text-color">Legal</h5>
                             <ul className="list-none p-0 m-0">
                                 <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Privacy Policy</a></li>
                                 <li className="mb-2"><a className="text-color-secondary hover:text-primary cursor-pointer">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
             </div>
            <Divider />
             <p className="text-center text-sm text-color-secondary">© {new Date().getFullYear()} CareerFlow AI. All rights reserved. Made with <i className="pi pi-heart-fill text-primary"></i> to help you succeed.</p>
        </div>
    );
};


// --- Main Landing Page Component ---
const LandingPage = () => {

    // Basic fade-in effect on scroll (optional, might need IntersectionObserver for robust implementation)
     useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                 if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');
                 }
            });
        }, { threshold: 0.1 }); // Trigger when 10% visible

        const elements = document.querySelectorAll('.fade-in');
         elements.forEach(el => observer.observe(el));

         return () => elements.forEach(el => observer.unobserve(el)); // Cleanup
     }, []);


    return (
        <>
            <GlobalStyles />
            <div className="landing-wrapper w-full">
                 <Header />
                <HeroSection />
                <StruggleSection /> {/* Added the new emotional pain point section */}
                <FeaturesSection />
                <ATSCheckerSection /> {/* Added dedicated ATS checker section */}
                <PricingSection />
                 <Footer />
            </div>
        </>
    );
};

export default LandingPage;
