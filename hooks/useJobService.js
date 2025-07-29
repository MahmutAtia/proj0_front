import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { aiApi } from '@/lib/axios';
import api from '@/lib/axios'; // Import the main api for resume fetching
import { useJobServiceContext } from '@/contexts/JobServiceContext';

const JOB_SERVICE_CACHE_KEY = 'globalJobService';
const JOB_SERVICE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const KEYWORD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between keywords
const RESUMES_CACHE_KEY = 'all_resumes_list_cache'; // Same key as dashboard
const CACHE_EXPIRY_DURATION = 15 * 60 * 1000; // Same as dashboard (15 minutes)

// NEW: Exported pure utility function for filtering jobs
export const filterJobs = (jobs = [], options = {}) => {
    const {
        searchTerm = '',
        location = '',
        isRemote = false,
        sortKey = 'relevance',
        limit = 0,
    } = options;

    if (!jobs || jobs.length === 0) {
        return [];
    }

    let filtered = [...jobs];

    // Apply text search filter
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(job =>
            (job.title && job.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (job.company && job.company.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    // Apply location filter
    if (location) {
        const lowerCaseLocation = location.toLowerCase();
        filtered = filtered.filter(job =>
            job.location && job.location.toLowerCase().includes(lowerCaseLocation)
        );
    }

    // Apply remote-only filter
    if (isRemote) {
        filtered = filtered.filter(job => job.is_remote);
    }

    // Apply sorting (can be expanded later)
    if (sortKey === 'recent') {
        filtered.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }

    // Apply limit
    if (limit > 0) {
        return filtered.slice(0, limit);
    }

    return filtered;
};

export class JobService {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
        this.isProcessingKeyword = false;
        this.keywordTimeoutId = null;
        this.keywordCheckIntervalId = null;
        this.subscribers = new Set();
        this.lastFullCycleTime = 0;
        this.currentKeywordIndex = 0;
        this.keywords = [];
        this.cycleStartTime = 0;
        this.hasStartedCycle = false;
        this.loading = true;
        this.isWaitingForKeywords = false; // NEW: True if paused pending user action
        this.hasActiveCycle = false;      // NEW: True if currently processing a cycle
        this.loadFromCache();
    }

    // Add the new states to the central state getter
    getState() {
        return {
            jobs: this.jobs,
            loading: this.loading,
            isRunning: this.isRunning,
            isWaitingForKeywords: this.isWaitingForKeywords,
            hasActiveCycle: this.hasActiveCycle,
        };
    }

    // Subscribe to job service updates
    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.getState()); // Send current state immediately

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    // Notify all subscribers about state changes
    notifySubscribers() {
        const state = this.getState();
        this.subscribers.forEach(callback => callback(state));
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
                this.lastFullCycleTime = lastFullCycleTime || 0; // Keep 0 for first-time users
                this.currentKeywordIndex = currentKeywordIndex || 0;
                this.keywords = keywords || [];
                this.cycleStartTime = cycleStartTime || 0;
                this.hasStartedCycle = hasStartedCycle || false;

                console.log(`JobService: Loaded from cache - ${this.jobs.length} jobs, keyword ${this.currentKeywordIndex}/${this.keywords.length}`);
                console.log(`JobService: Last cycle: ${this.lastFullCycleTime === 0 ? 'Never (first time)' : new Date(this.lastFullCycleTime).toLocaleString()}`);
            } else {
                // First time user - ensure it will start immediately
                console.log('JobService: First time user - will start immediately');
                this.lastFullCycleTime = 0;
            }
        } catch (error) {
            console.error('JobService: Failed to load from cache', error);
            // Reset to ensure first-time start
            this.lastFullCycleTime = 0;
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

    // Check if 24-hour cycle has expired
    is24HourCycleExpired() {
        const now = Date.now();
        const timeSinceLastCycle = now - this.lastFullCycleTime;
        return timeSinceLastCycle >= JOB_SERVICE_EXPIRY_MS;
    }

    // Check if currently in middle of a cycle
    isInActiveCycle() {
        // An active cycle requires that it has started, has keywords, and hasn't finished them all.
        if (!this.hasStartedCycle || this.keywords.length === 0 || this.currentKeywordIndex >= this.keywords.length) {
            return false;
        }

        // If it meets the criteria above, it's considered active.
        // The 24-hour check is for starting a *new* cycle, not for checking if the *current* one is active.
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

        // Check for cycle completion *before* doing anything else.
        if (this.currentKeywordIndex >= this.keywords.length) {
            console.log('JobService: ✅ All keywords processed for this cycle');
            this.hasActiveCycle = false;
            this.isRunning = false; // Cycle is done, so it's not "running"
            this.loading = false;
            this.lastFullCycleTime = Date.now();
            this.hasStartedCycle = false;
            this.cycleStartTime = 0;
            this.cleanOldJobs();
            this.saveToCache();
            this.notifySubscribers();
            
            console.log(`JobService: Cycle complete! Next run will start in ~24 hours.`);
            // Schedule the next full cycle run
            setTimeout(() => this.start(), JOB_SERVICE_EXPIRY_MS);
            return;
        }

        this.isProcessingKeyword = true;
        this.loading = true;
        this.notifySubscribers();

        try {
            const location = await this.getUserLocation();
            if (!location) {
                console.warn('JobService: Cannot process keyword - no location available');
                this.currentKeywordIndex++; // Skip to avoid getting stuck
                return;
            }

            const currentKeyword = this.keywords[this.currentKeywordIndex];
            console.log(`JobService: 🔍 Processing keyword ${this.currentKeywordIndex + 1}/${this.keywords.length}: "${currentKeyword}"`);

            const response = await aiApi.post('/scraper/scrape-jobs/', {
                search_term: currentKeyword,
                location: location.city,
                country: location.country,
            });
            
            const newJobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);

            if (newJobs.length > 0) {
                const addedCount = this.addUniqueJobs(newJobs);
                console.log(`JobService: Added ${addedCount} unique jobs. Total: ${this.jobs.length}`);
            } else {
                console.log(`JobService: No jobs found for keyword "${currentKeyword}"`);
            }

            this.currentKeywordIndex++;

        } catch (error) {
            console.error(`JobService: Error processing keyword "${this.keywords[this.currentKeywordIndex]}"`, error);
            this.currentKeywordIndex++; // Still move to next keyword to avoid getting stuck
        } finally {
            this.isProcessingKeyword = false;
            this.loading = false; // Keyword is done, UI can update
            this.saveToCache();
            this.notifySubscribers();
            
            // **Crucial part**: Decide what to do next.
            if (this.isRunning && this.currentKeywordIndex < this.keywords.length) {
                // If more keywords are left, schedule the next one.
                this.scheduleNextKeyword();
            } else if (this.isRunning) {
                // If that was the last keyword, call this function again to trigger the completion logic.
                this.processSingleKeyword();
            }
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
        if (this.currentKeywordIndex >= this.keywords.length) {
            return;
        }

        // Clear any existing timeout to prevent duplicates
        if (this.keywordTimeoutId) {
            clearTimeout(this.keywordTimeoutId);
        }

        this.keywordTimeoutId = setTimeout(() => {
            this.processSingleKeyword(); // This will then schedule the *next* one
        }, KEYWORD_INTERVAL_MS);

        const nextKeyword = this.keywords[this.currentKeywordIndex];
        console.log(`JobService: Scheduled next keyword "${nextKeyword}" in ${KEYWORD_INTERVAL_MS / 1000 / 60} minutes`);
    }

    // --- REFINED START LOGIC ---
    async start() {
        if (this.isRunning) {
            console.log('JobService: Call to start() ignored, already running.');
            return;
        }
        console.log('JobService: Start sequence initiated...');
        this.isRunning = true; // Tentatively set
        this.loading = true;
        this.isWaitingForKeywords = false;
        this.notifySubscribers();

        if (this.keywordCheckIntervalId) {
            clearInterval(this.keywordCheckIntervalId);
            this.keywordCheckIntervalId = null;
        }

        const hasKeywords = await this.initializeKeywords();

        if (!hasKeywords) {
            console.warn('JobService: No default resume or keywords found. Entering waiting state.');
            this.isRunning = false;
            this.loading = false;
            this.isWaitingForKeywords = true;
            this.hasActiveCycle = false;
            this.notifySubscribers();

            this.keywordCheckIntervalId = setInterval(() => this.start(), 60 * 1000);
            return;
        }

        // --- THE CORE LOGIC FIX IS HERE ---
        const isFirstEverRun = this.lastFullCycleTime === 0 && !this.hasStartedCycle;
        const hasCycleExpired = this.is24HourCycleExpired();
        const shouldResume = this.isInActiveCycle();

        if (shouldResume) {
            // 1. HIGHEST PRIORITY: Resume an in-progress cycle.
            console.log(`JobService: Resuming active cycle at keyword ${this.currentKeywordIndex + 1}/${this.keywords.length}`);
            this.hasActiveCycle = true;
            this.notifySubscribers();
            this.processSingleKeyword(); // Process immediately to continue where it left off.
        } else if (isFirstEverRun || hasCycleExpired) {
            // 2. If not resuming, check if it's time for a new cycle.
            console.log(`JobService: 🚀 Starting a new 24-hour cycle. First run: ${isFirstEverRun}, Expired: ${hasCycleExpired}`);
            this.currentKeywordIndex = 0;
            this.cycleStartTime = Date.now();
            this.hasStartedCycle = true;
            this.hasActiveCycle = true;
            this.saveToCache();
            this.processSingleKeyword(); // Process the first keyword immediately.
        } else {
            // 3. If not resuming and not time for a new cycle, then wait.
            const timeUntilNextCycle = (this.lastFullCycleTime + JOB_SERVICE_EXPIRY_MS) - Date.now();
            const hoursLeft = Math.ceil(timeUntilNextCycle / (1000 * 60 * 60));
            console.log(`JobService: ✅ Cycle complete. Waiting ${hoursLeft} hours for the next run.`);
            this.isRunning = false;
            this.loading = false;
            this.hasActiveCycle = false;
            this.notifySubscribers();
            setTimeout(() => this.start(), timeUntilNextCycle);
        }
    }

    // --- FULLY CORRECTED PROCESS SINGLE KEYWORD ---
    async processSingleKeyword() {
        if (this.isProcessingKeyword) {
            console.log('JobService: Already processing a keyword, skipping...');
            return;
        }

        // Check for cycle completion *before* doing anything else.
        if (this.currentKeywordIndex >= this.keywords.length) {
            console.log('JobService: ✅ All keywords processed for this cycle');
            this.hasActiveCycle = false;
            this.isRunning = false; // Cycle is done, so it's not "running"
            this.loading = false;
            this.lastFullCycleTime = Date.now();
            this.hasStartedCycle = false;
            this.cycleStartTime = 0;
            this.cleanOldJobs();
            this.saveToCache();
            this.notifySubscribers();
            
            console.log(`JobService: Cycle complete! Next run will start in ~24 hours.`);
            // Schedule the next full cycle run
            setTimeout(() => this.start(), JOB_SERVICE_EXPIRY_MS);
            return;
        }

        this.isProcessingKeyword = true;
        this.loading = true;
        this.notifySubscribers();

        try {
            const location = await this.getUserLocation();
            if (!location) {
                console.warn('JobService: Cannot process keyword - no location available');
                this.currentKeywordIndex++; // Skip to avoid getting stuck
                return;
            }

            const currentKeyword = this.keywords[this.currentKeywordIndex];
            console.log(`JobService: 🔍 Processing keyword ${this.currentKeywordIndex + 1}/${this.keywords.length}: "${currentKeyword}"`);

            const response = await aiApi.post('/scraper/scrape-jobs/', {
                search_term: currentKeyword,
                location: location.city,
                country: location.country,
            });
            
            const newJobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);

            if (newJobs.length > 0) {
                const addedCount = this.addUniqueJobs(newJobs);
                console.log(`JobService: Added ${addedCount} unique jobs. Total: ${this.jobs.length}`);
            } else {
                console.log(`JobService: No jobs found for keyword "${currentKeyword}"`);
            }

            this.currentKeywordIndex++;

        } catch (error) {
            console.error(`JobService: Error processing keyword "${this.keywords[this.currentKeywordIndex]}"`, error);
            this.currentKeywordIndex++; // Still move to next keyword to avoid getting stuck
        } finally {
            this.isProcessingKeyword = false;
            this.loading = false; // Keyword is done, UI can update
            this.saveToCache();
            this.notifySubscribers();
            
            // **Crucial part**: Decide what to do next.
            if (this.isRunning && this.currentKeywordIndex < this.keywords.length) {
                // If more keywords are left, schedule the next one.
                this.scheduleNextKeyword();
            } else if (this.isRunning) {
                // If that was the last keyword, call this function again to trigger the completion logic.
                this.processSingleKeyword();
            }
        }
    }

    // --- NEW STOP METHOD ---
    stop() {
        console.log('JobService: Stopping all background activity.');
        this.isRunning = false;
        this.isWaitingForKeywords = false;
        this.hasActiveCycle = false;
        if (this.keywordTimeoutId) {
            clearTimeout(this.keywordTimeoutId);
            this.keywordTimeoutId = null;
        }
        if (this.keywordCheckIntervalId) {
            clearInterval(this.keywordCheckIntervalId);
            this.keywordCheckIntervalId = null;
        }
        this.notifySubscribers();
    }

    // --- MODIFIED REFRESH METHOD ---
    async refresh() {
        console.log('JobService: Manual refresh triggered');

        // If not running because it's waiting for keywords, try to start immediately.
        if (!this.isRunning && this.keywords.length === 0) {
            console.log('JobService: Refreshing to check for new keywords...');
            await this.start();
            return;
        }

        if (this.isInActiveCycle() && this.currentKeywordIndex < this.keywords.length) {
            await this.processSingleKeyword();
        } else if (this.is24HourCycleExpired()) {
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
export const useJobService = useJobServiceContext;

export default useJobService;



