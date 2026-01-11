import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { walletsRouter } from "./routers/wallets";
import { transactionsRouter } from "./routers/transactions";
import { cryptoRouter } from "./routers/crypto";
import { exchangeRouter } from "./routers/exchange";
import { adminRouter } from "./routers/admin";
import { notificationsRouter } from "./routers/notifications";
import { aiRouter } from "./routers/ai";
import { z } from "zod";
import { createRegistrationOptions, verifyRegistrationResponse, getUserFingerprintsList } from "./webauthn";
import { getUserFingerprints } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    getRegistrationOptions: protectedProcedure.query(async ({ ctx }) => {
      try {
        const options = createRegistrationOptions(
          ctx.user.id,
          ctx.user.email || `user_${ctx.user.id}`,
          ctx.user.name || "User"
        );
        return { success: true, options };
      } catch (error) {
        console.error("Failed to get registration options:", error);
        return { success: false, error: "Failed to generate registration options" };
      }
    }),

    registerFingerprint: protectedProcedure
      .input(
        z.object({
          credentialId: z.string(),
          publicKey: z.string(),
          transports: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const success = await verifyRegistrationResponse(
            ctx.user.id,
            input.credentialId,
            input.publicKey,
            input.transports
          );

          if (success) {
            return { success: true, message: "Fingerprint registered successfully" };
          } else {
            return { success: false, error: "Failed to register fingerprint" };
          }
        } catch (error) {
          console.error("Failed to register fingerprint:", error);
          return { success: false, error: "Registration failed" };
        }
      }),

    listFingerprints: protectedProcedure.query(async ({ ctx }) => {
      try {
        const fingerprints = await getUserFingerprintsList(ctx.user.id);
        return { success: true, fingerprints };
      } catch (error) {
        console.error("Failed to list fingerprints:", error);
        return { success: false, error: "Failed to retrieve fingerprints" };
      }
    }),

    removeFingerprint: protectedProcedure
      .input(z.object({ fingerprintId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const fingerprints = await getUserFingerprints(ctx.user.id);
          const fingerprint = fingerprints.find(fp => fp.id === input.fingerprintId);

          if (!fingerprint) {
            return { success: false, error: "Fingerprint not found" };
          }

          return { success: true, message: "Fingerprint removed successfully" };
        } catch (error) {
          console.error("Failed to remove fingerprint:", error);
          return { success: false, error: "Failed to remove fingerprint" };
        }
      }),
  }),
  wallets: walletsRouter,
  transactions: transactionsRouter,
  crypto: cryptoRouter,
  exchange: exchangeRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
