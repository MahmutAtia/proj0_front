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

import { useJobService } from '@/contexts/JobServiceContext';
import { filterJobs } from '@/hooks/useJobService';
import { useTranslation } from '@/hooks/useTranslation';
import styles from './JobFeed.module.css';

const JobFeedPage = () => {
    const router = useRouter();
    const toast = useRef(null);
    const { t, isRTL } = useTranslation();

    const { jobs: allJobs, loading, refresh, isWaitingForKeywords, hasActiveCycle } = useJobService(); // No longer need getFilteredJobs

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
            sortKey
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
        return (
            // Grid Layout only
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div className="surface-card shadow-2 border-1 surface-border border-round-2xl h-full hover:shadow-4 transition-all transition-duration-300">
                    <div className="p-4 h-full flex flex-column">
                        <div className="text-lg font-bold text-center mb-2 text-900">{job.title}</div>
                        <div className="text-md text-600 text-center mb-3">{job.company}</div>
                        <div className="text-sm text-500 mb-3">
                            <i className="pi pi-map-marker mr-1 text-primary"></i>
                            {job.location || t('jobFeed.job.locationNotSpecified') || 'Not specified'}
                            {job.is_remote && <span className="bg-green-100 text-green-800 px-2 py-1 border-round-lg text-xs font-semibold ml-2">{t('common.remote') || 'Remote'}</span>}
                        </div>
                        {job.addedAt && (
                            <div className="text-xs text-500 mb-3 text-center">
                                {t('jobFeed.job.addedAgo') || 'Added'} {formatTimeAgo(job.addedAt)}
                            </div>
                        )}
                        {job.site && (
                            <div className="text-center mb-3">
                                <span className="bg-gray-100 text-primary px-2 py-1 border-round-lg text-xs font-semibold">{job.site.toUpperCase()}</span>
                            </div>
                        )}
                        <div className="mt-auto flex flex-column gap-2">
                            {/*
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors px-3 py-2 border-round-lg text-sm font-semibold no-underline text-center">
                                {t('jobFeed.job.viewOn') || 'View on'} {job.site || t('common.source') || 'Source'}
                            </a>
                           */}
                            <Button
                                label={t('jobFeed.job.applyNow') || 'Apply Now'}
                                icon="pi pi-send"
                                className="p-button-outlined   border-2  border-round-3xl  px-3 py-2 border-none font-semibold w-full hover:bg-primary-500 hover:text-white transition-colors"
                                onClick={() => window.open(job.job_url, '_blank')}
                            />
                        </div>
                    </div>
                </div>
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
        <div className="bg-primary-gradient p-4 border-round-top-2xl">
            <div className="flex flex-column lg:flex-row lg:justify-content-between gap-4">
                <div className="flex flex-column sm:flex-row sm:justify-content-between sm:align-items-center gap-3">
                    <div className="flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <h2 className="text-3xl font-bold mb-1">{t('jobFeed.title') || 'Job Feed'}</h2>
                        {hasActiveCycle && (
                            <span className="bg-white-alpha-20  px-3 py-1 border-round-xl text-sm font-semibold flex align-items-center">
                                <i className="pi pi-spin pi-spinner mr-1" style={{ fontSize: '0.8rem' }}></i>
                                LIVE
                            </span>
                        )}
                    </div>
                    <p className="text-900 m-0 text-sm" style={{ whiteSpace: 'nowrap' }}>
                        {t('jobFeed.showingJobs', { filtered: filteredJobs.length, total: allJobs.length })}
                    </p>
                </div>

                <div className="flex flex-column lg:flex-row gap-3 lg:align-items-center">
                    <div className="flex flex-column sm:flex-row gap-2" style={{ maxWidth: '600px' }}>
                        <InputText
                            placeholder={t('jobFeed.filters.search') || 'Job title, keyword...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="border-round-lg border-none p-3 bg-white"
                        />
                        <InputText
                            placeholder={t('jobFeed.filters.location') || 'City or Country'}
                            value={locationFilterInput}
                            onChange={(e) => setLocationFilterInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="border-round-lg border-none p-3 bg-white"
                        />
                        <Button
                            icon="pi pi-search"
                            onClick={handleSearch}
                            loading={loading}
                            tooltip={t('common.search') || 'Search'}
                            tooltipOptions={{ position: 'bottom' }}
                            className="bg-white text-primary hover:bg-gray-100 border-round-lg px-3 py-3 border-none flex-shrink-0"
                        />
                    </div>

                    <div className="flex flex-column sm:flex-row align-items-stretch sm:align-items-center gap-3">
                        <div className="flex align-items-center bg-white-alpha-20 px-3 py-2 border-round-lg">
                            <Checkbox
                                style={{
                                    marginLeft: isRTL ? '0.5rem' : 0,
                                    marginRight: !isRTL ? '0.5rem' : 0
                                }}
                                inputId="remote"
                                onChange={(e) => setIsRemote(e.checked ?? false)}
                                checked={isRemote}
                            />

                            <label htmlFor="remote" className="ml-2  font-medium" style={{ whiteSpace: 'nowrap' }}>
                                {' '}
                                {t('jobFeed.filters.remoteOnly') || 'Remote Only'}
                            </label>
                        </div>

                        <Dropdown options={sortOptions} value={sortKey} optionLabel="label" placeholder={t('common.sortBy') || 'Sort By'} onChange={(e) => setSortKey(e.value)} className="border-round-lg border-none bg-white" />

                        <Button icon="pi pi-refresh" className="bg-white-alpha-20 hover:bg-white-alpha-30 border-round-lg px-3 py-2 border-none" onClick={refresh} loading={loading} tooltip={t('common.refresh') || 'Refresh'} />

                        <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} style={{ display: 'none' }} />
                    </div>
                </div>
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
                    <p className="text-color-secondary">{t('jobFeed.waiting.description') || 'Please set a default resume with relevant job keywords.'}</p>
                    <Button label={t('jobFeed.waiting.button') || 'Go to My Resumes'} icon="pi pi-arrow-right" onClick={() => router.push('/main/resumes')} />
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
                    <p className="text-color-secondary">{t('jobFeed.empty.description') || "We couldn't find any jobs matching your keywords right now."}</p>
                    <p className="text-sm text-color-secondary mt-2">{t('jobFeed.empty.nextSteps') || "We'll search again automatically later. You can also try updating your resume keywords."}</p>
                    <Button label={t('common.refresh') || 'Refresh Now'} icon="pi pi-refresh" onClick={refresh} className="p-button-outlined mt-2" />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Toast ref={toast} />

            {/* INDICATOR: Show when a cycle is running and jobs are already visible */}
            {hasActiveCycle && allJobs.length > 0 && <Message severity="info" text={t('jobFeed.liveUpdate.message') || 'Searching for more jobs in the background...'} className="m-3" />}

            <DataView
                value={filteredJobs}
                header={dataviewHeader}
                itemTemplate={jobItemTemplate}
                layout={layout}
                paginator={filteredJobs.length > 12}
                rows={12}
                alwaysShowPaginator={false}
                emptyMessage={t('jobFeed.empty.noMatch') || 'No job postings found matching your current filters.'}
                loading={loading && filteredJobs.length === 0}
                className="m-0"
            />
        </div>
    );
};

export default JobFeedPage;
