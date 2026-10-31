CREATE TABLE `studio_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`service` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer NOT NULL,
	`amount` integer,
	`status` text DEFAULT 'requested' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bookings_owner` ON `studio_bookings` (`owner_id`);--> statement-breakpoint
CREATE INDEX `bookings_date` ON `studio_bookings` (`date`);--> statement-breakpoint
CREATE TABLE `studio_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'Invité' NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `studio_bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_unique` ON `studio_participants` (`booking_id`,`email`);--> statement-breakpoint
CREATE INDEX `participants_email` ON `studio_participants` (`email`);--> statement-breakpoint
CREATE TABLE `studio_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_slots` (
	`key` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `studio_bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
