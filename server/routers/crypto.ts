import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createWallet, getUserWallets, getWalletById, createTransaction } from "../db";
import { InsertTransaction } from "../../drizzle/schema";

/**
 * Cryptocurrency integration procedures
 * Handles Bitcoin, Ethereum, and other cryptocurrency operations
 */

export const cryptoRouter = router({
  /**
   * Generate a new cryptocurrency address for deposits
   * In production, this would call BlockCypher or Blockchain.com API
   */
  generateAddress: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already has a wallet for this crypto
        const existingWallets = await getUserWallets(ctx.user.id);
        const exists = existingWallets.some(w => w.currencyCode === input.cryptocurrency);

        if (exists) {
          const wallet = existingWallets.find(w => w.currencyCode === input.cryptocurrency);
          return {
            success: true,
            address: wallet?.address || "1A1z7agoat4FqCnf4Xy2MQUqLCWCuqq2em",
            cryptocurrency: input.cryptocurrency,
          };
        }

        // Generate mock address (in production, call BlockCypher API)
        const mockAddress = input.cryptocurrency === "BTC"
          ? "1A1z7agoat4FqCnf4Xy2MQUqLCWCuqq2em"
          : "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE";

        // Create wallet with address
        await createWallet(ctx.user.id, input.cryptocurrency, mockAddress);

        return {
          success: true,
          address: mockAddress,
          cryptocurrency: input.cryptocurrency,
        };
      } catch (error) {
        console.error("Failed to generate address:", error);
        return { success: false, error: "Failed to generate address" };
      }
    }),

  /**
   * Get deposit address for a cryptocurrency
   */
  getDepositAddress: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const wallets = await getUserWallets(ctx.user.id);
        const wallet = wallets.find(w => w.currencyCode === input.cryptocurrency);

        if (!wallet || !wallet.address) {
          return { success: false, error: "Wallet not found" };
        }

        return {
          success: true,
          address: wallet.address,
          cryptocurrency: input.cryptocurrency,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wallet.address)}`,
        };
      } catch (error) {
        console.error("Failed to get deposit address:", error);
        return { success: false, error: "Failed to retrieve address" };
      }
    }),

  /**
   * Initiate a cryptocurrency withdrawal
   */
  initiateWithdrawal: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
        amount: z.string(),
        destinationAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const wallets = await getUserWallets(ctx.user.id);
        const wallet = wallets.find(w => w.currencyCode === input.cryptocurrency);

        if (!wallet) {
          return { success: false, error: "Wallet not found" };
        }

        const balance = parseFloat(wallet.balance);
        const amount = parseFloat(input.amount);

        if (balance < amount) {
          return { success: false, error: "Insufficient balance" };
        }

        // Create withdrawal transaction
        const transactionData: InsertTransaction = {
          fromUserId: ctx.user.id,
          fromWalletId: wallet.id,
          toWalletId: wallet.id,
          amount: input.amount,
          fee: "0.0005", // Mock fee
          transactionType: "withdrawal",
          status: "pending",
          description: `Withdrawal to ${input.destinationAddress.substring(0, 10)}...`,
        };

        await createTransaction(transactionData);

        return {
          success: true,
          message: "Withdrawal initiated successfully",
          status: "pending",
          cryptocurrency: input.cryptocurrency,
        };
      } catch (error) {
        console.error("Failed to initiate withdrawal:", error);
        return { success: false, error: "Failed to initiate withdrawal" };
      }
    }),

  /**
   * Get cryptocurrency price in USD
   * In production, this would call CoinGecko or similar API
   */
  getPrice: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Mock prices (in production, fetch from CoinGecko API)
        const prices: Record<string, number> = {
          BTC: 42500,
          ETH: 2300,
        };

        const price = prices[input.cryptocurrency] || 0;

        return {
          success: true,
          cryptocurrency: input.cryptocurrency,
          price,
          currency: "USD",
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Failed to get price:", error);
        return { success: false, error: "Failed to retrieve price" };
      }
    }),

  /**
   * Get transaction history for a cryptocurrency
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const wallets = await getUserWallets(ctx.user.id);
        const wallet = wallets.find(w => w.currencyCode === input.cryptocurrency);

        if (!wallet) {
          return { success: false, error: "Wallet not found" };
        }

        // In production, fetch from blockchain explorer API
        return {
          success: true,
          cryptocurrency: input.cryptocurrency,
          transactions: [],
          total: 0,
        };
      } catch (error) {
        console.error("Failed to get transaction history:", error);
        return { success: false, error: "Failed to retrieve transaction history" };
      }
    }),

  /**
   * Get cryptocurrency balance
   */
  getBalance: protectedProcedure
    .input(
      z.object({
        cryptocurrency: z.enum(["BTC", "ETH"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const wallets = await getUserWallets(ctx.user.id);
        const wallet = wallets.find(w => w.currencyCode === input.cryptocurrency);

        if (!wallet) {
          return { success: false, error: "Wallet not found" };
        }

        return {
          success: true,
          cryptocurrency: input.cryptocurrency,
          balance: wallet.balance,
          address: wallet.address,
        };
      } catch (error) {
        console.error("Failed to get balance:", error);
        return { success: false, error: "Failed to retrieve balance" };
      }
    }),

  /**
   * List all cryptocurrency wallets
   */
  listCryptoWallets: protectedProcedure.query(async ({ ctx }) => {
    try {
      const wallets = await getUserWallets(ctx.user.id);
      const cryptoWallets = wallets.filter(w => ["BTC", "ETH", "LTC", "XRP"].includes(w.currencyCode));

      return {
        success: true,
        wallets: cryptoWallets.map(w => ({
          id: w.id,
          cryptocurrency: w.currencyCode,
          balance: w.balance,
          address: w.address,
          isActive: w.isActive,
        })),
      };
    } catch (error) {
      console.error("Failed to list crypto wallets:", error);
      return { success: false, error: "Failed to retrieve wallets" };
    }
  }),
});
