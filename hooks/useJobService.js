import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { aiApi } from '@/lib/axios';

const JOB_SERVICE_CACHE_KEY = 'globalJobService';
const JOB_SERVICE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const SCRAPE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RESUME_CACHE_KEY = 'defaultResumeData';

class JobService {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
        this.intervalId = null;
        this.subscribers = new Set();
        this.lastScrapeTime = 0;
        this.defaultResume = null;
        this.userLocation = null;
        this.loadFromCache();
    }

    // Load cached data on initialization
    loadFromCache() {
        try {
            const cachedData = localStorage.getItem(JOB_SERVICE_CACHE_KEY);
            if (cachedData) {
                const { jobs, timestamp, lastScrapeTime, location } = JSON.parse(cachedData);
                const now = Date.now();
                
                // Only load if cache is less than 24 hours old
                if (now - timestamp < JOB_SERVICE_EXPIRY_MS) {
                    this.jobs = jobs || [];
                    this.lastScrapeTime = lastScrapeTime || 0;
                    this.userLocation = location;
                    console.log('JobService: Loaded from cache', this.jobs.length, 'jobs');
                } else {
                    localStorage.removeItem(JOB_SERVICE_CACHE_KEY);
                }
            }
        } catch (error) {
            console.error('JobService: Failed to load from cache', error);
        }
    }

    // Save current state to cache
    saveToCache() {
        try {
            const cacheData = {
                jobs: this.jobs,
                timestamp: Date.now(),
                lastScrapeTime: this.lastScrapeTime,
                location: this.userLocation
            };
            localStorage.setItem(JOB_SERVICE_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('JobService: Failed to save to cache', error);
        }
    }

    // Subscribe to job updates
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers of updates
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.jobs));
    }

    // Get default resume with search keywords
    async getDefaultResume() {
        try {
            // Check cache first
            const cachedResume = localStorage.getItem(DEFAULT_RESUME_CACHE_KEY);
            if (cachedResume) {
                const { resume, timestamp } = JSON.parse(cachedResume);
                // Use cached resume if less than 1 hour old
                if (Date.now() - timestamp < 60 * 60 * 1000) {
                    this.defaultResume = resume;
                    return resume;
                }
            }

            // Fetch fresh data
            const response = await api.get('/api/resumes/');
            const resumes = response.data;
            const defaultResume = resumes.find(r => r.is_default) || resumes[0];
            
            if (defaultResume) {
                // Cache the resume
                localStorage.setItem(DEFAULT_RESUME_CACHE_KEY, JSON.stringify({
                    resume: defaultResume,
                    timestamp: Date.now()
                }));
                this.defaultResume = defaultResume;
            }
            
            return defaultResume;
        } catch (error) {
            console.error('JobService: Failed to get default resume', error);
            return null;
        }
    }

    // Get user location
    async getUserLocation() {
        if (this.userLocation) return this.userLocation;

        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.userLocation = {
                country: data.country_name || 'USA',
                city: data.city || 'New York'
            };
            return this.userLocation;
        } catch (error) {
            console.error('JobService: Failed to get location', error);
            this.userLocation = { country: 'USA', city: 'New York' };
            return this.userLocation;
        }
    }

    // Scrape jobs based on default resume
    async scrapeJobs() {
        try {
            console.log('JobService: Starting job scrape...');
            
            const [defaultResume, location] = await Promise.all([
                this.getDefaultResume(),
                this.getUserLocation()
            ]);

            if (!defaultResume) {
                console.warn('JobService: No default resume found, skipping scrape');
                return;
            }

            // Extract search terms from resume
            const searchTerms = this.extractSearchTerms(defaultResume);
            
            if (!searchTerms || searchTerms.length === 0) {
                console.warn('JobService: No search keywords found in resume');
                return;
            }

            console.log(`JobService: Scraping jobs for ${searchTerms.length} keywords:`, searchTerms);

            const scrapePromises = searchTerms.map(term => {
                const requestBody = {
                    search_term: term,
                    location: location.city,
                    country: location.country,
                };
                return aiApi.post('/scraper/scrape-jobs/', requestBody);
            });

            const results = await Promise.allSettled(scrapePromises);
            
            const allNewJobs = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const newJobs = Array.isArray(result.value.data) ? result.value.data : (result.value.data.jobs || []);
                    if (newJobs.length > 0) {
                        console.log(`JobService: Found ${newJobs.length} jobs for keyword "${searchTerms[index]}"`);
                        allNewJobs.push(...newJobs);
                    }
                } else {
                    console.error(`JobService: Failed to scrape for keyword "${searchTerms[index]}"`, result.reason);
                }
            });

            if (allNewJobs.length > 0) {
                // Deduplicate jobs from the current scrape before adding to the main list
                const uniqueNewJobs = [];
                const seenJobs = new Set();

                allNewJobs.forEach(job => {
                    const identifier = (job.job_url || `${job.title}-${job.company}`).toLowerCase();
                    if (!seenJobs.has(identifier)) {
                        seenJobs.add(identifier);
                        uniqueNewJobs.push(job);
                    }
                });
                
                const addedCount = this.addUniqueJobs(uniqueNewJobs);
                if (addedCount > 0) {
                    this.lastScrapeTime = Date.now();
                    this.saveToCache();
                    this.notifySubscribers();
                    console.log(`JobService: Added ${addedCount} new unique jobs. Total: ${this.jobs.length}`);
                } else {
                    console.log('JobService: No new unique jobs found to add.');
                }
            } else {
                console.log('JobService: No new jobs found from any keyword.');
            }

        } catch (error) {
            console.error('JobService: An error occurred during the scrape process', error);
        }
    }

    // Extract search terms from resume
    extractSearchTerms(resume) {
        const terms = new Set();

        // From job_search_keywords field
        if (resume.job_search_keywords) {
            const keywords = resume.job_search_keywords.split(',').map(k => k.trim());
            keywords.forEach(k => k && terms.add(k));
        }


        console.log('JobService: Extracted search terms:', Array.from(terms));
        return Array.from(terms).filter(term => term.length > 2); // Filter out short terms
    }

    // Add unique jobs to the list
    addUniqueJobs(newJobs) {
        let addedCount = 0;
        newJobs.forEach(newJob => {
            // Check if job already exists (by URL or title+company combination)
            const exists = this.jobs.some(existingJob => 
                (existingJob.job_url && newJob.job_url && existingJob.job_url === newJob.job_url) ||
                (existingJob.title === newJob.title && existingJob.company === newJob.company)
            );

            if (!exists) {
                this.jobs.unshift(newJob); // Add new jobs to the beginning
                addedCount++;
            }
        });
        return addedCount;
    }

    // Start the background scraping service
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('JobService: Starting background job scraping...');

        // Initial scrape if we haven't scraped in the last hour
        if (Date.now() - this.lastScrapeTime > 60 * 60 * 1000) {
            this.scrapeJobs();
        }

        // Set up interval for every 5 minutes
        this.intervalId = setInterval(() => {
            this.scrapeJobs();
        }, SCRAPE_INTERVAL_MS);
    }

    // Stop the background scraping service
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('JobService: Stopped background job scraping');
    }

    // Get current jobs
    getJobs() {
        return this.jobs;
    }

    // Get jobs filtered by criteria
    getFilteredJobs(filters = {}) {
        let filteredJobs = [...this.jobs];

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filteredJobs = filteredJobs.filter(job => 
                job.title?.toLowerCase().includes(term) ||
                job.company?.toLowerCase().includes(term) ||
                job.location?.toLowerCase().includes(term)
            );
        }

        if (filters.location) {
            const location = filters.location.toLowerCase();
            filteredJobs = filteredJobs.filter(job => 
                job.location?.toLowerCase().includes(location)
            );
        }

        if (filters.isRemote) {
            filteredJobs = filteredJobs.filter(job => job.is_remote);
        }

        // Sort by added date (newest first)
        filteredJobs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

        return filteredJobs.slice(0, filters.limit || filteredJobs.length);
    }

    // Manual refresh
    async refresh() {
        await this.scrapeJobs();
    }
}

