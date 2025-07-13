import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from 'next-auth/providers/google';
import axios from "axios";

// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 15 * 60;  // 15 minutes (increased from 4 for stability)
const BACKEND_REFRESH_TOKEN_LIFETIME = 24 * 60 * 60;  // 24 hours

const getCurrentEpochTime = () => {
    return Math.floor(new Date().getTime() / 1000);
};

// Define interfaces for expected response formats
interface BackendResponse {
    user: any;
    access: string;
    refresh: string;
}

// Type for sign-in handlers
type SignInHandlerFn = (
    user: any,
    account: any,
    profile: any,
    email: any,
    credentials: any
) => Promise<boolean>;

// Define handlers with proper type
const SIGN_IN_HANDLERS: Record<string, SignInHandlerFn> = {
    "credentials": async (user, account, profile, email, credentials) => {
        return true;
    },
    "google": async (user, account, profile, email, credentials) => {
        try {
            const response = await axios({
                method: "post",
                url: process.env.NEXTAUTH_BACKEND_URL + "/accounts/google/",
                data: {
                    access_token: account["access_token"],
                },
            });
            account["meta"] = response.data;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};

const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: BACKEND_REFRESH_TOKEN_LIFETIME,
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    access_type: "offline",
                    response_type: "code"
                }
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                try {
                    const response = await fetch(
                        `${process.env.NEXTAUTH_BACKEND_URL}/accounts/login/`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(credentials),
                        }
                    );
                    const data = await response.json();
                    if (data) return data;
                } catch (error) {
                    console.error(error);
                }
                return null;
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            if (!account || !SIGN_IN_PROVIDERS.includes(account.provider)) return false;

            const handler = SIGN_IN_HANDLERS[account.provider as keyof typeof SIGN_IN_HANDLERS];
            return handler(user, account, profile, email, credentials);
        },

        async jwt({ user, token, account }) {
            // If `user` and `account` are set that means it is a login event
            if (user && account) {
                const backendResponse = (account.provider === "credentials"
                    ? user
                    : account.meta) as BackendResponse;

                token.user = backendResponse.user;
                token.access_token = backendResponse.access;
                token.refresh_token = backendResponse.refresh;
                token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                token.failedRefreshAttempts = 0; // Reset failed attempts on successful login
                return token;
            }

            // Check if token exists and needs refresh
            if (token.ref && getCurrentEpochTime() > token.ref) {
                console.log("Token expired, attempting refresh...");

                try {
                    const response = await axios({
                        method: "post",
                        url: process.env.NEXTAUTH_BACKEND_URL + "/accounts/token/refresh/",
                        data: {
                            refresh: token.refresh_token,
                        },
                        timeout: 15000, // Increased timeout
                        validateStatus: function (status) {
                            return status < 500; // Don't throw for 4xx errors, handle them gracefully
                        }
                    });

                    // Check if refresh was successful
                    if (response.status === 200 && response.data.access) {
                        // Update tokens but KEEP user data
                        token.access_token = response.data.access;

                        if (response.data.refresh) {
                            token.refresh_token = response.data.refresh;
                        }

                        token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                        token.failedRefreshAttempts = 0; // Reset failed attempts on successful refresh
                        console.log("Token refreshed successfully");
                        return token;
                    } else {
                        // Refresh failed with 4xx error
                        console.log("Token refresh failed with status:", response.status);
                        throw new Error(`Refresh failed: ${response.status}`);
                    }

                } catch (error: any) {
                    console.error("Error refreshing token:", error);

                    // Only clear session if refresh token is actually invalid (not just network issues)
                    if (error.response?.status === 401 || error.message?.includes('Refresh failed: 401')) {
                        console.log("Refresh token invalid, clearing session");
                        // Clear tokens but PRESERVE user data for a better UX
                        token.access_token = null;
                        token.refresh_token = null;
                        token.ref = null;
                        // Only clear user after multiple failed attempts
                        if (!token.failedRefreshAttempts) {
                            token.failedRefreshAttempts = 1;
                        } else {
                            token.failedRefreshAttempts++;
                        }
                        
                        // Only clear user after 3 failed refresh attempts
                        if (token.failedRefreshAttempts >= 3) {
                            token.user = null;
                        }
                        return token; // Return cleared token instead of throwing
                    } else {
                        // For network errors, keep trying with existing token
                        console.log("Network error during refresh, keeping existing session");
                        // Extend the refresh time slightly to avoid immediate retry
                        token.ref = getCurrentEpochTime() + 60; // Retry in 1 minute
                        return token;
                    }
                }
            }

            return token;
        },

        async session({ session, token }) {
            // Always ensure user data is available if token has user
            if (token.user) {
                session.user = {
                    ...session.user,
                    ...token.user,
                    // Ensure these core fields are always available
                    name: token.user.first_name && token.user.last_name 
                        ? `${token.user.first_name} ${token.user.last_name}`.trim()
                        : token.user.username || token.user.email,
                    email: token.user.email,
                    image: token.user.image || null,
                };
            }

            // Add tokens if they exist and are valid
            if (token.access_token && token.refresh_token) {
                session.accessToken = token.access_token;
                session.refreshToken = token.refresh_token;
            } else {
                // Clear tokens but keep user info to prevent logout
                session.accessToken = undefined;
                session.refreshToken = undefined;
                // Only clear user if token is completely invalid AND we've failed multiple times
                if (!token.user || (token.failedRefreshAttempts && token.failedRefreshAttempts >= 3)) {
                    session.user = undefined;
                }
            }

            return session;
        },
    },

    // **ADD EVENTS TO HANDLE TOKEN ISSUES**
    events: {
        async signOut(message) {
            console.log("User signed out:", message);
        },
    },

    // **ADD PAGES TO HANDLE ERRORS**
    pages: {
        signIn: '/login',
        error: '/login', // Redirect errors to login page
    },
};

// Add type definitions to prevent TypeScript errors
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
        user: any;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        access_token?: string | null;
        refresh_token?: string | null;
        ref?: number | null;
        user: any;
        failedRefreshAttempts?: number;
    }
}
