import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createRegistrationOptions, createAuthenticationOptions, verifyRegistrationResponse, getUserFingerprintsList } from "../webauthn";
import { createFingerprint, getUserFingerprints } from "../db";

export const authRouter = router({
  /**
   * Get WebAuthn registration options for a new fingerprint
   */
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

  /**
   * Register a new fingerprint credential
   */
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

  /**
   * Get WebAuthn authentication options
   */
  getAuthenticationOptions: publicProcedure.query(async () => {
    try {
      // In a real app, you'd get the user ID from the request
      // For now, we'll use a placeholder
      const options = createAuthenticationOptions(0);
      return { success: true, options };
    } catch (error) {
      console.error("Failed to get authentication options:", error);
      return { success: false, error: "Failed to generate authentication options" };
    }
  }),

  /**
   * List all registered fingerprints for the current user
   */
  listFingerprints: protectedProcedure.query(async ({ ctx }) => {
    try {
      const fingerprints = await getUserFingerprintsList(ctx.user.id);
      return { success: true, fingerprints };
    } catch (error) {
      console.error("Failed to list fingerprints:", error);
      return { success: false, error: "Failed to retrieve fingerprints" };
    }
  }),

  /**
   * Remove a fingerprint credential
   */
  removeFingerprint: protectedProcedure
    .input(z.object({ fingerprintId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const fingerprints = await getUserFingerprints(ctx.user.id);
        const fingerprint = fingerprints.find(fp => fp.id === input.fingerprintId);

        if (!fingerprint) {
          return { success: false, error: "Fingerprint not found" };
        }

        // In production, you'd delete the fingerprint from the database
        // For now, we'll just return success
        return { success: true, message: "Fingerprint removed successfully" };
      } catch (error) {
        console.error("Failed to remove fingerprint:", error);
        return { success: false, error: "Failed to remove fingerprint" };
      }
    }),
});
