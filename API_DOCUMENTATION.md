# Biometric Wallet API Documentation

## Overview

The Biometric Wallet API is a comprehensive REST/tRPC-based backend service that provides secure financial transaction management with fingerprint-based authentication. All API calls are made through tRPC procedures, which provide end-to-end type safety.

## Authentication

### WebAuthn Registration

Register a new fingerprint for biometric authentication.

**Procedure:** `auth.getRegistrationOptions`
- **Method:** Query
- **Authentication:** Required
- **Returns:** Registration options for WebAuthn

**Procedure:** `auth.registerFingerprint`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `credentialId` (string): The credential ID from WebAuthn
  - `publicKey` (string): The public key from WebAuthn
  - `transports` (string[], optional): Transport methods

### Fingerprint Management

**Procedure:** `auth.listFingerprints`
- **Method:** Query
- **Authentication:** Required
- **Returns:** List of registered fingerprints

**Procedure:** `auth.removeFingerprint`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `fingerprintId` (number): ID of fingerprint to remove

### Session Management

**Procedure:** `auth.me`
- **Method:** Query
- **Authentication:** Optional
- **Returns:** Current user information or null

**Procedure:** `auth.logout`
- **Method:** Mutation
- **Authentication:** Required
- **Returns:** Success confirmation

## Wallet Management

### Create Wallet

**Procedure:** `wallets.create`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `currencyCode` (string): Currency code (USD, EUR, BTC, ETH, etc.)
- **Returns:** Created wallet details

### List Wallets

**Procedure:** `wallets.list`
- **Method:** Query
- **Authentication:** Required
- **Returns:** Array of user's wallets with balances

### Get Wallet Details

**Procedure:** `wallets.getById`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `walletId` (number): Wallet ID
- **Returns:** Wallet details including balance and address

### Get Portfolio Value

**Procedure:** `wallets.getPortfolioValue`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `baseCurrency` (string): Base currency for valuation (default: USD)
- **Returns:** Total portfolio value in base currency

### Get Portfolio Distribution

**Procedure:** `wallets.getDistribution`
- **Method:** Query
- **Authentication:** Required
- **Returns:** Asset allocation percentages by currency

## Transaction Management

### Create Transfer

**Procedure:** `transactions.transfer`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `toUserId` (number): Recipient user ID
  - `fromWalletId` (number): Source wallet ID
  - `toWalletId` (number): Destination wallet ID
  - `amount` (string): Amount to transfer
  - `description` (string, optional): Transfer description
- **Returns:** Transfer confirmation

### List Transactions

**Procedure:** `transactions.list`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `limit` (number, default: 50): Number of transactions to return
  - `offset` (number, default: 0): Pagination offset
  - `type` (enum, optional): Filter by transaction type (transfer, deposit, withdrawal, exchange)
  - `status` (enum, optional): Filter by status (pending, completed, failed, cancelled)
- **Returns:** Array of transactions matching filters

### Get Transaction Details

**Procedure:** `transactions.getById`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `transactionId` (number): Transaction ID
- **Returns:** Detailed transaction information

### Record Deposit

**Procedure:** `transactions.recordDeposit`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `walletId` (number): Destination wallet ID
  - `amount` (string): Deposit amount
  - `blockchainTxHash` (string, optional): Blockchain transaction hash
  - `description` (string, optional): Deposit description
- **Returns:** Deposit confirmation

### Record Withdrawal

**Procedure:** `transactions.recordWithdrawal`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `walletId` (number): Source wallet ID
  - `amount` (string): Withdrawal amount
  - `blockchainTxHash` (string, optional): Blockchain transaction hash
  - `description` (string, optional): Withdrawal description
- **Returns:** Withdrawal confirmation

### Export Transactions

**Procedure:** `transactions.export`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `format` (enum): Export format (csv, json)
- **Returns:** Exported transaction data with filename

## Cryptocurrency Management

### Generate Deposit Address

**Procedure:** `crypto.generateAddress`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `cryptocurrency` (enum): Cryptocurrency type (BTC, ETH)
- **Returns:** Generated wallet address and QR code URL

### Get Deposit Address

**Procedure:** `crypto.getDepositAddress`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `cryptocurrency` (enum): Cryptocurrency type (BTC, ETH)
- **Returns:** Wallet address with QR code URL

### Initiate Withdrawal

**Procedure:** `crypto.initiateWithdrawal`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `cryptocurrency` (enum): Cryptocurrency type (BTC, ETH)
  - `amount` (string): Withdrawal amount
  - `destinationAddress` (string): Destination blockchain address
- **Returns:** Withdrawal confirmation with status

### Get Cryptocurrency Price

**Procedure:** `crypto.getPrice`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `cryptocurrency` (enum): Cryptocurrency type (BTC, ETH)
- **Returns:** Current price in USD

### Get Cryptocurrency Balance

**Procedure:** `crypto.getBalance`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `cryptocurrency` (enum): Cryptocurrency type (BTC, ETH)
- **Returns:** Current balance and wallet address

### List Cryptocurrency Wallets

**Procedure:** `crypto.listCryptoWallets`
- **Method:** Query
- **Authentication:** Required
- **Returns:** Array of cryptocurrency wallets

## Exchange Rates

### Get Exchange Rate

**Procedure:** `exchange.getRate`
- **Method:** Query
- **Authentication:** Not required
- **Input:**
  - `from` (string): Source currency code
  - `to` (string): Target currency code
