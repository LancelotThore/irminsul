CREATE TABLE `artifact_sets` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `character_material_slots` (
	`character_id` text NOT NULL,
	`slot` text NOT NULL,
	`material_id` integer NOT NULL,
	`source` text DEFAULT 'ambr' NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_by` text,
	PRIMARY KEY(`character_id`, `slot`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`rank` integer NOT NULL,
	`name` text NOT NULL,
	`element` text NOT NULL,
	`weapon_type` text NOT NULL,
	`region` text,
	`icon` text NOT NULL,
	`source` text DEFAULT 'ambr' NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `gazette_builds` (
	`character_key` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`page_url` text NOT NULL,
	`source` text DEFAULT 'gazette' NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`rank` integer,
	`icon` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`server` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weapons` (
	`id` integer PRIMARY KEY NOT NULL,
	`rank` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL
);
