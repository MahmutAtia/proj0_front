// 'use client';
// import React, { useState, useRef, useEffect } from 'react';
// import Link from 'next/link';
// import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
// // Import desired icons from react-icons
// import { FiArrowRight, FiCheckCircle, FiXCircle, FiUploadCloud, FiCpu, FiGlobe, FiEdit, FiUsers, FiGift, FiShield, FiClock, FiEye, FiTrendingUp, FiZap, FiMenu, FiX } from 'react-icons/fi';
// import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
// import { IoSparkles } from 'react-icons/io5'; // Example specific icon

// // --- Framer Motion Variants ---
// const fadeInUp = {
//     initial: { opacity: 0, y: 40 },
//     animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }, // Custom ease
// };

// const fadeIn = {
//     initial: { opacity: 0 },
//     animate: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
// };

// const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
//     initial: {},
//     animate: {
//         transition: {
//             staggerChildren: staggerChildren,
//             delayChildren: delayChildren,
//         },
//     },
// });

// const buttonHover = {
//     hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
//     tap: { scale: 0.95 },
// };

// const cardHover = {
//      rest: { scale: 1, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)' },
//      hover: { scale: 1.03, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', transition: { type: 'spring', stiffness: 250 } }
// };

// // --- Global Styles & CSS Variables ---
// const GlobalStyles = () => (
//     <style jsx global>{`
//         @import url('https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap'); /* Example FontShare */
//         /* Add Inter or other fallbacks */

//         :root {
//             --primary: #581C87; /* Deep Purple */
//             --primary-light: #A855F7;
//             --secondary: #EC4899; /* Vivid Pink */
//             --accent: #06B6D4; /* Bright Cyan */
//             --success: #10B981; /* Emerald Green */
//             --warning: #F59E0B; /* Amber */
//             --danger: #EF4444; /* Red */

//             --bg-light: #F8FAFC; /* Very Light Gray/Off-white */
//             --bg-dark: #020617; /* Very Dark Blue/Near Black */
//             --card-bg: #FFFFFF;
//             --border-light: #E2E8F0;
//             --border-dark: #334155;

//             --text-dark: #0F172A; /* Slate 900 */
//             --text-light: #F1F5F9; /* Slate 100 */
//             --text-muted-dark: #64748B; /* Slate 500 */
//             --text-muted-light: #94A3B8; /* Slate 400 */

//             --font-primary: 'General Sans', 'Inter', sans-serif;
//             --font-headings: 'General Sans', 'Inter', sans-serif; /* Could be different */

//             --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
//             --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
//             --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
//             --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

//             --border-radius: 12px;
//             --transition-speed: 0.3s;
//         }

//         *, *::before, *::after {
//             box-sizing: border-box;
//             margin: 0;
//             padding: 0;
//         }

//         html {
//              scroll-behavior: smooth;
//         }

//         body {
//             font-family: var(--font-primary);
//             background-color: var(--bg-light);
//             color: var(--text-dark);
//             line-height: 1.7;
//             font-size: 16px; /* Base font size */
//             -webkit-font-smoothing: antialiased;
//             -moz-osx-font-smoothing: grayscale;
//         }

//         h1, h2, h3, h4, h5, h6 {
//             font-family: var(--font-headings);
//             font-weight: 700;
//             color: var(--text-dark);
//             line-height: 1.3;
//             margin-bottom: 1rem;
//         }
//         h1 { font-size: clamp(2.5rem, 5vw + 1rem, 4.5rem); } /* Responsive heading */
//         h2 { font-size: clamp(2rem, 4vw + 1rem, 3.5rem); }
//         h3 { font-size: clamp(1.5rem, 3vw + 1rem, 2.5rem); }
//         h4 { font-size: clamp(1.2rem, 2vw + 1rem, 1.75rem); }

//         p {
//             color: var(--text-muted-dark);
//             margin-bottom: 1.25rem;
//             max-width: 65ch; /* Improve readability */
//             font-size: 1rem; /* ~16px */
//         }
//         @media (min-width: 768px) {
//              p { font-size: 1.125rem; } /* ~18px */
//         }

//         a {
//             color: var(--primary);
//             text-decoration: none;
//             transition: color var(--transition-speed) ease;
//         }
//         a:hover {
//             color: var(--primary-light);
//         }

//         .container {
//             width: 90%;
//             max-width: 1200px;
//             margin: 0 auto;
//             padding: 4rem 0; /* Vertical padding */
//         }
//         @media (min-width: 1024px) {
//              .container { padding: 6rem 0; }
//         }

//         .section-bg-gradient {
//             background: linear-gradient(180deg, var(--bg-light) 0%, #F0E7F9 100%); /* Light purple tint */
//         }
//          .section-bg-dark {
//              background-color: var(--bg-dark);
//              color: var(--text-light);
//          }
//          .section-bg-dark h1, .section-bg-dark h2, .section-bg-dark h3, .section-bg-dark h4 {
//              color: var(--text-light);
//          }
//          .section-bg-dark p {
//              color: var(--text-muted-light);
//          }

