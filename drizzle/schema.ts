import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Wallets table - stores individual currency wallets for each user
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currencyCode: varchar("currencyCode", { length: 10 }).notNull(), // e.g., 'USD', 'BTC', 'ETH'
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0").notNull(),
  address: varchar("address", { length: 255 }), // for crypto wallets
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

// Transactions table - records all financial transactions
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId"),
  toUserId: int("toUserId"),
  fromWalletId: int("fromWalletId").notNull(),
  toWalletId: int("toWalletId"),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }).default("0"),
  transactionType: mysqlEnum("transactionType", ["transfer", "deposit", "withdrawal", "exchange"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  blockchainTxHash: varchar("blockchainTxHash", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Fingerprints table - stores WebAuthn credential data
export const fingerprints = mysqlTable("fingerprints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  credentialId: varchar("credentialId", { length: 255 }).notNull().unique(),
  publicKey: text("publicKey").notNull(), // encrypted
  counter: int("counter").default(0).notNull(),
  transports: json("transports"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed"),
});

export type Fingerprint = typeof fingerprints.$inferSelect;
export type InsertFingerprint = typeof fingerprints.$inferInsert;

// Exchange rates table - caches real-time currency exchange rates
export const exchangeRates = mysqlTable("exchangeRates", {
  id: int("id").autoincrement().primaryKey(),
  fromCurrency: varchar("fromCurrency", { length: 10 }).notNull(),
  toCurrency: varchar("toCurrency", { length: 10 }).notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  source: varchar("source", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

// Notifications table - tracks notification history
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "transfer", "security", "system"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Audit logs table - records administrative actions
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetUserId: int("targetUserId"),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  sentTransactions: many(transactions, { relationName: "fromUser" }),
  receivedTransactions: many(transactions, { relationName: "toUser" }),
  fingerprints: many(fingerprints),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  sentTransactions: many(transactions, { relationName: "fromWallet" }),
  receivedTransactions: many(transactions, { relationName: "toWallet" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  fromUser: one(users, { fields: [transactions.fromUserId], references: [users.id], relationName: "fromUser" }),
  toUser: one(users, { fields: [transactions.toUserId], references: [users.id], relationName: "toUser" }),
  fromWallet: one(wallets, { fields: [transactions.fromWalletId], references: [wallets.id], relationName: "fromWallet" }),
  toWallet: one(wallets, { fields: [transactions.toWalletId], references: [wallets.id], relationName: "toWallet" }),
}));

export const fingerprintsRelations = relations(fingerprints, ({ one }) => ({
  user: one(users, { fields: [fingerprints.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, { fields: [auditLogs.adminId], references: [users.id] }),
  targetUser: one(users, { fields: [auditLogs.targetUserId], references: [users.id] }),
}));