// Global singleton instance
let jobServiceInstance = null;

// Custom hook to use the job service
export const useJobService = () => {
    const { data: session, status } = useSession();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize service
    useEffect(() => {
        if (status === 'authenticated' && session) {
            if (!jobServiceInstance) {
                jobServiceInstance = new JobService();
            }

            // Subscribe to updates
            const unsubscribe = jobServiceInstance.subscribe((updatedJobs) => {
                setJobs(updatedJobs);
                setLoading(false);
            });

            // Initial load
            setJobs(jobServiceInstance.getJobs());
            setLoading(false);

            // Start the service
            jobServiceInstance.start();

            return () => {
                unsubscribe();
            };
        }
    }, [session, status]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (jobServiceInstance) {
                jobServiceInstance.stop();
            }
        };
    }, []);

    const getFilteredJobs = useCallback((filters) => {
        return jobServiceInstance ? jobServiceInstance.getFilteredJobs(filters) : [];
    }, []);

    const refresh = useCallback(async () => {
        if (jobServiceInstance) {
            setLoading(true);
            await jobServiceInstance.refresh();
            setLoading(false);
        }
    }, []);

    return {
        jobs,
        loading,
        error,
        getFilteredJobs,
        refresh,
        isServiceRunning: jobServiceInstance?.isRunning || false
    };
};

export default useJobService;