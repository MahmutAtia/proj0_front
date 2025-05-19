import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';

const LOCAL_STORAGE_KEY = 'jobFeedData';
const DATA_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const JobPostings = ({ router }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ country: '', city: '' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('https://ipapi.co/json/')
            .then((response) => response.json())
            .then((data) => {
                const country = data.country_name;
                const city = data.city;
                setLocation({ country, city });
                fetchJobPostings(country, city);
            })
            .catch((err) => {
                console.error("Error fetching location:", err);
                setError("Unable to fetch location. Showing default job postings.");
                fetchJobPostings(); // Fallback
            });
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
                        location: { country, city } // Store location used for this cache
                    };
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cacheData));
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
