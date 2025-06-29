import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported locales
const locales = ['en', 'tr', 'ar'];
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

  // Check if current path is public
  const isPublic = publicPaths.some(path => pathWithoutLocale.startsWith(path));
  const isProtected = isProtectedPath(pathWithoutLocale);

  console.log('Is public:', isPublic);
  console.log('Is protected:', isProtected);

  // Handle locale redirects for all paths
  if (!currentLocale) {
    const preferredLocale = getPreferredLocale(request);
    // Only redirect to locale prefix if it's not the default locale or it's not the root path
    if (preferredLocale !== defaultLocale || pathname !== '/') {
      const newPath = `/${preferredLocale}${pathname}`;
      console.log('Redirecting to:', newPath);
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }

  // For public paths, allow access without authentication
  if (isPublic) {
    console.log('Public path, allowing access');
    return NextResponse.next();
  }

  // For protected paths, check authentication
  if (isProtected) {
    console.log('Protected path, checking authentication');

    // Get Next-Auth.js session token
    const token = request.cookies.get('next-auth.session-token')?.value;
    const devToken = request.cookies.get('__Secure-next-auth.session-token')?.value;
    const hasValidToken = token || devToken;

    console.log('Has valid token:', !!hasValidToken);

    if (!hasValidToken) {
      // Redirect to login with current locale
      const loginPath = currentLocale ? `/${currentLocale}/login` : '/login';
      console.log('No token, redirecting to:', loginPath);
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  console.log('Allowing access to:', pathname);
  return NextResponse.next();
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