//          .button {
//             display: inline-flex;
//             align-items: center;
//             justify-content: center;
//             gap: 0.5rem;
//             padding: 0.8rem 1.8rem;
//             border-radius: 50px; /* Pill shape */
//             font-weight: 600;
//             font-size: 1rem;
//             border: none;
//             cursor: pointer;
//             transition: all var(--transition-speed) ease;
//             text-align: center;
//          }
//          .button-primary {
//             background: linear-gradient(90deg, var(--primary), var(--primary-light));
//             color: var(--text-light);
//             box-shadow: 0 4px 15px rgba(88, 28, 135, 0.3);
//          }
//          .button-primary:hover {
//              box-shadow: 0 6px 20px rgba(88, 28, 135, 0.4);
//              /* Slightly shift gradient maybe? */
//          }
//          .button-secondary {
//             background: transparent;
//             color: var(--primary);
//             border: 2px solid var(--primary);
//          }
//          .button-secondary:hover {
//              background: rgba(88, 28, 135, 0.05);
//              color: var(--primary); /* Keep color or slightly darken */
//          }
//         .button-accent {
//             background: var(--accent);
//             color: var(--text-dark);
//              box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
//          }
//         .button-accent:hover {
//              background: #0891B2; /* Darker cyan */
//               box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
//          }

//          .gradient-text {
//             background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
//             background-size: 200% auto;
//             color: #000;
//             background-clip: text;
//             -webkit-background-clip: text;
//             -webkit-text-fill-color: transparent;
//             animation: gradient-flow 5s linear infinite;
//          }

//         @keyframes gradient-flow {
//             0% { background-position: 0% 50%; }
//             50% { background-position: 100% 50%; }
//             100% { background-position: 0% 50%; }
//         }

//         /* Add more utility classes or specific component styles as needed */
//         .text-center { text-align: center; }
//         .mx-auto { margin-left: auto; margin-right: auto; }
//         .mb-1 { margin-bottom: 0.25rem; }
//         .mb-2 { margin-bottom: 0.5rem; }
//         .mb-3 { margin-bottom: 0.75rem; }
//         .mb-4 { margin-bottom: 1rem; }
//         .mb-5 { margin-bottom: 1.5rem; }
//         .mb-6 { margin-bottom: 2rem; }
//          .mt-4 { margin-top: 1rem; }
//          .mt-6 { margin-top: 2rem; }
//          .mt-8 { margin-top: 3rem; }
//     `}</style>
// );

// // --- Header Component ---
// const Header = () => {
//     const [isOpen, setIsOpen] = useState(false);
//     const headerRef = useRef(null);
//     const [isSticky, setIsSticky] = useState(false);

//      useEffect(() => {
//         const handleScroll = () => {
//             if (headerRef.current) {
//                 setIsSticky(window.scrollY > 80); // Adjust threshold as needed
//             }
//         };
//         window.addEventListener('scroll', handleScroll);
//         return () => window.removeEventListener('scroll', handleScroll);
//     }, []);

//     const navItems = [
//         { label: 'The Grind', href: '#struggle' },
//         { label: 'Your Edge', href: '#features' },
//         { label: 'How It Works', href: '#how-it-works' },
//         { label: 'Pricing', href: '#pricing' },
//         { label: 'ATS Check ✨', href: '#ats-checker', special: true },
//     ];

//     return (
//         <>
//             <motion.header
//                 ref={headerRef}
//                 className={`header ${isSticky ? 'sticky' : ''}`}
//                 initial={{ y: -100 }}
//                 animate={{ y: 0 }}
//                 transition={{ duration: 0.5, ease: 'easeOut' }}
//             >
//                 <div className="header-container">
//                     <Link href="/" passHref>
//                         <motion.a className="logo" whileHover={{ scale: 1.05 }}>
//                              <IoSparkles className="logo-icon" /> {/* Using a different icon */}
//                              <span>CareerFlow AI</span>
//                         </motion.a>
//                     </Link>

//                     <nav className="desktop-nav">
//                         <ul>
//                             {navItems.map((item) => (
//                                 <motion.li key={item.label} whileHover={{ y: -2 }}>
//                                     <Link href={item.href} className={item.special ? 'nav-link special' : 'nav-link'}>
//                                         {item.label}
//                                     </Link>
//                                 </motion.li>
//                             ))}
//                         </ul>
//                     </nav>

//                      <div className="desktop-actions">
//                         <motion.button className="button-secondary button-sm" variants={buttonHover} whileHover="hover" whileTap="tap">Login</motion.button>
//                         <motion.button className="button-primary button-sm" variants={buttonHover} whileHover="hover" whileTap="tap">Get Started Free</motion.button>
//                     </div>


//                     <motion.button
//                         className="mobile-menu-toggle"
//                         onClick={() => setIsOpen(!isOpen)}
//                         aria-label="Toggle menu"
//                         whileTap={{ scale: 0.9 }}
//                     >
//                         {isOpen ? <FiX /> : <FiMenu />}
//                     </motion.button>
//                 </div>

