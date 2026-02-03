CREATE TABLE `cash_drawers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isActive` integer DEFAULT true,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`cashDrawerId` text NOT NULL,
	`userId` text NOT NULL,
	`startTime` integer NOT NULL,
	`endTime` integer,
	`initialBalance` real NOT NULL,
	`finalBalance` real,
	`expectedBalance` real,
	`difference` real,
	`status` text DEFAULT 'ACTIVE',
	`note` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shifts_local_ref_id_unique` ON `shifts` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` real NOT NULL,
	`sellPrice` real NOT NULL,
	`note` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`customerId` text,
	`totalAmount` real NOT NULL,
	`totalPaid` real NOT NULL,
	`paymentTypeId` text NOT NULL,
	`transactionDate` integer NOT NULL,
	`status` text DEFAULT 'COMPLETED',
	`note` text,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_local_ref_id_unique` ON `transactions` (`local_ref_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`username` text NOT NULL,
	`organizationId` text,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
