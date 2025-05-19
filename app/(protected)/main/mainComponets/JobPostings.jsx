import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';

const JobPostings = ({ router }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setJobs([
                { id: 1, title: "Frontend Developer", company: "Tech Solutions Inc.", location: "Remote" },
                { id: 2, title: "Product Manager", company: "Innovate Hub", location: "New York, NY" },
                { id: 3, title: "UX Designer", company: "Creative Minds LLC", location: "San Francisco, CA" },
            ]);
            setLoading(false);
        }, 2000);
    }, []);

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
            {loading ? (
                <div className="flex justify-content-center align-items-center">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                </div>
            ) : jobs.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {jobs.map(job => (
                        <li key={job.id} className={`${styles.feedItem} p-2 border-round cursor-pointer`}>
                            <div className={styles.feedItemTitle}>{job.title}</div>
                            <div className={styles.feedItemSubtitle}>
                                {job.company} {job.location && `- ${job.location}`}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-color-secondary">No new job postings found.</p>
            )}
        </Card>
    );
};

export default JobPostings;
