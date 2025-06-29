'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import styles from './JobFeed.module.css';

const LOCAL_STORAGE_KEY = 'jobFeedData';
const DATA_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const JobFeedPage = () => {
    const router = useRouter();
    const toast = useRef(null);

    const [allJobs, setAllJobs] = useState([]); // Holds all fetched/cached jobs
    const [filteredJobs, setFilteredJobs] = useState([]); // Jobs after client-side filtering
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState({ country: '', city: '' }); // User's detected IP location
    const [searchLocation, setSearchLocation] = useState({ country: '', city: '' }); // Location used for the current search

    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilterInput, setLocationFilterInput] = useState(''); // Input field for location
    const [isRemote, setIsRemote] = useState(false);

    const sortOptions = [
        { label: 'Relevance', value: 'relevance' },
        // Add date sort if your API provides a reliable date field
        // { label: 'Date Posted (Newest)', value: 'date_newest' },
    ];
    const [sortKey, setSortKey] = useState(sortOptions[0].value);
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
        // Attempt to load from localStorage first
        try {
            const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cachedDataString) {
                const cachedData = JSON.parse(cachedDataString);
                const now = new Date().getTime();
                if (cachedData.jobs && (now - cachedData.timestamp < DATA_EXPIRY_MS)) {
                    setAllJobs(cachedData.jobs);
                    setUserLocation(cachedData.location || { country: '', city: '' });
                    setSearchLocation(cachedData.location || { country: '', city: '' });
                    setLocationFilterInput(cachedData.location?.city || '');
                    setLoading(false);
                    toast.current?.show({ severity: 'info', summary: 'Loaded Cached Data', detail: 'Displaying recently fetched jobs.', life: 3000 });
                    return; // Exit if valid cache is found
                } else {
                    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear expired cache
                }
            }
        } catch (e) {
            console.warn("Failed to read from localStorage", e);
        }

        // If no valid cache, fetch user's IP location then jobs
        fetch('https://ipapi.co/json/')
            .then((response) => response.json())
            .then((data) => {
                const country = data.country_name;
                const city = data.city;
                setUserLocation({ country, city });
                setSearchLocation({ country, city }); // Set initial search location
                setLocationFilterInput(city || ''); // Pre-fill location input
                fetchJobsAPI(country, city, "developer jobs", city || "default");
            })
            .catch((err) => {
                console.error("Error fetching user location:", err);
                setError("Could not fetch your location. Please enter one manually or jobs will be fetched for a default location.");
                toast.current?.show({ severity: 'warn', summary: 'Location Error', detail: 'Could not fetch your location. Using defaults.' });
                fetchJobsAPI(null, null, "developer jobs", "default"); // Fetch with default
            });
    }, []);

    const fetchJobsAPI = async (country, city, currentSearchTerm, currentGoogleSearchLocation) => {
        setLoading(true);
        setError(null);

        const apiUrl = `${process.env.NEXT_PUBLIC_AI_API_URL}/scraper/scrape-jobs/`;
        const requestBody = {
            search_term: currentSearchTerm || "jobs",
            location: currentGoogleSearchLocation || "default", // API uses this for its own location logic
            country: country || "default",
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
                throw new Error(`API Error: ${response.status} - ${errorData.detail || errorData.message || "Failed to fetch jobs"}`);
            }
            const data = await response.json();
            setAllJobs(data || []);
            setSearchLocation({ country: country || '', city: city || '' }); // Update search location state

            // Save to localStorage
            try {
                const cacheData = {
                    jobs: data || [],
                    timestamp: new Date().getTime(),
                    location: { country, city }
                };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cacheData));
            } catch (e) {
                console.warn("Failed to save jobs to localStorage", e);
            }

        } catch (err) {
            console.error("Error fetching job postings:", err);
            setError(err.message || "Failed to fetch job postings. Please try again later.");
            toast.current?.show({ severity: 'error', summary: 'Fetch Error', detail: err.message || "Failed to fetch jobs." });
            setAllJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Client-side filtering logic
        let currentJobs = [...allJobs];

        // Filter by remote
        if (isRemote) {
            currentJobs = currentJobs.filter(job => job.is_remote);
        }

        // Add sorting logic here if API doesn't sort or if more complex client-side sort is needed
        // For 'date_newest', you'd need a reliable date field from the API.
        // Example: if (sortKey === 'date_newest') { currentJobs.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date)); }

        setFilteredJobs(currentJobs);
    }, [allJobs, isRemote, sortKey]); // Re-filter when these change

    const handleSearch = () => {
        // Use locationFilterInput for the city in the search, fallback to userLocation.city if empty
        const cityToSearch = locationFilterInput || userLocation.city;
        // For country, prioritize userLocation.country if locationFilterInput is just a city,
        // or allow for a country to be part of locationFilterInput (more complex parsing needed for that)
        const countryToSearch = userLocation.country; // Simplified: assumes locationFilterInput is city-level

        fetchJobsAPI(countryToSearch, cityToSearch, searchTerm, cityToSearch);
    };

    const jobItemTemplate = (job, currentLayout) => {
        if (currentLayout === 'list') {
            return (
                <div className="col-12">
                    <Card className={`${styles.jobListItem} mb-3`}>
                        <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
                                <div className="flex flex-column align-items-center sm:align-items-start gap-3">
                                    <div className="text-2xl font-bold text-900">{job.title}</div>
                                    <div className="text-lg text-600">{job.company}</div>
                                    <div className="flex align-items-center gap-3">
                                        <span><i className="pi pi-map-marker mr-1"></i>{job.location || 'Not specified'}</span>
                                        {job.is_remote && (<span className="p-tag p-tag-success">Remote</span>)}
                                    </div>
                                    <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-text mt-2">
                                        View on {job.site || 'Source'} <i className="pi pi-external-link ml-1"></i>
                                    </a>
                                </div>
                                <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                    {/* Placeholder for date or other info */}
                                    {/* <span className="text-sm text-500">{job.posted_date}</span> */}
                                    <Button label="Apply Now" icon="pi pi-send" className="p-button-raised p-button-sm" onClick={() => window.open(job.job_url, '_blank')} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return ( // Grid Layout
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <Card className={`${styles.jobGridItem} h-full`}>
                    <div className="p-3 border-round h-full flex flex-column">
                        <div className="text-lg font-bold text-center mb-2">{job.title}</div>
                        <div className="text-md text-600 text-center mb-3">{job.company}</div>
                        <div className="text-sm text-500 mb-3">
                            <i className="pi pi-map-marker mr-1"></i>{job.location || 'Not specified'}
                            {job.is_remote && <span className="p-tag p-tag-info ml-2">Remote</span>}
                        </div>
                        <div className="mt-auto flex flex-column gap-2">
                             <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-outlined w-full">
                                View on {job.site || 'Source'}
                            </a>
                            <Button label="Apply Now" icon="pi pi-send" className="p-button-sm p-button-raised w-full" onClick={() => window.open(job.job_url, '_blank')} />
                        </div>
                    </div>
                </Card>
            </div>
        );
    };


    const dataviewHeader = (
        <div className={`flex flex-column md:flex-row md:justify-content-between gap-3 p-4 ${styles.header}`}>
            <div className="p-inputgroup flex-1 md:flex-initial" style={{ maxWidth: '600px' }}>
                <InputText placeholder="Job title, keyword..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
                <InputText placeholder="City or Country" value={locationFilterInput} onChange={(e) => setLocationFilterInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
                <Button icon="pi pi-search" onClick={handleSearch} tooltip="Search" tooltipOptions={{position: 'bottom'}}/>
            </div>
            <div className="flex align-items-center justify-content-center md:justify-content-end gap-3 mt-3 md:mt-0">
                <div className="flex align-items-center">
                    <Checkbox inputId="remote" onChange={e => setIsRemote(e.checked ?? false)} checked={isRemote}></Checkbox>
                    <label htmlFor="remote" className="ml-2">Remote Only</label>
                </div>
                {/* <Dropdown options={sortOptions} value={sortKey} optionLabel="label" placeholder="Sort By" onChange={(e) => setSortKey(e.value)} className="w-full sm:w-auto" /> */}
                <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
            </div>
        </div>
    );

    // ... (keep your loading and error states rendering)
    if (loading && filteredJobs.length === 0) { // Show spinner only if no jobs are displayed yet
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="ml-2">Loading job opportunities...</p>
            </div>
        );
    }
     if (error && filteredJobs.length === 0) { // Show full page error if no jobs and error
        return (
            <div className="flex flex-column justify-content-center align-items-center min-h-screen text-center p-5">
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                <h2 className="text-2xl mb-2">Oops! Something went wrong.</h2>
                <p className="text-lg text-600 mb-3">{error}</p>
                <p className="text-md text-500 mb-4">Please try adjusting your search terms or try again later.</p>
                <Button label="Retry Search" icon="pi pi-refresh" onClick={handleSearch} />
            </div>
        );
    }

    return (
        <div className={styles.jobFeedContainer}>
            <Toast ref={toast} />
            <Card className={styles.pageCard}>
                <DataView
                    value={filteredJobs}
                    itemTemplate={(job) => jobItemTemplate(job, layout)}
                    layout={layout}
                    header={dataviewHeader}
                    paginator={filteredJobs.length > 12} // Show paginator if more than 12 jobs
                    rows={12}
                    alwaysShowPaginator={false}
                    emptyMessage={loading ? "Fetching jobs..." : "No job postings found matching your criteria. Try broadening your search!"}
                    loading={loading && filteredJobs.length > 0} // Show inline loader if jobs are already displayed but fetching new ones
                    pt={{ header: { className: 'surface-ground' } }}
                />
            </Card>
        </div>
    );
};

export default JobFeedPage;
