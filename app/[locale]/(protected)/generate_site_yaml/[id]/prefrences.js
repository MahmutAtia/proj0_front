import styles from './CreatePortfolioPage.module.css';

// Helper for Color Palette Visuals
const ColorPaletteVisual = ({ colors, gradient }) => {
    if (gradient) {
        // For gradients, we render a single, wider bar to showcase the color transition.
        return (
            <div
                style={{
                    background: gradient,
                    width: '150px', // Wider than a single color swatch to display the gradient
                    height: '60px', // Same height as the other color swatches for consistency
                    borderRadius: '4px'
                }}
                className="shadow-1"
            >
            </div>
        );
    }
    return (
        <div className="flex justify-content-center align-items-center h-full">
            {colors.map((color, index) => (
                <div
                    key={index}
                    style={{ backgroundColor: color, width: '20px', height: '60px', borderRadius: '4px' }}
                    className="mr-1 shadow-1"
                ></div>
            ))}
        </div>
    );
};

const designConceptOptions = [
    {
        id: 'codeCanvas',
        userFacingText: 'Interactive Code Canvas', // Concept Name (User-Facing)
        description: 'A sleek, modern design inspired by code editors. Perfect for showcasing technical precision and dynamic data with an artistic twist.', // User-Facing Description
        visualElement: () => <i className={`pi pi-code ${styles.visualIcon} text-cyan-500`}></i>, // Visual Cue Idea: { } with glowing dot
        aiInstructions: {
            core: "Design a personal website with an overall aesthetic inspired by code editors, and digital interfaces, featuring a clean, modern, and artistic interpretation. The design should emphasize structure, precision, and dynamic data representation, conveying a technical, clean, and subtly complex feel. Implement a strong grid system with defined sections resembling code blocks or terminal windows. Use sharp corners, subtle borders, and potentially fixed-width sections that scroll horizontally within a vertical flow. Elements might align based on code indentation principles. Incorporate custom icons resembling command-line symbols or code syntax elements. Backgrounds can feature subtle grid patterns, abstracted binary code streams, or geometric shapes. Ensure code snippets are beautifully styled.",
            animation: "Implement a 'Syntax Highlight Reveal' animation: as the user scrolls, sections or key pieces of text (like skill lists or project descriptions) are dynamically 'syntax highlighted,' as if code is being parsed in real-time. Interactive elements should glow or pulse like active processes.",

        }
    },
       {
        id: 'minimalistBrutalist',
        userFacingText: 'Minimalist Brutalist',
        description: 'Bold, unapologetic design with stark typography, raw geometric shapes, and intentional use of negative space. Emphasizes content over decoration.',
        visualElement: () => <i className={`pi pi-stop ${styles.visualIcon} text-900`}></i>,
        aiInstructions: {
            core: "Create a bold, minimalist brutalist design with stark geometric shapes, heavy typography, and intentional use of negative space. Use chunky, sans-serif fonts with strong contrast. Implement blocky, rectangular sections with sharp edges. Background should be predominantly white or stark colors with bold accent blocks. Typography should be oversized for headers with plenty of whitespace. Grid system should be rigid and apparent. Avoid rounded corners, gradients, or decorative elements.",
            animation: "Implement 'Block Slide' animations: sections slide in as solid geometric blocks, and interactive elements transform with sharp, immediate transitions rather than smooth curves.",
        }
    },
    {
        id: 'architectBlueprint',
        userFacingText: 'Architect\'s Blueprint',
        description: 'A clean, technical design that mimics an architectural blueprint with grid lines, precise annotations, and a drafting aesthetic.',
        visualElement: () => <i className={`pi pi-compass ${styles.visualIcon} text-blue-600`}></i>,
        aiInstructions: {
            core: "Construct the website with an architectural blueprint theme. Use a background with a subtle grid pattern. Employ thin, precise lines for borders and dividers. Typography should be a clean, technical sans-serif or a narrow, capitalized font, reminiscent of drafting text. Use annotations, measurement lines, and simple geometric shapes (circles, squares) as decorative motifs. The layout should be highly organized and structured.",
            animation: "Animate elements by having their outlines 'drawn' into view, as if being sketched by a drafter. On hover, elements could reveal more detailed annotations or a subtle fill."
        }
    },
    {
        id: 'digitalGarden',
        userFacingText: 'Digital Garden',
        description: 'An interconnected, non-linear layout that visualizes projects and skills as a network of ideas, emphasizing connections and growth.',
        visualElement: () => <i className={`pi pi-share-alt ${styles.visualIcon} text-green-500`}></i>,
        aiInstructions: {
            core: "Design the site as a 'digital garden' or knowledge graph. The structure should feel interconnected, using lines or other visual cues to link related projects, skills, and blog posts. The layout can be more organic than a standard linear page. Use tags and backlinks prominently. The aesthetic is clean, intellectual, and modern, focusing on clarity and relationships between content.",
            animation: "On hover or scroll, animate the connecting lines between related items. Nodes or cards could gently pulse or scale up to indicate their relationship to the current content being viewed."
        }
    },
    {
        id: 'kineticTypography',
        userFacingText: 'Kinetic Typography',
        description: 'A dynamic, minimalist design where oversized, animated typography is the primary visual element, creating a bold and expressive experience.',
        visualElement: () => <i className={`pi pi-font ${styles.visualIcon} text-gray-700`}></i>,
        aiInstructions: {
            core: "Create a design where typography is the hero. Use a minimalist layout with very few decorative elements, allowing the text itself to be the main visual. Employ large, bold, and expressive font choices for headings. The core of the design is how text is presented and animated. Content is arranged in simple, clean blocks to support the typographic focus.",
            animation: "Implement text-focused animations as the primary interactive feedback. Words can animate on scroll (e.g., changing weight, size, or position), letters can shuffle on hover, and section transitions can be driven by dramatic typographic changes."
        }
    },
        {
        id: 'neonCyberpunk',
        userFacingText: 'Neon Cyberpunk',
        description: 'A futuristic, high-tech aesthetic with glowing neon elements, dark backgrounds, and sci-fi inspired interfaces.',
        visualElement: () => <i className={`pi pi-bolt ${styles.visualIcon} text-purple-400`}></i>,
        aiInstructions: {
            core: "Design a cyberpunk-inspired portfolio with dark, metallic backgrounds and electric neon accents. Use glowing borders, holographic effects, and futuristic UI elements. Typography should be sharp and tech-focused with occasional glitch effects. Implement circuit-board patterns, hexagonal grids, and LED-style indicators. Color scheme dominated by deep blacks/grays with electric blues, purples, and greens.",
            animation: "Implement 'Digital Pulse' animations: elements pulse with neon light, text has subtle glitch effects, and interactive elements create electric spark animations on hover. Add scanning line effects and holographic shimmer transitions."
        }
    },
    {
        id: 'marvelHero',
        userFacingText: 'Marvel Hero Universe',
        description: 'Bold, comic book-inspired design with dynamic layouts, heroic typography, and action-packed visual elements.',
        visualElement: () => <i className={`pi pi-flash ${styles.visualIcon} text-red-600`}></i>,
        aiInstructions: {
            core: "Create a superhero comic book aesthetic with bold, dynamic layouts inspired by Marvel comics. Use comic book panel layouts, bold serif and sans-serif typography, and dramatic color contrasts. Implement speech bubble elements, pow/zap style callouts, and heroic iconography. Backgrounds can feature subtle halftone patterns and comic book textures.",
            animation: "Implement 'Hero Impact' animations: elements burst into view with comic book style impact effects, text appears with dramatic scaling, and interactive elements create 'POW!' style feedback with particle effects."
        }
    },
    {
        id: 'medicalProfessional',
        userFacingText: 'Medical Professional',
        description: 'Clean, trustworthy design inspired by medical interfaces with precise layouts, calming colors, and scientific elements.',
        visualElement: () => <i className={`pi pi-heart ${styles.visualIcon} text-blue-500`}></i>,
        aiInstructions: {
            core: "Design a professional medical/healthcare portfolio with clean, sterile aesthetics. Use precise grid layouts, medical iconography, and subtle anatomical or molecular patterns. Typography should be highly legible and professional. Implement EKG-line dividers, pill-shaped buttons, and medical chart-inspired data visualization.",
            animation: "Implement 'Vital Signs' animations: elements appear with heartbeat-like pulses, progress bars mimic EKG readings, and hover effects create gentle, healing-inspired glows."
        }
    },
    {
        id: 'mechanicalEngineer',
        userFacingText: 'Mechanical Blueprint',
        description: 'Industrial design inspired by engineering blueprints, technical drawings, and mechanical precision.',
        visualElement: () => <i className={`pi pi-cog ${styles.visualIcon} text-orange-600`}></i>,
        aiInstructions: {
            core: "Create an industrial engineering aesthetic with technical blueprint styling. Use precise line work, technical annotations, and mechanical iconography. Implement gear motifs, technical drawings as backgrounds, and industrial color schemes. Typography should be technical and precise with monospace elements for measurements.",
            animation: "Implement 'Mechanical Motion' animations: gears rotate on hover, elements slide in like mechanical parts assembling, and interactive feedback includes industrial sound-inspired visual effects."
        }
    },
    {
        id: 'electricalCircuit',
        userFacingText: 'Electrical Circuit',
        description: 'High-tech design inspired by circuit boards, electrical schematics, and electronic components.',
        visualElement: () => <i className={`pi pi-wifi ${styles.visualIcon} text-green-400`}></i>,
        aiInstructions: {
            core: "Design an electrical engineering portfolio with circuit board aesthetics. Use trace lines as design elements, electronic component shapes, and LED-style indicators. Implement PCB green backgrounds, copper trace pathways, and electronic schematic symbols. Typography should be technical and precise.",
            animation: "Implement 'Current Flow' animations: traces light up sequentially like electrical current, components glow when activated, and interactions create electrical arc effects."
        }
    },
    {
        id: 'animeAesthetic',
        userFacingText: 'Anime Aesthetic',
        description: 'Vibrant, anime-inspired design with bold colors, dynamic compositions, and Japanese visual elements.',
        visualElement: () => <i className={`pi pi-star ${styles.visualIcon} text-pink-500`}></i>,
        aiInstructions: {
            core: "Create an anime-inspired portfolio with vibrant colors, dynamic asymmetrical layouts, and Japanese aesthetic elements. Use bold, stylized typography, cherry blossom motifs, and geometric shapes. Implement anime-style character silhouettes, manga panel layouts, and traditional Japanese patterns.",
            animation: "Implement 'Anime Transform' animations: elements appear with sparkle effects, dramatic scaling animations, and speed-line backgrounds during transitions."
        }
    },

    {
        id: 'minimalistLuxury',
        userFacingText: 'Minimalist Luxury',
        description: 'High-end, sophisticated design with premium materials, subtle animations, and elegant spacing.',
        visualElement: () => <i className={`pi pi-gem ${styles.visualIcon} text-yellow-600`}></i>,
        aiInstructions: {
            core: "Create a luxury portfolio with premium aesthetics. Use generous white space, high-quality typography, and subtle material design elements. Implement gold accents, marble textures, and premium color palettes. Layout should be spacious and breathable with attention to micro-interactions.",
            animation: "Implement 'Luxury Float' animations: elements gently float and scale with premium easing curves, subtle parallax effects, and elegant hover states with soft shadows."
        }
    }
];





    


