CREATE TABLE `store_supplies` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`date` integer NOT NULL,
	`note` text,
	`status` text DEFAULT 'COMPLETED',
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
CREATE UNIQUE INDEX `store_supplies_local_ref_id_unique` ON `store_supplies` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE `store_supply_items` (
	`id` text PRIMARY KEY NOT NULL,
	`storeSupplyId` text NOT NULL,
	`productId` text NOT NULL,
	`quantitySystem` real NOT NULL,
	`quantityPhysical` real NOT NULL,
	`usage` real NOT NULL,
	`purchasePrice` real DEFAULT 0,
	`organizationId` text NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);