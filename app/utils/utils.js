import yaml from 'js-yaml';
import { getResumesFromCache } from '@/app/utils/resumeCache';

/**
 * Finds a resume by ID in local storage and converts it to a sorted YAML string.
 * This function now returns the YAML string or throws an error.
 * @param {string | number} resumeId The ID of the resume to process.
 * @returns {string} The YAML string representation of the resume.
 */
const generateYamlFromLocalStorage = (resumeId) => {
    // FIX: Use the centralized cache utility function to read from the correct key.
    const resumes = getResumesFromCache(); 
    if (!resumes) {
        throw new Error('Resume cache not found. Please visit the dashboard to load resumes.');
    }

    const resumeItem = resumes.find((item) => item.id == resumeId); // Loose comparison

    if (!resumeItem || !resumeItem.resume) {
        throw new Error(`Resume with ID ${resumeId} not found in local cache.`);
    }

    const sectionsSort = resumeItem.sections_sort 
    const orderedResume = {};

    sectionsSort.forEach(sectionKey => {
        if (resumeItem.resume.hasOwnProperty(sectionKey)) {
            orderedResume[sectionKey] = resumeItem.resume[sectionKey];
        }
    });

    // Then, add any remaining sections that might not be in sections_sort
    Object.keys(resumeItem.resume).forEach(key => {
        if (!orderedResume.hasOwnProperty(key)) {
            orderedResume[key] = resumeItem.resume[key];
        }
    });

    // Create the complete resume structure with metadata fields
    const completeResumeStructure = {
        title: resumeItem.title || 'Resume Collection',
        description: resumeItem.description || '',
        fontawesome_icon: resumeItem.icon || 'fa-user',
        about_candidate: resumeItem.about || '',
        job_search_keywords: resumeItem.job_search_keywords || '',
        resume: orderedResume
    };

    // Convert the complete resume structure to a sorted YAML string and return it
    return yaml.dump(completeResumeStructure, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false // Keep the order as specified
    });
};


export { generateYamlFromLocalStorage };