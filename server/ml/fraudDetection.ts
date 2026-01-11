import * as tf from '@tensorflow/tfjs';
import { Transaction, Wallet } from '../../drizzle/schema';

/**
 * Fraud Detection System using TensorFlow.js
 * Analyzes transaction patterns and user behavior to detect suspicious activity
 */

interface FraudAnalysisInput {
  amount: number;
  userAverageTransaction: number;
  timeSinceLastTransaction: number;
  transactionFrequency: number;
  isNewDevice: boolean;
  isNewLocation: boolean;
  isWeekend: boolean;
  isNightTime: boolean;
  walletAge: number;
  userAccountAge: number;
}

interface FraudScore {
  score: number; // 0-1, where 1 is highest fraud probability
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

class FraudDetectionModel {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  /**
   * Initialize the fraud detection model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create a neural network for fraud detection
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [10],
            units: 64,
            activation: 'relu',
            name: 'input_layer',
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            name: 'hidden_layer_1',
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            name: 'hidden_layer_2',
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
            name: 'output_layer',
          }),
        ],
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      this.isInitialized = true;
      console.log('[Fraud Detection] Model initialized successfully');
    } catch (error) {
      console.error('[Fraud Detection] Failed to initialize model:', error);
      throw error;
    }
  }

  /**
   * Analyze a transaction for fraud risk
   */
  async analyzeTransaction(input: FraudAnalysisInput): Promise<FraudScore> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Normalize inputs
      const normalizedInput = this.normalizeInput(input);

      // Create tensor
      const inputTensor = tf.tensor2d([normalizedInput], [1, 10]);

      // Get prediction
      const prediction = this.model!.predict(inputTensor) as tf.Tensor;
      const fraudScore = (await prediction.data())[0];

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Determine risk level
      const riskLevel = this.getRiskLevel(fraudScore);
      const factors = this.identifyRiskFactors(input, fraudScore);
      const recommendation = this.getRecommendation(riskLevel, factors);

      return {
        score: fraudScore,
        riskLevel,
        factors,
        recommendation,
      };
    } catch (error) {
      console.error('[Fraud Detection] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Normalize input values for the neural network
   */
  private normalizeInput(input: FraudAnalysisInput): number[] {
    return [
      Math.min(input.amount / 10000, 1), // Normalize amount (max $10k)
      Math.min(input.userAverageTransaction / 5000, 1), // Normalize average
      Math.min(input.timeSinceLastTransaction / 86400, 1), // Normalize time (max 1 day)
      Math.min(input.transactionFrequency / 100, 1), // Normalize frequency
      input.isNewDevice ? 1 : 0,
      input.isNewLocation ? 1 : 0,
      input.isWeekend ? 1 : 0,
      input.isNightTime ? 1 : 0,
      Math.min(input.walletAge / 31536000, 1), // Normalize age (max 1 year)
      Math.min(input.userAccountAge / 31536000, 1), // Normalize account age
    ];
  }

  /**
   * Determine risk level based on fraud score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Identify specific risk factors
   */
  private identifyRiskFactors(input: FraudAnalysisInput, score: number): string[] {
    const factors: string[] = [];

    if (input.amount > input.userAverageTransaction * 5) {
      factors.push('Unusually large transaction amount');
    }

    if (input.timeSinceLastTransaction < 300) {
      factors.push('Rapid consecutive transactions');
    }

    if (input.isNewDevice) {
      factors.push('Transaction from new device');
    }

    if (input.isNewLocation) {
      factors.push('Transaction from new location');
    }

    if (input.isNightTime && input.isNewDevice) {
      factors.push('Suspicious timing and device');
    }

    if (input.walletAge < 86400) {
      factors.push('Very new wallet');
    }

    if (input.transactionFrequency > 50) {
      factors.push('Unusually high transaction frequency');
    }

    if (score >= 0.7 && factors.length === 0) {
      factors.push('Pattern matches known fraud signature');
    }

    return factors;
  }

  /**
   * Get recommendation based on risk level
   */
  private getRecommendation(
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    factors: string[]
  ): string {
    switch (riskLevel) {
      case 'critical':
        return 'Block transaction and verify user identity immediately';
      case 'high':
        return 'Require additional verification (fingerprint + 2FA)';
      case 'medium':
        return 'Require fingerprint verification before proceeding';
      case 'low':
        return 'Transaction approved - standard processing';
    }
  }

  /**
   * Train model on historical transaction data
   */
  async trainOnHistoricalData(
    trainingData: FraudAnalysisInput[],
    labels: number[]
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const normalizedData = trainingData.map(d => this.normalizeInput(d));

      const xs = tf.tensor2d(normalizedData, [normalizedData.length, 10]);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      await this.model!.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
      });

      xs.dispose();
      ys.dispose();

      console.log('[Fraud Detection] Model trained successfully');
    } catch (error) {
      console.error('[Fraud Detection] Training failed:', error);
      throw error;
    }
  }

  /**
   * Save model to storage
   */
  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      await this.model.save(`file://${path}`);
      console.log('[Fraud Detection] Model saved to', path);
    } catch (error) {
      console.error('[Fraud Detection] Failed to save model:', error);
      throw error;
    }
  }

  /**
   * Load model from storage
   */
  async loadModel(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      this.isInitialized = true;
      console.log('[Fraud Detection] Model loaded from', path);
    } catch (error) {
      console.error('[Fraud Detection] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const fraudDetectionModel = new FraudDetectionModel();

/**
 * Helper function to create fraud analysis input from transaction data
 */
export async function createFraudAnalysisInput(
  transaction: any,
  userHistory: any[],
  wallet: any
): Promise<FraudAnalysisInput> {
  const now = Date.now();
  const lastTransaction = userHistory[0];
  const timeSinceLastTransaction = lastTransaction
    ? (now - lastTransaction.createdAt.getTime()) / 1000
    : 86400;

  const userAverageTransaction =
    userHistory.length > 0
      ? userHistory.reduce((sum, t) => sum + parseFloat(t.amount), 0) / userHistory.length
      : 0;

  const transactionFrequency = userHistory.filter(
    t => (now - t.createdAt.getTime()) / 1000 < 3600
  ).length;

  const walletAge = wallet ? (now - wallet.createdAt.getTime()) / 1000 : 0;
  const userAccountAge = wallet?.user ? (now - wallet.user.createdAt.getTime()) / 1000 : 0;

  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 22 || currentHour <= 6;
  const isWeekend = [0, 6].includes(new Date().getDay());

  return {
    amount: parseFloat(transaction.amount),
    userAverageTransaction,
    timeSinceLastTransaction,
    transactionFrequency,
    isNewDevice: false, // Would be set from device tracking
    isNewLocation: false, // Would be set from geolocation
    isWeekend,
    isNightTime,
    walletAge,
    userAccountAge,
  };
}
