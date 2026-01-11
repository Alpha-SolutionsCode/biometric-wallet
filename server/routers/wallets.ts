import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createWallet, getUserWallets, getWalletById, updateWalletBalance } from "../db";

export const walletsRouter = router({
  /**
   * Create a new wallet for the current user
   */
  create: protectedProcedure
    .input(
      z.object({
        currencyCode: z.string().min(1).max(10),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already has a wallet for this currency
        const existingWallets = await getUserWallets(ctx.user.id);
        const exists = existingWallets.some(w => w.currencyCode === input.currencyCode);

        if (exists) {
          return { success: false, error: `Wallet for ${input.currencyCode} already exists` };
        }

        await createWallet(ctx.user.id, input.currencyCode, input.address);
        return { success: true, message: `${input.currencyCode} wallet created successfully` };
      } catch (error) {
        console.error("Failed to create wallet:", error);
        return { success: false, error: "Failed to create wallet" };
      }
    }),

  /**
   * List all wallets for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const wallets = await getUserWallets(ctx.user.id);
      return { success: true, wallets };
    } catch (error) {
      console.error("Failed to list wallets:", error);
      return { success: false, error: "Failed to retrieve wallets" };
    }
  }),

  /**
   * Get a specific wallet by ID
   */
  getById: protectedProcedure
    .input(z.object({ walletId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const wallet = await getWalletById(input.walletId);

        if (!wallet || wallet.userId !== ctx.user.id) {
          return { success: false, error: "Wallet not found" };
        }

        return { success: true, wallet };
      } catch (error) {
        console.error("Failed to get wallet:", error);
        return { success: false, error: "Failed to retrieve wallet" };
      }
    }),

  /**
   * Get balance for a specific wallet
   */
  getBalance: protectedProcedure
    .input(z.object({ walletId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const wallet = await getWalletById(input.walletId);

        if (!wallet || wallet.userId !== ctx.user.id) {
          return { success: false, error: "Wallet not found" };
        }

        return { success: true, balance: wallet.balance, currency: wallet.currencyCode };
      } catch (error) {
        console.error("Failed to get balance:", error);
        return { success: false, error: "Failed to retrieve balance" };
      }
    }),

  /**
   * Get total portfolio value in a specific currency
   */
  getPortfolioValue: protectedProcedure
    .input(z.object({ baseCurrency: z.string().default("USD") }))
    .query(async ({ ctx, input }) => {
      try {
        const wallets = await getUserWallets(ctx.user.id);

        // Calculate total value (simplified - in production you'd use exchange rates)
        const totalValue = wallets.reduce((sum, wallet) => {
          const balance = parseFloat(wallet.balance);
          return sum + balance;
        }, 0);

        return { success: true, totalValue, currency: input.baseCurrency };
      } catch (error) {
        console.error("Failed to get portfolio value:", error);
        return { success: false, error: "Failed to calculate portfolio value" };
      }
    }),

  /**
   * Get wallet distribution (percentage breakdown)
   */
  getDistribution: protectedProcedure.query(async ({ ctx }) => {
    try {
      const wallets = await getUserWallets(ctx.user.id);

      const totalValue = wallets.reduce((sum, wallet) => {
        return sum + parseFloat(wallet.balance);
      }, 0);

      if (totalValue === 0) {
        return { success: true, distribution: [] };
      }

      const distribution = wallets.map(wallet => ({
        currency: wallet.currencyCode,
        balance: wallet.balance,
        percentage: (parseFloat(wallet.balance) / totalValue) * 100,
      }));

      return { success: true, distribution };
    } catch (error) {
      console.error("Failed to get distribution:", error);
      return { success: false, error: "Failed to calculate distribution" };
    }
  }),
});
