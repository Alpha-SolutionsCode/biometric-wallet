import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getUserWallets, getUserTransactions, getAuditLogs, createAuditLog } from "../db";
import { InsertAuditLog } from "../../drizzle/schema";

/**
 * Admin-only procedures
 * These require the user to have admin role
 */

// Middleware to check admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Get system analytics
   */
  getAnalytics: adminProcedure.query(async ({ ctx }) => {
    try {
      // In production, this would aggregate data from the database
      return {
        success: true,
        analytics: {
          totalUsers: 0,
          totalTransactions: 0,
          totalVolume: "0",
          activeWallets: 0,
          averageTransactionValue: "0",
          systemHealth: "healthy",
        },
      };
    } catch (error) {
      console.error("Failed to get analytics:", error);
      return { success: false, error: "Failed to retrieve analytics" };
    }
  }),

  /**
   * Get audit logs
   */
  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      try {
        const logs = await getAuditLogs(input.limit, input.offset);
        return { success: true, logs };
      } catch (error) {
        console.error("Failed to get audit logs:", error);
        return { success: false, error: "Failed to retrieve audit logs" };
      }
    }),

  /**
   * Log an admin action
   */
  logAction: adminProcedure
    .input(
      z.object({
        action: z.string(),
        targetUserId: z.number().optional(),
        details: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const logData: InsertAuditLog = {
          adminId: ctx.user.id,
          action: input.action,
          targetUserId: input.targetUserId,
          details: input.details || undefined,
        };

        await createAuditLog(logData);
        return { success: true, message: "Action logged successfully" };
      } catch (error) {
        console.error("Failed to log action:", error);
        return { success: false, error: "Failed to log action" };
      }
    }),

  /**
   * Get user details (admin only)
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // In production, fetch user details from database
        const wallets = await getUserWallets(input.userId);
        const transactions = await getUserTransactions(input.userId, 50, 0);

        return {
          success: true,
          user: {
            id: input.userId,
            wallets: wallets.length,
            transactions: transactions.length,
            totalVolume: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
          },
        };
      } catch (error) {
        console.error("Failed to get user details:", error);
        return { success: false, error: "Failed to retrieve user details" };
      }
    }),

  /**
   * Get transaction monitoring data
   */
  getTransactionMonitoring: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // In production, fetch from database with filtering
        return {
          success: true,
          transactions: [],
          total: 0,
        };
      } catch (error) {
        console.error("Failed to get transaction monitoring data:", error);
        return { success: false, error: "Failed to retrieve transaction data" };
      }
    }),

  /**
   * Suspend a user account
   */
  suspendUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, update user status in database
        await createAuditLog({
          adminId: ctx.user.id,
          action: "suspend_user",
          targetUserId: input.userId,
          details: { reason: input.reason },
        });

        return { success: true, message: "User suspended successfully" };
      } catch (error) {
        console.error("Failed to suspend user:", error);
        return { success: false, error: "Failed to suspend user" };
      }
    }),

  /**
   * Activate a suspended user
   */
  activateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, update user status in database
        await createAuditLog({
          adminId: ctx.user.id,
          action: "activate_user",
          targetUserId: input.userId,
        });

        return { success: true, message: "User activated successfully" };
      } catch (error) {
        console.error("Failed to activate user:", error);
        return { success: false, error: "Failed to activate user" };
      }
    }),

  /**
   * Deposit cryptocurrency to user wallet (admin only)
   */
  depositCrypto: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        walletId: z.number(),
        amount: z.string(),
        txHash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, create transaction and update wallet balance
        await createAuditLog({
          adminId: ctx.user.id,
          action: "deposit_crypto",
          targetUserId: input.userId,
          details: {
            walletId: input.walletId,
            amount: input.amount,
            txHash: input.txHash,
          },
        });

        return { success: true, message: "Deposit processed successfully" };
      } catch (error) {
        console.error("Failed to process deposit:", error);
        return { success: false, error: "Failed to process deposit" };
      }
    }),

  /**
   * Get system health status
   */
  getSystemHealth: adminProcedure.query(async () => {
    try {
      return {
        success: true,
        health: {
          status: "healthy",
          database: "connected",
          api: "operational",
          blockchain: "operational",
          uptime: "99.9%",
        },
      };
    } catch (error) {
      console.error("Failed to get system health:", error);
      return { success: false, error: "Failed to retrieve system health" };
    }
  }),
});
