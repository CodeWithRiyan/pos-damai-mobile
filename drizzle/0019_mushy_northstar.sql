ALTER TABLE `customers` ADD `totalTransactions` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customers` ADD `totalRevenue` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customers` ADD `totalProfit` real DEFAULT 0;