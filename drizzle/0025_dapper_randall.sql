CREATE TABLE `purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchaseId` text NOT NULL,
	`productId` text NOT NULL,
	`variantId` text,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	`organizationId` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
ALTER TABLE `payables` ADD `supplierName` text;--> statement-breakpoint
ALTER TABLE `payables` ADD `status` text DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `purchase_returns` ADD `supplierName` text;--> statement-breakpoint
ALTER TABLE `purchase_returns` ADD `status` text DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `purchases` ADD `supplierName` text;--> statement-breakpoint
ALTER TABLE `purchases` ADD `paymentTypeName` text;--> statement-breakpoint
ALTER TABLE `receivables` ADD `customerId` text;--> statement-breakpoint
ALTER TABLE `receivables` ADD `customerName` text;--> statement-breakpoint
ALTER TABLE `receivables` ADD `status` text DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `transaction_return_items` ADD `profit` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transaction_returns` ADD `customerName` text;--> statement-breakpoint
ALTER TABLE `transaction_returns` ADD `status` text DEFAULT 'PENDING';