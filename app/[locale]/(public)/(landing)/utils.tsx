export const smoothScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        // Get header height from CSS variable or set a default
        const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim(), 10) || 80;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight - 20; // Add extra space

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    } else {
        console.warn(`smoothScrollTo: Element with ID "${id}" not found.`);
    }
};
