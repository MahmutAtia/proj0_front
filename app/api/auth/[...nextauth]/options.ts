import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from 'next-auth/providers/google';
import axios from "axios";

// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 5 * 60;  // 5 minutes
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

            // Type assertion to ensure TypeScript knows this is a valid handler
            const handler = SIGN_IN_HANDLERS[account.provider as keyof typeof SIGN_IN_HANDLERS];
            return handler(user, account, profile, email, credentials);
        },

        async jwt({ user, token, account }) {
            // If `user` and `account` are set that means it is a login event
            if (user && account) {
                // Use type assertion to ensure TypeScript knows the structure
                const backendResponse = (account.provider === "credentials"
                    ? user
                    : account.meta) as BackendResponse;

                // Now TypeScript knows that these properties exist
                token.user = backendResponse.user;
                token.access_token = backendResponse.access;
                token.refresh_token = backendResponse.refresh;
                token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                return token;
            }

            // Refresh the backend token if necessary
            if (token.ref && getCurrentEpochTime() > token.ref) {
                try {
                    const response = await axios({
                        method: "post",
                        url: process.env.NEXTAUTH_BACKEND_URL + "/accounts/token/refresh/",
                        data: {
                            refresh: token.refresh_token,
                        },
                    });
                    token.access_token = response.data.access;
                    token.refresh_token = response.data.refresh;
                    token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                } catch (error) {
                    console.error("Error refreshing token:", error);
                }
            }
            return token;
        },

        async session({ session, token }) {
            // Add access token and refresh token to the session
            session.accessToken = token.access_token;
            session.refreshToken = token.refresh_token;
            return session;
        },
    },
};

// Add type definitions to prevent TypeScript errors
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        access_token?: string;
        refresh_token?: string;
        ref?: number;
        user?: any;
    }
}
