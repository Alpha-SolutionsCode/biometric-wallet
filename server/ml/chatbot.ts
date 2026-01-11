import * as natural from 'natural';

/**
 * Intelligent Support Chatbot
 * Handles customer inquiries with NLP and pattern matching
 */

interface ChatMessage {
  id: string;
  userId: number;
  message: string;
  timestamp: Date;
  isBot: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ConversationContext {
  userId: number;
  messages: ChatMessage[];
  topic?: string;
  resolved: boolean;
  escalatedToHuman: boolean;
}

interface BotResponse {
  message: string;
  confidence: number; // 0-1
  requiresHuman: boolean;
  suggestedActions?: string[];
}

class SupportChatbot {
  private tokenizer: natural.WordTokenizer;
  private classifier: natural.BayesClassifier;
  private faqDatabase: Map<string, string>;
  private conversations: Map<number, ConversationContext>;
  private intentPatterns: Map<string, RegExp[]>;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.classifier = new natural.BayesClassifier();
    this.faqDatabase = new Map();
    this.conversations = new Map();
    this.intentPatterns = new Map();
    this.initializeFAQ();
    this.initializeIntentPatterns();
    this.trainClassifier();
  }

  /**
   * Initialize FAQ database
   */
  private initializeFAQ(): void {
    const faqs = {
      'how_to_register':
        'To register, visit our website and click Sign Up. You\'ll need a valid email and a device with biometric capability.',
      'how_to_add_fingerprint':
        'Go to Settings > Security > Add Fingerprint. Follow the on-screen prompts to register your fingerprint.',
      'how_to_send_money':
        'Go to Wallets or Dashboard, click Send Money, enter recipient details, amount, and verify with your fingerprint.',
      'how_to_receive_money':
        'Share your username with the sender. They can initiate a transfer to your account from their Wallets page.',
      'how_to_deposit_crypto':
        'Go to your cryptocurrency wallet, click Receive, and share your wallet address or QR code with the sender.',
      'how_to_withdraw_crypto':
        'Go to your cryptocurrency wallet, click Send/Withdraw, enter destination address and amount, then verify with fingerprint.',
      'transaction_fee':
        'Standard transfers between users are free. Cryptocurrency withdrawals may have network fees displayed before confirmation.',
      'security_features':
        'Our security includes fingerprint authentication, AES-256 encryption, JWT sessions, and real-time fraud detection.',
      'forgot_fingerprint':
        'Click "Forgot Fingerprint?" on the login page, verify your email, and follow the recovery instructions to set up a new fingerprint.',
      'account_locked':
        'Your account is locked after multiple failed attempts for security. Wait 15 minutes and try again, or use account recovery.',
      'two_factor_auth':
        'Go to Settings > Security > Enable 2FA. Scan the QR code with an authenticator app and enter the verification code.',
      'export_transactions':
        'Go to Transactions, click Export, choose CSV or JSON format, and the file will download automatically.',
      'notification_settings':
        'Go to Settings > Notifications to choose which notifications to receive and set your preferred frequency.',
      'delete_account':
        'Go to Settings > Account. Click Delete Account and follow the verification steps. This action is permanent.',
      'contact_support':
        'Email us at support@biometricwallet.com or use the live chat on our website. We respond within 24 hours.',
    };

    for (const [key, value] of Object.entries(faqs)) {
      this.faqDatabase.set(key, value);
    }
  }

  /**
   * Initialize intent patterns for keyword matching
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns.set('greeting', [/^(hello|hi|hey|greetings)/i]);

    this.intentPatterns.set('help', [/^(help|support|assist|issue|problem)/i]);

    this.intentPatterns.set('register', [
      /register|sign up|create account|new account/i,
      /how do i join/i,
    ]);

    this.intentPatterns.set('fingerprint', [
      /fingerprint|biometric|authentication|login/i,
      /add finger|register finger/i,
    ]);

    this.intentPatterns.set('send_money', [
      /send money|transfer|send funds|pay/i,
      /how to send|sending money/i,
    ]);

    this.intentPatterns.set('receive_money', [
      /receive|incoming|getting paid|deposit/i,
      /how to receive/i,
    ]);

    this.intentPatterns.set('crypto', [
      /bitcoin|ethereum|btc|eth|cryptocurrency|crypto/i,
      /deposit crypto|withdraw crypto/i,
    ]);

    this.intentPatterns.set('transaction', [
      /transaction|transfer|payment/i,
      /history|export|record/i,
    ]);

    this.intentPatterns.set('security', [
      /security|safe|protection|fraud/i,
      /2fa|two factor|password/i,
    ]);

    this.intentPatterns.set('account', [
      /account|profile|settings|preferences/i,
      /delete|close|suspend/i,
    ]);

    this.intentPatterns.set('fee', [/fee|charge|cost|price/i]);

    this.intentPatterns.set('error', [
      /error|bug|broken|not working|issue/i,
      /failed|crash|problem/i,
    ]);
  }

  /**
   * Train the classifier with sample data
   */
  private trainClassifier(): void {
    const trainingData = [
      { text: 'How do I register?', intent: 'register' },
      { text: 'How to create an account?', intent: 'register' },
      { text: 'I want to sign up', intent: 'register' },
      { text: 'How do I add my fingerprint?', intent: 'fingerprint' },
      { text: 'Register fingerprint', intent: 'fingerprint' },
      { text: 'How to send money?', intent: 'send_money' },
      { text: 'I want to transfer funds', intent: 'send_money' },
      { text: 'How do I receive money?', intent: 'receive_money' },
      { text: 'Bitcoin deposit', intent: 'crypto' },
      { text: 'Ethereum withdrawal', intent: 'crypto' },
      { text: 'Is it secure?', intent: 'security' },
      { text: 'What are the fees?', intent: 'fee' },
      { text: 'Something is broken', intent: 'error' },
      { text: 'Hello there', intent: 'greeting' },
      { text: 'Hi, I need help', intent: 'help' },
    ];

    trainingData.forEach(({ text, intent }) => {
      this.classifier.addDocument(text.toLowerCase(), intent);
    });

    this.classifier.train();
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userId: number, userMessage: string): Promise<BotResponse> {
    // Get or create conversation context
    let context = this.conversations.get(userId);
    if (!context) {
      context = {
        userId,
        messages: [],
        resolved: false,
        escalatedToHuman: false,
      };
      this.conversations.set(userId, context);
    }

    // Add user message to context
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      message: userMessage,
      timestamp: new Date(),
      isBot: false,
      sentiment: this.analyzeSentiment(userMessage),
    };
    context.messages.push(userMsg);

