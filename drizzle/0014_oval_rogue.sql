CREATE TABLE `transaction_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionReturnId` text NOT NULL,
	`productId` text NOT NULL,
	`variantId` text,
	`quantity` real NOT NULL,
	`sellPrice` real DEFAULT 0,
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
CREATE TABLE `transaction_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`customerId` text,
	`totalAmount` real NOT NULL,
	`returnType` text DEFAULT 'CASH',
	`note` text NOT NULL,
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
CREATE UNIQUE INDEX `transaction_returns_local_ref_id_unique` ON `transaction_returns` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `inventory_transactions` ADD `note` text;--> statement-breakpoint
ALTER TABLE `purchases` ADD `note` text;