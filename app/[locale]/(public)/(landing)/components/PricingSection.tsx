"use client"; // This component is a client component

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiZap, FiUsers, FiCheckCircle, FiLoader, FiAlertTriangle, FiShoppingCart, FiBriefcase, FiStar } from 'react-icons/fi'; // Added more icons for variety
import axios from 'axios';
import styles from '../styles/PricingSection.module.css';

// --- Framer Motion Variants ---
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

// --- Icon Mapping ---
// Helper to map plan names or IDs to icons if not provided directly by backend
const iconMap: { [key: string]: React.ElementType } = {
    default: FiShoppingCart, // Default icon
    starter: FiGift,
    basic: FiGift,
    free: FiGift,
    pro: FiZap,
    professional: FiZap,
    premium: FiStar,
    business: FiBriefcase,
    teams: FiUsers,
    enterprise: FiUsers,
    // Add more specific mappings based on your plan names/slugs if needed
};

const getPlanIcon = (planName?: string): React.ElementType => {
    if (planName) {
        const lowerPlanName = planName.toLowerCase();
        for (const key in iconMap) {
            if (lowerPlanName.includes(key)) {
                return iconMap[key];
            }
        }
    }
    return iconMap.default;
};


// --- Pricing Section ---
const PricingSection = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPricingPlans = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Using the endpoint from PlansPage.jsx
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans/`);

                // Map backend data to the structure expected by this component
                const formattedPlans = response.data.map((plan: any) => ({
                    id: plan.id,
                    name: plan.name,
                    price: `$${plan.price}`, // Assuming price is a number from backend
                    priceSuffix: plan.billing_period ? `/${plan.billing_period}` : null,
                    tagline: plan.description || `Explore the ${plan.name} plan.`, // Use description as tagline
                    iconComponent: getPlanIcon(plan.name), // Dynamically get icon
                    features: plan.features || [],
                    buttonLabel: (currentSubscription: any | null) => { // Function to determine button label
                        if (currentSubscription?.plan?.id === plan.id && !currentSubscription?.is_canceling) {
                            return "Current Plan";
                        }
                        if (currentSubscription?.plan?.id === plan.id && currentSubscription?.is_canceling) {
                            return "Reactivate";
                        }
                        return plan.name?.toLowerCase().includes('free') || plan.price === "0" || plan.price === 0 ? "Get Started Free" : "Choose Plan";
                    },
                    buttonClass: plan.is_popular ? 'button-primary' : 'button-secondary',
                    popular: plan.is_popular || false,
                    actionUrl: `/main/plans#${plan.id}`, // Link to the plans page, potentially with an anchor
                }));
                setPlans(formattedPlans);
            } catch (err) {
                console.error("Error fetching pricing plans:", err);
                setError("Failed to load pricing plans. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPricingPlans();
    }, []);

    // Note: To make buttonLabel dynamic based on subscription, you'd need to fetch
    // currentSubscription status here as well, or pass it down if this component
    // is used within an authenticated context. For simplicity, this example
    // assumes a generic button label logic.

    if (isLoading) {
        return (
            <section id="pricing" className={`${styles.container || ''} section-padding ${styles.textCenter}`}>
                <FiLoader className={`${styles.loadingIcon} spin`} size={48} />
                <p className={styles.subheading}>Loading pricing plans...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section id="pricing" className={`${styles.container || ''} section-padding ${styles.textCenter}`}>
                <FiAlertTriangle className={styles.errorIcon} size={48} />
                <h2 className={styles.heading}>Oops! Something went wrong.</h2>
                <p className={styles.subheading}>{error}</p>
            </section>
        );
    }

    if (plans.length === 0) {
        return (
            <section id="pricing" className={`${styles.container || ''} section-padding ${styles.textCenter}`}>
                <h2 className={styles.heading}>No Plans Available</h2>
                <p className={styles.subheading}>
                    Pricing plans are currently unavailable. Please check back later.
                </p>
            </section>
        );
    }

    return (
        <section id="pricing" className={`${styles.container || ''} section-padding`}>
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
            </motion.div>

            <motion.div
                className={styles.pricingGrid}
                variants={staggerContainer(0.1)}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.1 }}
            >
                {plans.map((plan) => {
                    const PlanIcon = plan.iconComponent; // Use the mapped component
                    // For buttonLabel, if it's a function, you might call it here
                    // if you have access to subscription status. Otherwise, use as is.
                    const buttonLabelText = typeof plan.buttonLabel === 'function'
                        ? plan.buttonLabel(null) // Pass null or actual subscription if available
                        : plan.buttonLabel;

                    return (
                        <motion.div
                            key={plan.id}
                            className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
                            variants={fadeInUp}
                        >
                            {plan.popular && <div className={styles.popularBadge}>POPULAR</div>}
                            <div className={styles.textCenter}>
                                <PlanIcon
                                    className={styles.planIcon}
                                    style={{ color: plan.popular ? 'var(--primary)' : 'var(--secondary)' }}
                                />
                                <h3 className={styles.planName}>{plan.name}</h3>
                                <p className={styles.planTagline}>{plan.tagline}</p>
                                <div className={styles.priceWrapper}>
                                    <span className={styles.priceAmount}>{plan.price}</span>
                                    {plan.priceSuffix && <span className={styles.priceSuffix}>{plan.priceSuffix}</span>}
                                </div>
                            </div>

                            <motion.button
                                className={`button ${plan.buttonClass} ${styles.buttonFullWidth} ${styles.marginTopAuto}`}
                                variants={buttonHover}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => window.location.href = plan.actionUrl}
                            >
                                {buttonLabelText}
                            </motion.button>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
};


export default PricingSection;
// <ul className={styles.featuresList}>
//     {plan.features.map((feature: string) => (
//         <li key={feature} className={styles.featureItem}>
//             <FiCheckCircle className={styles.checkIcon} /> {feature}
//         </li>
//     ))}
// </ul>
