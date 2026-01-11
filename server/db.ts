import { eq, or, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, wallets, transactions, fingerprints, exchangeRates, notifications, auditLogs, InsertWallet, InsertTransaction, InsertFingerprint, InsertNotification, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Wallet queries
export async function createWallet(userId: number, currencyCode: string, address?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(wallets).values({
    userId,
    currencyCode,
    address,
    balance: "0",
    isActive: true,
  });
  
  return result;
}

export async function getUserWallets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(wallets).where(eq(wallets.userId, userId));
}

export async function getWalletById(walletId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWalletBalance(walletId: number, newBalance: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, walletId));
}

// Transaction queries
export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(data);
  return result;
}

export async function getUserTransactions(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(transactions)
    .where(
      or(
        eq(transactions.fromUserId, userId),
        eq(transactions.toUserId, userId)
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
}

// Fingerprint queries
export async function createFingerprint(data: InsertFingerprint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(fingerprints).values(data);
}

export async function getUserFingerprints(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(fingerprints).where(eq(fingerprints.userId, userId));
}

export async function getFingerprintByCredentialId(credentialId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(fingerprints).where(eq(fingerprints.credentialId, credentialId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Exchange rate queries
export async function getExchangeRate(fromCurrency: string, toCurrency: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertExchangeRate(fromCurrency: string, toCurrency: string, rate: string, source: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getExchangeRate(fromCurrency, toCurrency);
  
  if (existing) {
    return db.update(exchangeRates)
      .set({ rate, source, updatedAt: new Date() })
      .where(
        and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency)
        )
      );
  } else {
    return db.insert(exchangeRates).values({
      fromCurrency,
      toCurrency,
      rate,
      source,
    });
  }
}

// Notification queries
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Audit log queries
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}
