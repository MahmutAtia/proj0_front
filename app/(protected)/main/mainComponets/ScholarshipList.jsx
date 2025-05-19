import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import styles from '../Dashboard.module.css';

const ScholarshipList = ({ router }) => {
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ country: '', city: '', currency: '', language: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((response) => response.json())
      .then((data) => {
        const city = data.city;
        const country = data.country_name;
        const currency = data.currency;
        const language = data.languages ? data.languages.split(',')[0] : ''; // first language

        setLocation({ country, city, currency, language });
        console.log(`Location: ${country}, ${city}, Currency: ${currency}, Language: ${language}`);
        // Call your fetchScholarships function with city and country
        fetchScholarships(country, city);
      })
      .catch((err) => {
        alert("Unable to fetch location. Showing default scholarships.");
        setError("Unable to fetch location. Showing default scholarships.");
        fetchScholarships(); // fallback
      });
  }, []);


    const fetchScholarships = (country, city) => {
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            // Replace this with your actual API call
            const mockScholarships = [
                { id: 1, title: "Future Leaders Scholarship", provider: "Education Foundation", deadline: "2025-08-01" },
                { id: 2, title: "Tech Innovators Grant", provider: "Science & Tech Fund", deadline: "2025-09-15" },
            ];

            if (country && city) {
                console.log(`Fetching scholarships for location: ${country}, ${city}`);
                // You can send country and city to your API here
            }

            setScholarships(mockScholarships);
            setLoading(false);
        }, 2000);
    };


    return (
        <Card className={`${styles.dashboardCard} h-full`}>
            <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="text-xl font-bold m-0">Scholarship Opportunities</h3>
                <Button
                    label="View All"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="p-button-text p-button-sm"
                    onClick={() => router.push('/main/scholarship-feed')}
                />
            </div>
            {loading ? (
                <div className="flex justify-content-center align-items-center">
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
                <p className="text-color-secondary">No scholarships available right now.</p>
            )}
        </Card>
    );
};

export default ScholarshipList;
