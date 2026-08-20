CREATE TABLE `data_overrides` (
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`data` text,
	`deleted` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_by` text NOT NULL,
	PRIMARY KEY(`entity_type`, `entity_id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`server` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
