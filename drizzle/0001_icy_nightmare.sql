CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetUserId` int,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchangeRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromCurrency` varchar(10) NOT NULL,
	`toCurrency` varchar(10) NOT NULL,
	`rate` decimal(18,8) NOT NULL,
	`source` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchangeRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fingerprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credentialId` varchar(255) NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp,
	CONSTRAINT `fingerprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `fingerprints_credentialId_unique` UNIQUE(`credentialId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','transfer','security','system') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int,
	`toUserId` int,
	`fromWalletId` int NOT NULL,
	`toWalletId` int,
	`amount` decimal(18,8) NOT NULL,
	`fee` decimal(18,8) DEFAULT '0',
	`transactionType` enum('transfer','deposit','withdrawal','exchange') NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`blockchainTxHash` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currencyCode` varchar(10) NOT NULL,
	`balance` decimal(18,8) NOT NULL DEFAULT '0',
	`address` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
