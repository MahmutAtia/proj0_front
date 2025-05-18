"use client"; // This component is a client component

import React from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiZap, FiUsers, FiCheckCircle } from 'react-icons/fi';
import styles from '../styles/PricingSection.module.css'; // Import the CSS module

// --- Framer Motion Variants (assuming these are defined elsewhere or pass as props) ---
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } },
};

const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    initial: {},
    animate: {
        transition: {
            staggerChildren: staggerChildren,
            delayChildren: delayChildren,
        },
    },
});

const buttonHover = {
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
    tap: { scale: 0.95 },
};

// Optional: Define card hover variant if you want Framer Motion to handle scale
const cardHover = {
    rest: { scale: 1 },
    hover: { scale: 1.03, transition: { type: 'spring', stiffness: 250 } }
};


// --- Pricing Section ---
const PricingSection = () => {
    const plans = [
        { name: "Starter", price: "$0", tagline: "The essentials, free forever.", icon: FiGift, features: ["1 AI Resume", "1 AI Website", "Unlimited ATS Checks", "Basic Templates"], buttonLabel: "Start Free Now", buttonClass: "button-secondary" },
        { name: "Pro", price: "$19", priceSuffix: "/mo", tagline: "Unlock your full potential.", icon: FiZap, features: ["Unlimited Resumes & Docs", "Unlimited Websites", "Advanced AI Editing", "Premium Templates", "Portfolio Collections", "Priority Support"], buttonLabel: "Go Pro", buttonClass: "button-primary", popular: true },
        { name: "Teams", price: "Custom", tagline: "For career centers & orgs.", icon: FiUsers, features: ["Everything in Pro", "Team Management", "Custom Branding", "Analytics", "Dedicated Support"], buttonLabel: "Contact Sales", buttonClass: "button-secondary" }
    ];

    return (
        <section id="pricing" className={`${styles.container || ''} section-padding`}> {/* Add a background class if needed */}
            <motion.div
                className={`${styles.textCenter} ${styles.marginBottom6}`}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
            >
                <h2 className={styles.heading}>Simple Plans, Powerful Results</h2>
                <p className={styles.subheading}>
                    Choose the plan that fits your journey. Start free, upgrade anytime. No hidden fees.
                </p>
                {/* Add Monthly/Annual Toggle Here if desired */}
            </motion.div>

            <motion.div
                className={styles.pricingGrid}
                variants={staggerContainer(0.1)}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.1 }}
            >
                {plans.map((plan) => (
                    <motion.div
                        key={plan.name}
                        className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
                        variants={fadeInUp} // Use fadeInUp for entry animation
                        // Optional: Use Framer Motion for hover scale if preferred over CSS transform
                        // initial="rest" whileHover="hover" animate="rest" variants={cardHover}
                    >
                        {plan.popular && <div className={styles.popularBadge}>POPULAR</div>}
                        <div className={styles.textCenter}>
                            <plan.icon
                                className={styles.planIcon}
                                // Use CSS variables directly for dynamic color based on popularity
                                style={{ color: plan.popular ? 'var(--primary)' : 'var(--secondary)' }}
                            />
                            <h3 className={styles.planName}>{plan.name}</h3>
                            <p className={styles.planTagline}>{plan.tagline}</p>
                            <div className={styles.priceWrapper}>
                                <span className={styles.priceAmount}>{plan.price}</span>
                                {plan.priceSuffix && <span className={styles.priceSuffix}>{plan.priceSuffix}</span>}
                            </div>
                        </div>
                        <ul className={styles.featuresList}>
                            {plan.features.map(feature => (
                                <li key={feature} className={styles.featureItem}>
                                    <FiCheckCircle className={styles.checkIcon}/> {feature}
                                </li>
                            ))}
                        </ul>
                        <motion.button
                            // Combine global button class with module-specific and dynamic classes
                            className={`button ${plan.buttonClass} ${styles.buttonFullWidth} ${styles.marginTopAuto}`}
                            variants={buttonHover}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {plan.buttonLabel}
                        </motion.button>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

export default PricingSection; // Make sure to export
