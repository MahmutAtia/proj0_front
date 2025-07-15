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
        // --- 1. INITIAL SIGN-IN ---
        // This block runs only when a user successfully signs in.
        if (user && account) {
            console.log("✅ Initial sign-in: Populating token from backend response.");
            const backendResponse = (account.provider === "credentials" ? user : account.meta) as {
                user: any;
                access: string;
                refresh: string;
            };

            // Persist the data from your backend to the token
            token.user = backendResponse.user;
            token.access_token = backendResponse.access;
            token.refresh_token = backendResponse.refresh;
            token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
            
            return token;
        }

        // --- 2. SUBSEQUENT REQUESTS (TOKEN IS VALID) ---
        // On subsequent requests, if the access token is still valid, return it.
        if (token.ref && getCurrentEpochTime() < token.ref) {
            return token;
        }

        // --- 3. SUBSEQUENT REQUESTS (TOKEN IS EXPIRED) ---
        // If the access token has expired, we need to refresh it.
        console.log("⏳ Access token expired, attempting refresh...");

        // If we don't have a refresh token, we can't do anything. The session is invalid.
        if (!token.refresh_token) {
            console.error("❌ No refresh token found. Invalidating session.");
            token.user = null; // Invalidate the session
            return token;
        }

        try {
            const response = await fetch(
                process.env.NEXTAUTH_BACKEND_URL + "/accounts/token/refresh/",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh: token.refresh_token }),
                }
            );

            const refreshedTokens = await response.json();

            if (!response.ok) {
                // The refresh token was rejected (e.g., expired, revoked)
                throw new Error("Refresh token failed with status: " + response.status);
            }
            
            console.log("✨ Token refreshed successfully.");
            
            // Update the token with the new values
            token.access_token = refreshedTokens.access;
            // Your backend might or might not return a new refresh token
            token.refresh_token = refreshedTokens.refresh ?? token.refresh_token;
            token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;

            return token;

        } catch (error) {
            console.error("🚨 Error refreshing token:", error);
            
            // THE CRITICAL FIX: The refresh failed, so we invalidate the entire session
            // by setting all key properties to null.
            token.access_token = null;
            token.refresh_token = null;
            token.ref = null;
            token.user = null; // This effectively logs the user out.

            return token;
        }
    },
    

        async session({ session, token }) {
            console.log('🎫 Session Callback - Token Debug:', {
                hasUser: !!token.user,
                hasAccessToken: !!token.access_token,
                hasRefreshToken: !!token.refresh_token,
                accessTokenLength: token.access_token?.length || 0,
                failedAttempts: token.failedRefreshAttempts || 0,
                tokenExpiry: token.ref ? new Date(token.ref * 1000).toISOString() : 'none'
            });

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

            // CRITICAL FIX: Always pass accessToken if it exists, even if refresh token is missing
            if (token.access_token) {
                session.accessToken = token.access_token;
                console.log('✅ AccessToken set in session:', session.accessToken.slice(0, 10) + '...');
            } else {
                console.log('❌ No accessToken in token object');
                session.accessToken = undefined;
            }

            if (token.refresh_token) {
                session.refreshToken = token.refresh_token;
                console.log('✅ RefreshToken set in session:', session.refreshToken.slice(0, 10) + '...');
            } else {
                session.refreshToken = undefined;
            }

            // Only clear user if we've completely failed authentication
            if (!token.user || (token.failedRefreshAttempts && token.failedRefreshAttempts >= 3)) {
                console.log('🚫 Clearing user session due to repeated failures');
                session.user = undefined;
            }

            console.log('🎫 Final Session:', {
                hasUser: !!session.user,
                hasAccessToken: !!session.accessToken,
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
