CREATE TABLE `incident_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`resolved_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maintenance_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `check_results` ADD `status` text DEFAULT 'up' NOT NULL;
--> statement-breakpoint
UPDATE `check_results` SET `status` = 'down' WHERE `is_up` = 0;
