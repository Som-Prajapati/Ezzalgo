import NextAuth, { User, NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const BASE_PATH = "/api/auth";

const authOptions = {
  providers: [
   Google
  ],
  // basePath: BASE_PATH,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
