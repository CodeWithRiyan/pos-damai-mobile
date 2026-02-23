CREATE TABLE IF NOT EXISTS `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`point` real DEFAULT 0,
	`description` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'RETAIL',
	`code` text,
	`phone` text,
	`address` text,
	`organizationId` text,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`productId` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`inventoryBatchId` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `inventory_transactions_local_ref_id_unique` ON `inventory_transactions` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`price` real NOT NULL,
	`productId` text NOT NULL,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`barcode` text,
	`purchasePrice` real DEFAULT 0,
	`description` text,
	`isFavorite` integer DEFAULT false,
	`categoryId` text NOT NULL,
	`brandId` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`supplierId` text NOT NULL,
	`totalAmount` real NOT NULL,
	`totalPaid` real DEFAULT 0,
	`paymentType` text DEFAULT 'CASH',
	`dueDate` integer,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `purchases_local_ref_id_unique` ON `purchases` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
