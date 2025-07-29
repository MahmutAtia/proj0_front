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
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';

import { useJobService, filterJobs } from '@/hooks/useJobService'; // Import the new filterJobs function
import { useTranslation } from '@/hooks/useTranslation';
import styles from './JobFeed.module.css';

const JobFeedPage = () => {
    const router = useRouter();
    const toast = useRef(null);
    const { t } = useTranslation();
    
    const { 
        jobs: allJobs, 
        loading, 
        refresh, 
        isWaitingForKeywords, 
        hasActiveCycle 
    } = useJobService(); // No longer need getFilteredJobs
    
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilterInput, setLocationFilterInput] = useState('');
    const [isRemote, setIsRemote] = useState(false);
    const [mounted, setMounted] = useState(false);

    const sortOptions = [
        { label: t('jobFeed.sorting.relevance') || 'Relevance', value: 'relevance' },
        { label: t('jobFeed.sorting.recent') || 'Most Recent', value: 'recent' },
        { label: t('jobFeed.sorting.company') || 'Company A-Z', value: 'company_asc' },
        { label: t('jobFeed.sorting.title') || 'Title A-Z', value: 'title_asc' }
    ];
    const [sortKey, setSortKey] = useState(sortOptions[0].value);
    const [layout, setLayout] = useState('grid');

    // This effect now uses the pure utility function, ensuring it's always in sync
    useEffect(() => {
        const newFilteredJobs = filterJobs(allJobs, {
            searchTerm,
            location: locationFilterInput,
            isRemote,
            sortKey,
        });
        setFilteredJobs(newFilteredJobs);
    }, [allJobs, searchTerm, locationFilterInput, isRemote, sortKey]);

    // Track mounted state for hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = () => {
        // Trigger a manual refresh of the job service
        refresh();
        toast.current?.show({ 
            severity: 'info', 
            summary: t('jobFeed.searchStarted') || 'Search Started', 
            detail: t('jobFeed.searchStartedDetail') || 'Refreshing jobs based on your criteria...', 
            life: 3000 
        });
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
                                        <span><i className="pi pi-map-marker mr-1"></i>{job.location || t('jobFeed.job.locationNotSpecified') || 'Not specified'}</span>
                                        {job.is_remote && (<span className="p-tag p-tag-success">{t('common.remote') || 'Remote'}</span>)}
                                    </div>
                                    {job.addedAt && (
                                        <div className="text-sm text-color-secondary">
                                            {t('jobFeed.job.addedAgo') || 'Added'} {formatTimeAgo(job.addedAt)}
                                        </div>
                                    )}
                                    <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-text mt-2">
                                        {t('jobFeed.job.viewOn') || 'View on'} {job.site || t('common.source') || 'Source'} <i className="pi pi-external-link ml-1"></i>
                                    </a>
                                </div>
                                <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
                                    {job.site && <Badge value={job.site.toUpperCase()} severity="secondary" />}
                                    <Button label={t('jobFeed.job.applyNow') || 'Apply Now'} icon="pi pi-send" className="p-button-raised p-button-sm" onClick={() => window.open(job.job_url, '_blank')} />
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
                            <i className="pi pi-map-marker mr-1"></i>{job.location || t('jobFeed.job.locationNotSpecified') || 'Not specified'}
                            {job.is_remote && <span className="p-tag p-tag-info ml-2">{t('common.remote') || 'Remote'}</span>}
                        </div>
                        {job.addedAt && (
                            <div className="text-xs text-color-secondary mb-3 text-center">
                                {t('jobFeed.job.addedAgo') || 'Added'} {formatTimeAgo(job.addedAt)}
                            </div>
                        )}
                        {job.site && (
                            <div className="text-center mb-3">
                                <Badge value={job.site.toUpperCase()} severity="secondary" />
                            </div>
                        )}
                        <div className="mt-auto flex flex-column gap-2">
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="p-button p-button-sm p-button-outlined w-full">
                                {t('jobFeed.job.viewOn') || 'View on'} {job.site || t('common.source') || 'Source'}
                            </a>
                            <Button label={t('jobFeed.job.applyNow') || 'Apply Now'} icon="pi pi-send" className="p-button-sm p-button-raised w-full" onClick={() => window.open(job.job_url, '_blank')} />
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    // Client-safe time formatting
    const formatTimeAgo = (timestamp) => {
        if (!timestamp || !mounted) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} ${t('common.day')}${days > 1 ? 's' : ''} ${t('common.ago')}`;
        } else if (hours > 0) {
            return `${hours} ${t('common.hour')}${hours > 1 ? 's' : ''} ${t('common.ago')}`;
        } else {
            return t('common.justNow') || 'Just now';
        }
    };

    const dataviewHeader = (
        <div className={`flex flex-column md:flex-row md:justify-content-between gap-3 p-4 ${styles.header}`}>
            <div className="flex justify-content-between align-items-center mb-3 md:mb-0">
                <div className="flex align-items-center gap-2">
                    <h2 className="text-2xl font-bold m-0">{t('jobFeed.title') || 'Job Feed'}</h2>
                    {hasActiveCycle && (
                        <Badge 
                            value={
                                <span className="flex align-items-center">
                                    <i className="pi pi-spin pi-spinner mr-1" style={{fontSize: '0.8rem'}}></i>
                                    LIVE
                                </span>
                            } 
                            severity="success" 
                            tooltip={t('jobFeed.autoUpdate.description') || 'Actively searching for new jobs...'}
                        />
                    )}
                </div>
                {/* Correctly display the job count */}
                <p className="text-color-secondary m-0">
                    {t('jobFeed.showingJobs', { filtered: filteredJobs.length, total: allJobs.length })}
                </p>
            </div>
            
            <div className="p-inputgroup flex-1 md:flex-initial" style={{ maxWidth: '600px' }}>
                <InputText 
                    placeholder={t('jobFeed.filters.search') || 'Job title, keyword...'} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                />
                <InputText 
                    placeholder={t('jobFeed.filters.location') || 'City or Country'} 
                    value={locationFilterInput} 
                    onChange={(e) => setLocationFilterInput(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                />
                <Button 
                    icon="pi pi-search" 
                    onClick={handleSearch} 
                    loading={loading}
                    tooltip={t('common.search') || 'Search'} 
                    tooltipOptions={{position: 'bottom'}}
                />
            </div>
            
            <div className="flex align-items-center justify-content-center md:justify-content-end gap-3 mt-3 md:mt-0">
                <div className="flex align-items-center">
                    <Checkbox 
                        inputId="remote" 
                        onChange={e => setIsRemote(e.checked ?? false)} 
                        checked={isRemote}
                    />
                    <label htmlFor="remote" className="ml-2">{t('jobFeed.filters.remoteOnly') || 'Remote Only'}</label>
                </div>
                
                <Dropdown 
                    options={sortOptions} 
                    value={sortKey} 
                    optionLabel="label" 
                    placeholder={t('common.sortBy') || 'Sort By'} 
                    onChange={(e) => setSortKey(e.value)} 
                    className="w-full sm:w-auto" 
                />
                
                <Button
                    icon="pi pi-refresh"
                    className="p-button-outlined p-button-sm"
                    onClick={refresh}
                    loading={loading}
                    tooltip={t('common.refresh') || 'Refresh'}
                />
                
                <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
            </div>
        </div>
    );

    // Show loading during initial mount to prevent hydration issues
    if (!mounted) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="ml-2">{t('jobFeed.loadingInitial') || 'Loading job feed...'}</p>
            </div>
        );
    }

    // --- NEW CONDITIONAL RENDERING LOGIC ---

    // 1. Handle the "Waiting for Keywords" state
    if (isWaitingForKeywords) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <Card title={t('jobFeed.waiting.title') || 'Start Your Job Search'} className="text-center">
                    <p className="text-color-secondary">
                        {t('jobFeed.waiting.description') || 'Please set a default resume with relevant job keywords.'}
                    </p>
                    <Button 
                        label={t('jobFeed.waiting.button') || 'Go to My Resumes'} 
                        icon="pi pi-arrow-right" 
                        onClick={() => router.push('/main/resumes')} 
                    />
                </Card>
            </div>
        );
    }

    // 2. Handle the initial loading state
    if (loading && allJobs.length === 0) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="ml-2">{t('jobFeed.loading') || 'Searching for job opportunities...'}</p>
            </div>
        );
    }

    // 3. Handle the "No Jobs Found" state after a full cycle
    if (!loading && !hasActiveCycle && allJobs.length === 0) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <Card title={t('jobFeed.empty.title') || 'No Jobs Found'} className="text-center">
                    <p className="text-color-secondary">
                        {t('jobFeed.empty.description') || "We couldn't find any jobs matching your keywords right now."}
                    </p>
                    <p className="text-sm text-color-secondary mt-2">
                        {t('jobFeed.empty.nextSteps') || "We'll search again automatically later. You can also try updating your resume keywords."}
                    </p>
                    <Button 
                        label={t('common.refresh') || 'Refresh Now'} 
                        icon="pi pi-refresh" 
                        onClick={refresh} 
                        className="p-button-outlined mt-2"
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.jobFeedContainer}>
            <Toast ref={toast} />
            
            {/* INDICATOR: Show when a cycle is running and jobs are already visible */}
            {hasActiveCycle && allJobs.length > 0 && (
                <Message 
                    severity="info" 
                    text={t('jobFeed.liveUpdate.message') || "Searching for more jobs in the background..."} 
                    className="m-3" 
                />
            )}
            
            <Card className={styles.pageCard}>
                <DataView
                    value={filteredJobs} // This will now be correctly populated
                    header={dataviewHeader}
                    itemTemplate={jobItemTemplate}
                    layout={layout}
                    paginator={filteredJobs.length > 12}
                    rows={12}
                    alwaysShowPaginator={false}
                    emptyMessage={t('jobFeed.empty.noMatch') || 'No job postings found matching your current filters.'}
                    // This condition ensures the overlay only shows when loading AND the view is empty.
                    loading={loading && filteredJobs.length === 0} 
                    pt={{ header: { className: 'surface-ground' } }}
                />
            </Card>
        </div>
    );
};

export default JobFeedPage;