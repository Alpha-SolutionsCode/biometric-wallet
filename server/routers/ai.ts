import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { fraudDetectionModel, createFraudAnalysisInput } from "../ml/fraudDetection";
import { recommendationEngine } from "../ml/recommendations";
import { supportChatbot } from "../ml/chatbot";
import { getUserTransactions, getUserWallets } from "../db";

/**
 * AI System Integration Procedures
 * Exposes fraud detection, recommendations, and chatbot via tRPC
 */

export const aiRouter = router({
  /**
   * Analyze transaction for fraud risk
   */
  analyzeFraud: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        walletId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user transaction history
        const transactions = await getUserTransactions(ctx.user.id, 50, 0);
        const wallet = await getUserWallets(ctx.user.id);

        // Create fraud analysis input
        const fraudInput = await createFraudAnalysisInput(
          { amount: input.amount },
          transactions,
          wallet.find(w => w.id === input.walletId)
        );

        // Analyze for fraud
        const fraudScore = await fraudDetectionModel.analyzeTransaction(fraudInput);

        return {
          success: true,
          fraudScore: fraudScore.score,
          riskLevel: fraudScore.riskLevel,
          factors: fraudScore.factors,
          recommendation: fraudScore.recommendation,
        };
      } catch (error) {
        console.error("Failed to analyze fraud:", error);
        return {
          success: false,
          error: "Failed to analyze transaction",
          fraudScore: 0.5,
          riskLevel: "medium" as const,
        };
      }
    }),

  /**
   * Get transaction recommendations
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user wallets and transactions
      const wallets = await getUserWallets(ctx.user.id);
      const transactions = await getUserTransactions(ctx.user.id, 100, 0);

      // Build user profile
      const portfolioComposition: Record<string, number> = {};
      let totalBalance = 0;

      wallets.forEach(wallet => {
        const balance = parseFloat(wallet.balance);
        portfolioComposition[wallet.currencyCode] = balance;
        totalBalance += balance;
      });

      // Normalize to percentages
      if (totalBalance > 0) {
        Object.keys(portfolioComposition).forEach(currency => {
          portfolioComposition[currency] = (portfolioComposition[currency] / totalBalance) * 100;
        });
      }

      const userProfile = {
        userId: ctx.user.id,
        totalBalance,
        portfolioComposition,
        riskTolerance: "moderate" as const,
        investmentHorizon: "long" as const,
        transactionHistory: transactions.map(t => ({
          amount: parseFloat(t.amount),
          currency: "USD",
          timestamp: t.createdAt,
          type: t.transactionType as "transfer" | "deposit" | "withdrawal" | "exchange",
        })),
      };

      // Generate recommendations
      const recommendations = await recommendationEngine.generateRecommendations(
        ctx.user.id,
        userProfile
      );

      // Calculate portfolio risk
      const portfolioRisk = recommendationEngine.calculatePortfolioRisk(userProfile);

      return {
        success: true,
        recommendations,
        portfolioRisk,
      };
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      return {
        success: false,
        error: "Failed to generate recommendations",
        recommendations: [],
        portfolioRisk: 0.5,
      };
    }
  }),

  /**
   * Send message to support chatbot
   */
  chatbotMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await supportChatbot.processMessage(ctx.user.id, input.message);

        return {
          success: true,
          message: response.message,
          confidence: response.confidence,
          requiresHuman: response.requiresHuman,
          suggestedActions: response.suggestedActions,
        };
      } catch (error) {
        console.error("Failed to process chatbot message:", error);
        return {
          success: false,
          error: "Failed to process message",
          message: "I apologize, but I'm having trouble processing your request. Please try again.",
          confidence: 0,
          requiresHuman: true,
        };
      }
    }),

  /**
   * Get chatbot conversation history
   */
  getChatHistory: protectedProcedure.query(({ ctx }) => {
    try {
      const history = supportChatbot.getConversationHistory(ctx.user.id);

      return {
        success: true,
        messages: history.map(msg => ({
          id: msg.id,
          message: msg.message,
          isBot: msg.isBot,
          timestamp: msg.timestamp,
          sentiment: msg.sentiment,
        })),
      };
    } catch (error) {
      console.error("Failed to get chat history:", error);
      return {
        success: false,
        error: "Failed to retrieve chat history",
        messages: [],
      };
    }
  }),

  /**
   * Clear chatbot conversation
   */
  clearChat: protectedProcedure.mutation(({ ctx }) => {
    try {
      supportChatbot.clearConversation(ctx.user.id);

      return {
        success: true,
        message: "Conversation cleared",
      };
    } catch (error) {
      console.error("Failed to clear chat:", error);
      return {
        success: false,
        error: "Failed to clear conversation",
      };
    }
  }),

  /**
   * Get chatbot conversation status
   */
  getChatStatus: protectedProcedure.query(({ ctx }) => {
    try {
      const status = supportChatbot.getConversationStatus(ctx.user.id);

      return {
        success: true,
        ...status,
      };
    } catch (error) {
      console.error("Failed to get chat status:", error);
      return {
        success: false,
        error: "Failed to retrieve chat status",
        isResolved: false,
        escalatedToHuman: false,
        messageCount: 0,
      };
    }
  }),

  /**
   * Get fraud detection statistics (admin only)
   */
  getFraudStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if admin
      if (ctx.user.role !== "admin") {
        return {
          success: false,
          error: "Admin access required",
        };
      }

      // In production, aggregate fraud detection data
      return {
        success: true,
        stats: {
          totalAnalyzed: 0,
          highRiskDetected: 0,
          fraudPrevented: 0,
          averageRiskScore: 0,
          topRiskFactors: [],
        },
      };
    } catch (error) {
      console.error("Failed to get fraud stats:", error);
      return {
        success: false,
        error: "Failed to retrieve fraud statistics",
      };
    }
  }),

  /**
   * Train fraud detection model (admin only)
   */
  trainFraudModel: protectedProcedure
    .input(
      z.object({
        trainingData: z.array(
          z.object({
            amount: z.number(),
            userAverageTransaction: z.number(),
            timeSinceLastTransaction: z.number(),
            transactionFrequency: z.number(),
            isNewDevice: z.boolean(),
            isNewLocation: z.boolean(),
            isWeekend: z.boolean(),
            isNightTime: z.boolean(),
            walletAge: z.number(),
            userAccountAge: z.number(),
          })
        ),
        labels: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if admin
        if (ctx.user.role !== "admin") {
          return {
            success: false,
            error: "Admin access required",
          };
        }

        // Train model
        await fraudDetectionModel.trainOnHistoricalData(input.trainingData, input.labels);

        return {
          success: true,
          message: "Fraud detection model trained successfully",
        };
      } catch (error) {
        console.error("Failed to train fraud model:", error);
        return {
          success: false,
          error: "Failed to train model",
        };
      }
    }),

  /**
   * Get AI system health
   */
  getAIHealth: protectedProcedure.query(async () => {
    try {
      return {
        success: true,
        health: {
          fraudDetection: "operational",
          recommendations: "operational",
          chatbot: "operational",
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error("Failed to get AI health:", error);
      return {
        success: false,
        error: "Failed to retrieve AI system health",
      };
    }
  }),
});