//                  {/* Mobile Menu */}
//                 <AnimatePresence>
//                     {isOpen && (
//                         <motion.nav
//                             className="mobile-nav"
//                             initial={{ opacity: 0, height: 0 }}
//                             animate={{ opacity: 1, height: 'auto' }}
//                             exit={{ opacity: 0, height: 0 }}
//                             transition={{ duration: 0.3, ease: 'easeInOut' }}
//                         >
//                             <ul>
//                                 {navItems.map((item) => (
//                                      <li key={item.label}>
//                                         <Link href={item.href} className={item.special ? 'nav-link special' : 'nav-link'} onClick={() => setIsOpen(false)}>
//                                             {item.label}
//                                         </Link>
//                                     </li>
//                                 ))}
//                             </ul>
//                             <div className="mobile-actions">
//                                 <motion.button className="button-secondary" style={{ width: '100%' }} variants={buttonHover} whileHover="hover" whileTap="tap">Login</motion.button>
//                                 <motion.button className="button-primary" style={{ width: '100%' }} variants={buttonHover} whileHover="hover" whileTap="tap">Get Started Free</motion.button>
//                              </div>
//                         </motion.nav>
//                     )}
//                 </AnimatePresence>
//             </motion.header>
//             {/* Header Styles */}
//             <style jsx>{`
//                 .header {
//                     position: absolute; /* Starts absolute */
//                     top: 0;
//                     left: 0;
//                     width: 100%;
//                     z-index: 1000;
//                     padding: 1rem 0;
//                     transition: background-color 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;
//                  }
//                 .header.sticky {
//                     position: fixed;
//                     background-color: rgba(255, 255, 255, 0.85);
//                     backdrop-filter: blur(10px);
//                     -webkit-backdrop-filter: blur(10px);
//                     box-shadow: var(--shadow-md);
//                      padding: 0.75rem 0;
//                  }
//                  .header-container {
//                     width: 90%;
//                     max-width: 1200px;
//                     margin: 0 auto;
//                     display: flex;
//                     align-items: center;
//                     justify-content: space-between;
//                  }
//                  .logo {
//                     display: flex;
//                     align-items: center;
//                     gap: 0.5rem;
//                     font-size: 1.5rem;
//                     font-weight: 700;
//                     color: var(--text-dark);
//                     font-family: var(--font-headings);
//                  }
//                  .logo-icon {
//                     color: var(--primary);
//                     font-size: 1.8rem;
//                  }
//                  .desktop-nav { display: none; } /* Hide on mobile */
//                  .desktop-actions { display: none; gap: 0.5rem; }

//                  .nav-link {
//                     padding: 0.5rem 1rem;
//                     font-weight: 600;
//                     color: var(--text-muted-dark);
//                     transition: color 0.2s ease;
//                      position: relative;
//                  }
//                  .nav-link:hover { color: var(--primary); }
//                  .nav-link.special { color: var(--secondary); font-weight: 700; }
//                  .nav-link::after { /* Underline effect */
//                      content: '';
//                      position: absolute;
//                      bottom: -2px; left: 50%;
//                      width: 0; height: 2px;
//                      background: var(--primary);
//                      transition: width 0.3s ease, left 0.3s ease;
//                  }
//                  .nav-link:hover::after {
//                      width: 80%; left: 10%;
//                  }
//                  .nav-link.special::after { background: var(--secondary); }


//                 .mobile-menu-toggle {
//                     background: none;
//                     border: none;
//                     font-size: 1.8rem;
//                     cursor: pointer;
//                     color: var(--text-dark);
//                     z-index: 1100; /* Above mobile nav */
//                     display: block; /* Show on mobile */
//                  }

//                 .mobile-nav {
//                     position: absolute;
//                     top: 100%; left: 0; right: 0;
//                     background-color: var(--card-bg);
//                     box-shadow: var(--shadow-lg);
//                     border-bottom-left-radius: var(--border-radius);
//                     border-bottom-right-radius: var(--border-radius);
//                     overflow: hidden;
//                 }
//                 .mobile-nav ul { list-style: none; padding: 1rem 0; }
//                 .mobile-nav ul li { text-align: center; }
//                 .mobile-nav ul li a { display: block; padding: 1rem 1.5rem; font-weight: 600; }
//                 .mobile-actions { padding: 1rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

//                 .button-sm { padding: 0.6rem 1.2rem; font-size: 0.9rem; }

//                  @media (min-width: 1024px) { /* lg breakpoint */
//                      .desktop-nav { display: block; }
//                     .desktop-nav ul { list-style: none; display: flex; gap: 0.5rem; }
//                      .desktop-actions { display: flex; }
//                      .mobile-menu-toggle { display: none; }
//                      .mobile-nav { display: none; }
//                  }
//             `}</style>
//         </>
//     );
// };


// // --- Hero Section ---
// const HeroSection = () => {
//      const { scrollYProgress } = useScroll();
//      // Parallax effect for the image (adjust multiplier for speed)
//      const y = useTransform(scrollYProgress, [0, 1], [0, -150]);

