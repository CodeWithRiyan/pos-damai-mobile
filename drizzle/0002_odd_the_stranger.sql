CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nominal` real NOT NULL,
	`type` text DEFAULT 'FLAT',
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
ALTER TABLE `products` ADD `discountId` text;