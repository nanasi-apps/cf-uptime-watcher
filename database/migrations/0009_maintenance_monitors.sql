CREATE TABLE `maintenance_monitors` (
	`maintenance_id` integer NOT NULL,
	`monitor_id` integer NOT NULL,
	PRIMARY KEY(`maintenance_id`, `monitor_id`),
	FOREIGN KEY (`maintenance_id`) REFERENCES `maintenance_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
