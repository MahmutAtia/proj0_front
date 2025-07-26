import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from 'next-auth/providers/google';
import axios from "axios";

// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 19 * 60; // 19 minutes
const BACKEND_REFRESH_TOKEN_LIFETIME = 2 * 24 * 60 * 60; // 2 days

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
            console.log("Google response:", response.data); // Add this

            account["meta"] = response.data;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};

const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

// --- SOLUTION: Add a lock to prevent token refresh race conditions ---
let tokenRefreshPromise: Promise<any> | null = null;

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
                    console.log("Login response:", data); // Add this

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
            // --- 1. INITIAL SIGN-IN ---
            if (user && account) {
                console.log("✅ Initial sign-in: Populating token from backend response.");
                const backendResponse = (account.provider === "credentials" ? user : account.meta) as BackendResponse;
                token.user = backendResponse.user;
                token.access_token = backendResponse.access;
                token.refresh_token = backendResponse.refresh;
                token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                return token;
            }

            // --- 2. SUBSEQUENT REQUESTS (TOKEN IS VALID) ---
            if (token.ref && getCurrentEpochTime() < token.ref) {
                return token;
            }

            // --- 3. TOKEN REFRESH ---
            if (!token.refresh_token) {
                console.error("❌ No refresh token found. Invalidating session completely.");
                return { ...token, error: "RefreshAccessTokenError" };
            }

            // --- Use the lock ---
            if (tokenRefreshPromise) {
                console.log("🔄 Another refresh is in progress, waiting for it to complete...");
                return await tokenRefreshPromise;
            }

            tokenRefreshPromise = (async () => {
                console.log("⏳ Access token expired, attempting refresh...");
                try {
                    const response = await fetch(process.env.NEXTAUTH_BACKEND_URL + "/accounts/token/refresh/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refresh: token.refresh_token }),
                    });

                    const refreshedTokens = await response.json();
                    if (!response.ok) throw refreshedTokens;

                    console.log("✨ Token refreshed successfully.");
                    return {
                        ...token,
                        access_token: refreshedTokens.access,
                        refresh_token: refreshedTokens.refresh ?? token.refresh_token,
                        ref: getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME,
                    };
                } catch (error) {
                    console.error("🚨 Error refreshing access token:", error);
                    // On failure, invalidate the session to force re-login
                    return { ...token, access_token: null, refresh_token: null, ref: null, user: null, error: "RefreshAccessTokenError" };
                } finally {
                    // --- Release the lock ---
                    tokenRefreshPromise = null;
                }
            })();

            return await tokenRefreshPromise;
        },

        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...session.user,
                    ...token.user,
                    name: token.user.first_name && token.user.last_name
                        ? `${token.user.first_name} ${token.user.last_name}`.trim()
                        : token.user.username || token.user.email,
                    email: token.user.email,
                    image: token.user.image || null,
                };
            }

            session.accessToken = token.access_token;
            session.refreshToken = token.refresh_token;
            session.error = token.error;
            
            // Log final session state for debugging
            console.log('🎫 Final Session:', {
                hasUser: !!session.user,
                hasAccessToken: !!session.accessToken,
                error: session.error,
                userEmail: session.user?.email || 'none'
            });

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
        accessToken?: string | null;
        refreshToken?: string | null;
        user: any;
        error?: "RefreshAccessTokenError";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        access_token?: string | null;
        refresh_token?: string | null;
        ref?: number | null;
        user: any;
        error?: "RefreshAccessTokenError";
    }
}
