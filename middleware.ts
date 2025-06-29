import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported locales
const locales = ['en', 'tr', 'ar', 'de', 'es'];
const defaultLocale = 'en';

// Define public paths (without locale prefix)
const publicPaths = ['/login', '/api/auth'];

// Protected paths that need authentication
const protectedPaths = ['/main', '/editor', '/test', '/resume', '/(protected)'];

// Helper function to get locale from pathname
function getLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  return locales.includes(maybeLocale) ? maybeLocale : null;
}

// Helper function to get preferred locale from Accept-Language header
function getPreferredLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferredLocale = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
  return locales.includes(preferredLocale) ? preferredLocale : defaultLocale;
}

// Helper function to remove locale from pathname
function removeLocaleFromPathname(pathname: string, locale: string | null) {
  if (!locale) return pathname;
  return pathname.slice(`/${locale}`.length) || '/';
}

// Helper function to check if path is protected
function isProtectedPath(pathname: string) {
  return protectedPaths.some(path => {
    if (path.includes('*')) {
      return pathname.startsWith(path.replace('*', ''));
    }
    return pathname.startsWith(path);
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware executing for path:', pathname);

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract locale from pathname
  const currentLocale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = removeLocaleFromPathname(pathname, currentLocale);

  console.log('Current locale:', currentLocale);
  console.log('Path without locale:', pathWithoutLocale);

  // **DISABLE LOCALE DETECTION FOR EXPLICIT URLs**
  // If user has explicitly set a locale in URL, respect it completely
  if (currentLocale) {
    console.log('Explicit locale detected in URL, respecting user choice:', currentLocale);

    // Check if current path is public or protected
    const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path));
    const isProtected = isProtectedPath(pathWithoutLocale);

    // For public paths, allow access without authentication
    if (isPublic) {
      console.log('Public path with explicit locale, allowing access');
      return NextResponse.next();
    }

    // For protected paths, only check authentication
    if (isProtected) {
      console.log('Protected path with explicit locale, checking authentication only');

      // Get Next-Auth.js session token
      const token = request.cookies.get('next-auth.session-token')?.value;
      const devToken = request.cookies.get('__Secure-next-auth.session-token')?.value;
      const hasValidToken = token || devToken;

      console.log('Has valid token:', !!hasValidToken);

      if (!hasValidToken) {
        // Redirect to login with the SAME locale user chose
        const loginPath = `/${currentLocale}/login`;
        console.log('No token, redirecting to login with same locale:', loginPath);
        return NextResponse.redirect(new URL(loginPath, request.url));
      }
    }

    // Allow access with explicit locale
    console.log('Allowing access with explicit locale:', pathname);
    return NextResponse.next();
  }

  // **ONLY do automatic locale detection for paths WITHOUT explicit locale**
  console.log('No explicit locale in URL, applying automatic detection');

  const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path));
  const isProtected = isProtectedPath(pathWithoutLocale);

  console.log('Is public:', isPublic);
  console.log('Is protected:', isProtected);

  // For paths without locale, add preferred locale
  const preferredLocale = getPreferredLocale(request);

  // Only redirect to locale prefix if it's not the default locale on root path
  if (pathname === '/' && preferredLocale === defaultLocale) {
    console.log('Root path with default locale, no redirect needed');
    return NextResponse.next();
  }

  // Add locale to URL
  const newPath = `/${preferredLocale}${pathname}`;
  console.log('Adding automatic locale to URL:', newPath);
  return NextResponse.redirect(new URL(newPath, request.url));
}

// Configure middleware to run on all routes except API and static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons).*)',
  ]
};
