CREATE TABLE `stock_opnames` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`date` integer NOT NULL,
	`note` text,
	`status` text DEFAULT 'DIFFERENCE',
	`totalGain` real DEFAULT 0,
	`totalLoss` real DEFAULT 0,
	`createdBy` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_opnames_local_ref_id_unique` ON `stock_opnames` (`local_ref_id`);
--> statement-breakpoint
CREATE TABLE `stock_opname_items` (
	`id` text PRIMARY KEY NOT NULL,
	`stockOpnameId` text NOT NULL,
	`productId` text NOT NULL,
	`quantitySystem` real NOT NULL,
	`quantityPhysical` real NOT NULL,
	`difference` real NOT NULL,
	`purchasePrice` real DEFAULT 0,
	`financialImpact` real DEFAULT 0,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
