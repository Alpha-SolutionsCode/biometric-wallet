import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createTransaction, getUserTransactions, getWalletById, updateWalletBalance, getUserWallets } from "../db";
import { InsertTransaction } from "../../drizzle/schema";


export const transactionsRouter = router({
  /**
   * Create a peer-to-peer transfer between users
   */
  transfer: protectedProcedure
    .input(
      z.object({
        toUserId: z.number(),
        fromWalletId: z.number(),
        toWalletId: z.number(),
        amount: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate sender's wallet
        const fromWallet = await getWalletById(input.fromWalletId);
        if (!fromWallet || fromWallet.userId !== ctx.user.id) {
          return { success: false, error: "Invalid source wallet" };
        }

        // Validate receiver's wallet
        const toWallet = await getWalletById(input.toWalletId);
        if (!toWallet) {
          return { success: false, error: "Invalid destination wallet" };
        }

        // Check sufficient balance
        const balance = parseFloat(fromWallet.balance);
        const amount = parseFloat(input.amount);
        if (balance < amount) {
          return { success: false, error: "Insufficient balance" };
        }

        // Create transaction record
        const transactionData: InsertTransaction = {
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          fromWalletId: input.fromWalletId,
          toWalletId: input.toWalletId,
          amount: input.amount,
          fee: "0",
          transactionType: "transfer",
          status: "completed",
          description: input.description,
        };

        await createTransaction(transactionData);

        // Update balances
        const newFromBalance = (balance - amount).toString();
        const toBalance = parseFloat(toWallet.balance);
        const newToBalance = (toBalance + amount).toString();

        await updateWalletBalance(input.fromWalletId, newFromBalance);
        await updateWalletBalance(input.toWalletId, newToBalance);

        return { success: true, message: "Transfer completed successfully" };
      } catch (error) {
        console.error("Failed to create transfer:", error);
        return { success: false, error: "Transfer failed" };
      }
    }),

  /**
   * List transactions for the current user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        type: z.enum(["transfer", "deposit", "withdrawal", "exchange"]).optional(),
        status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const transactions = await getUserTransactions(ctx.user.id, input.limit, input.offset);

        // Filter by type if specified
        let filtered = transactions;
        if (input.type) {
          filtered = filtered.filter(t => t.transactionType === input.type);
        }

        // Filter by status if specified
        if (input.status) {
          filtered = filtered.filter(t => t.status === input.status);
        }

        return { success: true, transactions: filtered, total: filtered.length };
      } catch (error) {
        console.error("Failed to list transactions:", error);
        return { success: false, error: "Failed to retrieve transactions" };
      }
    }),

  /**
   * Get transaction details
   */
  getById: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const transactions = await getUserTransactions(ctx.user.id, 1000, 0);
        const transaction = transactions.find(t => t.id === input.transactionId);

        if (!transaction) {
          return { success: false, error: "Transaction not found" };
        }

        return { success: true, transaction };
      } catch (error) {
        console.error("Failed to get transaction:", error);
        return { success: false, error: "Failed to retrieve transaction" };
      }
    }),

  /**
   * Record a deposit transaction
   */
  recordDeposit: protectedProcedure
    .input(
      z.object({
        walletId: z.number(),
        amount: z.string(),
        blockchainTxHash: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const wallet = await getWalletById(input.walletId);
        if (!wallet || wallet.userId !== ctx.user.id) {
          return { success: false, error: "Invalid wallet" };
        }

        const transactionData: InsertTransaction = {
          toUserId: ctx.user.id,
          fromWalletId: input.walletId,
          toWalletId: input.walletId,
          amount: input.amount,
          fee: "0",
          transactionType: "deposit",
          status: "completed",
          blockchainTxHash: input.blockchainTxHash,
          description: input.description || "Deposit",
        };

        await createTransaction(transactionData);

        // Update wallet balance
        const newBalance = (parseFloat(wallet.balance) + parseFloat(input.amount)).toString();
        await updateWalletBalance(input.walletId, newBalance);

        return { success: true, message: "Deposit recorded successfully" };
      } catch (error) {
        console.error("Failed to record deposit:", error);
        return { success: false, error: "Failed to record deposit" };
      }
    }),

  /**
   * Record a withdrawal transaction
   */
  recordWithdrawal: protectedProcedure
    .input(
      z.object({
        walletId: z.number(),
        amount: z.string(),
        blockchainTxHash: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const wallet = await getWalletById(input.walletId);
        if (!wallet || wallet.userId !== ctx.user.id) {
          return { success: false, error: "Invalid wallet" };
        }

        const balance = parseFloat(wallet.balance);
        const amount = parseFloat(input.amount);
        if (balance < amount) {
          return { success: false, error: "Insufficient balance" };
        }

        const transactionData: InsertTransaction = {
          fromUserId: ctx.user.id,
          fromWalletId: input.walletId,
          toWalletId: input.walletId,
          amount: input.amount,
          fee: "0",
          transactionType: "withdrawal",
          status: "completed",
          blockchainTxHash: input.blockchainTxHash,
          description: input.description || "Withdrawal",
        };

        await createTransaction(transactionData);

        // Update wallet balance
        const newBalance = (balance - amount).toString();
        await updateWalletBalance(input.walletId, newBalance);

        return { success: true, message: "Withdrawal recorded successfully" };
      } catch (error) {
        console.error("Failed to record withdrawal:", error);
        return { success: false, error: "Failed to record withdrawal" };
      }
    }),

  /**
   * Export transactions as CSV
   */
  export: protectedProcedure
    .input(z.object({ format: z.enum(["csv", "json"]).default("csv") }))
    .query(async ({ ctx, input }) => {
      try {
        const transactions = await getUserTransactions(ctx.user.id, 10000, 0);

        if (input.format === "json") {
          return {
            success: true,
            data: JSON.stringify(transactions, null, 2),
            filename: `transactions_${new Date().toISOString().split("T")[0]}.json`,
          };
        }

        // CSV format
        const headers = ["ID", "Type", "Status", "Amount", "Fee", "Date", "Description"];
        const rows = transactions.map(t => [
          t.id,
          t.transactionType,
          t.status,
          t.amount,
          t.fee,
          t.createdAt.toISOString(),
          t.description || "",
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

        return {
          success: true,
          data: csv,
          filename: `transactions_${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("Failed to export transactions:", error);
        return { success: false, error: "Failed to export transactions" };
      }
    }),
});