- **Returns:** Exchange rate and metadata

### Convert Currency

**Procedure:** `exchange.convert`
- **Method:** Query
- **Authentication:** Not required
- **Input:**
  - `amount` (string): Amount to convert
  - `from` (string): Source currency code
  - `to` (string): Target currency code
- **Returns:** Converted amount and exchange rate

### Get Supported Currency Pairs

**Procedure:** `exchange.getSupportedPairs`
- **Method:** Query
- **Authentication:** Not required
- **Returns:** Array of supported currency pairs

### Get Exchange Rate History

**Procedure:** `exchange.getHistory`
- **Method:** Query
- **Authentication:** Not required
- **Input:**
  - `from` (string): Source currency code
  - `to` (string): Target currency code
  - `days` (number, default: 7): Number of days of history
- **Returns:** Historical exchange rates

## Notifications

### List Notifications

**Procedure:** `notifications.list`
- **Method:** Query
- **Authentication:** Required
- **Input:**
  - `limit` (number, default: 20): Number of notifications
  - `offset` (number, default: 0): Pagination offset
- **Returns:** Array of user notifications

### Send Deposit Notification

**Procedure:** `notifications.sendDepositNotification`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `amount` (string): Deposit amount
  - `currency` (string): Currency code
  - `txHash` (string, optional): Transaction hash
- **Returns:** Notification confirmation

### Send Withdrawal Notification

**Procedure:** `notifications.sendWithdrawalNotification`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `amount` (string): Withdrawal amount
  - `currency` (string): Currency code
  - `address` (string): Destination address
  - `txHash` (string, optional): Transaction hash
- **Returns:** Notification confirmation

### Send Transfer Notification

**Procedure:** `notifications.sendTransferNotification`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `amount` (string): Transfer amount
  - `currency` (string): Currency code
  - `toUser` (string): Recipient name
  - `type` (enum): Transfer type (sent, received)
- **Returns:** Notification confirmation

### Get Notification Preferences

**Procedure:** `notifications.getPreferences`
- **Method:** Query
- **Authentication:** Required
- **Returns:** User notification preferences

### Update Notification Preferences

**Procedure:** `notifications.updatePreferences`
- **Method:** Mutation
- **Authentication:** Required
- **Input:**
  - `depositNotifications` (boolean, optional)
  - `withdrawalNotifications` (boolean, optional)
  - `transferNotifications` (boolean, optional)
  - `securityAlerts` (boolean, optional)
  - `emailFrequency` (enum, optional): immediate, daily, weekly
- **Returns:** Updated preferences confirmation

## Admin Procedures

### Get System Analytics

**Procedure:** `admin.getAnalytics`
- **Method:** Query
- **Authentication:** Required (Admin only)
- **Returns:** System-wide analytics data

### Get Audit Logs

**Procedure:** `admin.getAuditLogs`
- **Method:** Query
- **Authentication:** Required (Admin only)
- **Input:**
  - `limit` (number, default: 100)
  - `offset` (number, default: 0)
- **Returns:** Array of audit log entries

### Get User Details

**Procedure:** `admin.getUserDetails`
- **Method:** Query
- **Authentication:** Required (Admin only)
- **Input:**
  - `userId` (number): User ID
- **Returns:** User details including wallet count and transaction volume

### Suspend User

**Procedure:** `admin.suspendUser`
- **Method:** Mutation
- **Authentication:** Required (Admin only)
- **Input:**
  - `userId` (number): User ID to suspend
  - `reason` (string): Suspension reason
- **Returns:** Suspension confirmation

### Activate User

**Procedure:** `admin.activateUser`
- **Method:** Mutation
- **Authentication:** Required (Admin only)
- **Input:**
  - `userId` (number): User ID to activate
- **Returns:** Activation confirmation

### Deposit Cryptocurrency (Admin)

**Procedure:** `admin.depositCrypto`
- **Method:** Mutation
- **Authentication:** Required (Admin only)
- **Input:**
  - `userId` (number): User ID
  - `walletId` (number): Wallet ID
  - `amount` (string): Deposit amount
  - `txHash` (string, optional): Transaction hash
- **Returns:** Deposit confirmation

### Get System Health

**Procedure:** `admin.getSystemHealth`
- **Method:** Query
- **Authentication:** Required (Admin only)
- **Returns:** System health status

## Error Handling

All API responses follow a standard format:

```typescript
{
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}
```

### Common Error Codes

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input parameters
- `INTERNAL_SERVER_ERROR`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Standard users: 100 requests per minute
- Premium users: 1000 requests per minute
- Admin users: Unlimited

## Security Considerations

1. **Fingerprint Authentication**: All sensitive operations require fingerprint verification
2. **Encryption**: All data is encrypted in transit (TLS) and at rest (AES-256)
3. **Audit Logging**: All admin actions are logged for compliance
4. **Input Validation**: All inputs are validated and sanitized
5. **CSRF Protection**: All mutations include CSRF tokens

## Webhooks

Webhooks can be configured to receive real-time notifications for:
- Transaction completions
- Cryptocurrency deposits
- Security alerts
- System events

Contact support to configure webhooks for your account.

## Versioning

The API follows semantic versioning. Current version: v1.0.0

Breaking changes will be announced with a 30-day deprecation notice.

## Support

For API support, contact: api-support@biometricwallet.com

Documentation updates: https://docs.biometricwallet.com