//     return (
//         <section id="hero" className="hero-section">
//             <div className="container hero-container">
//                 <motion.div
//                     className="hero-content"
//                     initial="initial"
//                     animate="animate"
//                     variants={staggerContainer(0.2)}
//                 >
//                     <motion.h1 variants={fadeInUp}>
//                         Resume <span className="highlight">rejected</span>? Again?
//                     </motion.h1>
//                     <motion.h2 variants={fadeInUp} className="hero-subtitle">
//                         Stop the soul-crushing job hunt cycle. Create <span className="gradient-text">AI-powered resumes & portfolios</span> that actually get you noticed.
//                     </motion.h2>
//                     <motion.p variants={fadeInUp}>
//                         You're brilliant, skilled, and ready. But your application gets lost in the abyss. It's not you, it's the system. Let's fix that, together.
//                     </motion.p>
//                     <motion.div variants={fadeInUp} className="hero-actions">
//                         <motion.button className="button button-primary" variants={buttonHover} whileHover="hover" whileTap="tap">
//                             Start My Free AI Resume <FiArrowRight />
//                         </motion.button>
//                         <motion.button className="button button-secondary" variants={buttonHover} whileHover="hover" whileTap="tap">
//                             Check My ATS Score <FiShield />
//                         </motion.button>
//                     </motion.div>
//                 </motion.div>
//                 <motion.div className="hero-image-container" style={{ y }}>
//                      {/* REPLACE IMAGE */}
//                     <motion.img
//                         src="https://images.unsplash.com/photo-1604881991769-41b03fe54a3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600" // More abstract, dynamic, hopeful
//                         alt="Abstract visual representing overcoming job search challenges"
//                         initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
//                         animate={{ opacity: 1, scale: 1, rotate: 0 }}
//                         transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 100 }}
//                     />
//                 </motion.div>
//             </div>
//              {/* Hero Styles */}
//              <style jsx>{`
//                 .hero-section {
//                     min-height: 100vh; /* Full viewport height */
//                     display: flex;
//                     align-items: center;
//                     background: linear-gradient(160deg, var(--bg-light) 60%, #e9d5ff 100%); /* Light purple gradient */
//                     overflow: hidden;
//                     padding-top: 100px; /* Account for header */
//                  }
//                 .hero-container {
//                     display: grid;
//                     grid-template-columns: 1fr;
//                     align-items: center;
//                     gap: 3rem;
//                  }
//                  .hero-content {
//                      text-align: center;
//                      z-index: 2;
//                  }
//                  .hero-content h1 {
//                      font-size: clamp(2.8rem, 6vw + 1rem, 5.5rem); /* Larger hero heading */
//                      font-weight: 700;
//                      margin-bottom: 1rem;
//                      line-height: 1.2;
//                  }
//                  .hero-content h1 .highlight {
//                      color: var(--danger); /* Highlight the pain point */
//                      text-decoration: line-through wavy var(--danger) 3px;
//                  }
//                  .hero-subtitle {
//                      font-size: clamp(1.2rem, 2vw + 1rem, 1.75rem);
//                      font-weight: 500;
//                      color: var(--text-muted-dark);
//                      margin-bottom: 2rem;
//                      max-width: 600px;
//                      margin-left: auto;
//                      margin-right: auto;
//                  }
//                  .hero-actions {
//                      display: flex;
//                      flex-direction: column;
//                      align-items: center;
//                      gap: 1rem;
//                      margin-top: 2.5rem;
//                  }
//                  .hero-image-container {
//                      display: none; /* Hide image on mobile initially */
//                      z-index: 1;
//                  }
//                  .hero-image-container img {
//                      width: 100%;
//                      max-width: 550px;
//                      height: auto;
//                      border-radius: var(--border-radius);
//                      box-shadow: var(--shadow-xl);
//                      object-fit: cover;
//                  }

//                  @media (min-width: 768px) {
//                     .hero-actions {
//                         flex-direction: row;
//                         justify-content: center;
//                     }
//                  }

//                  @media (min-width: 1024px) {
//                      .hero-container { grid-template-columns: 1fr 1fr; gap: 4rem; }
//                      .hero-content { text-align: left; }
//                      .hero-actions { justify-content: flex-start; }
//                     .hero-image-container {
//                         display: flex;
//                         justify-content: center;
//                         align-items: center;
//                      }
//                  }
//             `}</style>
//         </section>
//     );
// };


// // --- Struggle Section ---
// const StruggleSection = () => {
//     const scrollRef = useRef(null);
//     const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start end", "end start"] });
//     // Example parallax: move faster/slower than scroll
//     const yFast = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);
//     const ySlow = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);

//     const painPoints = [
//         { icon: FiXCircle, title: "The Black Hole", text: "Hours crafting resumes, zero replies. Feel invisible? You're not alone.", color: "var(--danger)" },
//         { icon: FiClock, title: "The Time Vampire", text: "Endless tailoring for each application. Your life shouldn't revolve around tweaking bullet points.", color: "var(--warning)" },
//         { icon: FiEye, title: "The Comparison Trap", text: "Stuck with generic templates? No portfolio? Feeling inadequate compared to others?", color: "var(--text-muted-dark)" },
//         { icon: FiShield, title: "The ATS Nightmare", text: "Beaten by the bots? Keywords, formatting... it's a confusing, soul-destroying game.", color: "var(--primary-light)" },
//     ];

//     return (
//         <section id="struggle" className="container" ref={scrollRef}>
//              <motion.div className="text-center mb-6" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                 <FiTrendingUp style={{ fontSize: '3rem', color: 'var(--danger)', transform: 'rotate(90deg)', marginBottom: '1rem' }} />
//                 <h2 className="font-bold mb-2">Sound Familiar? The Job Search <span style={{ textDecoration: 'line-through wavy var(--danger) 4px' }}>Grind</span></h2>
//                 <p className="text-lg md:text-xl text-muted-dark max-w-3xl mx-auto">
//                     It is s a cycle: Hope {'>'} Effort {'>'} Rejection {'>'} Doubt. You spend precious time and energy feeling stuck, judged, and completely overwhelmed.
//                  </p>
//             </motion.div>

//             <motion.div
//                 className="struggle-grid"
//                 variants={staggerContainer(0.15)}
//                 initial="initial"
//                 whileInView="animate"
//                 viewport={{ once: true }}
//             >
//                 {painPoints.map((point, index) => (
//                     <motion.div key={point.title} className="pain-card" variants={fadeInUp} style={{ y: index % 2 === 0 ? ySlow : yFast }}>
//                         <point.icon className="pain-icon" style={{ color: point.color }} />
//                         <h4 className="font-semibold mb-2">{point.title}</h4>
//                         <p className="text-sm text-muted-dark">{point.text}</p>
//                     </motion.div>
//                 ))}
//             </motion.div>

//             <motion.div
//                 className="missing-out-box"
//                 variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.5 }}
//             >
//                  <FiGift className="missing-out-icon" />
//                 <div>
//                     <h3 className="font-bold mb-1">Are You Leaving Opportunities on the Table?</h3>
//                     <p className="m-0 text-muted-dark">
//                         A generic resume, no portfolio, no personal website... In 2025, these aren't optional extras, they're necessities. Don't let outdated approaches cost you your dream job or scholarship.
//                     </p>
//                  </div>
//             </motion.div>

