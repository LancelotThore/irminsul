DROP TABLE `character_material_slots`;
--> statement-breakpoint
DROP TABLE `materials`;
--> statement-breakpoint
CREATE TABLE `materials_guides` (
	`character_key` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`page_url` text NOT NULL,
	`source` text DEFAULT 'sephijin' NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_by` text
);
