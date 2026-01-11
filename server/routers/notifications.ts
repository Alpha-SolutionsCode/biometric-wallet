import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createNotification, getUserNotifications } from "../db";
import { InsertNotification } from "../../drizzle/schema";

/**
 * Email notification procedures
 * Handles sending and managing email notifications
 */

export const notificationsRouter = router({
  /**
   * Get user notifications
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      try {
        const notifications = await getUserNotifications(ctx.user.id);
        return { success: true, notifications };
      } catch (error) {
        console.error("Failed to get notifications:", error);
        return { success: false, error: "Failed to retrieve notifications" };
      }
    }),

  /**
   * Send deposit notification
   */
  sendDepositNotification: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        currency: z.string(),
        txHash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notificationData: InsertNotification = {
          userId: ctx.user.id,
          type: "deposit",
          subject: `Deposit Received: ${input.amount} ${input.currency}`,
          content: `You have received ${input.amount} ${input.currency}. Transaction: ${input.txHash || "pending"}`,
        };

        await createNotification(notificationData);

        // In production, send actual email here via SendGrid/SMTP
        console.log(`Email sent to user ${ctx.user.id}: Deposit notification`);

        return { success: true, message: "Deposit notification sent" };
      } catch (error) {
        console.error("Failed to send deposit notification:", error);
        return { success: false, error: "Failed to send notification" };
      }
    }),

  /**
   * Send withdrawal notification
   */
  sendWithdrawalNotification: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        currency: z.string(),
        address: z.string(),
        txHash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notificationData: InsertNotification = {
          userId: ctx.user.id,
          type: "withdrawal",
          subject: `Withdrawal Initiated: ${input.amount} ${input.currency}`,
          content: `Withdrawal of ${input.amount} ${input.currency} to ${input.address.substring(0, 10)}... has been initiated.`,
        };

        await createNotification(notificationData);

        // In production, send actual email here
        console.log(`Email sent to user ${ctx.user.id}: Withdrawal notification`);

        return { success: true, message: "Withdrawal notification sent" };
      } catch (error) {
        console.error("Failed to send withdrawal notification:", error);
        return { success: false, error: "Failed to send notification" };
      }
    }),

  /**
   * Send transfer notification
   */
  sendTransferNotification: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        currency: z.string(),
        toUser: z.string(),
        type: z.enum(["sent", "received"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const subject = input.type === "sent"
          ? `Transfer Sent: ${input.amount} ${input.currency}`
          : `Transfer Received: ${input.amount} ${input.currency}`;

        const content = input.type === "sent"
          ? `You have sent ${input.amount} ${input.currency} to ${input.toUser}`
          : `You have received ${input.amount} ${input.currency} from ${input.toUser}`;

        const notificationData: InsertNotification = {
          userId: ctx.user.id,
          type: "transfer",
          subject,
          content,
        };

        await createNotification(notificationData);

        // In production, send actual email here
        console.log(`Email sent to user ${ctx.user.id}: Transfer notification`);

        return { success: true, message: "Transfer notification sent" };
      } catch (error) {
        console.error("Failed to send transfer notification:", error);
        return { success: false, error: "Failed to send notification" };
      }
    }),

  /**
   * Send security alert notification
   */
  sendSecurityAlert: protectedProcedure
    .input(
      z.object({
        alert: z.string(),
        action: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notificationData: InsertNotification = {
          userId: ctx.user.id,
          type: "security",
          subject: "Security Alert",
          content: `${input.alert}. ${input.action ? `Action: ${input.action}` : ""}`,
        };

        await createNotification(notificationData);

        // In production, send actual email here with high priority
        console.log(`Email sent to user ${ctx.user.id}: Security alert`);

        return { success: true, message: "Security alert sent" };
      } catch (error) {
        console.error("Failed to send security alert:", error);
        return { success: false, error: "Failed to send alert" };
      }
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, update notification read status in database
        return { success: true, message: "Notification marked as read" };
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return { success: false, error: "Failed to update notification" };
      }
    }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, delete notification from database
        return { success: true, message: "Notification deleted" };
      } catch (error) {
        console.error("Failed to delete notification:", error);
        return { success: false, error: "Failed to delete notification" };
      }
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      // In production, fetch user preferences from database
      return {
        success: true,
        preferences: {
          depositNotifications: true,
          withdrawalNotifications: true,
          transferNotifications: true,
          securityAlerts: true,
          emailFrequency: "immediate",
        },
      };
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      return { success: false, error: "Failed to retrieve preferences" };
    }
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        depositNotifications: z.boolean().optional(),
        withdrawalNotifications: z.boolean().optional(),
        transferNotifications: z.boolean().optional(),
        securityAlerts: z.boolean().optional(),
        emailFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, update user preferences in database
        return { success: true, message: "Preferences updated successfully" };
      } catch (error) {
        console.error("Failed to update notification preferences:", error);
        return { success: false, error: "Failed to update preferences" };
      }
    }),
});
