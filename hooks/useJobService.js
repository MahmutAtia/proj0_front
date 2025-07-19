import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { aiApi } from '@/lib/axios';
import api from '@/lib/axios'; // Import the main api for resume fetching

const JOB_SERVICE_CACHE_KEY = 'globalJobService';
const JOB_SERVICE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const KEYWORD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between keywords
const RESUMES_CACHE_KEY = 'all_resumes_list_cache'; // Same key as dashboard
const CACHE_EXPIRY_DURATION = 15 * 60 * 1000; // Same as dashboard (15 minutes)

class JobService {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
        this.keywordTimeoutId = null;
        this.subscribers = new Set();
        this.lastFullCycleTime = 0;
        this.currentKeywordIndex = 0;
        this.keywords = [];
        this.defaultResume = null;
        this.userLocation = null;
        this.isProcessingKeyword = false;
        this.cycleStartTime = 0;
        this.hasStartedCycle = false;
        this.loadFromCache();
    }

    // Load cached data on initialization
    loadFromCache() {
        try {
            const cachedData = localStorage.getItem(JOB_SERVICE_CACHE_KEY);
            if (cachedData) {
                const { 
                    jobs, 
                    timestamp, 
                    lastFullCycleTime, 
                    currentKeywordIndex, 
                    keywords,
                    cycleStartTime,
                    hasStartedCycle 
                } = JSON.parse(cachedData);
                
                this.jobs = jobs || [];
                this.lastFullCycleTime = lastFullCycleTime || 0;
                this.currentKeywordIndex = currentKeywordIndex || 0;
                this.keywords = keywords || [];
                this.cycleStartTime = cycleStartTime || 0;
                this.hasStartedCycle = hasStartedCycle || false;
                
                console.log(`JobService: Loaded from cache - ${this.jobs.length} jobs, keyword ${this.currentKeywordIndex}/${this.keywords.length}`);
                console.log(`JobService: Last cycle: ${new Date(this.lastFullCycleTime).toLocaleString()}`);
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
                lastFullCycleTime: this.lastFullCycleTime,
                currentKeywordIndex: this.currentKeywordIndex,
                keywords: this.keywords,
                location: this.userLocation,
                cycleStartTime: this.cycleStartTime,
                hasStartedCycle: this.hasStartedCycle
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

    // Check if 24-hour cycle has expired
    is24HourCycleExpired() {
        const now = Date.now();
        const timeSinceLastCycle = now - this.lastFullCycleTime;
        return timeSinceLastCycle >= JOB_SERVICE_EXPIRY_MS;
    }

    // Check if currently in middle of a cycle
    isInActiveCycle() {
        if (!this.hasStartedCycle) return false;
        if (this.currentKeywordIndex >= this.keywords.length) return false; // Completed cycle
        
        const now = Date.now();
        const timeSinceCycleStart = now - this.cycleStartTime;
        
        // If cycle started but it's been more than expected time, consider it stalled
        const expectedCycleTime = this.keywords.length * KEYWORD_INTERVAL_MS;
        if (timeSinceCycleStart > expectedCycleTime + (60 * 60 * 1000)) { // Add 1 hour buffer
            console.log('JobService: Cycle appears stalled, will restart');
            return false;
        }
        
        return true;
    }

    // Get default resume using the same caching strategy as dashboard
    async getDefaultResume() {
        try {
            // Use the same cache key as dashboard
            const localData = localStorage.getItem(RESUMES_CACHE_KEY);
            let resumesData = null;
            
            if (localData) {
                const parsedCache = JSON.parse(localData);
                if (parsedCache.data && parsedCache.timestamp && (Date.now() - parsedCache.timestamp < CACHE_EXPIRY_DURATION)) {
                    resumesData = parsedCache.data;
                    console.log('JobService: Using cached resumes data');
                } else {
                    console.log('JobService: Cached resumes expired, will fetch fresh');
                    localStorage.removeItem(RESUMES_CACHE_KEY);
                }
            }

            if (!resumesData) {
                console.log('JobService: Fetching fresh resumes data');
                const response = await api.get('/api/resumes/');
                resumesData = response.data;
                
                // Cache the resumes data using the same key as dashboard
                localStorage.setItem(RESUMES_CACHE_KEY, JSON.stringify({ 
                    data: resumesData, 
                    timestamp: Date.now() 
                }));
            }

            // Find the default resume
            const defaultResume = resumesData.find(r => r.is_default) || resumesData[0];
            
            if (defaultResume) {
                this.defaultResume = defaultResume;
                console.log('JobService: Found default resume:', defaultResume.title);
            } else {
                console.log('JobService: No default resume found');
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

    // Initialize keywords from resume
    async initializeKeywords() {
        const defaultResume = await this.getDefaultResume();
        if (!defaultResume) {
            console.warn('JobService: No default resume found for keyword initialization');
            return false;
        }

        const searchTerms = this.extractSearchTerms(defaultResume);
        if (!searchTerms || searchTerms.length === 0) {
            console.warn('JobService: No search keywords found in resume');
            return false;
        }

        // Only update keywords if they've changed
        const keywordsChanged = JSON.stringify(this.keywords) !== JSON.stringify(searchTerms);
        if (keywordsChanged) {
            this.keywords = searchTerms;
            // Don't reset currentKeywordIndex here unless starting a new cycle
            console.log(`JobService: Keywords updated. Total: ${this.keywords.length}`, this.keywords);
        }

        return true;
    }

    // Process single keyword
    async processSingleKeyword() {
        if (this.isProcessingKeyword) {
            console.log('JobService: Already processing a keyword, skipping...');
            return;
        }

        if (this.currentKeywordIndex >= this.keywords.length) {
            console.log('JobService: All keywords processed for this cycle');
            return;
        }

        this.isProcessingKeyword = true;

        try {
            // Get location
            const location = await this.getUserLocation();
            if (!location) {
                console.warn('JobService: Cannot process keyword - no location available');
                return;
            }

            // Get current keyword
            const currentKeyword = this.keywords[this.currentKeywordIndex];
            console.log(`JobService: Processing keyword ${this.currentKeywordIndex + 1}/${this.keywords.length}: "${currentKeyword}"`);

            // Make API request
            const requestBody = {
                search_term: currentKeyword,
                location: location.city,
                country: location.country,
            };

            const response = await aiApi.post('/scraper/scrape-jobs/', requestBody);
            const newJobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);

            if (newJobs.length > 0) {
                console.log(`JobService: Found ${newJobs.length} jobs for keyword "${currentKeyword}"`);
                
                // Add unique jobs to cache
                const addedCount = this.addUniqueJobs(newJobs);
                console.log(`JobService: Added ${addedCount} unique jobs. Total jobs: ${this.jobs.length}`);
                
                if (addedCount > 0) {
                    this.saveToCache();
                    this.notifySubscribers();
                }
            } else {
                console.log(`JobService: No jobs found for keyword "${currentKeyword}"`);
            }

            // Move to next keyword
            this.currentKeywordIndex++;

            // Check if we completed full cycle
            if (this.currentKeywordIndex >= this.keywords.length) {
                console.log('JobService: ✅ Completed full keyword cycle!');
                this.currentKeywordIndex = 0; // Reset for next cycle
                this.lastFullCycleTime = Date.now();
                this.hasStartedCycle = false;
                this.cycleStartTime = 0;
                
                // Clean old jobs (keep jobs from last 7 days)
                this.cleanOldJobs();
                
                this.saveToCache();
                console.log(`JobService: Next cycle will start in 24 hours (${new Date(this.lastFullCycleTime + JOB_SERVICE_EXPIRY_MS).toLocaleString()})`);
            } else {
                // Save progress
                this.saveToCache();
            }

        } catch (error) {
            console.error(`JobService: Error processing keyword "${this.keywords[this.currentKeywordIndex]}"`, error);
            // Still move to next keyword to avoid getting stuck
            this.currentKeywordIndex++;
            this.saveToCache();
        } finally {
            this.isProcessingKeyword = false;
        }
    }

    // Clean old jobs (keep jobs from last 7 days)
    cleanOldJobs() {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const initialCount = this.jobs.length;
        
        this.jobs = this.jobs.filter(job => {
            // Keep job if it has addedAt timestamp and is within 7 days, or if no timestamp (keep as fallback)
            return !job.addedAt || job.addedAt > sevenDaysAgo;
        });

        const removedCount = initialCount - this.jobs.length;
        if (removedCount > 0) {
            console.log(`JobService: Cleaned ${removedCount} old jobs. Remaining: ${this.jobs.length}`);
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
                // Add timestamp for tracking
                newJob.addedAt = Date.now();
                this.jobs.unshift(newJob); // Add new jobs to the beginning
                addedCount++;
            }
        });
        return addedCount;
    }

    // Schedule next keyword processing
    scheduleNextKeyword() {
        if (this.keywordTimeoutId) {
            clearTimeout(this.keywordTimeoutId);
        }

        // Don't schedule if cycle is complete
        if (this.currentKeywordIndex >= this.keywords.length) {
            console.log('JobService: Cycle complete, no more keywords to schedule');
            return;
        }

        this.keywordTimeoutId = setTimeout(() => {
            this.processSingleKeyword().then(() => {
                // Schedule next keyword if still running and not complete
                if (this.isRunning && this.currentKeywordIndex < this.keywords.length) {
                    this.scheduleNextKeyword();
                }
            });
        }, KEYWORD_INTERVAL_MS);
        
        const nextKeyword = this.keywords[this.currentKeywordIndex];
        console.log(`JobService: Scheduled next keyword "${nextKeyword}" in ${KEYWORD_INTERVAL_MS / 1000 / 60} minutes`);
    }

    // Start the background scraping service
    async start() {
        if (this.isRunning) {
            console.log('JobService: Already running');
            return;
        }
        
        console.log('JobService: Starting background job scraping...');

        // Initialize keywords
        const hasKeywords = await this.initializeKeywords();
        if (!hasKeywords) {
            console.warn('JobService: Cannot start - no keywords available');
            return;
        }

        // Check if 24-hour cycle has expired
        const cycleExpired = this.is24HourCycleExpired();
        const inActiveCycle = this.isInActiveCycle();

        console.log(`JobService: Cycle expired: ${cycleExpired}, In active cycle: ${inActiveCycle}`);
        console.log(`JobService: Current keyword index: ${this.currentKeywordIndex}/${this.keywords.length}`);

        if (cycleExpired && !inActiveCycle) {
            // Start new 24-hour cycle
            console.log('JobService: 🚀 Starting NEW 24-hour cycle');
            this.currentKeywordIndex = 0;
            this.hasStartedCycle = true;
            this.cycleStartTime = Date.now();
            this.isRunning = true;
            
            // Process first keyword immediately
            this.processSingleKeyword().then(() => {
                if (this.isRunning && this.currentKeywordIndex < this.keywords.length) {
                    this.scheduleNextKeyword();
                }
            });
        } else if (inActiveCycle) {
            // Continue existing cycle
            console.log(`JobService: 📋 Continuing existing cycle from keyword ${this.currentKeywordIndex + 1}/${this.keywords.length}`);
            this.isRunning = true;
            
            // Continue with next keyword
            if (this.currentKeywordIndex < this.keywords.length) {
                this.processSingleKeyword().then(() => {
                    if (this.isRunning && this.currentKeywordIndex < this.keywords.length) {
                        this.scheduleNextKeyword();
                    }
                });
            }
        } else {
            // Waiting for next 24-hour cycle
            const timeUntilNextCycle = (this.lastFullCycleTime + JOB_SERVICE_EXPIRY_MS) - Date.now();
            const hoursLeft = Math.ceil(timeUntilNextCycle / (1000 * 60 * 60));
            console.log(`JobService: ⏰ Waiting for next cycle. ${hoursLeft} hours remaining until ${new Date(this.lastFullCycleTime + JOB_SERVICE_EXPIRY_MS).toLocaleString()}`);
            this.isRunning = true;
            
            // Schedule to start next cycle when time comes
            setTimeout(() => {
                if (this.isRunning) {
                    console.log('JobService: 24 hours elapsed, starting new cycle...');
                    this.start(); // Recursively start new cycle
                }
            }, timeUntilNextCycle);
        }
    }

    // Stop the background scraping service
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.keywordTimeoutId) {
            clearTimeout(this.keywordTimeoutId);
            this.keywordTimeoutId = null;
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

    // Manual refresh - process next keyword immediately (only if in active cycle)
    async refresh() {
        console.log('JobService: Manual refresh triggered');
        
        if (this.isInActiveCycle() && this.currentKeywordIndex < this.keywords.length) {
            await this.processSingleKeyword();
        } else if (this.is24HourCycleExpired()) {
            // Start new cycle if expired
            console.log('JobService: Starting new cycle due to manual refresh');
            await this.start();
        } else {
            console.log('JobService: Cannot refresh - either cycle complete or time not elapsed');
        }
    }

    // Get service status
    getStatus() {
        const cycleExpired = this.is24HourCycleExpired();
        const inActiveCycle = this.isInActiveCycle();
        const timeUntilNextCycle = Math.max(0, (this.lastFullCycleTime + JOB_SERVICE_EXPIRY_MS) - Date.now());
        
        return {
            isRunning: this.isRunning,
            currentKeywordIndex: this.currentKeywordIndex,
            totalKeywords: this.keywords.length,
            currentKeyword: this.keywords[this.currentKeywordIndex] || null,
            lastFullCycleTime: this.lastFullCycleTime,
            isProcessingKeyword: this.isProcessingKeyword,
            jobsCount: this.jobs.length,
            cycleExpired,
            inActiveCycle,
            timeUntilNextCycle,
            hasStartedCycle: this.hasStartedCycle,
            cycleStartTime: this.cycleStartTime
        };
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

            // Start the service (it will check if it should actually start based on 24-hour cycle)
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

    const getStatus = useCallback(() => {
        return jobServiceInstance ? jobServiceInstance.getStatus() : null;
    }, []);

    return {
        jobs,
        loading,
        error,
        getFilteredJobs,
        refresh,
        getStatus,
        isServiceRunning: jobServiceInstance?.isRunning || false
    };
};

export default useJobService;