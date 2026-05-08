ALTER TABLE `notification_channels` ADD `discord_embed_enabled` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_title` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_description` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_color` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_author_name` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_author_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_author_icon_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_thumbnail_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_image_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_footer_text` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_footer_icon_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_embed_timestamp` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_allow_user_mentions` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_allow_role_mentions` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_allow_everyone_mentions` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_suppress_embeds` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_suppress_notifications` integer;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_thread_name` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_applied_tags` text;
