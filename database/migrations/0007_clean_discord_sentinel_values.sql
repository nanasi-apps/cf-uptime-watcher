ALTER TABLE `notification_channels` ADD `discord_content` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_username` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_avatar_url` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `discord_tts` integer;
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_content` = NULL WHERE `discord_content` = 'discord_content';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_username` = NULL WHERE `discord_username` = 'discord_username';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_avatar_url` = NULL WHERE `discord_avatar_url` = 'discord_avatar_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_title` = NULL WHERE `discord_embed_title` = 'discord_embed_title';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_description` = NULL WHERE `discord_embed_description` = 'discord_embed_description';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_url` = NULL WHERE `discord_embed_url` = 'discord_embed_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_color` = NULL WHERE `discord_embed_color` = 'discord_embed_color';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_author_name` = NULL WHERE `discord_embed_author_name` = 'discord_embed_author_name';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_author_url` = NULL WHERE `discord_embed_author_url` = 'discord_embed_author_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_author_icon_url` = NULL WHERE `discord_embed_author_icon_url` = 'discord_embed_author_icon_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_thumbnail_url` = NULL WHERE `discord_embed_thumbnail_url` = 'discord_embed_thumbnail_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_image_url` = NULL WHERE `discord_embed_image_url` = 'discord_embed_image_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_footer_text` = NULL WHERE `discord_embed_footer_text` = 'discord_embed_footer_text';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_embed_footer_icon_url` = NULL WHERE `discord_embed_footer_icon_url` = 'discord_embed_footer_icon_url';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_thread_name` = NULL WHERE `discord_thread_name` = 'discord_thread_name';
--> statement-breakpoint
UPDATE `notification_channels` SET `discord_applied_tags` = NULL WHERE `discord_applied_tags` = 'discord_applied_tags';
