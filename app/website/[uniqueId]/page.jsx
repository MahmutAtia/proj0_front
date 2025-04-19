// app/website/[uniqueId]/page.jsx

'use client'; // This directive is crucial for using hooks in app directory

import { useRouter } from 'next/navigation'; // Import from 'next/navigation' in app directory
import { useEffect } from 'react';

export default function GeneratedWebsitePage({params}) {
  const uniqueId = params.uniqueId; // Extract uniqueId from the URL parameters

  useEffect(() => {
    if (uniqueId) {
      // Construct the backend URL to fetch the website content
      const backendWebsiteUrl = `/api/serve-website/${uniqueId}/`; // Adjust if your API route is different

      // Redirect the browser to the backend URL
      window.location.href = backendWebsiteUrl;
    }
  }, [uniqueId]);

  return (
    <div>
      {uniqueId ? (
        <p>Redirecting to your personal website...</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