const colorStyleOptions = [
    {
        id: 'slate',
        userFacingText: 'Cool Slate',
        description: 'A professional and calming palette of cool grays and blues.',
        visualElement: () => <ColorPaletteVisual colors={['#F8FAFC', '#E2E8F0', '#64748B', '#3B82F6', '#1E293B']} />,
        aiInstructions: {
            light: "Use a light, cool gray (#F8FAFC) for the background. Use a darker slate gray (#64748B) for secondary text and borders. Main text should be a very dark, near-black slate (#1E293B). Use a vibrant, professional blue (#3B82F6) as the primary accent for links, buttons, and highlights.",
            dark: "Use a deep, dark slate blue (#0F172A) for the background. Lighter panels can use a slightly less saturated dark gray (#1E293B). Text should be a soft, light gray (#E2E8F0). The accent blue (#3B82F6) should be brightened slightly to ensure high contrast and visibility."
        }
    },
    {
        id: 'forest',
        userFacingText: 'Forest & Amber',
        description: 'An earthy, organic palette with deep greens and a warm amber accent.',
        visualElement: () => <ColorPaletteVisual colors={['#F0FDF4', '#A3E635', '#4D7C0F', '#F59E0B', '#14532D']} />,
        aiInstructions: {
            light: "Use an off-white or very light green (#F0FDF4) background. Use a muted, earthy green (#4D7C0F) for secondary elements. Main text should be a deep forest green (#14532D). Use a warm, vibrant amber or gold (#F59E0B) as the contrasting accent color.",
            dark: "Use a very dark, desaturated green (#14532D) as the background. Panels can be a slightly lighter charcoal green. Text should be a light, warm off-white. The amber accent (#F59E0B) remains the primary highlight, providing a warm glow against the dark background. A secondary lime green accent (#A3E635) can be used for minor details."
        }
    },
    {
        id: 'noir',
        userFacingText: 'Noir & Neon',
        description: 'A high-contrast, futuristic palette of black, white, and a single electric accent.',
        visualElement: () => <ColorPaletteVisual colors={['#000000', '#FFFFFF', '#F97316', '#FFFFFF', '#000000']} />,
        aiInstructions: {
            light: "Use a stark white (#FFFFFF) background. All text and primary lines should be pure black (#000000). Use a single, vibrant neon color (e.g., electric orange #F97316, magenta #EC4899, or cyan #0EA5E9) as the only accent for all interactive elements. The look is extremely high-contrast and minimal.",
            dark: "Use a pure black (#000000) background. All text should be stark white (#FFFFFF). The same single, vibrant neon accent color from the light theme should be used, creating a glowing effect against the black canvas. Maintain the extreme high-contrast, minimalist aesthetic."
        }
    },
    {
        id: 'creme',
        userFacingText: 'Crème & Ink',
        description: 'A warm, elegant palette with off-white, beige, and a deep, rich accent.',
        visualElement: () => <ColorPaletteVisual colors={['#FEFDFB', '#F1EFEA', '#D97706', '#7F1D1D', '#1C1917']} />,
        aiInstructions: {
            light: "Use a warm, creamy off-white (#FEFDFB) for the background. Secondary surfaces can use a slightly darker beige (#F1EFEA). Text should be a near-black, warm 'ink' color (#1C1917). For accents, use a deep, rich color like burgundy (#7F1D1D) or a muted, warm orange (#D97706).",
            dark: "Use a dark, warm brown or charcoal (#1C1917) for the background. Text should be a soft, creamy off-white (#FEFDFB). The rich accent color (burgundy or warm orange) should be adapted to be slightly more luminous to stand out against the dark background, providing an elegant, low-light feel."
        }
    },
    {
        id: 'rose',
        userFacingText: 'Rosé & Quartz',
        description: 'A modern, soft palette with muted pinks, grays, and a gentle feel.',
        visualElement: () => <ColorPaletteVisual colors={['#FFF1F2', '#FECDD3', '#F43F5E', '#57534E', '#1C1917']} />,
        aiInstructions: {
            light: "Use a very light, almost white rosé color (#FFF1F2) for the background. Use a soft, muted pink (#FECDD3) for panels or highlights. Text should be a dark, warm gray (#1C1917). The primary accent should be a bolder, more saturated rose or magenta color (#F43F5E).",
            dark: "Use a dark, muted stone-gray (#57534E) for the background. Text should be a light, soft pink (#FECDD3). The main rosé accent (#F43F5E) should be used for interactive elements, providing a punch of color against the muted, dark backdrop."
        }
    },
    {
    id: 'oceanDeep',
    userFacingText: 'Ocean Deep',
    description: 'Sophisticated deep blues and teals with pearl white accents, evoking trust and depth.',
    visualElement: () => <ColorPaletteVisual colors={['#F0F9FF', '#0EA5E9', '#0F172A', '#06B6D4', '#164E63']} />,
    aiInstructions: {
        light: "Use a crisp, clean white (#F0F9FF) background. Primary text should be deep navy (#0F172A). Use ocean blue (#0EA5E9) for primary buttons and links. Teal (#06B6D4) works as secondary accent. Create a sense of depth and trust with these oceanic tones.",
        dark: "Use deep ocean navy (#164E63) as background. Light text should be pearl white (#F0F9FF). Bright cyan (#06B6D4) becomes the primary accent, with sky blue (#0EA5E9) for secondary elements. Creates a deep, professional underwater feel."
    }
},
{
    id: 'sunset',
    userFacingText: 'Sunset Gradient',
    description: 'Warm sunset colors blending from golden yellow to deep purple, creating an energetic and creative vibe.',
    visualElement: () => <ColorPaletteVisual gradient="linear-gradient(135deg, #FEF3C7 0%, #F59E0B 25%, #EF4444 50%, #7C3AED 75%, #1E1B4B 100%)" />,
    aiInstructions: {
        light: "Use warm cream (#FEF3C7) backgrounds with gradient accents. Text should be deep purple (#1E1B4B). Use the sunset gradient for headers, buttons, and key elements. Orange (#F59E0B) and red (#EF4444) work as individual accent colors.",
        dark: "Dark purple (#1E1B4B) background with cream text (#FEF3C7). The sunset gradient becomes more vibrant against dark backgrounds. Use individual sunset colors strategically for highlights and interactive elements."
    }
},
{
    id: 'monochrome',
    userFacingText: 'Pure Monochrome',
    description: 'Timeless black and white with perfect gray scales, emphasizing content and typography.',
    visualElement: () => <ColorPaletteVisual colors={['#FFFFFF', '#F3F4F6', '#9CA3AF', '#374151', '#000000']} />,
    aiInstructions: {
        light: "Pure white (#FFFFFF) background with true black (#000000) text. Use gray scales (#F3F4F6, #9CA3AF, #374151) for depth and hierarchy. Focus on typography, shadows, and spacing. No color distractions.",
        dark: "True black (#000000) background with pure white (#FFFFFF) text. Same gray scales for hierarchy but inverted. Emphasis on stark contrast and clean typography. Minimal use of effects beyond shadows."
    }
},
{
    id: 'emerald',
    userFacingText: 'Emerald Luxury',
    description: 'Rich emerald greens with gold accents, creating an elegant and luxurious feel.',
    visualElement: () => <ColorPaletteVisual colors={['#ECFDF5', '#10B981', '#065F46', '#F59E0B', '#1F2937']} />,
    aiInstructions: {
        light: "Light mint background (#ECFDF5) with rich emerald (#065F46) text. Use bright emerald (#10B981) for interactive elements and gold (#F59E0B) sparingly for luxury accents. Creates sophisticated, high-end feel.",
        dark: "Deep forest green (#065F46) background with light mint (#ECFDF5) text. Bright emerald (#10B981) for primary actions, gold (#F59E0B) for premium highlights. Evokes luxury and nature."
    }
},
{
    id: 'cosmic',
    userFacingText: 'Cosmic Purple',
    description: 'Deep space purples with electric accents, perfect for creative and tech-focused portfolios.',
    visualElement: () => <ColorPaletteVisual colors={['#FAF5FF', '#A855F7', '#581C87', '#10B981', '#0F172A']} />,
    aiInstructions: {
        light: "Very light purple (#FAF5FF) background with deep purple (#581C87) text. Bright purple (#A855F7) for primary elements, electric green (#10B981) for special accents. Creates creative, innovative atmosphere.",
        dark: "Deep space black (#0F172A) background with light purple (#FAF5FF) text. Vibrant purple (#A855F7) glows against dark background, electric green (#10B981) creates striking contrast."
    }
},
{
    id: 'coral',
    userFacingText: 'Coral Reef',
    description: 'Living coral and turquoise inspired by tropical reefs, vibrant yet professional.',
    visualElement: () => <ColorPaletteVisual colors={['#FFF7ED', '#FB923C', '#EA580C', '#0891B2', '#164E63']} />,
    aiInstructions: {
        light: "Warm cream (#FFF7ED) background with deep teal (#164E63) text. Living coral (#FB923C) for primary actions, deeper coral (#EA580C) for emphasis, turquoise (#0891B2) for secondary elements.",
        dark: "Deep ocean teal (#164E63) background with cream (#FFF7ED) text. Vibrant coral colors (#FB923C, #EA580C) pop against dark background, turquoise (#0891B2) provides cool balance."
    }
},
{
    id: 'arctic',
    userFacingText: 'Arctic Frost',
    description: 'Cool whites and icy blues with silver accents, creating a clean, modern, high-tech feel.',
    visualElement: () => <ColorPaletteVisual colors={['#FFFFFF', '#F1F5F9', '#64748B', '#0EA5E9', '#0F172A']} />,
    aiInstructions: {
        light: "Pure white (#FFFFFF) with subtle gray (#F1F5F9) panels. Cool gray (#64748B) for secondary text, icy blue (#0EA5E9) for accents, deep navy (#0F172A) for primary text. Clean, minimal, high-tech aesthetic.",
        dark: "Deep navy (#0F172A) background with ice white (#FFFFFF) text. Cool gray (#64748B) for secondary elements, electric blue (#0EA5E9) glows like ice crystals. Creates sophisticated tech feel."
    }
},
{
    id: 'vintage',
    userFacingText: 'Vintage Sepia',
    description: 'Warm sepia tones with burnt orange accents, perfect for creative and artistic portfolios.',
    visualElement: () => <ColorPaletteVisual colors={['#FEF7ED', '#FED7AA', '#EA580C', '#92400E', '#1C1917']} />,
    aiInstructions: {
        light: "Warm cream (#FEF7ED) background with rich brown (#1C1917) text. Use sepia tones (#FED7AA) for panels, burnt orange (#EA580C) for accents, deeper brown (#92400E) for emphasis. Vintage, artistic feel.",
        dark: "Rich dark brown (#1C1917) background with warm cream (#FEF7ED) text. Sepia tones become highlights, burnt orange (#EA580C) provides warm glow against dark background."
    }
},
{
    id: 'electric',
    userFacingText: 'Electric Lime',
    description: 'High-energy lime green with charcoal and white, perfect for modern, energetic portfolios.',
    visualElement: () => <ColorPaletteVisual colors={['#F7FEE7', '#84CC16', '#365314', '#FFFFFF', '#18181B']} />,
    aiInstructions: {
        light: "Light lime background (#F7FEE7) with dark green (#365314) text. Electric lime (#84CC16) for primary actions, pure white (#FFFFFF) for contrast panels, creates energetic, modern feel.",
        dark: "Charcoal black (#18181B) background with lime highlights (#F7FEE7). Electric lime (#84CC16) glows intensely against dark background, creating high-energy, modern aesthetic."
    }
},
{
    id: 'goldenHour',
    userFacingText: 'Golden Hour',
    description: 'Warm golden yellows and deep browns, creating a cozy, premium, and inviting atmosphere.',
    visualElement: () => <ColorPaletteVisual colors={['#FFFBEB', '#F59E0B', '#D97706', '#92400E', '#1C1917']} />,
    aiInstructions: {
        light: "Warm ivory (#FFFBEB) background with rich brown (#1C1917) text. Golden yellow (#F59E0B) for primary elements, amber (#D97706) for emphasis, creates warm, inviting, premium feel.",
        dark: "Rich dark brown (#1C1917) background with golden cream (#FFFBEB) text. Gold colors (#F59E0B, #D97706) glow warmly against dark background, creating cozy, luxury atmosphere."
    }
},
]

