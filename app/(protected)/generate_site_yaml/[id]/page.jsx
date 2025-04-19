"use client";

import React, { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// PrimeReact Components
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { OrderList } from 'primereact/orderlist';

const GenerateWebsiteForm = ({ params }) => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useRef(null);

    // Get the resume ID from the URL parameters
    const resumeId = params.id;


    // Identity & Branding
    const [overallTone, setOverallTone] = useState('professional');
    const [visualTheme, setVisualTheme] = useState('modern');
    const [personalStatement, setPersonalStatement] = useState('');

    // Content Emphasis & Organization
    const [sectionPrioritization, setSectionPrioritization] = useState([
        'about', 'experience', 'education', 'skills', 'projects', 'contact'
    ]);
    const [sectionDetailLevel, setSectionDetailLevel] = useState({}); // Initialize as empty
    const [highlightedAchievements, setHighlightedAchievements] = useState([]);
    const [highlightedSkills, setHighlightedSkills] = useState([]);

    // Presentation & Styling
    const [listStyle, setListStyle] = useState('bullet');
    const [headingStyle, setHeadingStyle] = useState('h5');
    const [enableAnimations, setEnableAnimations] = useState(false);

    // Contact & Call to Action
    const [contactDetailsToShow, setContactDetailsToShow] = useState(['email']);
    const [includeContactForm, setIncludeContactForm] = useState(true);
    const [callToAction, setCallToAction] = useState('contact-me');
    const [callToActionText, setCallToActionText] = useState('Contact Me');

    // Optional Enhancements
    const [personalInterests, setPersonalInterests] = useState('');
    const [externalLinks, setExternalLinks] = useState([{ label: '', url: '' }]);
    const [includeTestimonials, setIncludeTestimonials] = useState(false);

    // Custom Instructions
    const [customInstructions, setCustomInstructions] = useState('');

    const toneOptions = useMemo(() => [
        { label: 'Professional', value: 'professional' },
        { label: 'Creative', value: 'creative' },
        { label: 'Minimalist', value: 'minimalist' },
        { label: 'Energetic', value: 'energetic' },
    ], []);

    const themeOptions = useMemo(() => [
        { label: 'Modern', value: 'modern' },
        { label: 'Classic', value: 'classic' },
        { label: 'Elegant', value: 'elegant' },
        { label: 'Dark', value: 'dark' },
        { label: 'Creative', value: 'creative' },
    ], []);

    const availableSections = useMemo(() => [
        { label: 'About Me', value: 'about' },
        { label: 'Experience', value: 'experience' },
        { label: 'Education', value: 'education' },
        { label: 'Skills', value: 'skills' },
        { label: 'Projects', value: 'projects' },
        { label: 'Contact Form', value: 'contact' },
        { label: 'Awards/Honors', value: 'awards' },
        { label: 'Publications', value: 'publications' },
        { label: 'Languages', value: 'languages' },
        { label: 'Interests', value: 'interests' },
        { label: 'References', value: 'references' },
    ], []);

    const detailLevelOptions = useMemo(() => [
        { label: 'Full Description', value: 'full' },
        { label: 'Titles Only', value: 'titles' },
        { label: 'Custom Summary', value: 'summary' },
    ], []);

    const listStyleOptions = useMemo(() => [
        { label: 'Bullet Points', value: 'bullet' },
        { label: 'Icons', value: 'icon' },
        { label: 'Dividers', value: 'divider' },
    ], []);

    const headingStyleOptions = useMemo(() => [
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
    ], []);

    const ctaOptions = useMemo(() => [
        { label: 'Contact Me', value: 'contact-me' },
        { label: 'Download Resume', value: 'download-resume' },
        { label: 'View Portfolio', value: 'view-portfolio' },
        { label: 'Connect on LinkedIn', value: 'linkedin' },
    ], []);

    const showSuccess = (message) => {
        toast.current.show({ severity: 'success', summary: 'Success', detail: message, life: 3000 });
    };

    const showError = (message) => {
        toast.current.show({ severity: 'error', summary: 'Error', detail: message, life: 5000 });
    };

    const handleSectionReorder = (e) => {
        setSectionPrioritization(e.value);
    };

    const handleDetailLevelChange = (section, level) => {
        setSectionDetailLevel(prev => ({ ...prev, [section]: level }));
    };

    const handleGenerateWebsite = async () => {
        if (!resumeId) {
            showError("Please select a resume to generate a website.");
            return;
        }

        setLoading(true);
        try {
            const preferences = {
                identity: {
                    overallTone,
                    visualTheme,
                    personalStatement: personalStatement.trim(),
                    // profileImage: profileImage, // Handle image upload later
                },
                content: {
                    prioritizedSections: sectionPrioritization,
                    sectionDetailLevel,
                    highlightedAchievements,
                    highlightedSkills,
                },
                presentation: {
                    listStyle,
                    headingStyle,
                    enableAnimations,
                },
                contact: {
                    contactDetailsToShow,
                    includeContactForm,
                    callToAction,
                    callToActionText: callToAction === 'custom' ? callToActionText : '',
                },
                enhancements: {
                    personalInterests: personalInterests.trim(),
                    externalLinks: externalLinks.filter(link => link.label && link.url),
                    includeTestimonials,
                },
                customInstructions: customInstructions.trim(),
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate_website_yaml/`,
                {
                    resumeId: resumeId,
                    preferences: preferences
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.website_uuid) {
                showSuccess("Website generated successfully! Redirecting...");
                setTimeout(() => {
                    router.push(`/site-editor/${response.data.website_uuid}/`);
                }, 1500);
            } else if (response.data && response.data.error) {
                console.error("Error generating website:", response.data.error);
                showError(`Error generating website: ${response.data.error}`);
            } else {
                console.error("Unexpected response:", response.data);
                showError("Failed to generate website. Please try again.");
            }
        } catch (error) {
            console.error("Error generating website:", error);
            showError("An unexpected error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-content-center p-4">
            <Toast ref={toast} />
            <Card
                title="Create Your Authentic & Awesome Personal Website"
                subTitle="Customize every aspect of your online presence."
                className="p-shadow-5 surface-card border-round w-full md:w-10 lg:w-8"
            >
                <div className="p-fluid">
                    {/* Identity & Branding Choices */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Identity & Branding</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field">
                                <label htmlFor="overallTone" className="block text-sm font-medium text-700 mb-2">Overall Tone/Style</label>
                                <Dropdown id="overallTone" value={overallTone} options={toneOptions} onChange={(e) => setOverallTone(e.value)} placeholder="Select Tone" className="w-full p-inputtext-sm" />
                            </div>
                            <div className="field">
                                <label htmlFor="visualTheme" className="block text-sm font-medium text-700 mb-2">Visual Theme</label>
                                <Dropdown id="visualTheme" value={visualTheme} options={themeOptions} onChange={(e) => setVisualTheme(e.value)} placeholder="Select Theme" className="w-full p-inputtext-sm" />
                            </div>
                            <div className="field col-span-2">
                                <label htmlFor="personalStatement" className="block text-sm font-medium text-700 mb-2">Personal Statement/Tagline</label>
                                <InputTextarea id="personalStatement" value={personalStatement} onChange={(e) => setPersonalStatement(e.target.value)} rows={2} className="w-full p-inputtext-sm" placeholder="Enter your tagline" />
                            </div>
                            {/* Image Upload Placeholder - Skipping for now */}
                        </div>
                    </div>

                    <Divider className="my-4" />

                    {/* Content Emphasis & Organization */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Content Emphasis & Organization</h5>
                        <div className="field">
                            <label htmlFor="sectionOrder" className="block text-sm font-medium text-700 mb-2">Prioritize Sections</label>
                            <OrderList value={sectionPrioritization} onChange={handleSectionReorder} itemTemplate={(item) => <div>{availableSections.find(opt => opt.value === item)?.label}</div>} header="Drag to Reorder" listStyle={{ height: 'auto', minHeight: '150px' }} />
                            <small className="block mt-2 text-700">Drag and drop to reorder the sections on your website.</small>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {availableSections.map(section => (
                                <div key={section.value} className="field">
                                    <label htmlFor={`detailLevel-${section.value}`} className="block text-sm font-medium text-700 mb-2">{section.label} Detail</label>
                                    <Dropdown
                                        id={`detailLevel-${section.value}`}
                                        value={sectionDetailLevel[section.value] || 'full'} // Default to 'full'
                                        options={detailLevelOptions}
                                        onChange={(e) => handleDetailLevelChange(section.value, e.value)}
                                        className="w-full p-inputtext-sm"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Highlighting Achievements/Skills - Skipping for now */}
                    </div>

                    <Divider className="my-4" />

                    {/* Presentation & Styling of Information */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Presentation & Styling</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field">
                                <label htmlFor="listStyle" className="block text-sm font-medium text-700 mb-2">List Style</label>
                                <Dropdown id="listStyle" value={listStyle} options={listStyleOptions} onChange={(e) => setListStyle(e.value)} className="w-full p-inputtext-sm" />
                            </div>
                            <div className="field">
                                <label htmlFor="headingStyle" className="block text-sm font-medium text-700 mb-2">Heading Style</label>
                                <Dropdown id="headingStyle" value={headingStyle} options={headingStyleOptions} onChange={(e) => setHeadingStyle(e.value)} className="w-full p-inputtext-sm" />
                            </div>
                            <div className="field col-span-2">
                                <Checkbox inputId="enableAnimations" checked={enableAnimations} onChange={(e) => setEnableAnimations(e.checked)} />
                                <label htmlFor="enableAnimations" className="ml-2 text-sm text-800">Enable Animated Transitions</label>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-4" />

                    {/* Contact & Call to Action Preferences */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Contact & Call to Action</h5>
                        {/* Basic Contact Form Inclusion */}
                        <div className="field-checkbox">
                            <Checkbox inputId="includeContactForm" checked={includeContactForm} onChange={(e) => setIncludeContactForm(e.checked)} />
                            <label htmlFor="includeContactForm" className="ml-2 text-sm text-800">Include a Contact Form</label>
                        </div>
                        <div className="field">
                            <label htmlFor="callToAction" className="block text-sm font-medium text-700 mb-2">Primary Call to Action</label>
                            <Dropdown id="callToAction" value={callToAction} options={ctaOptions} onChange={(e) => setCallToAction(e.value)} className="w-full p-inputtext-sm" />
                        </div>
                        {callToAction === 'custom' && (
                            <div className="field">
                                <label htmlFor="ctaText" className="block text-sm font-medium text-700 mb-2">Custom Button Text</label>
                                <InputText id="ctaText" value={callToActionText} onChange={(e) => setCallToActionText(e.target.value)} className="w-full p-inputtext-sm" />
                            </div>
                        )}
                    </div>

                    <Divider className="my-4" />

                    {/* Optional Enhancements & Personal Touches */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Optional Enhancements</h5>
                        <div className="field">
                            <label htmlFor="personalInterests" className="block text-sm font-medium text-700 mb-2">Personal Interests/Hobbies</label>
                            <InputTextarea id="personalInterests" value={personalInterests} onChange={(e) => setPersonalInterests(e.target.value)} rows={2} className="w-full p-inputtext-sm" placeholder="e.g., Hiking, Photography, Reading" />
                        </div>
                        {/* Basic External Links Input */}
                        <div className="field">
                            <label className="block text-sm font-medium text-700 mb-2">Links to External Profiles/Sites (Basic - needs more UI)</label>
                            {externalLinks.map((link, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                                    <InputText placeholder="Label" value={link.label} onChange={(e) => {
                                        const newLinks = [...externalLinks];
                                        newLinks[index].label = e.target.value;
                                        setExternalLinks(newLinks);
                                    }} className="p-inputtext-sm" />
                                    <InputText placeholder="URL" value={link.url} onChange={(e) => {
                                        const newLinks = [...externalLinks];
                                        newLinks[index].url = e.target.value;
                                        setExternalLinks(newLinks);
                                    }} className="p-inputtext-sm" />
                                </div>
                            ))}
                            <Button label="Add Link" className="p-button-sm" onClick={() => setExternalLinks([...externalLinks, { label: '', url: '' }])} />
                        </div>
                        <div className="field-checkbox">
                            <Checkbox inputId="includeTestimonials" checked={includeTestimonials} onChange={(e) => setIncludeTestimonials(e.checked)} />
                            <label htmlFor="includeTestimonials" className="ml-2 text-sm text-800">Include Testimonials/Recommendations (if available)</label>
                        </div>
                    </div>

                    <Divider className="my-4" />
                    </div>

                    {/* Custom Instructions */}
                    <div className="mb-4">
                        <h5 className="mb-3 text-xl font-semibold text-900">Custom Instructions (Optional)</h5>
                        <label htmlFor="customInstructions" className="block text-sm font-medium text-700 mb-2">Provide any specific instructions for the website generation:</label>
                        <InputTextarea
                            id="customInstructions"
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            rows={4}
                            placeholder="e.g., 'Use a specific font pairing', 'Ensure the contact form has a subject field', 'Prioritize my latest projects'."
                            className="w-full p-inputtext-sm"
                            autoResize
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <Button
                            label={loading ? "" : "Generate My Awesome Website"}
                            onClick={handleGenerateWebsite}
                            disabled={loading || !resumeId}
                            className="p-button-primary p-button-lg"
                            icon={loading ? <ProgressSpinner className="mr-2" style={{ width: '1rem', height: '1rem' }} strokeWidth="5" animationDuration=".5s" /> : null}
                        />
                    </div>
                    {!resumeId && (
                        <small className="block mt-2 text-red-500">Please select a resume to generate a website.</small>
                    )}
            </Card>
        </div>
    );
};

export default GenerateWebsiteForm;
