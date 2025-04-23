import React from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiShield, FiGlobe, FiEdit, FiZap } from 'react-icons/fi';
import styles from '../styles/FeaturesSection.module.css'; // Import the CSS module

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

// --- Features Section (Your Edge) ---
const FeaturesSection = () => {
    const features = [
        { icon: FiCpu, title: "Hyper-Personalized AI Drafts", text: "AI analyzes job descriptions AND your profile to craft unique, targeted resumes & letters in seconds. Say goodbye to generic!" },
        { icon: FiShield, title: "Conquer the ATS", text: "Optimized formatting, keyword analysis, and a FREE instant ATS score checker ensure you pass the bots." },
        { icon: FiGlobe, title: "Your Own Corner of the Web", text: "Generate a stunning, professional website & portfolio from your resume. Easily edit with AI, share instantly." },
        { icon: FiEdit, title: "AI Editing Magic Wand", text: "Need a section stronger? More concise? Just ask the AI. Edit anything in real-time with simple prompts. ✨" },
    ];

    return (
        <section id="features" className={`${styles.sectionBgGradient} section-padding`}>
            <div className={styles.container}>
                <motion.div
                    className={`${styles.textCenter} ${styles.marginBottom6}`}
                    variants={fadeInUp}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    <FiZap className={styles.iconZap} />
                    <h2 className={styles.heading}>Your New Edge: <span className={styles.gradientText}>AI + Your Brilliance</span></h2>
                    <p className={styles.subheading}>
                        CareerFlow AI isn't just another tool. It's your intelligent partner, designed to amplify your strengths and navigate the complexities of the modern job market.
                    </p>
                </motion.div>

                <motion.div
                    className={styles.featuresGrid}
                    variants={staggerContainer(0.15)} // Slightly increased stagger
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            className={styles.featureCard}
                            variants={fadeInUp} // Use fadeInUp for individual card animation
                            whileHover={{ y: -5 }} // Framer Motion hover effect (optional, CSS handles transform)
                            transition={{ type: 'spring', stiffness: 300 }} // Springy effect on hover
                        >
                            <div className={styles.featureIconWrapper}>
                                <feature.icon className={styles.featureIcon} />
                            </div>
                            <h4 className={styles.featureTitle}>{feature.title}</h4>
                            <p className={styles.featureText}>{feature.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturesSection; // Make sure to export if it's in its own file
