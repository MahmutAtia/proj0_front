import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';

const LOCAL_STORAGE_KEY = 'jobFeedData';
const DATA_EXPIRY_MS = 120 * 60 * 1000; // 120 minutes

const JobPostings = ({ router }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ country: '', city: '' });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocationAndJobs = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                const country = data.country_name;
                const city = data.city;
                setLocation({ country, city });

                // Check localStorage for cached data for this location
                const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (cachedData) {
                    const { jobs: cachedJobs, timestamp, location: cachedLocation } = JSON.parse(cachedData);
                    const isCacheValid = (new Date().getTime() - timestamp) < DATA_EXPIRY_MS;
                    const isSameLocation = cachedLocation && cachedLocation.country === country && cachedLocation.city === city;

                    if (isCacheValid && isSameLocation && cachedJobs && cachedJobs.length > 0) {
                        setJobs(cachedJobs);
                        setLoading(false);
                        setError(null);
                        console.log("Loaded jobs from cache for:", city, country);
                        return; // Exit if valid cache is found
                    }
                }
                // If no valid cache, fetch new job postings
                fetchJobPostings(country, city);
            } catch (err) {
                console.error("Error fetching location:", err);
                setError("Unable to fetch location. Checking cache for default jobs or fetching new ones.");
                // Try to load from cache with no specific location or fetch default
                const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (cachedData) {
                    const { jobs: cachedJobs, timestamp, location: cachedLocation } = JSON.parse(cachedData);
                    const isCacheValid = (new Date().getTime() - timestamp) < DATA_EXPIRY_MS;
                     // Allow loading if cache is for 'default' or if location couldn't be fetched
                    if (isCacheValid && (!cachedLocation || (cachedLocation.country === "default" && cachedLocation.city === "default")) && cachedJobs && cachedJobs.length > 0) {
                        setJobs(cachedJobs);
                        setLocation(cachedLocation || { country: 'Default', city: 'Location' });
                        setLoading(false);
                        setError(null);
                        console.log("Loaded default jobs from cache due to location fetch error.");
                        return;
                    }
                }
                fetchJobPostings(); // Fallback to fetch default jobs
            }
        };

        fetchLocationAndJobs();
    }, []);

    const fetchJobPostings = (country, city) => {
        setLoading(true);
        setError(null);

        const apiUrl = `${process.env.NEXT_PUBLIC_AI_API_URL}/scraper/scrape-jobs/`;
        const requestBody = {
            search_term: "developer",
            location: city || "default",
            country: country || "default",
        };

        fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setJobs(data || []); // Ensure data is an array
                try {
                    const cacheData = {
                        jobs: data || [],
                        timestamp: new Date().getTime(),
                        location: { country: country || "default", city: city || "default" } // Store location used for this cache
                    };
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cacheData));
                    console.log("Saved jobs to localStorage for:", city || "default", country || "default");
                } catch (e) {
                    console.warn("Failed to save jobs to localStorage", e);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching job postings:", err);
                setError("Failed to fetch job postings. Please try again later.");
                setJobs([]); // Clear jobs on error
                setLoading(false);
            });
    };

    return (
        <Card className={`${styles.dashboardCard} h-full`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="text-xl font-bold m-0">Latest Job Postings</h3>
                <Button
                    label="View All"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-text p-button-sm"
                    onClick={() => router.push('/main/job-feed')}
                />
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            {location.country && location.city && !error && (
                <p className="text-sm text-color-secondary mb-3">
                    Showing top results for {location.city}, {location.country}.
                </p>
            )}
            {loading ? (
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
                <p className="text-color-secondary">{error ? "Could not load jobs." : "No new job postings found."}</p>
            )}
        </Card>
    );
};

export default JobPostings;
