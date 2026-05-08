ALTER TABLE `notification_channels` ADD `down_template` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `up_template` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_content` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_username` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_avatar_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_tts` integer;
