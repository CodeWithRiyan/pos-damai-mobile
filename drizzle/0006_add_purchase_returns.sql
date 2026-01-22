CREATE TABLE IF NOT EXISTS `purchase_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`supplierId` text NOT NULL,
	`totalAmount` real NOT NULL,
	`returnType` text DEFAULT 'CASH',
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `purchase_returns_local_ref_id_unique` ON `purchase_returns` (`local_ref_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `purchase_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchaseReturnId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` real NOT NULL,
	`purchasePrice` real DEFAULT 0,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