    // Detect intent
    const intent = this.detectIntent(userMessage);

    // Check for escalation triggers
    if (this.shouldEscalate(userMessage, context)) {
      context.escalatedToHuman = true;
      return {
        message:
          'I understand this is important. Let me connect you with a human agent who can better assist you.',
        confidence: 1,
        requiresHuman: true,
      };
    }

    // Generate response based on intent
    let response = await this.generateResponse(intent, userMessage, context);

    // Add bot response to context
    const botMsg: ChatMessage = {
      id: `msg_${Date.now()}_bot`,
      userId,
      message: response.message,
      timestamp: new Date(),
      isBot: true,
    };
    context.messages.push(botMsg);

    return response;
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    // First try pattern matching
    let detectedIntent = 'help';
    this.intentPatterns.forEach((patterns, intent) => {
      patterns.forEach(pattern => {
        if (pattern.test(message)) {
          detectedIntent = intent;
        }
      });
    });
    if (detectedIntent !== 'help') return detectedIntent;

    // Fall back to classifier
    try {
      return this.classifier.classify(message.toLowerCase());
    } catch {
      return 'help';
    }
  }

  /**
   * Analyze sentiment of message
   */
  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'good', 'excellent', 'thanks', 'thank you', 'happy', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'problem'];

    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerMessage.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerMessage.includes(w)).length;

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Check if conversation should be escalated to human
   */
  private shouldEscalate(message: string, context: ConversationContext): boolean {
    // Escalate if user is frustrated
    if (this.analyzeSentiment(message) === 'negative' && context.messages.length > 3) {
      return true;
    }

    // Escalate if multiple failed attempts
    if (context.messages.filter(m => !m.isBot).length > 5) {
      return true;
    }

    // Escalate for specific keywords
    const escalationKeywords = ['human', 'agent', 'representative', 'manager', 'supervisor'];
    if (escalationKeywords.some(kw => message.toLowerCase().includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(
    intent: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<BotResponse> {
    const faqKey = this.mapIntentToFAQ(intent);
    const faqAnswer = this.faqDatabase.get(faqKey);

    if (faqAnswer) {
      return {
        message: faqAnswer,
        confidence: 0.85,
        requiresHuman: false,
        suggestedActions: this.getSuggestedActions(intent),
      };
    }

    // Fallback response
    return {
      message:
        "I'm not sure how to help with that. Could you provide more details? Or I can connect you with a human agent.",
      confidence: 0.3,
      requiresHuman: false,
      suggestedActions: ['Connect with support team', 'View FAQ', 'Check documentation'],
    };
  }

  /**
   * Map intent to FAQ key
   */
  private mapIntentToFAQ(intent: string): string {
    const mapping: Record<string, string> = {
      greeting: 'how_to_register',
      help: 'contact_support',
      register: 'how_to_register',
      fingerprint: 'how_to_add_fingerprint',
      send_money: 'how_to_send_money',
      receive_money: 'how_to_receive_money',
      crypto: 'how_to_deposit_crypto',
      transaction: 'export_transactions',
      security: 'security_features',
      account: 'delete_account',
      fee: 'transaction_fee',
      error: 'contact_support',
    };

    return mapping[intent] || 'contact_support';
  }

  /**
   * Get suggested actions for intent
   */
  private getSuggestedActions(intent: string): string[] {
    const actions: Record<string, string[]> = {
      register: ['View registration guide', 'Contact support'],
      fingerprint: ['View fingerprint setup', 'Troubleshoot biometric'],
      send_money: ['View transfer guide', 'Check transaction limits'],
      receive_money: ['View receiving guide', 'Share wallet address'],
      crypto: ['View crypto guide', 'Check deposit address'],
      transaction: ['Download transactions', 'View transaction details'],
      security: ['Enable 2FA', 'Review security settings'],
      account: ['View account settings', 'Contact support'],
    };

    return actions[intent] || ['View FAQ', 'Contact support'];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(userId: number): ChatMessage[] {
    const context = this.conversations.get(userId);
    return context?.messages || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(userId: number): void {
    this.conversations.delete(userId);
  }

  /**
   * Get conversation status
   */
  getConversationStatus(userId: number): {
    isResolved: boolean;
    escalatedToHuman: boolean;
    messageCount: number;
  } {
    const context = this.conversations.get(userId);
    return {
      isResolved: context?.resolved || false,
      escalatedToHuman: context?.escalatedToHuman || false,
      messageCount: context?.messages.length || 0,
    };
  }
}

// Export singleton instance
export const supportChatbot = new SupportChatbot();
