import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import styles from '../Dashboard.module.css';
// --- FIX IS HERE ---
// The hook now comes from the context, and the utility function from the hook file.
import { useJobService } from '@/contexts/JobServiceContext';
import { filterJobs } from '@/hooks/useJobService';
import { useTranslation } from '../../../../hooks/useTranslation';

const JobPostings = ({ router }) => {
    const { t } = useTranslation();
    const { 
        jobs, 
        loading, 
        refresh, 
        isWaitingForKeywords, 
        hasActiveCycle 
    } = useJobService(); // Removed getFilteredJobs from here

    // Use the pure utility function directly on the jobs state
    const latestJobs = filterJobs(jobs, { limit: 3, sortKey: 'recent' });

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    return (
        <Card className={`${styles.dashboardCard} h-full`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <div className="flex align-items-center gap-2">
                    <h3 className="text-xl font-bold m-0">{t('dashboard_main.jobPostings.title')}</h3>
                    {hasActiveCycle && (
                        <Badge 
                            value={
                                <span className="flex align-items-center">
                                    <i className="pi pi-spin pi-spinner mr-1" style={{fontSize: '0.7rem'}}></i>
                                    LIVE
                                </span>
                            } 
                            severity="success" 
                            className="text-xs" 
                            tooltip="Actively searching for new jobs"
                        />
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-refresh"
                        className="p-button-text p-button-sm"
                        onClick={refresh}
                        loading={loading}
                        tooltip="Refresh jobs now"
                    />
                    <Button
                        label={t('common.viewAll')}
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        className="p-button-text p-button-sm"
                        onClick={() => router.push('/main/job-feed')}
                    />
                </div>
            </div>

            <div className="mb-3">
                <p className="text-sm text-color-secondary m-0">
                    {t('dashboard_main.jobPostings.subtitle', { 
                        count: jobs.length,
                        status: hasActiveCycle ? 'live updates' : 'cached'
                    })}
                </p>
            </div>

            {/* This conditional logic will now work correctly */}
            {loading && jobs.length === 0 && !isWaitingForKeywords ? (
                <div className="flex justify-content-center align-items-center py-5">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                </div>
            ) : latestJobs.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {latestJobs.map((job) => (
                        <li key={job.id || job.job_url} className={`${styles.feedItem} p-3 border-round cursor-pointer hover:surface-hover transition-colors transition-duration-150`}>
                            <div className="flex justify-content-between align-items-start">
                                <div className="flex-1">
                                    <div className={`${styles.feedItemTitle} font-semibold mb-1`}>
                                        {job.title}
                                    </div>
                                    <div className={`${styles.feedItemSubtitle} text-sm text-color-secondary mb-1`}>
                                        {job.company}
                                        {job.location && ` • ${job.location}`}
                                        {job.is_remote && <Badge value="Remote" severity="info" className="ml-2" />}
                                    </div>
                                    {job.addedAt && (
                                        <div className="text-xs text-color-secondary">
                                            Added {formatTimeAgo(job.addedAt)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-column align-items-end gap-1">
                                    {job.site && (
                                        <Badge 
                                            value={job.site.toUpperCase()} 
                                            severity="secondary" 
                                            className="text-xs"
                                        />
                                    )}
                                    {job.job_url && (
                                        <Button
                                            icon="pi pi-external-link"
                                            className="p-button-text p-button-sm p-button-rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(job.job_url, '_blank');
                                            }}
                                            tooltip="Open job posting"
                                        />
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-5">
                    {isWaitingForKeywords ? (
                        <>
                            <p className="text-color-secondary mb-3">
                                {t('dashboard_main.jobPostings.waitingForKeywords') || 'Set a default resume to start finding jobs.'}
                            </p>
                            <Button
                                label={t('dashboard_main.jobPostings.goToResumes') || 'Go to Resumes'}
                                icon="pi pi-arrow-right"
                                className="p-button-sm"
                                onClick={() => router.push('/main/resumes')}
                            />
                        </>
                    ) : (
                        <>
                            <p className="text-color-secondary mb-3">
                                {t('dashboard_main.jobPostings.noJobs') || 'No new jobs found yet.'}
                            </p>
                            <Button
                                label={t('common.refresh') || 'Refresh Now'}
                                icon="pi pi-refresh"
                                className="p-button-sm"
                                onClick={refresh}
                                loading={loading}
                            />
                        </>
                    )}
                </div>
            )}

            {jobs.length > 3 && (
                <div className="text-center mt-3 pt-3 border-top-1 surface-border">
                    <Button
                        label={t('dashboard_main.jobPostings.viewMore', { count: jobs.length - 3 })}
                        className="p-button-link p-button-sm"
                        onClick={() => router.push('/main/job-feed')}
                    />
                </div>
            )}
        </Card>
    );
};

export default JobPostings;