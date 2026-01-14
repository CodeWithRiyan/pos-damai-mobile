CREATE TABLE `brands` (
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
CREATE TABLE `categories` (
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
CREATE TABLE `customers` (
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
CREATE UNIQUE INDEX `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
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
CREATE UNIQUE INDEX `inventory_transactions_local_ref_id_unique` ON `inventory_transactions` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE `product_prices` (
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
CREATE TABLE `products` (
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
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`supplierId` text NOT NULL,
	`totalAmount` real NOT NULL,
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
CREATE UNIQUE INDEX `purchases_local_ref_id_unique` ON `purchases` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
