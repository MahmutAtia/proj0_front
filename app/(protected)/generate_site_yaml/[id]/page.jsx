"use client";
// pages/resumes/[resumeId]/create-portfolio.js
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

// PrimeReact Components
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { RadioButton } from 'primereact/radiobutton';
import { Message } from 'primereact/message'; // For the hint/warning

// CSS Modules
import styles from './CreatePortfolioPage.module.css';

// --- Data Definitions (Ideally in a separate file: e.g., data/designOptions.js) ---

// Helper for Color Palette Visuals
const ColorPaletteVisual = ({ colors, gradient }) => {
    if (gradient) {
        return (
            <div
                style={{
                    background: gradient,
                    width: '100%',
                    height: '60px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                className="shadow-1"
            >
                {/* Optional: text on gradient */}
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
            core: "Design a personal website with an overall aesthetic inspired by code editors, terminals, and digital interfaces, featuring a clean, modern, and artistic interpretation. The design should emphasize structure, precision, and dynamic data representation, conveying a technical, clean, and subtly complex feel. Implement a strong grid system with defined sections resembling code blocks or terminal windows. Use sharp corners, subtle borders, and potentially fixed-width sections that scroll horizontally within a vertical flow. Elements might align based on code indentation principles. Incorporate custom icons resembling command-line symbols or code syntax elements. Backgrounds can feature subtle grid patterns, abstracted binary code streams, or geometric shapes. Ensure code snippets are beautifully styled.",
            animation: "Implement a 'Syntax Highlight Reveal' animation: as the user scrolls, sections or key pieces of text (like skill lists or project descriptions) are dynamically 'syntax highlighted,' as if code is being parsed in real-time. Interactive elements should glow or pulse like active processes.",
            defaultColorGuidance: {
                light: "For light mode, use a light grey or off-white background (e.g., #F5F5F5, #ECEFF1), with black or dark grey text (e.g., #212121, #37474F). Employ vibrant accents (e.g., electric blue #007BFF, neon green #39FF14, bright purple #7F00FF, hot pink #FF69B4) for code elements, interactive parts, or syntax highlighting.",
                dark: "For dark mode, use a dominant deep, muted technical background (e.g., charcoal #263238, deep navy #1A237E, dark forest green #003300), with light mono-spaced text (e.g., #E0E0E0, #CFD8DC). Implement glowing vibrant accents (e.g., electric blue #50S8FF, neon green #6FFF4F, bright purple #BF5FFF, hot pink #FF85C7) to highlight interactive elements, code snippets, or key stats, creating a true terminal feel."
            }
        }
    },
    {
        id: 'abstractSculpture',
        userFacingText: 'Abstract Portfolio Sculpture',
        description: 'An experimental, artistic design treating your website as a dynamic, abstract sculpture. Expect unexpected forms and fluid transitions.',
        visualElement: () => <i className={`pi pi-slack ${styles.visualIcon} text-purple-500`}></i>, // Visual Cue: morphing, abstract shapes (pi-slack as placeholder)
        aiInstructions: {
            core: "Design a personal website that functions as a dynamic, abstract sculpture or art installation. The focus should be on form, movement, and unexpected transitions, creating an artistic, experimental, and highly unique feel. Employ non-traditional layouts with overlapping elements, skewed sections, or elements that break the grid. Shapes should be abstract – blobs, waves, shattered glass effects, or impossible geometry. Integrate abstract generative art backgrounds, distorted or manipulated photography, custom icons that are abstract shapes, and potentially use noise or grain as a texture.",
            animation: "Implement a 'Section Transformation' animation: as the user scrolls or navigates between sections, the transition should be a complex visual transformation where elements morph, shatter, or dissolve into the next section's content, rather than a simple fade or slide. Hover effects should involve elements subtly changing shape or color gradient.",
            defaultColorGuidance: {
                light: "For light mode, use a dominant bold color or gradient (e.g., a vibrant coral #FF7F50 or a teal-to-purple gradient) with high contrast text (e.g., dark grey #333333 or white #FFFFFF) and distinct accent colors (e.g., lemon yellow #FFFACD or electric lime #CCFF00).",
                dark: "For dark mode, shift to a different, equally bold dominant color or gradient (e.g., deep indigo #4B0082 or a magenta-to-cyan gradient), maintaining high contrast with text (e.g., light grey #D3D3D3 or vibrant cyan #00FFFF) and accent colors. Both modes should be visually striking and can use duotones, split complementary, or highly saturated palettes."
            }
        }
    },
    {
        id: 'layeredDepthPortal',
        userFacingText: 'Layered Depth & Portal Effect',
        description: 'An immersive design creating a strong sense of depth, as if looking through portals into different content planes. Polished and intriguing.',
        visualElement: () => <i className={`pi pi-clone ${styles.visualIcon} text-teal-500`}></i>, // Visual Cue: overlapping semi-transparent planes (pi-clone)
        aiInstructions: {
            core: "Design a personal website that creates a strong sense of depth and dimensionality, giving the impression that content exists on different planes or that the user is looking through 'portals' into different sections. The feel should be immersive, intriguing, and polished. Utilize z-index extensively to create overlapping elements. Frame sections with shapes suggesting windows or portals. Backgrounds should incorporate subtle parallax effects. Include elements with realistic shadows and highlights, translucent overlays (using rgba or opacity), and background images or videos that appear distant. Icons might have a subtle 3D tilt.",
            animation: "Implement a 'Scroll-Triggered Layer Shift & Portal Zoom' animation: as the user scrolls, different layers of content move at varying speeds (parallax). Clicking on a portfolio item or section link should trigger a smooth animation where the view 'zooms' into that section as if passing through a portal.",
            defaultColorGuidance: {
                light: "For light mode, use a base of sophisticated light neutrals (e.g., soft grey #E0E0E0, pale beige #F5F5DC) combined with translucent light overlays (e.g., rgba(255, 255, 255, 0.7)) and pops of color that appear 'behind' or 'in front' of layers (e.g., muted teal #78C2C4, warm ochre #CC7722). Use subtle shadows to create depth.",
                dark: "For dark mode, use a base of deep neutrals (e.g., deep grey #36454F, muted navy #2C3E50) with darker translucent overlays (e.g., rgba(0, 0, 0, 0.5)). Enhance depth with more pronounced shadows and potentially subtle glowing edges (e.g., a soft white or light blue glow) on 'upper' layers. Accent colors should be chosen to stand out against the darker background (e.g., vibrant gold #FFD700, cool lavender #E6E6FA)."
            }
        }
    },
    {
        id: 'gridBreakingKinetic',
        userFacingText: 'Grid-Breaking Kinetic Display',
        description: 'A bold, dynamic design where elements energetically move, shift, and break free from traditional grids. Modern and attention-grabbing.',
        visualElement: () => <i className={`pi pi-arrows-alt ${styles.visualIcon} text-orange-500`}></i>, // Visual Cue: arrows breaking out of a grid (pi-arrows-alt)
        aiInstructions: {
            core: "Design a personal website that is highly dynamic and energetic, characterized by elements that move, shift, and break free from traditional grid constraints, focusing on motion and visual impact. The feel should be bold, modern, and attention-grabbing. While an underlying grid may provide structure, many elements should intentionally break out of their grid cells. Use diagonal lines, skewed angles, and elements that overlap or intersect dynamically. Incorporate animated typography (kinetic type), background particle effects, and elements that trail or leave echoes as they move. Icons might spin or pulse.",
            animation: "Implement 'Kinetic Text & Element Trails': The main headline or key text elements should be animated (e.g., letters scatter and reform, words slide into place). Interactive elements should leave subtle visual trails or echoes as the cursor moves over them or they are clicked.",
            defaultColorGuidance: {
                light: "For light mode, use a clean, bright background (e.g., white #FFFFFF or very light grey #FAFAFA) with moving elements in vibrant or strong contrasting colors (e.g., primary red #FF0000, deep blue #0000FF, black #000000). Trails/effects should be subtle but visible.",
                dark: "For dark mode, use a dark background (e.g., near black #121212 or dark charcoal #1E1E1E) where moving elements stand out dramatically, potentially with glowing trails or effects in bright, saturated colors (e.g., electric yellow #FFFF33, vivid cyan #00FFFF, bright magenta #FF00FF)."
            }
        }
    },
    {
        id: 'handcraftedSketchbook',
        userFacingText: 'Handcrafted Digital Sketchbook',
        description: 'A personal, authentic design blending digital precision with the warmth of handcrafted elements. Feels tactile and creatively unique.',
        visualElement: () => <i className={`pi pi-pencil ${styles.visualIcon} text-yellow-700`}></i>, // Visual Cue: pencil drawing a digital element
        aiInstructions: {
            core: "Design a personal website that blends digital precision with the warmth and imperfection of hand-drawn or handcrafted elements, creating a personal, authentic, and creatively tactile feel. Layouts should be clean and structured but incorporate elements that look sketched, cut out, or taped onto the page. Use subtle irregularities in lines and shapes. Include custom hand-drawn illustrations or icons (digitized), and background textures resembling paper, canvas, or subtle noise. Typography might include a mix of clean sans-serif and a hand-written style font for accents.",
            animation: "Implement a 'Sketch Reveal & Element Stickiness' animation: as sections load or elements appear, they animate as if being quickly sketched onto the page. Interactive elements should have a subtle 'sticky' effect, slightly pulling towards the cursor on hover before snapping back.",
            defaultColorGuidance: {
                light: "For light mode, use a light, textured background (e.g., off-white paper texture #F8F8F0, cream #FFFDD0) with darker text (e.g., charcoal #36454F, sepia #704214) and hand-drawn style elements in natural drawing colors (e.g., pencil grey, muted blues, greens, or reds). Accent colors should feel like markers or paint (e.g., a vibrant but slightly desaturated orange #F4A261).",
                dark: "For dark mode, use a darker, textured background (e.g., charcoal paper #505050, dark canvas #3B3B3B) with lighter text (e.g., off-white #EAEAEA, light chalky blue #A0D2DB) and hand-drawn elements that appear sketched in white, light pastels, or metallic colors. Accent colors should be chosen to pop against the dark background while maintaining the handcrafted feel (e.g., a muted gold #BC8F8F)."
            }
        }
    },
    {
        id: 'glitchArtInterface',
        userFacingText: 'Glitch Art Interface',
        description: 'An edgy, cyberpunk-inspired design embracing digital imperfections, pixelation, and CRT effects. Boldly unconventional and futuristic.',
        visualElement: () => <i className={`pi pi-bolt ${styles.visualIcon} text-green-500`}></i>, // Visual Cue: pixelated/distorted text (pi-bolt for energy/glitch)
        aiInstructions: {
            core: "Design a personal website with a 'Glitch Art' aesthetic, inspired by digital errors, cyberpunk interfaces, and retro-futurism. The design should feel edgy, unconventional, and visually striking, embracing pixelation, chromatic aberration, scan lines, and distorted text or image effects. Layouts can be somewhat chaotic but should maintain usability. Use monospace fonts and digital-looking UI elements.",
            animation: "Implement 'Interactive Glitches & Text Corruption': On hover or scroll, elements might briefly glitch, pixelate, or show chromatic aberration. Text snippets might animate as if momentarily 'corrupting' and then resolving. Backgrounds could feature subtle, animated scan lines or digital noise.",
            defaultColorGuidance: {
                light: "For light mode, use a stark light background (e.g., very light grey #EFEFEF or clinical white #FFFFFF) with sharp black or dark grey text. Glitch effects should introduce vibrant, jarring accent colors like electric green (#00FF00), magenta (#FF00FF), and cyan (#00FFFF), often in pixelated or blocky forms.",
                dark: "For dark mode, use a deep black (#000000) or very dark grey (#111111) background, reminiscent of old CRT monitors. Text should be a bright, glowing color like phosphor green (#39FF14), amber (#FFBF00), or electric blue (#007BFF). Glitch accents should be intense and luminous."
            }
        }
    },
    {
        id: 'minimalistZenGarden',
        userFacingText: 'Minimalist Zen Garden',
        description: 'A serene, minimalist design focusing on balance, negative space, and subtle natural textures. Calm, elegant, and thoughtfully structured.',
        visualElement: () => <i className={`pi pi-circle-off ${styles.visualIcon} text-gray-500`}></i>, // Visual Cue: simple stones/raked sand (pi-circle-off for emptiness/space)
        aiInstructions: {
            core: "Design a personal website with a 'Minimalist Zen Garden' aesthetic. The design must prioritize ample negative space, balanced compositions, and a sense of calm and tranquility. Use subtle natural textures (e.g., fine sand, smooth stone, soft wood grain) and a very restrained approach to elements. Typography should be clean, elegant, and highly legible. The layout should feel open and uncluttered, guiding the user's focus gently.",
            animation: "Implement 'Subtle Fades & Gentle Ripples' animations: Content sections should fade in gently. Interactive elements might have very subtle ripple or soft glow effects on hover, reminiscent of water or light. Avoid jarring or fast animations. Focus on smooth, almost imperceptible transitions.",
            defaultColorGuidance: {
                light: "For light mode, use a base of soft, warm whites (e.g., #FBFBFB, #FAF0E6) or very light, muted earth tones (e.g., pale sand #F4A460 but much lighter and desaturated). Text should be a soft dark grey or muted brown. Accent colors should be inspired by nature: moss green (#8FBC8F), stone grey (#808080), water blue (#ADD8E6), all used sparingly.",
                dark: "For dark mode, use deep, calming charcoals (#36454F), dark slate greys (#2F4F4F), or muted indigo (#483D8B). Text should be a soft off-white or very light grey. Accent colors remain nature-inspired but adjusted for contrast, perhaps a moonlit silver (#C0C0C0) or a deep forest green (#006400) used minimally."
            }
        }
    },
    {
        id: 'retroFuturisticHolo',
        userFacingText: 'Retro-Futuristic Holo-Interface',
        description: 'A design inspired by retro sci-fi interfaces, holographic displays, and glowing neon lines. Futuristic with a nostalgic, tangible tech feel.',
        visualElement: () => <i className={`pi pi-desktop ${styles.visualIcon} text-indigo-500`}></i>, // Visual Cue: glowing translucent button (pi-desktop already used, maybe pi-globe for holo)
        aiInstructions: {
            core: "Design a personal website with a 'Retro-Futuristic Holo-Interface' aesthetic. This should evoke the feeling of interacting with a holographic display from 70s/80s sci-fi. Emphasize glowing lines, translucent panels, sharp vector graphics, and a sense of projected light. Use geometric shapes, grids, and data visualization motifs. Typography can be clean and futuristic, or slightly retro-digital.",
            animation: "Implement 'Scan Lines & Holographic Shimmer' animations: Subtle horizontal scan lines can animate across the background or panels. Elements on hover might shimmer or have a slight 'flicker' as if projected. Transitions between sections could involve elements assembling from light or dissolving into particles.",
            defaultColorGuidance: {
                light: "For light mode, use a very light, almost ethereal background (e.g., pale cyan #E0FFFF or light silver #D3D3D3) to suggest a brightly lit environment. Holographic elements and text should be in vibrant, glowing colors like electric blue (#00FFFF), neon pink (#FF007F), and bright orange (#FFA500), often with outer glows. Borders and accents can be sharp white or light grey.",
                dark: "For dark mode, use a deep space blue (#000030), black (#000000), or dark purple (#301934) background. Glowing elements should be the primary light source: neon cyan (#00BFFF), laser red (#FF0000), vibrant green (#00FF00). Translucent panels can have subtle internal lighting effects."
            }
        }
    }
];

const colorStyleOptions = [
    {
        id: 'monochromaticMinimal',
        userFacingText: 'Monochromatic & Minimal',
        description: 'Clean and sophisticated. Uses shades and tints of a single core color for a harmonious and understated look.',
        visualElement: () => <ColorPaletteVisual gradient="linear-gradient(to right, #e3f2fd, #90caf9, #42a5f5, #1e88e5, #0d47a1)" />, // Shades of blue gradient
        aiInstructions: {
            light: "Apply a 'Monochromatic & Minimal' color style. Select a single base color (e.g., a muted blue, grey, or even a desaturated warm tone like beige). Use various tints (lighter versions) of this color for backgrounds and larger surfaces, and shades (darker versions) for text, borders, and key accents. Ensure sufficient contrast for readability. Introduce white or very light grey as a neutral.",
            dark: "Apply a 'Monochromatic & Minimal' color style. Use a dark shade of the chosen base color (or a complementary dark neutral like charcoal if the base color is very light) for the background. Use lighter tints and mid-tones of the base color, or a contrasting light neutral (like off-white), for text and interactive elements. The focus is on subtlety and sophistication."
        }
    },
    {
        id: 'vibrantEnergetic',
        userFacingText: 'Vibrant & Energetic',
        description: 'Bold and lively. Features a palette of bright, saturated colors to create an energetic and attention-grabbing feel.',
        visualElement: () => <ColorPaletteVisual colors={['#FFEB3B', '#FF4081', '#00E676']} />, // Yellow, Pink, Green
        aiInstructions: {
            light: "Apply a 'Vibrant & Energetic' color style. Use a clean, bright neutral background (white or very light grey). Employ a palette of 2-3 highly saturated, vibrant accent colors (e.g., electric blue, sunny yellow, Kelly green) for key elements, calls to action, and graphical features. Ensure text remains highly legible in a dark, contrasting color.",
            dark: "Apply a 'Vibrant & Energetic' color style. Use a deep, dark neutral background (near-black or very dark grey). The vibrant accent colors from the light mode should be adapted to 'glow' or stand out intensely against the dark background (e.g., their luminosity might be increased, or they might be paired with subtle outer glows). Text should be a bright, contrasting light color."
        }
    },
    {
        id: 'earthyOrganic',
        userFacingText: 'Earthy & Organic',
        description: 'Warm and natural. Uses colors found in nature – browns, greens, muted oranges, and stone greys – for a grounded, approachable feel.',
        visualElement: () => <ColorPaletteVisual colors={['#A0A083', '#6A744F', '#CC7A66', '#D3D3D3']} />, // Muted green, darker green, terracotta, stone grey
        aiInstructions: {
            light: "Apply an 'Earthy & Organic' color style. Use backgrounds in warm off-whites, creams, or very light tans/beiges. Accent colors should be drawn from nature: various shades of green (olive, forest, sage), browns (terracotta, sepia, tan), muted oranges, and stone greys. Text in dark brown or charcoal.",
            dark: "Apply an 'Earthy & Organic' color style. Use backgrounds in deep browns, rich forest greens, or dark charcoal/slate greys. Text in a light cream or beige. Accent colors should be adapted from the light mode palette, perhaps slightly desaturated or lightened to provide contrast while maintaining the natural feel (e.g., a muted gold, lighter sage)."
        }
    },
    {
        id: 'techNoirCyberpunk',
        userFacingText: 'Tech Noir / Cyberpunk Glow',
        description: 'Dark and futuristic. Dominated by deep blacks and greys, highlighted by sharp, glowing neon accents like blues, purples, and pinks.',
        visualElement: () => <ColorPaletteVisual colors={['#0D0221', '#2DE2E6', '#F6019D', '#7F00FF']} />, // Deep dark, neon cyan, neon pink, neon purple
        aiInstructions: {
            light: "Apply a 'Tech Noir / Cyberpunk Glow' color style. (This is less common for 'Tech Noir' but can be interpreted as a 'daylight' version of a cyberpunk city or a sterile lab). Use a very light grey or off-white, almost clinical background. Accent colors should be sharp and digital: electric blue, vibrant purple, hot pink, bright cyan, used for UI elements, borders, or highlights. Text in a crisp dark grey or black.",
            dark: "Apply a 'Tech Noir / Cyberpunk Glow' color style. This is the primary expression. Use a deep black or very dark charcoal/navy background. The main visual interest comes from glowing neon accents: electric blue, vibrant magenta/pink, acid green, vivid purple. These should be used for text highlights, interactive elements, borders, and graphical details, creating a strong contrast and futuristic feel."
        }
    },
    {
        id: 'pastelSoft',
        userFacingText: 'Pastel & Soft',
        description: 'Light, airy, and gentle. Features a palette of soft pastel colors for a calm, dreamy, and approachable aesthetic.',
        visualElement: () => <ColorPaletteVisual colors={['#E6E6FA', '#FFDAB9', '#AFEEEE', '#FFB6C1']} />, // Lavender, Peach, Pale Turquoise, Light Pink
        aiInstructions: {
            light: "Apply a 'Pastel & Soft' color style. Use a white or very light pastel background (e.g., pale mint, baby blue, soft pink). Primary colors for elements and accents should be a harmonious selection of pastels (e.g., lavender, peach, light yellow, sky blue). Text should be a soft dark grey or a darker shade of one of the pastel hues for readability.",
            dark: "Apply a 'Pastel & Soft' color style. (A less common interpretation for pastels, often becomes 'muted' rather than 'dark pastel'). Use a muted dark background (e.g., a deep desaturated blue, a dark heather grey, or a muted plum). Pastel accents should be brightened slightly to stand out, or use lighter versions of the chosen pastels. Text in a light, soft off-white or a very pale pastel."
        }
    },
    {
        id: 'highContrastDuotone',
        userFacingText: 'High-Contrast Duotone/Tritone',
        description: 'Striking and graphic. Uses only two or three bold, contrasting colors (plus black/white) for a dramatic and memorable visual impact.',
        visualElement: () => <ColorPaletteVisual colors={['#000000', '#FFFF00', '#FF0000']} />, // Black, Yellow, Red for Tritone example
        aiInstructions: {
            light: "Apply a 'High-Contrast Duotone/Tritone' color style. Select two (duotone) or three (tritone) dominant, highly contrasting colors (e.g., black and vibrant yellow; or dark teal, bright orange, and cream). Typically, one of the chosen colors (or white/off-white) will serve as the background. The other color(s) will be used for text, elements, and graphical treatments. Ensure extreme contrast for impact and readability.",
            dark: "Apply a 'High-Contrast Duotone/Tritone' color style. Select two (duotone) or three (tritone) dominant, highly contrasting colors. Typically, a dark version of one of the colors (or black/near-black) will serve as the background. The other color(s) will be used for text and elements, often appearing brighter or more luminous against the dark base. The key is maintaining the limited, high-impact palette."
        }
    }
];

const addOnFeatureOptions = [
    {
        id: 'customCursor',
        userFacingText: 'Custom Cursor',
        description: 'Enable a unique custom cursor that matches the site\'s theme and enhances interactivity.',
        visualElement: () => <i className={`pi pi-mouse ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Implement a custom cursor that replaces the default system cursor. The custom cursor should be visually unique and align with the overall design concept's theme and aesthetic. It should also provide clear visual feedback on interactive elements (e.g., changing appearance on hover)."
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
        id: 'splitScreenLayout',
        userFacingText: 'Split-Screen Layout (for specific sections)',
        description: 'Use a split-screen layout for sections like \'About Me\' or \'Contact\' for a balanced content display.',
        visualElement: () => <i className={`pi pi-table ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "For relevant sections (e.g., About Me, Contact, specific Project details), utilize a split-screen layout where content is divided into two distinct vertical or horizontal panes, potentially with different background treatments or scrolling behaviors."
    },
    {
        id: 'masonryPortfolio',
        userFacingText: 'Masonry or Irregular Grid Portfolio',
        description: 'Display portfolio projects in a dynamic masonry or irregular grid for a visually engaging layout.',
        visualElement: () => <i className={`pi pi-microsoft ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Design the portfolio section using a masonry or irregular grid layout where project items have varying heights and/or widths and are packed tightly together, creating a visually dynamic and modern display."
    },
    {
        id: 'fullScreenNav',
        userFacingText: 'Full-Screen Navigation Overlay',
        description: 'Implement a full-screen navigation menu that overlays the content when opened.',
        visualElement: () => <i className={`pi pi-window-maximize ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "When the navigation menu is opened (especially on mobile/tablet, but potentially as an option on desktop), it should appear as a full-screen overlay that covers the main content, providing a focused navigation experience. Style this overlay according to the chosen design concept and color style."
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
        id: 'interactiveSkills',
        userFacingText: 'Interactive Skill Visualization',
        description: 'Showcase skills in a creative, interactive way beyond a simple list (e.g., skill tree, constellation).',
        visualElement: () => <i className={`pi pi-sitemap ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Design a creative and interactive way to visualize skills (e.g., not just a list or static progress bars). This could be a force-directed graph, an interactive constellation where clicking a star reveals skill details, a draggable skill tree, a radial chart with interactive segments, or another unique visual metaphor that users can explore. The visualization should be thematically consistent with the chosen design concept."
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
        id: 'horizontalScroll',
        userFacingText: 'Horizontal Scrolling Sections',
        description: 'Incorporate sections that scroll horizontally, offering a unique way to navigate content like galleries or timelines.',
        visualElement: () => <i className={`pi pi-arrows-h ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Design one or more key sections of the website (e.g., a project gallery, a timeline, a step-by-step process) to utilize horizontal scrolling within the primary vertical scroll of the page. Ensure clear visual cues for horizontal interactivity and intuitive navigation (e.g., scrollbar, arrows, drag functionality)."
    },
    {
        id: 'microinteractions',
        userFacingText: 'Microinteractions & Hover Effects',
        description: 'Enhance user experience with delightful microinteractions and creative hover effects on buttons, links, and images.',
        visualElement: () => <i className={`pi pi-sparkles ${styles.addOnVisualIcon} text-700`}></i>, // pi-sparkles for "delightful"
        aiInstruction: "Implement meaningful microinteractions and creative hover effects on interactive elements such as buttons, links, navigation items, and portfolio thumbnails. These should provide clear feedback, add a touch of personality, and align with the chosen Design Concept (e.g., a button might subtly change shape, glow, reveal an icon, or have a textured feedback on hover/click)."
    },
    {
        id: 'variableFonts',
        userFacingText: 'Variable Font Integration',
        description: 'Utilize variable fonts for dynamic typography that can adapt weight, slant, or other axes, potentially interactively.',
        visualElement: () => <i className={`pi pi-font ${styles.addOnVisualIcon} text-700`}></i>,
        aiInstruction: "Integrate one or more variable fonts into the design. Leverage their dynamic capabilities for headings, subheadings, or even body text. Consider animations or interactive typographic effects where font weight, slant, width, or other axes change on hover, scroll, or based on other user interactions. Ensure graceful fallbacks for browsers that do not support variable fonts."
    }
];


export default function CreatePortfolioPage({params}) {
    const resumeId = params.id;
    const toast = useRef(null);
    const router = useRouter(); // Ensure useRouter is initialized

    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [selectedColorStyle, setSelectedColorStyle] = useState(null);
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generationResult, setGenerationResult] = useState(null);
    const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Crafting your unique layout...",
        "Selecting the perfect color harmonies...",
        "Integrating your chosen features...",
        "Polishing the pixels...",
        "Almost there, preparing the final touches!",
        "Just a little longer, good things take time!",
        "Our AI is working its magic for you...",
        "Finalizing the design blueprint..."
    ];

    useEffect(() => {
        if (!resumeId) {
            console.error('Resume ID is missing from params.');
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Resume ID is missing. Please check the URL.', life: 3000 });
        }
    }, [resumeId]);

    useEffect(() => {
        let intervalId;
        if (isLoading) {
            setCurrentLoadingMessageIndex(0); // Reset to the first message when loading starts
            intervalId = setInterval(() => {
                setCurrentLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
            }, 3500); // Change message every 3.5 seconds
        }
        return () => {
            clearInterval(intervalId);
        };
    }, [isLoading, loadingMessages.length]);

    const stepperItems = [
        { label: 'Design Concept', command: () => setActiveIndex(0) },
        { label: 'Color Palette', command: () => setActiveIndex(1) },
        { label: 'Add-on Features', command: () => setActiveIndex(2) },
        { label: 'Review & Generate', command: () => setActiveIndex(3) }
    ];

    const handleAddOnSelection = (e) => {
        let _selectedAddOns = [...selectedAddOns];
        if (e.checked) {
            _selectedAddOns.push(e.value);
        } else {
            _selectedAddOns = _selectedAddOns.filter(item => item.id !== e.value.id);
        }
        setSelectedAddOns(_selectedAddOns);
    };

    const constructPreferencesPayload = () => {
        const lines = [];

        // Intro
        lines.push("Generate a personal website design concept for a designer/frontend developer. The design must be fresh, highly creative, and visually striking...");

        // Design Concept
        if (selectedConcept) {
            if (lines.length > 0 && lines[0] !== "") lines.push(""); // Add a blank line if there's preceding content (intro)
            lines.push(`${selectedConcept.aiInstructions.core} (from ${selectedConcept.userFacingText} Concept Core)`);
            lines.push(`${selectedConcept.aiInstructions.animation} (from ${selectedConcept.userFacingText} Animation)`);
        }

        // Color Style
        if (selectedColorStyle) {
            if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push(""); // Add a blank line if there's preceding content and it's not already a blank line
            lines.push(`Apply a '${selectedColorStyle.userFacingText}' color style.`);
            lines.push(`For light mode: ${selectedColorStyle.aiInstructions.light}`);
            lines.push(`For dark mode: ${selectedColorStyle.aiInstructions.dark} (from ${selectedColorStyle.userFacingText} Color Style)`);
        }

        // Add-on Features
        if (selectedAddOns && selectedAddOns.length > 0) {
            if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push(""); // Add a blank line if there's preceding content and it's not already a blank line
            selectedAddOns.forEach((addon) => {
                lines.push(`${addon.aiInstruction} (from ${addon.userFacingText} Add-on)`);
            });
        }

        return lines.join('\n');
    };

    const handleSubmitPreferences = async () => {
        if (!selectedConcept || !selectedColorStyle) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Selections', detail: 'Please select a Design Concept and Color Palette.', life: 3000 });
            return;
        }
        setIsLoading(true);
        setGenerationResult(null);
        const preferences = constructPreferencesPayload();

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await axios.post(
                `${backendUrl}/api/resumes/generate_website_yaml/`,
                { resumeId: resumeId, preferences: preferences },
                { headers: { 'Content-Type': 'application/json' } }
            );
            setGenerationResult({ success: true, data: response.data });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Website preferences submitted! Generation started.', life: 5000 });
            // Navigate to the site editor page on success
            if (response.data && response.data.website_uuid) {
                router.push(`/site-editor/${response.data.website_uuid}/`);
            } else {
                // Fallback or error if website_uuid is not in the response
                console.error("website_uuid not found in response data");
                toast.current?.show({ severity: 'error', summary: 'Navigation Error', detail: 'Could not retrieve website ID for navigation.', life: 5000 });
            }
        } catch (error) {
            console.error("Error submitting preferences:", error);
            let detail = 'An error occurred while submitting preferences.';
            if (error.response) {
                detail = `Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`;
            } else if (error.request) {
                detail = 'No response from server. Check connection or try later.';
            }
            setGenerationResult({ success: false, error: detail });
            toast.current?.show({ severity: 'error', summary: 'Error', detail: detail, life: 7000 });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeIndex) {
            case 0: // Design Concept
                return (
                    <div className="grid">
                        {designConceptOptions.map(concept => (
                            <div key={concept.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <Card
                                    className={`${styles.selectionCard} ${selectedConcept?.id === concept.id ? styles.selectedCard : ''}`}
                                    onClick={() => setSelectedConcept(concept)}
                                >
                                    <div className="flex flex-column align-items-center text-center h-full">
                                        <div className={styles.visualElementContainer}>
                                            {concept.visualElement()}
                                        </div>
                                        <h3 className="mt-3 mb-2 text-lg font-semibold">{concept.userFacingText}</h3>
                                        <p className="text-sm text-600 px-2 flex-grow-1">{concept.description}</p>
                                        <RadioButton
                                            inputId={`concept_${concept.id}`} // Ensure unique inputId
                                            name="concept"
                                            value={concept}
                                            onChange={(e) => setSelectedConcept(e.value)}
                                            checked={selectedConcept?.id === concept.id}
                                            className="mt-3"
                                        />
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                );
            case 1: // Color Palette
                return (
                    <div className="grid">
                        {colorStyleOptions.map(style => (
                            <div key={style.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <Card
                                    className={`${styles.selectionCard} ${selectedColorStyle?.id === style.id ? styles.selectedCard : ''}`}
                                    onClick={() => setSelectedColorStyle(style)}
                                >
                                    <div className="flex flex-column align-items-center text-center h-full">
                                        <div className={`${styles.visualElementContainer} ${styles.colorPalettePreview}`}>
                                            {style.visualElement()}
                                        </div>
                                        <h3 className="mt-3 mb-2 text-lg font-semibold">{style.userFacingText}</h3>
                                        <p className="text-sm text-600 px-2 flex-grow-1">{style.description}</p>
                                        <RadioButton
                                            inputId={`style_${style.id}`} // Ensure unique inputId
                                            name="colorStyle"
                                            value={style}
                                            onChange={(e) => setSelectedColorStyle(e.value)}
                                            checked={selectedColorStyle?.id === style.id}
                                            className="mt-3"
                                        />
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                );
            case 2: // Add-on Features
                return (
                    <div className="grid">
                        {addOnFeatureOptions.map(feature => (
                            <div key={feature.id} className="col-12 md:col-6 lg:col-4 p-2">
                                <div
                                    className={`${styles.addOnCard} ${selectedAddOns.some(item => item.id === feature.id) ? styles.selectedAddOnCard : ''}`}
                                    onClick={() => {
                                        const isSelected = selectedAddOns.some(item => item.id === feature.id);
                                        handleAddOnSelection({ value: feature, checked: !isSelected });
                                    }}
                                >
                                    <div className="flex align-items-center">
                                        <div className={styles.addOnVisualElementContainer}>
                                            {feature.visualElement()}
                                        </div>
                                        <div className="ml-3 flex-grow-1">
                                            <span className="font-medium text-lg">{feature.userFacingText}</span>
                                            <p className="text-sm text-600 mt-1 mb-0">{feature.description}</p>
                                        </div>
                                        <Checkbox
                                            inputId={`feature_${feature.id}`} // Ensure unique inputId
                                            value={feature}
                                            onChange={handleAddOnSelection}
                                            checked={selectedAddOns.some(item => item.id === feature.id)}
                                            className="ml-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 3: // Review & Generate
                if (isLoading) {
                    return (
                        <div className="text-center p-5">
                            <ProgressSpinner style={{ width: '80px', height: '80px' }} strokeWidth="4" />
                            <h3 className="mt-4 text-xl font-semibold">Generating Your Design...</h3>
                            <p className="text-lg text-600 mt-2">{loadingMessages[currentLoadingMessageIndex]}</p>
                            <p className="text-sm text-500 mt-4">This can take up to a few minutes. Please don't close this page.</p>
                        </div>
                    );
                }
                if (generationResult?.success) {
                    return (
                        <div className="text-center p-5">
                            <i className="pi pi-check-circle text-green-500 text-6xl mb-3"></i>
                            <h3 className="mt-3 text-xl font-semibold">Preferences Submitted Successfully!</h3>
                            <p className="text-lg text-600">Your unique website design generation has been initiated.</p>
                            <p className="text-sm text-500 mt-2">You will be notified once it&apos;s ready, or check your dashboard.</p>
                            <Button label="Start New Design" icon="pi pi-plus" className="p-button-outlined mt-4" onClick={() => { setActiveIndex(0); setGenerationResult(null); setSelectedConcept(null); setSelectedColorStyle(null); setSelectedAddOns([]); }} />
                        </div>
                    );
                }
                if (generationResult?.error) {
                    return (
                        <div className="text-center p-5">
                            <i className="pi pi-times-circle text-red-500 text-6xl mb-3"></i>
                            <h3 className="mt-3 text-xl font-semibold">Generation Failed</h3>
                            <p className="text-lg text-red-700">{generationResult.error}</p>
                            <Button label="Try Again" icon="pi pi-refresh" className="p-button-danger mt-4" onClick={() => { setIsLoading(false); setGenerationResult(null); }} />
                        </div>
                    );
                }

                return (
                    <Card className="shadow-1">
                        <div className="p-4">
                            <h4 className="font-semibold text-2xl mb-4 text-center">Review Your Selections</h4>
                            <div className="surface-section p-4 border-round border-1 surface-border">
                                <div className="mb-3">
                                    <strong className="text-gray-700 block mb-1">Design Concept:</strong>
                                    <p className="text-gray-600 text-lg">{selectedConcept ? selectedConcept.userFacingText : 'Not Selected'}</p>
                                </div>
                                <div className="mb-3">
                                    <strong className="text-gray-700 block mb-1">Color Palette:</strong>
                                    <p className="text-gray-600 text-lg">{selectedColorStyle ? selectedColorStyle.userFacingText : 'Not Selected'}</p>
                                </div>
                                <div>
                                    <strong className="text-gray-700 block mb-1">Additional Features:</strong>
                                    {selectedAddOns.length > 0 ? (
                                        <ul className="list-disc pl-5 mt-1">
                                            {selectedAddOns.map(addon => <li key={addon.id} className="text-gray-600 text-lg">{addon.userFacingText}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-600 text-lg">None</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                label="Generate Website Design"
                                icon="pi pi-sparkles"
                                className="w-full mt-5 p-button-lg p-button-success"
                                onClick={handleSubmitPreferences}
                                disabled={!selectedConcept || !selectedColorStyle || isLoading}
                            />
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className={`min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6 lg:p-8 ${styles.pageContainer}`}>
                <div className={`surface-card p-3 sm:p-5 shadow-2 border-round w-full mx-auto ${styles.contentWrapper}`}>
                    <div className="text-center mb-5">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Customize Your Portfolio</h1>
                        <p className="text-gray-600 text-lg">Follow the steps to define your website's unique style.</p>
                    </div>

                    {/* Hint/Warning Message */}
                    <div className={`${styles.hintMessage} surface-100 p-3 border-round mb-6 flex align-items-center`}>
                        <i className="pi pi-info-circle text-primary text-2xl mr-3"></i>
                        <div>
                            <span className="font-bold text-primary">Important:</span> Your selections below will guide your personal AI in crafting a unique website tailored to your preferences. Choose wisely!
                        </div>
                    </div>


                    <Steps model={stepperItems} activeIndex={activeIndex} onSelect={(e) => setActiveIndex(e.index)} readOnly={false} className="mb-6 text-sm md:text-base" />

                    <div className="p-0 md:p-4">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-content-between mt-6 p-2 md:p-4">
                        <Button
                            label="Back"
                            icon="pi pi-arrow-left"
                            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                            disabled={activeIndex === 0 || isLoading}
                            className="p-button-secondary"
                        />
                        <Button
                            label={activeIndex === stepperItems.length - 1 ? (isLoading ? 'Generating...' : 'Generate Design') : 'Next'}
                            iconPos={activeIndex === stepperItems.length - 1 ? 'left' : 'right'}
                            icon={activeIndex === stepperItems.length - 1 ? (isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check') : 'pi pi-arrow-right'}
                            onClick={() => {
                                if (activeIndex === stepperItems.length - 1) {
                                    handleSubmitPreferences();
                                } else {
                                    if (activeIndex === 0 && !selectedConcept) {
                                        toast.current?.show({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a Design Concept.', life: 3000 }); return;
                                    }
                                    if (activeIndex === 1 && !selectedColorStyle) {
                                        toast.current?.show({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a Color Palette.', life: 3000 }); return;
                                    }
                                    setActiveIndex(Math.min(stepperItems.length - 1, activeIndex + 1));
                                }
                            }}
                            disabled={isLoading || (activeIndex === 0 && !selectedConcept && activeIndex < stepperItems.length - 1) || (activeIndex === 1 && !selectedColorStyle && activeIndex < stepperItems.length - 1)}
                            className={activeIndex === stepperItems.length - 1 ? 'p-button-success' : 'p-button-primary'}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
