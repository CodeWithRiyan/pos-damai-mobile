CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`productId` text NOT NULL,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `retailPoint` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `categories` ADD `wholesalePoint` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `product_prices` ADD `minimumPurchase` real DEFAULT 1;--> statement-breakpoint
ALTER TABLE `product_prices` ADD `type` text DEFAULT 'RETAIL';--> statement-breakpoint
ALTER TABLE `products` ADD `isActive` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `products` ADD `type` text DEFAULT 'DEFAULT';--> statement-breakpoint
ALTER TABLE `products` ADD `unit` text;--> statement-breakpoint
ALTER TABLE `products` ADD `minimumStock` real DEFAULT 0;