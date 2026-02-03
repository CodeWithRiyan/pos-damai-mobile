CREATE TABLE IF NOT EXISTS `payable_realizations` (
	`id` text PRIMARY KEY NOT NULL,
	`payableId` text NOT NULL,
	`nominal` real NOT NULL,
	`realizationDate` integer NOT NULL,
	`paymentMethodId` text NOT NULL,
	`note` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payables` (
	`id` text PRIMARY KEY NOT NULL,
	`nominal` real NOT NULL,
	`dueDate` integer,
	`note` text,
	`supplierId` text NOT NULL,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`commission` real DEFAULT 0,
	`minimalAmount` real DEFAULT 0,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
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
--> statement-breakpoint
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
CREATE UNIQUE INDEX IF NOT EXISTS `purchase_returns_local_ref_id_unique` ON `purchase_returns` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `receivable_realizations` (
	`id` text PRIMARY KEY NOT NULL,
	`receivableId` text NOT NULL,
	`nominal` real NOT NULL,
	`realizationDate` integer NOT NULL,
	`paymentMethodId` text NOT NULL,
	`note` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `receivables` (
	`id` text PRIMARY KEY NOT NULL,
	`nominal` real NOT NULL,
	`dueDate` integer,
	`note` text,
	`userId` text NOT NULL,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stock_opname_items` (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stock_opnames` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `stock_opnames_local_ref_id_unique` ON `stock_opnames` (`local_ref_id`);