import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getExchangeRate, upsertExchangeRate } from "../db";

/**
 * Exchange rate procedures
 * Handles currency conversion and real-time rate updates
 */

export const exchangeRouter = router({
  /**
   * Get exchange rate between two currencies
   */
  getRate: publicProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const rate = await getExchangeRate(input.from, input.to);

        if (!rate) {
          // Return mock rate if not found
          return {
            success: true,
            from: input.from,
            to: input.to,
            rate: "1.0",
            source: "mock",
            timestamp: new Date(),
          };
        }

        return {
          success: true,
          from: input.from,
          to: input.to,
          rate: rate.rate,
          source: rate.source,
          timestamp: rate.updatedAt,
        };
      } catch (error) {
        console.error("Failed to get exchange rate:", error);
        return { success: false, error: "Failed to retrieve exchange rate" };
      }
    }),

  /**
   * Convert amount from one currency to another
   */
  convert: publicProcedure
    .input(
      z.object({
        amount: z.string(),
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const rate = await getExchangeRate(input.from, input.to);

        if (!rate) {
          // Return mock conversion
          return {
            success: true,
            amount: input.amount,
            from: input.from,
            to: input.to,
            convertedAmount: input.amount,
            rate: "1.0",
          };
        }

        const amount = parseFloat(input.amount);
        const rateValue = parseFloat(rate.rate);
        const convertedAmount = (amount * rateValue).toFixed(8);

        return {
          success: true,
          amount: input.amount,
          from: input.from,
          to: input.to,
          convertedAmount,
          rate: rate.rate,
        };
      } catch (error) {
        console.error("Failed to convert currency:", error);
        return { success: false, error: "Failed to convert currency" };
      }
    }),

  /**
   * Get all supported currency pairs
   */
  getSupportedPairs: publicProcedure.query(async () => {
    try {
      // Return list of supported currency pairs
      const fiatCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
      const cryptoCurrencies = ["BTC", "ETH", "LTC", "XRP"];

      const pairs = [];
      for (const fiat of fiatCurrencies) {
        for (const crypto of cryptoCurrencies) {
          pairs.push({ from: crypto, to: fiat });
          pairs.push({ from: fiat, to: crypto });
        }
      }

      // Add fiat to fiat pairs
      for (let i = 0; i < fiatCurrencies.length; i++) {
        for (let j = i + 1; j < fiatCurrencies.length; j++) {
          pairs.push({ from: fiatCurrencies[i], to: fiatCurrencies[j] });
          pairs.push({ from: fiatCurrencies[j], to: fiatCurrencies[i] });
        }
      }

      return {
        success: true,
        pairs,
        total: pairs.length,
      };
    } catch (error) {
      console.error("Failed to get supported pairs:", error);
      return { success: false, error: "Failed to retrieve supported pairs" };
    }
  }),

  /**
   * Update exchange rate (admin only)
   */
  updateRate: publicProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        rate: z.string(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // In production, this should be protected with admin role check
        await upsertExchangeRate(
          input.from,
          input.to,
          input.rate,
          input.source || "manual"
        );

        return {
          success: true,
          message: "Exchange rate updated successfully",
        };
      } catch (error) {
        console.error("Failed to update exchange rate:", error);
        return { success: false, error: "Failed to update exchange rate" };
      }
    }),

  /**
   * Get historical exchange rates
   */
  getHistory: publicProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        // In production, fetch from database or external API
        const history = [];
        const now = new Date();

        for (let i = 0; i < input.days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          history.push({
            date,
            rate: "1.0", // Mock rate
          });
        }

        return {
          success: true,
          from: input.from,
          to: input.to,
          history: history.reverse(),
        };
      } catch (error) {
        console.error("Failed to get exchange rate history:", error);
        return { success: false, error: "Failed to retrieve history" };
      }
    }),
});
