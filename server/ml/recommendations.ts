import * as stats from 'simple-statistics';

/**
 * Transaction Recommendation Engine
 * Provides smart recommendations for portfolio optimization and transactions
 */

interface UserProfile {
  userId: number;
  totalBalance: number;
  portfolioComposition: Record<string, number>; // currency -> percentage
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  transactionHistory: TransactionRecord[];
}

interface TransactionRecord {
  amount: number;
  currency: string;
  timestamp: Date;
  type: 'transfer' | 'deposit' | 'withdrawal' | 'exchange';
}

interface Recommendation {
  type: 'diversification' | 'rebalance' | 'opportunity' | 'savings' | 'growth';
  title: string;
  description: string;
  action: string;
  expectedBenefit: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
}

class RecommendationEngine {
  private userProfiles: Map<number, UserProfile> = new Map();
  private currencyCorrelations: Map<string, Map<string, number>> = new Map();

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(userId: number, profile: UserProfile): Promise<Recommendation[]> {
    this.userProfiles.set(userId, profile);

    const recommendations: Recommendation[] = [];

    // Analyze portfolio composition
    const diversificationRecs = this.analyzeDiversification(profile);
    recommendations.push(...diversificationRecs);

    // Analyze spending patterns
    const savingsRecs = this.analyzeSavingsOpportunities(profile);
    recommendations.push(...savingsRecs);

    // Analyze market opportunities
    const opportunityRecs = await this.analyzeMarketOpportunities(profile);
    recommendations.push(...opportunityRecs);

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityScore[a.priority];
      const bPriority = priorityScore[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.confidence - a.confidence;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Analyze portfolio diversification
   */
  private analyzeDiversification(profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const composition = profile.portfolioComposition;
    const entries = Object.entries(composition);

    // Check for concentration risk
    const maxAllocation = Math.max(...entries.map(([_, pct]) => pct));
    if (maxAllocation > 60) {
      const topCurrency = entries.find(([_, pct]) => pct === maxAllocation)?.[0];
      recommendations.push({
        type: 'diversification',
        title: 'Reduce Concentration Risk',
        description: `Your portfolio is heavily concentrated in ${topCurrency} (${maxAllocation}%). Consider diversifying.`,
        action: `Allocate 10-15% to other currencies`,
        expectedBenefit: 'Reduce portfolio volatility',
        priority: 'high',
        confidence: 0.85,
      });
    }

    // Check for lack of diversification
    if (entries.length < 3) {
      recommendations.push({
        type: 'diversification',
        title: 'Expand Portfolio Diversification',
        description: `You only hold ${entries.length} currencies. Diversification can reduce risk.`,
        action: `Add 2-3 new currencies to your portfolio`,
        expectedBenefit: 'Better risk-adjusted returns',
        priority: 'medium',
        confidence: 0.75,
      });
    }

    // Recommend cryptocurrency allocation based on risk tolerance
    const hasCrypto = entries.some(([curr]) => ['BTC', 'ETH'].includes(curr));
    if (!hasCrypto && profile.riskTolerance !== 'conservative') {
      recommendations.push({
        type: 'growth',
        title: 'Consider Cryptocurrency Allocation',
        description: 'Your risk profile supports cryptocurrency exposure for growth potential.',
        action: `Allocate 5-10% to Bitcoin or Ethereum`,
        expectedBenefit: 'Potential for higher returns',
        priority: 'medium',
        confidence: 0.7,
      });
    }

    return recommendations;
  }

  /**
   * Analyze spending patterns for savings opportunities
   */
  private analyzeSavingsOpportunities(profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (profile.transactionHistory.length < 10) {
      return recommendations; // Not enough data
    }

    // Calculate average transaction size
    const amounts = profile.transactionHistory.map(t => t.amount);
    const avgTransaction = stats.mean(amounts);
    const stdDeviation = stats.standardDeviation(amounts);

    // Identify unusual spending patterns
    const largeTransactions = amounts.filter(a => a > avgTransaction + stdDeviation);
    if (largeTransactions.length > 0) {
      const avgLarge = stats.mean(largeTransactions);
      const potential = avgLarge * 0.1; // 10% savings potential

      recommendations.push({
        type: 'savings',
        title: 'Optimize Large Transfers',
        description: `You have ${largeTransactions.length} large transfers. Batching them could save fees.`,
        action: `Consolidate transfers when possible`,
        expectedBenefit: `Potential savings of ~${potential.toFixed(2)} in fees`,
        priority: 'low',
        confidence: 0.6,
      });
    }

    // Check for frequent small transactions (potential fee drain)
    const smallTransactions = amounts.filter(a => a < avgTransaction * 0.3);
    if (smallTransactions.length > profile.transactionHistory.length * 0.3) {
      recommendations.push({
        type: 'savings',
        title: 'Reduce Transaction Frequency',
        description: `${smallTransactions.length} small transactions detected. Consider batching.`,
        action: `Consolidate multiple small transfers`,
        expectedBenefit: 'Reduce transaction fees',
        priority: 'low',
        confidence: 0.65,
      });
    }

    return recommendations;
  }

  /**
   * Analyze market opportunities
   */
  private async analyzeMarketOpportunities(profile: UserProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Recommend rebalancing if portfolio drifts from target
    if (profile.investmentHorizon === 'long') {
      const composition = profile.portfolioComposition;

      // Target allocation based on risk tolerance
      const targets = this.getTargetAllocation(profile.riskTolerance);

      let maxDrift = 0;
      let driftCurrency = '';

      for (const [currency, target] of Object.entries(targets)) {
        const current = composition[currency] || 0;
        const drift = Math.abs(current - target);

        if (drift > maxDrift) {
          maxDrift = drift;
          driftCurrency = currency;
        }
      }

      if (maxDrift > 10) {
        recommendations.push({
          type: 'rebalance',
          title: 'Rebalance Portfolio',
          description: `Your ${driftCurrency} allocation has drifted from target. Time to rebalance.`,
          action: `Adjust ${driftCurrency} allocation to ${targets[driftCurrency]}%`,
          expectedBenefit: 'Maintain target risk profile',
          priority: 'medium',
          confidence: 0.8,
        });
      }
    }

    // Recommend stablecoin allocation for stability
    const hasStablecoin = Object.keys(profile.portfolioComposition).some(c =>
      ['USD', 'USDC', 'USDT'].includes(c)
    );

    if (!hasStablecoin && profile.riskTolerance === 'conservative') {
      recommendations.push({
        type: 'opportunity',
        title: 'Add Stablecoin Allocation',
        description: 'Stablecoins provide stability and liquidity for conservative investors.',
        action: `Allocate 20-30% to USD or USDC`,
        expectedBenefit: 'Reduced volatility and liquidity',
        priority: 'high',
        confidence: 0.9,
      });
    }

    return recommendations;
  }

  /**
   * Get target allocation based on risk tolerance
   */
  private getTargetAllocation(riskTolerance: 'conservative' | 'moderate' | 'aggressive'): Record<
    string,
    number
  > {
    const allocations = {
      conservative: {
        USD: 50,
        EUR: 20,
        GBP: 15,
        BTC: 10,
        ETH: 5,
      },
      moderate: {
        USD: 30,
        EUR: 20,
        GBP: 10,
        BTC: 20,
        ETH: 15,
        LTC: 5,
      },
      aggressive: {
        USD: 20,
        EUR: 10,
        BTC: 30,
        ETH: 25,
        LTC: 10,
        XRP: 5,
      },
    };

    return allocations[riskTolerance];
  }

  /**
   * Calculate portfolio risk score
   */
  calculatePortfolioRisk(profile: UserProfile): number {
    const composition = profile.portfolioComposition;
    const entries = Object.entries(composition);

    // Calculate Herfindahl index (concentration measure)
    const herfindahl = entries.reduce((sum, [_, pct]) => sum + (pct / 100) ** 2, 0);

    // Normalize to 0-1 scale
    const concentrationRisk = (herfindahl - 1 / entries.length) / (1 - 1 / entries.length);

    // Adjust based on asset types
    const cryptoAllocation = entries
      .filter(([curr]) => ['BTC', 'ETH', 'LTC', 'XRP'].includes(curr))
      .reduce((sum, [_, pct]) => sum + pct, 0);

    const volatilityFactor = cryptoAllocation * 0.5; // Crypto is more volatile

    return Math.min(1, concentrationRisk * 0.5 + volatilityFactor * 0.5);
  }

  /**
   * Get collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(userId: number): Promise<Recommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const recommendations: Recommendation[] = [];

    // Find similar users
    const similarUsers = this.findSimilarUsers(userId, userProfile);

    // Analyze what similar users hold that this user doesn't
    for (const similarUser of similarUsers.slice(0, 3)) {
      const similarProfile = this.userProfiles.get(similarUser);
      if (!similarProfile) continue;

      const userCurrencies = Object.keys(userProfile.portfolioComposition);
      const similarCurrencies = Object.keys(similarProfile.portfolioComposition);

      const missingCurrencies = similarCurrencies.filter(c => !userCurrencies.includes(c));

      for (const currency of missingCurrencies.slice(0, 2)) {
        const allocation = similarProfile.portfolioComposition[currency];
        if (allocation > 5) {
          recommendations.push({
            type: 'opportunity',
            title: `Consider Adding ${currency}`,
            description: `Similar investors hold ${allocation}% in ${currency}.`,
            action: `Allocate 5-10% to ${currency}`,
            expectedBenefit: 'Align with peer portfolios',
            priority: 'low',
            confidence: 0.6,
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Find similar users based on portfolio composition
   */
  private findSimilarUsers(userId: number, profile: UserProfile): number[] {
    const similarities: Array<{ userId: number; similarity: number }> = [];

    this.userProfiles.forEach((otherProfile, otherUserId) => {
      if (otherUserId === userId) return;

      const similarity = this.calculatePortfolioSimilarity(profile, otherProfile);
      similarities.push({ userId: otherUserId, similarity });
    });

    return similarities.sort((a, b) => b.similarity - a.similarity).map(s => s.userId);
  }

  /**
   * Calculate similarity between two portfolios
   */
  private calculatePortfolioSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const currencySet = new Set([
      ...Object.keys(profile1.portfolioComposition),
      ...Object.keys(profile2.portfolioComposition),
    ]);
    const currencies = Array.from(currencySet);

    let similarity = 0;
    currencies.forEach(currency => {
      const pct1 = profile1.portfolioComposition[currency] || 0;
      const pct2 = profile2.portfolioComposition[currency] || 0;
      similarity += 1 - Math.abs(pct1 - pct2) / 100;
    });

    return similarity / currencies.length;
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
