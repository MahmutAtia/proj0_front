import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';
import useUserLocation from '../../../hooks/useUserLocation'; // Adjust path as needed

const JOB_DATA_CACHE_KEY = 'jobFeedData';
const JOB_DATA_EXPIRY_MS = 120 * 60 * 1000; // 120 minutes for job data

// LOCATION_CACHE_KEY and LOCATION_CACHE_EXPIRY_MS are now in useUserLocation.js

const JobPostings = ({ router }) => {
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true); // Renamed to avoid conflict
    const [jobsError, setJobsError] = useState(null); // Renamed to avoid conflict

    // Use the custom hook for location
    const { location, loadingLocation, locationError, refetchLocation } = useUserLocation();

    // The getUserLocation function is now part of useUserLocation hook (as fetchUserLocation/refetchLocation)

    const fetchAndCacheJobPostings = useCallback(async (loc) => {
        const targetCountry = loc?.country || "default";
        const targetCity = loc?.city || "default";

        setLoadingJobs(true);
        // Preserve location-related error if jobs are being fetched as a fallback
        // If locationError exists, we might want to show it, otherwise clear jobsError
        if (!locationError) {
            setJobsError(null);
        }


        try {
            const cachedJobDataRaw = localStorage.getItem(JOB_DATA_CACHE_KEY);
            if (cachedJobDataRaw) {
                const { jobs: cachedJobs, timestamp, location: cachedJobLocation } = JSON.parse(cachedJobDataRaw);
                const isJobCacheValid = (new Date().getTime() - timestamp) < JOB_DATA_EXPIRY_MS;
                const isSameLocationForJobs = cachedJobLocation && cachedJobLocation.country === targetCountry && cachedJobLocation.city === targetCity;

                if (isJobCacheValid && isSameLocationForJobs && cachedJobs && cachedJobs.length > 0) {
                    setJobs(cachedJobs);
                    console.log("Loaded jobs from job cache for:", targetCity, targetCountry);
                    setLoadingJobs(false);
                    return;
                }
            }
        } catch (e) {
            console.warn("Failed to load jobs from job cache or parse error", e);
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_AI_API_URL}/scraper/scrape-jobs/`;
        const requestBody = {
            search_term: "developer",
            location: targetCity,
            country: targetCountry,
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            const jobsData = Array.isArray(data) ? data : (data.jobs || []);

            setJobs(jobsData);
            localStorage.setItem(JOB_DATA_CACHE_KEY, JSON.stringify({
                jobs: jobsData,
                timestamp: new Date().getTime(),
                location: { country: targetCountry, city: targetCity }
            }));
            console.log("Fetched and saved jobs to localStorage for:", targetCity, targetCountry);
        } catch (err) {
            console.error("Error fetching job postings:", err);
            setJobsError("Failed to fetch job postings. Please try again later.");
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    }, [locationError]); // Depend on locationError to decide if we should clear jobsError

    useEffect(() => {
        const initializeJobsFeed = async () => {
            // Location is fetched by the useUserLocation hook automatically on mount.
            // We wait for the location data (or error) before fetching jobs.
            if (!loadingLocation) { // Only proceed if location fetching is complete
                if (location && location.country && !locationError) {
                    await fetchAndCacheJobPostings(location);
                } else {
                    // If locationError exists or location is not available,
                    // fetchAndCacheJobPostings will use default values.
                    // The locationError state from the hook can be displayed to the user.
                    await fetchAndCacheJobPostings(null);
                }
            }
        };

        initializeJobsFeed();
    }, [loadingLocation, location, locationError, fetchAndCacheJobPostings]);


    // Determine overall loading state and error message
    const isLoading = loadingLocation || loadingJobs;
    const displayError = locationError || jobsError;

    return (
        <Card className={`${styles.dashboardCard} h-full`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="text-xl font-bold m-0">Latest Job Postings</h3>
                {/* Optional: Add a button to refetch location if needed */}
                {/* {locationError && <Button label="Retry Location" onClick={refetchLocation} className="p-button-sm p-button-warning" />} */}
                <Button
                    label="View All"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-text p-button-sm"
                    onClick={() => router.push('/main/job-feed')}
                />
            </div>
            {displayError && <p className="text-sm text-red-500 mb-3">{displayError}</p>}
            {location.city && location.country && !locationError && (
                <p className="text-sm text-color-secondary mb-3">
                    Showing top results for {location.city}, {location.country}.
                </p>
            )}
            {isLoading ? (
                <div className="flex justify-content-center align-items-center py-5">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                </div>
            ) : jobs && jobs.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {jobs.slice(0, 3).map((job) => (
                        <li key={job.id || job.job_url} className={`${styles.feedItem} p-2 border-round cursor-pointer`}>
                            <div className={styles.feedItemTitle}>{job.title}</div>
                            <div className={styles.feedItemSubtitle}>
                                {job.company} {job.location && `- ${job.location}`}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-color-secondary">{displayError ? "Could not load jobs." : "No new job postings found."}</p>
            )}
        </Card>
    );
};

export default JobPostings;
