// components/DashboardLayout.js
"use client"; // If this layout component is also client-side





// pages/main/positions/index.js or app/main/positions/page.js
// (or wherever you route to display the position templates)

// // Import the layout and the page content component
// import DashboardLayout from '../../../components/DashboardLayout'; // Adjust path as needed
// import PositionTemplatesPageContent from './PositionTemplatesPageContent'; // Rename the component to avoid confusion, maybe 'PositionTemplatesPageContent'


const PositionsPage = () => {
    return (
        <DashboardLayout>
            {/* PositionTemplatesPageContent will be rendered inside the {children} slot in DashboardLayout */}
            <PositionTemplatesPageContent />
        </DashboardLayout>
    );
};

export default PositionsPage;
// app/main/positions/PositionTemplatesPageContent.js

import React, { useState, useEffect ,useRef} from 'react'; // Added useEffect, useState
import { Card } from 'primereact/card';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from 'primereact/button'; // Added Button
import { Ripple } from 'primereact/ripple'; // Added Ripple
import { StyleClass } from 'primereact/styleclass'; // <<< Import StyleClass

// ... (Helper functions getDocumentIcon, getDocumentDescription, getDocumentTitle, getDocumentPreview remain the same) ...
// Make sure these are defined or imported. Example definitions included for completeness:
const getDocumentIcon = (type) => {
     switch (type) {
         case 'resume': return 'pi pi-file';
         case 'cover-letter': return 'pi pi-file-o';
         case 'portfolio': return 'pi pi-images';
         case 'reference-list': return 'pi pi-list-ol';
         default: return 'pi pi-file';
     }
};

const getDocumentDescription = (type) => {
     switch (type) {
         case 'resume': return 'A concise summary of your experience, skills, and education.';
         case 'cover-letter': return 'A letter introducing yourself and highlighting key qualifications for a specific job.';
         case 'portfolio': return 'A curated collection of your best work or projects.';
         case 'reference-list': return 'A list of professional contacts who can vouch for your skills and experience.';
         default: return 'A document related to this position.';
     }
};

const getDocumentTitle = (doc) => {
    if (doc.name) return doc.name;
    switch (doc.type) {
        case 'resume': return 'Resume';
        case 'cover-letter': return 'Cover Letter';
        case 'portfolio': return 'Portfolio';
        case 'reference-list': return 'Reference List';
        default: return 'Document';
    }
};

const getDocumentPreview = (doc) => {
    switch (doc.type) {
        case 'resume': return '/images/placeholders/resume-placeholder.png';
        case 'cover-letter': return '/images/placeholders/cover-letter-placeholder.png';
        default: return '/images/placeholders/doc-placeholder.png';
    }
};






// export default PositionAccordionItem; // This line should be outside the snippet

