import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';
import useUserLocation from '../../../hooks/useUserLocation'; // Adjust path as needed

const ScholarshipList = ({ router }) => {
    const [scholarships, setScholarships] = useState([]);
    const [loadingScholarships, setLoadingScholarships] = useState(true); // Renamed for clarity
    const [scholarshipsError, setScholarshipsError] = useState(null); // Renamed for clarity

    // Use the custom hook for location
    const { location, loadingLocation, locationError, refetchLocation } = useUserLocation();

    const fetchScholarships = useCallback(async (loc) => {
        setLoadingScholarships(true);
        setScholarshipsError(null); // Clear previous scholarship-specific errors

        const targetCountry = loc?.country;
        const targetCity = loc?.city;

        // Simulate API call
        console.log(`Simulating fetchScholarships for: ${targetCity}, ${targetCountry}`);
        setTimeout(() => {
            // Replace this with your actual API call
            const mockScholarships = [
                { id: 1, title: "Future Leaders Scholarship", provider: "Education Foundation", deadline: "2025-08-01" },
                { id: 2, title: "Tech Innovators Grant", provider: "Science & Tech Fund", deadline: "2025-09-15" },
            ];

            if (targetCountry && targetCity) {
                console.log(`Fetching scholarships for location: ${targetCountry}, ${targetCity}`);
                // You can send country and city to your API here
            } else if (locationError) {
                console.log("Location could not be determined. Fetching default scholarships.");
            } else {
                console.log("Fetching default scholarships (location data might still be loading or unavailable).");
            }

            setScholarships(mockScholarships);
            setLoadingScholarships(false);
        }, 1000); // Reduced timeout
    }, [locationError]); // locationError is a dependency if your fallback logic depends on it.

    useEffect(() => {
        // Location is fetched by the useUserLocation hook automatically on mount.
        // We wait for the location data (or error) before fetching scholarships.
        if (!loadingLocation) { // Only proceed if location fetching is complete
            if (location && location.country && !locationError) {
                fetchScholarships(location);
            } else {
                // If locationError exists or location is not available,
                // fetchScholarships will use default/fallback logic.
                // The locationError state from the hook can be displayed to the user.
                fetchScholarships(null);
            }
        }
    }, [loadingLocation, location, locationError, fetchScholarships]);

    // Determine overall loading state and error message
    const isLoading = loadingLocation || loadingScholarships;
    const displayError = locationError || scholarshipsError;

    return (
        <Card className={`${styles.dashboardCard} h-full`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="text-xl font-bold m-0">Scholarship Opportunities</h3>
                {/* Optional: Add a button to refetch location if needed */}
                {/* {locationError && <Button label="Retry Location" onClick={refetchLocation} className="p-button-sm p-button-warning" />} */}
                <Button
                    label="View All"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-text p-button-sm"
                    onClick={() => router.push('/main/scholarship-feed')}
                />
            </div>
            {displayError && <p className="text-sm text-red-500 mb-3">{displayError}</p>}
            {location.city && location.country && !locationError && (
                <p className="text-sm text-color-secondary mb-3">
                    Showing results based on your location: {location.city}, {location.country}.
                </p>
            )}
            {isLoading ? (
                <div className="flex justify-content-center align-items-center py-5">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                </div>
            ) : scholarships.length > 0 ? (
                <ul className="list-none p-0 m-0">
                    {scholarships.map(scholarship => (
                        <li key={scholarship.id} className={`${styles.feedItem} p-2 border-round cursor-pointer`}>
                            <div className={styles.feedItemTitle}>{scholarship.title}</div>
                            <div className={styles.feedItemSubtitle}>
                                {scholarship.provider} {scholarship.deadline && `- Deadline: ${scholarship.deadline}`}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-color-secondary">{displayError ? "Could not load scholarships." : "No new scholarship opportunities found."}</p>
            )}
        </Card>
    );
};

export default ScholarshipList;
