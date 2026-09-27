import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationEnabled } from "@/lib/email";
import {
  getClientIpFromContext,
  buildRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import authConfig from "./auth.config";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export class RateLimitError extends CredentialsSignin {
  code = "rate_limit_exceeded";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Rate limiting check: 5 attempts per 15 min by IP + email
        const clientIp = await getClientIpFromContext();
        const identifier = buildRateLimitIdentifier("login", clientIp, email);
        const rateLimit = await checkRateLimit("login", identifier);
        if (!rateLimit.success) {
          throw new RateLimitError();
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        if (isEmailVerificationEnabled() && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
