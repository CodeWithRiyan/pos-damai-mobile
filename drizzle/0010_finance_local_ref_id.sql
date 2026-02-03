CREATE TABLE `finances` (
	`id` text PRIMARY KEY NOT NULL,
	`local_ref_id` text,
	`nominal` real NOT NULL,
	`type` text NOT NULL,
	`expensesType` text,
	`transactionDate` integer NOT NULL,
	`status` text DEFAULT 'COMPLETED',
	`note` text,
	`inputToCashdrawer` integer DEFAULT false,
	`organizationId` text NOT NULL,
	`_dirty` integer DEFAULT false,
	`_syncedAt` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finances_local_ref_id_unique` ON `finances` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `cash_drawers` ADD `local_ref_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `cash_drawers_local_ref_id_unique` ON `cash_drawers` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `payable_realizations` ADD `local_ref_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payable_realizations_local_ref_id_unique` ON `payable_realizations` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `payables` ADD `local_ref_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payables_local_ref_id_unique` ON `payables` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `receivable_realizations` ADD `local_ref_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `receivable_realizations_local_ref_id_unique` ON `receivable_realizations` (`local_ref_id`);--> statement-breakpoint
ALTER TABLE `receivables` ADD `local_ref_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `receivables_local_ref_id_unique` ON `receivables` (`local_ref_id`);