//             {/* Struggle Styles */}
//             <style jsx>{`
//                 .struggle-grid {
//                     display: grid;
//                     grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//                     gap: 2rem;
//                     margin-bottom: 4rem;
//                  }
//                  .pain-card {
//                     background-color: var(--card-bg);
//                     padding: 2rem 1.5rem;
//                     border-radius: var(--border-radius);
//                     box-shadow: var(--shadow-md);
//                     text-align: center;
//                     border: 1px solid var(--border-light);
//                  }
//                  .pain-icon {
//                     font-size: 2.5rem;
//                     margin-bottom: 1rem;
//                  }

//                  .missing-out-box {
//                      background-color: #FFFBEB; /* Light yellow */
//                      border: 1px solid var(--warning);
//                      border-left: 5px solid var(--warning);
//                      border-radius: var(--border-radius);
//                      padding: 2rem;
//                      display: flex;
//                      align-items: center;
//                      gap: 1.5rem;
//                      box-shadow: var(--shadow-sm);
//                  }
//                  .missing-out-icon {
//                      font-size: 3rem;
//                      color: var(--warning);
//                      flex-shrink: 0;
//                  }
//                  @media (max-width: 640px) { /* sm breakpoint */
//                      .missing-out-box { flex-direction: column; text-align: center; }
//                  }
//             `}</style>
//         </section>
//     );
// };


// // --- Features Section (Your Edge) ---
// const FeaturesSection = () => {
//     const features = [
//         { icon: FiCpu, title: "Hyper-Personalized AI Drafts", text: "AI analyzes job descriptions AND your profile to craft unique, targeted resumes & letters in seconds. Say goodbye to generic!" },
//         { icon: FiShield, title: "Conquer the ATS", text: "Optimized formatting, keyword analysis, and a FREE instant ATS score checker ensure you pass the bots." },
//         { icon: FiGlobe, title: "Your Own Corner of the Web", text: "Generate a stunning, professional website & portfolio from your resume. Easily edit with AI, share instantly." },
//         { icon: FiEdit, title: "AI Editing Magic Wand", text: "Need a section stronger? More concise? Just ask the AI. Edit anything in real-time with simple prompts. ✨" },
//     ];

//     return (
//         <section id="features" className="section-bg-gradient">
//              <div className="container">
//                  <motion.div className="text-center mb-6" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                     <FiZap style={{ fontSize: '3rem', color: 'var(--secondary)', marginBottom: '1rem' }} />
//                     <h2 className="font-bold mb-2">Your New Edge: <span className="gradient-text">AI + Your Brilliance</span></h2>
//                     <p className="text-lg md:text-xl text-muted-dark max-w-3xl mx-auto">
//                         CareerFlow AI isn't just another tool. It's your intelligent partner, designed to amplify your strengths and navigate the complexities of the modern job market.
//                      </p>
//                  </motion.div>

//                  <motion.div
//                     className="features-grid"
//                     variants={staggerContainer()}
//                     initial="initial"
//                     whileInView="animate"
//                     viewport={{ once: true, amount: 0.2 }}
//                 >
//                     {features.map((feature) => (
//                          <motion.div key={feature.title} className="feature-card" variants={fadeInUp} initial="rest" whileHover="hover">
//                              <div className="feature-icon-wrapper">
//                                 <feature.icon className="feature-icon" />
//                              </div>
//                             <h4 className="font-semibold mt-4 mb-2">{feature.title}</h4>
//                             <p className="text-sm text-muted-dark">{feature.text}</p>
//                         </motion.div>
//                     ))}
//                  </motion.div>
//             </div>
//              {/* Features Styles */}
//              <style jsx>{`
//                  .features-grid {
//                     display: grid;
//                     grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
//                     gap: 2rem;
//                  }
//                  .feature-card {
//                     background: var(--card-bg);
//                     padding: 2.5rem 2rem;
//                     border-radius: var(--border-radius);
//                     box-shadow: var(--shadow-md);
//                     text-align: center;
//                      border: 1px solid transparent; /* Base border */
//                      transition: border-color 0.3s ease;
//                  }
//                  .feature-card:hover {
//                      border-color: var(--primary-light); /* Highlight on hover */
//                  }
//                  .feature-icon-wrapper {
//                     width: 70px;
//                     height: 70px;
//                     margin: 0 auto;
//                     border-radius: 50%;
//                     display: flex;
//                     align-items: center;
//                     justify-content: center;
//                     background: linear-gradient(135deg, var(--primary), var(--primary-light));
//                     box-shadow: 0 4px 10px rgba(88, 28, 135, 0.2);
//                     transition: transform 0.3s ease;
//                  }
//                 .feature-card:hover .feature-icon-wrapper {
//                      transform: scale(1.1) rotate(-10deg);
//                  }
//                  .feature-icon {
//                     font-size: 2rem;
//                     color: white;
//                  }
//             `}</style>
//         </section>
//     );
// };


// // --- How It Works / AI + You Section ---
// const HowItWorksSection = () => {
//      const scrollRef = useRef(null);
//      // Example: Animate background color based on scroll
//      const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start end", "end start"] });
//      const backgroundColor = useTransform(
//          scrollYProgress,
//          [0, 0.5, 1],
//          ["#F8FAFC", "#E9D5FF", "#F8FAFC"] // bg-light -> light purple -> bg-light
//      );

//      return (
//         <motion.section
//             id="how-it-works"
//             className="container"
//             ref={scrollRef}
//             style={{ backgroundColor }} // Animate background
//         >
//              <motion.div className="text-center mb-6" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                 <IoSparkles style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }} />
//                 <h2 className="font-bold mb-2">AI Is Your Co-Pilot, Not the Pilot</h2>
//                  <p className="text-lg md:text-xl text-muted-dark max-w-3xl mx-auto">
//                     Forget robotic templates. We blend AI's speed with your unique voice. You're always in control, crafting applications that are both effective and authentically *you*.
//                  </p>
//             </motion.div>

