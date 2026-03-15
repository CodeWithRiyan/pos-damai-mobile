ALTER TABLE `transactions` ADD `totalDiscount` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transactions` ADD `totalProfit` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `discountAmount` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `purchasePrice` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `profit` real DEFAULT 0;