// Receive props indicating it's inside a drawer and a function to close the drawer
const PositionTemplatesPageContent = ({ isInsideDrawer = false, onCloseDrawer }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    // the state is managed by StyleClass on the list items
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ... (handlePositionSelect, handleBackToPositions, handleTemplateSelect remain the same) ...
     const handlePositionSelect = (position) => {
         setSelectedPosition(position);
     };

     const handleBackToPositions = () => {
         setSelectedPosition(null);
     };
    // useRefs for each accordion item's button (a tag)
    // We need a way to store refs for each position dynamically.
    // A common pattern is using an object or Map, or an array of refs.
    // Let's create a ref for each position dynamically within the map.
    // Note: Managing dynamic refs in a map requires careful handling in effects if the list changes.
    // A simpler approach for StyleClass, given its selector '@next', is to just place the ref
    // directly on the button element inside the map loop.

    // ... (handleTemplateSelect - remains the same) ...
    const handleTemplateSelect = (position, selectedItem, type = 'resume') => {
        console.log(`Selected ${type} for position "${position.title}":`, selectedItem);
        // Example navigation (adjust route as needed)
        const itemId = selectedItem.id; // Assuming both position and doc objects have an id
        const positionId = position.id; // The position object is now passed directly

        let navPath = `/main/create-document?positionId=${positionId}&docType=${type}`;
        if (itemId && type !== 'resume') navPath += `&docItemId=${itemId}`; // Add docItemId only for non-resume docs

        router.push(navPath);
    };
   // ... End Handlers ...


    // ... (useEffect for data fetching remains the same) ...

         useEffect(() => {

             const fetchPositions = async () => {

                 try {

                     if (!process.env.NEXT_PUBLIC_BACKEND_URL) {

                         throw new Error('Backend URL not configured');

                     }

                     // Ensure session and accessToken are available before fetching
                     if (status !== "authenticated" || !session?.accessToken) {
                          // Optionally handle redirect or show a message if not authenticated
                          // If this component is only rendered in an authenticated route, this might be less critical
                          // If the layout handles auth, the session should be present
                          setLoading(false); // Stop loading if not authenticated
                          setError("Authentication required.");
                          return;
                     }


                     const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/`, { // Assumes this endpoint gives positions
                         headers: {

                             'Authorization': `Bearer ${session?.accessToken}`,

                             'Content-Type': 'application/json',

                         }

                     });



                     if (response.status === 401) {

                         // If authentication fails, potentially redirect the user
                         // In a drawer context, maybe just show a message or rely on parent layout auth handling
                          console.error("Authentication failed during fetch. User may need to log in.");
                          setError("Session expired. Please refresh or log in again.");
                          // router.push('/login'); // Redirect might be jarring inside a drawer
                         return;

                     }



                     if (!response.ok) {

                         const errorData = await response.json();
                         throw new Error(`Failed to fetch positions: ${errorData.detail || response.statusText}`);

                     }


                     const data = await response.json();
                     // Assuming the API returns a list of position objects, each potentially with 'other_docs'
                     // Example data structure: [{ id, title, description, icon, other_docs: [{ id, type, name, preview_url }] }, ...]
                     setPositions(data);
                     setLoading(false);


                     // add data to local storage (Optional, consider implications)
                     // localStorage.setItem('positionsData', JSON.stringify(data)); // Changed key to avoid conflict

                 } catch (err) {

                     console.error('Error fetching positions:', err);
                     // Display user-friendly error message
                     setError(err.message || 'An unexpected error occurred.');
                     setLoading(false);

                 }
             };

             // Fetch only when authenticated and positions data is empty, or on status/session change
             // Avoid fetching unnecessarily if data is already loaded and status hasn't changed significantly
             if (status === "authenticated" && positions.length === 0 && !error) {
                  fetchPositions();
             } else if (status === "unauthenticated") {
                 setLoading(false);
                 // Optionally show a message or handle unauthenticated state
                 setError("You need to be logged in to view templates.");
             }


         }, [status, session, error, positions.length]); // Added positions.length to dependency array

        // ... End useEffect ...


    // --- Loading, Error, Empty States (Keep as they render in the main area) ---
    if (status === "loading" || loading) {
        return (
            <div className="flex justify-content-center align-items-center h-full">
                <ProgressSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-600">
                <i className="pi pi-times-circle text-4xl mb-3"></i>
                <p className="text-xl font-semibold">Error loading templates.</p>
                <p>{error}</p>
            </div>
        );
    }

    if (positions.length === 0 && !loading && !error) {
        return (
            <div className="p-4 text-center text-700">
                 <i className="pi pi-box text-4xl mb-3"></i>
                <p className="text-xl font-semibold">No position templates available yet.</p>
                <p>Check back later or contact support.</p>
            </div>
        );
    }
   // ... End Loading, Error, Empty States ...


    // --- Main Render Logic (Renders accordion in the main content area) ---
    // --- Main Render Logic (Renders the list of accordion items) ---
    return (
        <div className="surface-ground p-4 w-full h-full overflow-y-auto"> {/* Container with padding */}
             <h1 className="text-4xl lg:text-5xl font-bold mb-5 text-center text-900">Browse Document Templates</h1>

            <div className="max-w-4xl mx-auto"> {/* Container for the accordion list */}
                <ul className="list-none p-0 m-0"> {/* Main list */}
                    {/* Map over positions and render the PositionAccordionItem component for each */}
                    {positions.map((position) => (
                        // Pass the position data and the handleTemplateSelect function as props
                        // Key is important when mapping lists
                        <PositionAccordionItem
                            key={position.id}
                            position={position}
                            onTemplateSelect={handleTemplateSelect}
                            // Pass helper functions if they are not globally accessible or imported in the item component
                            getDocumentIcon={getDocumentIcon}
                            getDocumentDescription={getDocumentDescription}
                            getDocumentTitle={getDocumentTitle}
                            getDocumentPreview={getDocumentPreview}
                        />
                    ))}
                </ul> {/* End of Main UL */}
            </div>
        </div>
    );
}; // Close the component function if needed

// components/DashboardLayout.js

import { Sidebar } from 'primereact/sidebar';

// Import the component that will live inside the drawer
// Adjust the path based on your project structure

// Assuming PrimeFlex, PrimeIcons, and your theme are imported globally or in your root layout/app.js
// import "primereact/resources/themes/lara-light-blue/theme.css"; // Example theme
// import "primeflex/primeflex.css";
// import "primeicons/primeicons.css";


const DashboardLayout = ({ children }) => {
    // State to control the visibility of the Browse Templates drawer

    // You might want state for other drawers too, e.g., for My Documents
    // const [myDocumentsDrawerVisible, setMyDocumentsDrawerVisible] = useState(false);


// Add these imports at the top if not already present
// import React, { useState } from 'react'; // useState is no longer needed for the drawer here
// import { Button } from 'primereact/button';
// import { Ripple } from 'primereact/ripple';

// Remove the import for PositionTemplatesPageContent from here

// --- DashboardLayout Component Content ---
// const DashboardLayout = ({ children }) => { // Keep the function signature

    // Remove the browseDrawerVisible state and setBrowseDrawerVisible

    return (
        <div className="flex min-h-screen surface-ground"> {/* Main container */}

            {/* === Persistent Sidebar === */}
            <div className="flex flex-column surface-card shadow-2 select-none" style={{ width: '260px', flexShrink: 0 }}>
                {/* App Title / Logo */}
                <div className="flex align-items-center justify-content-center px-4 py-4 text-2xl font-bold border-bottom-1 surface-border text-primary">
                    <i className="pi pi-fw pi-briefcase mr-3"></i>
                    <span className="hidden md:inline">JobReady AI</span>
                </div>

                {/* Navigation Menu */}
                <div className="flex flex-column p-3 overflow-y-auto">
                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                        <i className="pi pi-home mr-3"></i>
                        <span className="font-medium">Home</span>
                        <Ripple />
                    </a>
                    {/* --- 'Browse Templates' link points to the page route --- */}
                    {/* In a Next.js app, this would typically be a <Link href="/main/positions"> */}
                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors active"> {/* 'active' class example */}
                        <i className="pi pi-list mr-3"></i>
                        <span className="font-medium">Browse Templates</span>
                        <Ripple />
                    </a>
                    {/* Example: Link to My Documents */}
                     <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                         <i className="pi pi-folder mr-3"></i>
                         <span className="font-medium">My Documents</span>
                         <Ripple />
                     </a>
                    <a className="p-ripple flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                        <i className="pi pi-cog mr-3"></i>
                        <span className="font-medium">Settings</span>
                        <Ripple />
                    </a>
                </div>

                {/* Optional: User Info / Profile Link */}
                <div className="mt-auto p-3 border-top-1 surface-border">
                    <div className="flex align-items-center cursor-pointer p-3 border-round text-700 hover:surface-hover transition-duration-150 transition-colors">
                        <div className="flex align-items-center justify-content-center bg-primary-100 text-primary-800 mr-3" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }}>
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="font-medium">User Name</span>
                    </div>
                </div>
            </div>

            {/* === Main Content Area === */}
            {/* This is where the page content (PositionTemplatesPageContent) will be rendered */}
            <div className="flex flex-column flex-grow-1 overflow-hidden">

                {/* Optional: Top Bar */}
                <div className="surface-section shadow-1 p-4 flex justify-content-between align-items-center">
                    {/* The page title can be dynamic, maybe passed as a prop or determined by the route */}
                    <h2 className="font-bold text-xl m-0">Browse Templates</h2> {/* Example Title */}
                    <div className="flex align-items-center gap-3">
                        <Button icon="pi pi-bell" rounded text severity="secondary" />
                        <div className="flex align-items-center gap-2 cursor-pointer">
                            <i className="pi pi-user"></i>
                            <span className="font-medium text-700">User Name</span>
                        </div>
                    </div>
                </div>

                {/* === Page Content Area === */}
                {/* PositionTemplatesPageContent will be rendered here via routing */}
                <div className="flex-grow-1 overflow-y-auto p-4"> {/* Added padding for main content */}
                    {children} {/* This is where PositionTemplatesPageContent will be placed */}
                </div>

            </div>

            {/* === Remove Sidebar/Drawer component for Browse Templates === */}
             {/* <Sidebar ...>...</Sidebar> */}

        </div>
    );
}; // Close the component function if needed

// export default DashboardLayout; // This line should be outside the snippet if you don't want export


const PositionAccordionItem = ({ position, onTemplateSelect }) => { // Keep function signature

const positionButtonRef = useRef(null);

    return (
        <li key={position.id} className="mb-2 border-round-lg overflow-hidden surface-card shadow-2"> {/* List item for this position */}
            {/* Accordion Header - Clicking this expands/collapses the next UL */}
            <StyleClass nodeRef={positionButtonRef} selector="@next" enterFromClassName="hidden" enterActiveClassName="slidedown" leaveToClassName="hidden" leaveActiveClassName="slideup">
                {/* The ref is attached to the 'a' tag */}
                <a ref={positionButtonRef} className="p-ripple flex align-items-center cursor-pointer p-4 border-round text-700 hover:surface-hover transition-duration-150 transition-colors w-full">
                    <i className={`${position.icon || 'pi pi-briefcase'} text-2xl text-primary mr-3`}></i>
                    <span className="font-medium text-lg text-800">{position.title}</span>
                    {/* Chevron icon */}
                    <i className="pi pi-chevron-down ml-auto transition-transform transition-duration-300"></i>
                    <Ripple />
                </a>
            </StyleClass>

            {/* Accordion Content - This UL is toggled by StyleClass */}
            <ul className="list-none py-0 pl-4 pr-0 m-0 hidden overflow-y-hidden transition-all transition-duration-400 transition-ease-in-out surface-50 border-top-1 surface-border">
                {/* === Resume Template Item === */}
                <li className="border-bottom-1 surface-border last:border-bottom-none">
                    <div
                         className="flex flex-column sm:flex-row align-items-start sm:align-items-center cursor-pointer p-3 hover:surface-100 transition-duration-150 transition-colors gap-3"
                         onClick={() => onTemplateSelect(position, position, 'resume')} // Call prop handler
                    >
                        <i className={`${getDocumentIcon('resume')} text-xl text-primary flex-shrink-0`}></i>
                        <div className="flex flex-column flex-grow-1">
                            <span className="font-medium text-base text-900">Resume</span>
                            <p className="text-600 m-0 text-sm line-height-3">{getDocumentDescription('resume')}</p>
                        </div>
                        <Button
                             label="Create"
                             icon="pi pi-arrow-right"
                             className="p-button-outlined p-button-sm flex-shrink-0"
                             onClick={(e) => { e.stopPropagation(); onTemplateSelect(position, position, 'resume'); }} // Prevent li click
                        />
                    </div>
                </li>

                {/* === Other Docs Template Items === */}
                {position.other_docs && position.other_docs.map((doc) => (
                    <li key={doc.id || `doc-${position.id}-${doc.type}`} className="border-bottom-1 surface-border last:border-bottom-none"> {/* Ensure unique key */}
                         <div
                             className="flex flex-column sm:flex-row align-items-start sm:align-items-center cursor-pointer p-3 hover:surface-100 transition-duration-150 transition-colors gap-3"
                             onClick={() => onTemplateSelect(position, doc, doc.type || 'doc')} // Call prop handler
                         >
                            <i className={`${getDocumentIcon(doc.type)} text-xl text-primary flex-shrink-0`}></i>
                            <div className="flex flex-column flex-grow-1">
                                <span className="font-medium text-base text-900">{getDocumentTitle(doc)}</span>
                                <p className="text-600 m-0 text-sm line-height-3">{getDocumentDescription(doc.type)}</p>
                            </div>
                            <Button
                                 label="Create"
                                 icon="pi pi-arrow-right"
                                 className="p-button-outlined p-button-sm flex-shrink-0"
                                 onClick={(e) => { e.stopPropagation(); onTemplateSelect(position, doc, doc.type || 'doc'); }} // Prevent li click
                            />
                        </div>
                    </li>
                ))}

                {/* Case for no other_docs within an expanded position */}
                {position.other_docs && position.other_docs.length === 0 && (
                     <li className="p-3 text-center text-700 text-sm">
                         No additional document templates available for this position.
                     </li>
                )}
            </ul> {/* End of Accordion Content UL */}
        </li> // End of Position LI
    );
}