//             <div className="how-it-works-grid">
//                 <motion.div className="step-card" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                     <div className="step-number">1</div>
//                     <FiUploadCloud className="step-icon" />
//                      <h4 className="font-semibold mb-2">Input & Context</h4>
//                     <p className="text-sm text-muted-dark">Provide your details, experiences, and the target job/scholarship description. Give the AI the fuel it needs.</p>
//                  </motion.div>
//                  <motion.div className="step-card" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, delay: 0.1 }}>
//                     <div className="step-number">2</div>
//                      <FiCpu className="step-icon" />
//                     <h4 className="font-semibold mb-2">AI Magic Drafts</h4>
//                      <p className="text-sm text-muted-dark">Our AI generates tailored first drafts of resumes, letters, and website content in moments, optimized for ATS and impact.</p>
//                  </motion.div>
//                  <motion.div className="step-card" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, delay: 0.2 }}>
//                     <div className="step-number">3</div>
//                      <FiEdit className="step-icon" />
//                     <h4 className="font-semibold mb-2">Refine & Personalize</h4>
//                      <p className="text-sm text-muted-dark">Use intuitive tools and AI prompts ("Make this sound more confident") to polish, add your unique flair, and make it perfect.</p>
//                  </motion.div>
//             </div>

//              {/* How It Works Styles */}
//             <style jsx>{`
//                 .how-it-works-grid {
//                     display: grid;
//                     grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//                     gap: 2.5rem;
//                     position: relative; /* For pseudo-element line */
//                     padding-top: 2rem; /* Space for line */
//                  }
//                  /* Dashed line connector (desktop only) */
//                 .how-it-works-grid::before {
//                     content: '';
//                     position: absolute;
//                     top: calc(2rem + 35px); /* Align with icon centers */
//                     left: 15%; right: 15%;
//                     height: 2px;
//                     background-image: linear-gradient(to right, var(--primary-light) 50%, transparent 50%);
//                     background-size: 20px 2px;
//                     z-index: 0;
//                     display: none; /* Hide on mobile */
//                  }
//                  @media (min-width: 768px) {
//                      .how-it-works-grid::before { display: block; }
//                  }

//                  .step-card {
//                     background-color: var(--card-bg);
//                     padding: 2rem;
//                     border-radius: var(--border-radius);
//                     box-shadow: var(--shadow-md);
//                     text-align: center;
//                     border: 1px solid var(--border-light);
//                      position: relative; z-index: 1; /* Above line */
//                      display: flex;
//                      flex-direction: column;
//                      align-items: center;
//                  }
//                  .step-number {
//                     position: absolute;
//                     top: -20px; left: 50%;
//                     transform: translateX(-50%);
//                     width: 40px; height: 40px;
//                     border-radius: 50%;
//                     background: var(--primary);
//                     color: white;
//                     display: flex;
//                     align-items: center;
//                     justify-content: center;
//                     font-weight: 700;
//                     font-size: 1.1rem;
//                     box-shadow: var(--shadow-sm);
//                  }
//                  .step-icon {
//                      font-size: 2.5rem;
//                      color: var(--primary);
//                      margin-top: 1.5rem; /* Below number */
//                      margin-bottom: 1rem;
//                  }
//             `}</style>
//         </motion.section>
//     );
// };


// // --- ATS Checker Section ---
// const ATSCheckerSection = () => {
//     return (
//         <section id="ats-checker" className="section-bg-dark">
//             <div className="container ats-container">
//                 <motion.div className="ats-content" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                      <FiShield style={{ fontSize: '4rem', color: 'var(--accent)', marginBottom: '1.5rem' }} />
//                     <h2 className="font-bold mb-3">Is Your Resume Getting <span style={{ color: 'var(--accent)' }}>Ghosted by Robots?</span></h2>
//                      <p className="text-lg md:text-xl text-muted-light mb-5">
//                          Don't guess. Upload your resume now for a 100% FREE, instant ATS compatibility check. Get actionable insights to ensure a human actually sees your application.
//                      </p>
//                     <motion.button className="button button-accent" variants={buttonHover} whileHover="hover" whileTap="tap">
//                         Scan My Resume FREE <FiUploadCloud />
//                      </motion.button>
//                     <p className="text-sm text-muted-light mt-4">No tricks, no sign-up required for the scan.</p>
//                 </motion.div>
//                 <motion.div
//                     className="ats-visual"
//                      initial={{ opacity: 0, x: 50 }}
//                      whileInView={{ opacity: 1, x: 0 }}
//                      transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
//                      viewport={{ once: true }}
//                  >
//                     {/* Replace with a relevant visual - maybe a stylized scan/report */}
//                     <img
//                         src="https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600" // Abstract data/scan visual
//                         alt="Visual representation of an ATS resume scan"
//                         className="ats-image"
//                     />
//                  </motion.div>
//             </div>
//              {/* ATS Styles */}
//             <style jsx>{`
//                 .ats-container {
//                     display: grid;
//                     grid-template-columns: 1fr;
//                     align-items: center;
//                     gap: 3rem;
//                  }
//                  .ats-content { text-align: center; }
//                  .ats-visual { display: none; } /* Hide on mobile */
//                  .ats-image {
//                     width: 100%;
//                     max-width: 450px;
//                     height: auto;
//                     border-radius: var(--border-radius);
//                     box-shadow: 0 15px 30px rgba(6, 182, 212, 0.2); /* Accent shadow */
//                     object-fit: cover;
//                  }
//                  @media (min-width: 1024px) {
//                      .ats-container { grid-template-columns: 1fr 1fr; gap: 5rem; }
//                      .ats-content { text-align: left; }
//                      .ats-visual { display: block; text-align: center; }
//                  }
//             `}</style>
//          </section>
//     );
// };


