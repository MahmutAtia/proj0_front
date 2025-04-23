'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
// Import desired icons from react-icons
import { FiArrowRight, FiCheckCircle, FiXCircle, FiUploadCloud, FiCpu, FiGlobe, FiEdit, FiUsers, FiGift, FiShield, FiClock, FiEye, FiTrendingUp, FiZap, FiMenu, FiX } from 'react-icons/fi';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5'; // Example specific icon


// import components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StruggleSection from './components/StruggleSection';
import FeaturesSection from './components/FeaturesSection'; // Import the refactored component
import PricingSection from './components/PricingSection'; // Import the refactored component
import HowItWorksSection from './components/HowItWorksSection'; // Import the refactored component
import ATSCheckerSection from './components/ATSCheckerSection'; // Import the refactored component
import Footer from './components/Footer'; // Import the refactored component
import './styles/globals.css'; // Import the global CSS file

 // Import the page-specific module

const LandingPage = () => {
    return (
        // Apply the wrapper class to the top-level element for this page
        <div>
            <Header />
            <main>
                <HeroSection />
                <StruggleSection />
                <FeaturesSection />
                <HowItWorksSection />
                <ATSCheckerSection />
                <PricingSection />

                {/* <TestimonialsSection /> */}

            </main>
            <Footer />
        </div>
    );
};
export default LandingPage;
