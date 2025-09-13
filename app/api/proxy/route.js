import { NextResponse } from 'next/server';

export async function POST(request) {
  // Get the target Django API URL and auth token from the request headers
  const targetUrl = request.headers.get('X-Target-URL');
  const authToken = request.headers.get('Authorization');

 console.log('Proxying request to:', targetUrl);
  if (!targetUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'X-Target-URL header is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();

    // Forward the request to the Django backend
    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': authToken }),
      },
      body: JSON.stringify(body),
    });

    // Get the response from the backend
    const data = await backendResponse.json();

    // Send the backend's response back to the original client
    return new NextResponse(JSON.stringify(data), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An error occurred in the proxy.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}