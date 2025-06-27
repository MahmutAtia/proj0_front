const CACHE_KEY = 'all_resumes_list';

/**
 * Retrieves the list of all resumes from localStorage.
 * @returns {Array | null} The array of resume items or null if not present.
 */
export const getResumesFromCache = () => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;
        // The cache stores an object { data: [...] }, we return the array.
        return JSON.parse(cachedData).data || null;
    } catch (error) {
        console.error("Error reading resume cache:", error);
        return null;
    }
};

/**
 * Saves the entire list of resumes to localStorage.
 * @param {Array} resumes - The array of resume items to save.
 */
export const setResumesCache = (resumes) => {
    try {
        const cacheObject = {
            data: resumes,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
        console.error("Error setting resume cache:", error);
    }
};

/**
 * Adds or updates a single resume in the localStorage cache.
 * @param {object} resumeItem - The full resume item object to add or update.
 */
export const addOrUpdateResumeInCache = (resumeItem) => {
    if (!resumeItem || !resumeItem.id) return;

    try {
        const resumes = getResumesFromCache() || [];
        const index = resumes.findIndex(r => r.id === resumeItem.id);

        if (index > -1) {
            // Update existing resume
            resumes[index] = resumeItem;
        } else {
            // Add new resume to the top of the list
            resumes.unshift(resumeItem);
        }
        setResumesCache(resumes);
    } catch (error) {
        console.error("Error updating resume in cache:", error);
    }
};

/**
 * Invalidates and removes the entire resume cache.
 */
export const invalidateResumeCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
        console.log("Resume cache invalidated.");
    } catch (error) {
        console.error("Error removing resume cache:", error);
    }
};