// // --- Pricing Section ---
// const PricingSection = () => {
//     // Basic structure, enhance with toggle, features comparison etc.
//     const plans = [
//          { name: "Starter", price: "$0", tagline: "The essentials, free forever.", icon: FiGift, features: ["1 AI Resume", "1 AI Website", "Unlimited ATS Checks", "Basic Templates"], buttonLabel: "Start Free Now", buttonClass: "button-secondary" },
//         { name: "Pro", price: "$19", priceSuffix: "/mo", tagline: "Unlock your full potential.", icon: FiZap, features: ["Unlimited Resumes & Docs", "Unlimited Websites", "Advanced AI Editing", "Premium Templates", "Portfolio Collections", "Priority Support"], buttonLabel: "Go Pro", buttonClass: "button-primary", popular: true },
//         { name: "Teams", price: "Custom", tagline: "For career centers & orgs.", icon: FiUsers, features: ["Everything in Pro", "Team Management", "Custom Branding", "Analytics", "Dedicated Support"], buttonLabel: "Contact Sales", buttonClass: "button-secondary" }
//     ];

//     return (
//         <section id="pricing" className="container">
//             <motion.div className="text-center mb-6" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
//                  <h2 className="font-bold mb-2">Simple Plans, Powerful Results</h2>
//                 <p className="text-lg md:text-xl text-muted-dark max-w-3xl mx-auto">
//                      Choose the plan that fits your journey. Start free, upgrade anytime. No hidden fees.
//                  </p>
//                  {/* Add Monthly/Annual Toggle Here if desired */}
//             </motion.div>

//              <motion.div
//                 className="pricing-grid"
//                 variants={staggerContainer(0.1)}
//                 initial="initial"
//                 whileInView="animate"
//                 viewport={{ once: true, amount: 0.1 }}
//             >
//                 {plans.map((plan) => (
//                     <motion.div
//                         key={plan.name}
//                         className={`pricing-card ${plan.popular ? 'popular' : ''}`}
//                         variants={fadeInUp}
//                         initial="rest" whileHover="hover" animate="rest" // Use cardHover variant
//                     >
//                          {plan.popular && <div className="popular-badge">POPULAR</div>}
//                         <div className="text-center">
//                              <plan.icon className="plan-icon" style={{ color: plan.popular ? 'var(--primary)' : 'var(--secondary)' }}/>
//                             <h3 className="font-bold mb-1">{plan.name}</h3>
//                             <p className="text-sm text-muted-dark mb-4">{plan.tagline}</p>
//                              <div className="price mb-4">
//                                 <span className="price-amount">{plan.price}</span>
//                                 {plan.priceSuffix && <span className="price-suffix">{plan.priceSuffix}</span>}
//                             </div>
//                         </div>
//                          <ul className="features-list">
//                             {plan.features.map(feature => (
//                                 <li key={feature}><FiCheckCircle className="check-icon"/> {feature}</li>
//                              ))}
//                          </ul>
//                         <motion.button
//                              className={`button ${plan.buttonClass} w-full mt-auto`} // mt-auto pushes button down
//                              variants={buttonHover} whileHover="hover" whileTap="tap"
//                         >
//                              {plan.buttonLabel}
//                         </motion.button>
//                      </motion.div>
//                 ))}
//             </motion.div>
//             {/* Pricing Styles */}
//             <style jsx>{`
//                 .pricing-grid {
//                     display: grid;
//                     grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//                     gap: 2rem;
//                     align-items: stretch; /* Make cards same height */
//                  }
//                  .pricing-card {
//                     background: var(--card-bg);
//                     padding: 2.5rem 2rem;
//                     border-radius: var(--border-radius);
//                     box-shadow: var(--shadow-lg);
//                     border: 1px solid var(--border-light);
//                     display: flex;
//                     flex-direction: column;
//                     position: relative; /* For badge */
//                     overflow: hidden;
//                     transition: transform 0.3s ease, box-shadow 0.3s ease;
//                  }
//                  .pricing-card.popular {
//                     border-color: var(--primary);
//                     transform: scale(1.05); /* Make popular stand out */
//                      box-shadow: var(--shadow-xl);
//                  }
//                  .popular-badge {
//                     position: absolute;
//                     top: 0; right: 0;
//                     background: var(--primary);
//                     color: white;
//                     padding: 0.3rem 1rem;
//                     font-size: 0.8rem;
//                     font-weight: 700;
//                      border-bottom-left-radius: var(--border-radius);
//                  }
//                  .plan-icon { font-size: 3rem; margin-bottom: 0.5rem; }
//                  .price { margin-top: 1rem; }
//                  .price-amount { font-size: 2.5rem; font-weight: 700; color: var(--text-dark); }
//                  .price-suffix { font-size: 1rem; color: var(--text-muted-dark); margin-left: 0.25rem; }
//                  .features-list { list-style: none; padding: 1.5rem 0; margin-bottom: 1.5rem; flex-grow: 1; } /* flex-grow pushes button down */
//                  .features-list li { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.8rem; font-size: 0.95rem; color: var(--text-muted-dark); }
//                  .check-icon { color: var(--success); font-size: 1.2rem; flex-shrink: 0; }
//                  .w-full { width: 100%; }
//                  .mt-auto { margin-top: auto; }
//             `}</style>
//         </section>
//     );
// };