const addOnFeatureOptions = [
    {
        id: 'customCursor',
        userFacingText: 'Custom Cursor',
        description: 'Enable a unique custom cursor that matches the site\'s theme and enhances interactivity.',
        visualElement: () => <i className={`pi pi-mouse ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Implement a custom cursor that replaces the default system cursor. The custom cursor should be visually unique and align with the overall design concept's theme and aesthetic. It should also provide clear visual feedback on interactive elements (e.g., changing appearance on hover). Make sure that the cursor is visible and functional. Add the custom cursor to global parts"
    },
    {
        id: 'typingAnimation',
        userFacingText: 'Typing/Deleting Name Animation (Header)',
        description: 'Animate your name/title in the header with a dynamic typing and deleting effect.',
        visualElement: () => <i className={`pi pi-pencil ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "In the main header or hero section, animate the display of the user's name and/or title using a typing and/or deleting effect, as if it's being written out dynamically."
    },
    {
        id: 'interactiveBackground',
        userFacingText: 'Interactive Background (Reacts to Mouse/Scroll)',
        description: 'Make the background subtly react to mouse movement or scrolling for added depth.',
        visualElement: () => <i className={`pi pi-th-large ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Design the background of the website (or specific key sections) to be interactive, subtly reacting to the user's mouse movement or scroll position (e.g., subtle parallax, shifting gradients, particle effects that follow the cursor)."
    },

    {
        id: 'subtle3DElements',
        userFacingText: 'Subtle 3D Elements or Perspective',
        description: 'Add subtle 3D effects or perspective shifts to elements for a touch of depth.',
        visualElement: () => <i className={`pi pi-box ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Incorporate subtle 3D elements, perspective shifts, or techniques (like isometric views, card-flips, or carefully applied shadows/transforms on hover) to add a sense of depth or dimension to key visual elements or sections."
    },
    {
        id: 'generativeArt',
        userFacingText: 'Generative Art Background/Elements',
        description: 'Include generative art (algorithmically created visuals) as a dynamic background or unique design elements.',
        visualElement: () => <i className={`pi pi-share-alt ${styles.addOnVisualIcon} text-700`}></i>, // pi-share-alt for node-like structure
        aiInstruction: "Integrate generative art principles into the design, either as a dynamic background, unique section dividers, interactive elements whose appearance is algorithmically generated, or abstract patterns that subtly shift or evolve. This should align with the overall aesthetic."
    },
    {
        id: 'uniqueFooter',
        userFacingText: 'Unique Footer Design',
        description: 'Craft a distinct, visually interesting footer that goes beyond standard links.',
        visualElement: () => <i className={`pi pi-bookmark ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Design the website footer as a distinct and visually interesting section, going beyond a simple list of links. It could incorporate unique graphics aligned with the theme, a different layout structure (e.g., multi-column with icons, a call-to-action), or subtle animations. It should feel like a deliberate closing statement for the site."
    },
    {
        id: 'scrollAnimations',
        userFacingText: 'Scroll-Activated Animations/Transitions',
        description: 'Animate elements or sections as they scroll into view for a dynamic Browse experience.',
        visualElement: () => <i className={`pi pi-eye ${styles.addOnVisualIcon} text-700`}></i>, // pi-eye for "reveal on scroll"
        aiInstruction: "Implement scroll-activated animations for content sections or key elements. As the user scrolls and new content enters the viewport, elements should animate in (e.g., fade-in, slide-in, scale-up, reveal). Ensure these animations are smooth and enhance the user experience, not distract from it."
    },
    {
        id: 'themedIcons',
        userFacingText: 'Themed Icons Set',
        description: 'Use a custom set of icons designed specifically to match the website\'s overall theme.',
        visualElement: () => <i className={`pi pi-star ${styles.addOnVisualIcon} text-700`}></i>, // pi-star for "custom/special"
        aiInstruction: "Develop and implement a custom set of icons to be used throughout the website (for navigation, section headers, lists, social links, etc.). These icons must be stylistically cohesive and perfectly aligned with the chosen Design Concept and Color Style, reinforcing the overall aesthetic."
    },

    {
        id: 'variableFonts',
        userFacingText: 'Variable Font Integration',
        description: 'Utilize variable fonts for dynamic typography that can adapt weight, slant, or other axes, potentially interactively.',
        visualElement: () => <i className={`pi pi-font ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Integrate one or more variable fonts into the design. Leverage their dynamic capabilities for headings, subheadings, or even body text. Consider animations or interactive typographic effects where font weight, slant, width, or other axes change on hover, scroll, or based on other user interactions. Ensure graceful fallbacks for browsers that do not support variable fonts."
    }
];


export {
    designConceptOptions,
    colorStyleOptions,
    addOnFeatureOptions

}
