import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
// import AuthProvider from './providers/AuthProvider';
import InstallPWA from './components/InstallPWA';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import AuthProvider from './providers/AuthProvider';
import type { Metadata, Viewport } from "next";

const APP_NAME = "Sakai React";
const APP_DEFAULT_TITLE = "Sakai React - PrimeFaces";
const APP_TITLE_TEMPLATE = "%s - Sakai React";
const APP_DESCRIPTION = "Free React Admin Template";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet"></link>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link> {/* Adjust path if your icons are elsewhere */}
                <meta name="theme-color" content="#000000" /> {/* You can change this color */}
            </head>
            <body>
                <AuthProvider>
                    <PrimeReactProvider>
                        <LayoutProvider>
                            {children}
                            <InstallPWA />
                        </LayoutProvider>
                    </PrimeReactProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