// // --- Footer ---
// const Footer = () => {
//      return (
//         <footer className="footer">
//              <div className="container footer-container">
//                  <div className="footer-about">
//                     <Link href="/" className="logo mb-3">
//                         <IoSparkles className="logo-icon" />
//                         <span>CareerFlow AI</span>
//                     </Link>
//                     <p className="text-sm text-muted-dark">Empowering job seekers and students with AI to create opportunities and build brighter futures.</p>
//                      <div className="social-links mt-4">
//                         <motion.a href="#" target="_blank" rel="noopener noreferrer" variants={buttonHover} whileHover="hover"><FaLinkedin /></motion.a>
//                         <motion.a href="#" target="_blank" rel="noopener noreferrer" variants={buttonHover} whileHover="hover"><FaTwitter /></motion.a>
//                         <motion.a href="#" target="_blank" rel="noopener noreferrer" variants={buttonHover} whileHover="hover"><FaGithub /></motion.a>
//                      </div>
//                  </div>

//                  <div className="footer-links">
//                      <div>
//                          <h5 className="font-semibold mb-3">Product</h5>
//                          <ul>
//                              <li><Link href="#features">Features</Link></li>
//                             <li><Link href="#pricing">Pricing</Link></li>
//                              <li><Link href="#ats-checker">ATS Checker</Link></li>
//                              <li><Link href="#">Templates</Link></li>
//                          </ul>
//                      </div>
//                      <div>
//                          <h5 className="font-semibold mb-3">Resources</h5>
//                         <ul>
//                              <li><Link href="#">Blog</Link></li>
//                             <li><Link href="#">Guides</Link></li>
//                              <li><Link href="#">FAQ</Link></li>
//                              <li><Link href="#">Support</Link></li>
//                          </ul>
//                     </div>
//                     <div>
//                          <h5 className="font-semibold mb-3">Company</h5>
//                          <ul>
//                              <li><Link href="#">About Us</Link></li>
//                             <li><Link href="#">Careers</Link></li>
//                              <li><Link href="#">Contact</Link></li>
//                          </ul>
//                      </div>
//                      <div>
//                          <h5 className="font-semibold mb-3">Legal</h5>
//                         <ul>
//                              <li><Link href="#">Privacy Policy</Link></li>
//                              <li><Link href="#">Terms of Service</Link></li>
//                          </ul>
//                      </div>
//                  </div>
//              </div>
//             <div className="footer-bottom">
//                  <p className="text-sm text-muted-dark m-0">© {new Date().getFullYear()} CareerFlow AI. All rights reserved.</p>
//              </div>
//              {/* Footer Styles */}
//              <style jsx>{`
//                 .footer {
//                     background-color: var(--bg-light); /* Or a slightly darker bg */
//                     border-top: 1px solid var(--border-light);
//                     padding-top: 4rem; /* Add padding only to the top within the container */
//                  }
//                  .footer-container {
//                     display: grid;
//                     grid-template-columns: 1fr;
//                     gap: 3rem;
//                     padding-top: 0; /* Remove top padding from container */
//                     padding-bottom: 3rem; /* Add bottom padding before the bottom bar */
//                  }
//                  .footer-about .logo { margin-bottom: 1rem; }
//                  .footer-about p { max-width: 300px; }
//                  .social-links { display: flex; gap: 1rem; }
//                  .social-links a {
//                     font-size: 1.5rem;
//                     color: var(--text-muted-dark);
//                     transition: color 0.2s ease;
//                  }
//                  .social-links a:hover { color: var(--primary); }

//                  .footer-links {
//                     display: grid;
//                     grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile */
//                     gap: 2rem;
//                  }
//                  .footer-links h5 { color: var(--text-dark); font-size: 1rem; }
//                  .footer-links ul { list-style: none; }
//                  .footer-links li { margin-bottom: 0.6rem; }
//                  .footer-links a {
//                     color: var(--text-muted-dark);
//                     font-size: 0.95rem;
//                     transition: color 0.2s ease;
//                  }
//                 .footer-links a:hover { color: var(--primary); }

//                  .footer-bottom {
//                     border-top: 1px solid var(--border-light);
//                     padding: 1.5rem 0;
//                     text-align: center;
//                  }

//                  @media (min-width: 768px) {
//                      .footer-container {
//                          grid-template-columns: 1fr 2fr; /* About takes less space */
//                          gap: 4rem;
//                      }
//                      .footer-links {
//                          grid-template-columns: repeat(4, 1fr); /* 4 columns on desktop */
//                      }
//                  }

//                  /* Re-use logo styles from header */
//                  .logo {
//                     display: inline-flex; /* Make it inline for footer */
//                     align-items: center;
//                     gap: 0.5rem;
//                     font-size: 1.5rem;
//                     font-weight: 700;
//                     color: var(--text-dark);
//                     font-family: var(--font-headings);
//                  }
//                  .logo-icon {
//                     color: var(--primary);
//                     font-size: 1.8rem;
//                  }
//             `}</style>
//          </footer>
//     );
// };


// // --- Main Landing Page Component ---
// const LandingPage = () => {
//     return (
//         <>
//             <GlobalStyles /> {/* Apply global styles and variables */}
//             <Header />
//             <main>
//                  <HeroSection />
//                  <StruggleSection />
//                  <FeaturesSection />
//                  <HowItWorksSection />
//                  <ATSCheckerSection />
//                  <PricingSection />
//              </main>
//             <Footer />
//         </>
//     );
// };

// export default LandingPage;
