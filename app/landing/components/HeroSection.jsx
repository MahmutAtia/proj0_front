import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi'; // Changed icon
import styles from '../styles/HeroSection.module.css'; // Import CSS Module

// Animation Variants
const staggerContainer = (staggerChildren, delayChildren) => ({
    hidden: {},
    visible: {
        transition: { staggerChildren, delayChildren: delayChildren || 0 },
    },
});

const fadeInUp = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const buttonHoverTap = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
};

const HeroSection = () => {
    // Note: Removed parallax for simplification, focus on static layout first
    // const { scrollYProgress } = useScroll();
    // const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <section id="hero" className={styles.heroSection}>
            <div className={`container ${styles.heroContainer}`}>
                <motion.div
                    className={styles.heroContent}
                    variants={staggerContainer(0.15, 0.1)}
                    initial="hidden"
                    animate="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                        Stop Guessing, Start <span className={styles.highlight}>Landing Interviews</span>.
                    </motion.h1>
                    <motion.p variants={fadeInUp} className={styles.heroSubtitle}>
                        Transform your resume and portfolio with AI insights. Create applications that recruiters and ATS systems actually notice.
                    </motion.p>
                    <motion.div variants={fadeInUp} className={styles.heroActions}>
                        <motion.button
                           className={`button button-primary ${styles.heroButton}`} // Use global button styles + specific hero button style if needed
                           variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                           onClick={() => console.log("Navigate to AI Resume Builder")}
                        >
                            Build My AI Resume <FiArrowRight size="1.1em" />
                        </motion.button>
                        <motion.button
                           className={`button button-secondary ${styles.heroButton}`}
                           variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                           onClick={() => console.log("Navigate to ATS Checker")}
                        >
                            Check ATS Compatibility <FiCheckCircle size="1.1em" />
                        </motion.button>
                    </motion.div>
                </motion.div>
                <motion.div
                    className={styles.heroImageContainer}
                    // style={{ y }} // Add back if parallax is desired
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                >
                    <img
                        // --- NEWER, MORE RELATED IMAGE ---
                        src="https://images.unsplash.com/photo-1573496130407-57329f01f769?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Confident professional woman (implies success)
                        alt="Professional looking confident after optimizing their career application"
                        loading="eager"
                        width="870" // Aspect ratio 1740/1160 = 1.5 -> 870 * 1.5 = 1305 (adjust as needed)
                        height="580"
                        className={styles.heroImage}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
