// import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from 'next-auth/providers/google';
import axios from "axios";

// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 5 * 60;  // 5 minutes
const BACKEND_REFRESH_TOKEN_LIFETIME = 24 * 60 * 60;  // 24 hours

const getCurrentEpochTime = () => {
    return Math.floor(new Date().getTime() / 1000);
};

const SIGN_IN_HANDLERS = {
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
                    //   id_token: account["id_token"],
                    //   code: account["code"],
                },
            });
            //   console.log(response.data);
            account["meta"] = response.data;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

};
const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: BACKEND_REFRESH_TOKEN_LIFETIME,
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
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
            if (!SIGN_IN_PROVIDERS.includes(account.provider)) return false;
            return SIGN_IN_HANDLERS[account.provider](
                user, account, profile, email, credentials
            );
        },

        async jwt({ user, token, account }) {

            // If `user` and `account` are set that means it is a login event
            if (user && account) {
                let backendResponse = account.provider === "credentials" ? user : account.meta; // This is the response from the backend

                token["user"] = backendResponse.user;
                token["access_token"] = backendResponse.access;
                token["refresh_token"] = backendResponse.refresh;
                token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME; // Set the token expiration time
                return token;
            }
            console.log("jwt", token["ref"])
            // confirm ref to unix time
            console.log("jwt", token["ref"]);
            // Refresh the backend token if necessary
            if (getCurrentEpochTime() > token["ref"]) {
                const response = await axios({
                    method: "post",
                    url: process.env.NEXTAUTH_BACKEND_URL + "/accounts/token/refresh/",
                    data: {
                        refresh: token["refresh_token"],
                    },
                });
                token["access_token"] = response.data.access;
                token["refresh_token"] = response.data.refresh;
                token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
            }
            return token;
        },
        async session({ session, token, user }) {

            session.accessToken = token.access_token
            session.refreshToken = token.refresh_token
            // session.user = token.user;  // session.user already exists ?
            // console.log("session", session)
            return session;
        },
    },
    // pages: {
    //     signIn: "/auth/signin",
    //     signOut: "/auth/signout",
    //     error: "/auth/error",
    // },
}
