import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const youtubeScope = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: youtubeScope,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // keep the google token in the encrypted auth jwt for server api calls
      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
      }

      return token;
    },
  },
};
