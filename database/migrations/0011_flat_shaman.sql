PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notification_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`webhook_url` text,
	`slack_bot_token` text,
	`slack_channel` text,
	`telegram_bot_token` text,
	`telegram_chat_id` text,
	`twilio_account_sid` text,
	`twilio_auth_token` text,
	`twilio_from` text,
	`twilio_to` text,
	`template` text,
	`down_template` text,
	`up_template` text,
	`discord_content` text,
	`discord_username` text,
	`discord_avatar_url` text,
	`discord_tts` integer,
	`discord_embed_enabled` integer,
	`discord_embed_title` text,
	`discord_embed_description` text,
	`discord_embed_url` text,
	`discord_embed_color` text,
	`discord_embed_author_name` text,
	`discord_embed_author_url` text,
	`discord_embed_author_icon_url` text,
	`discord_embed_thumbnail_url` text,
	`discord_embed_image_url` text,
	`discord_embed_footer_text` text,
	`discord_embed_footer_icon_url` text,
	`discord_embed_timestamp` integer,
	`discord_allow_user_mentions` integer,
	`discord_allow_role_mentions` integer,
	`discord_allow_everyone_mentions` integer,
	`discord_suppress_embeds` integer,
	`discord_suppress_notifications` integer,
	`discord_thread_name` text,
	`discord_applied_tags` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_notification_channels`("id", "type", "name", "webhook_url", "slack_bot_token", "slack_channel", "telegram_bot_token", "telegram_chat_id", "twilio_account_sid", "twilio_auth_token", "twilio_from", "twilio_to", "template", "down_template", "up_template", "discord_content", "discord_username", "discord_avatar_url", "discord_tts", "discord_embed_enabled", "discord_embed_title", "discord_embed_description", "discord_embed_url", "discord_embed_color", "discord_embed_author_name", "discord_embed_author_url", "discord_embed_author_icon_url", "discord_embed_thumbnail_url", "discord_embed_image_url", "discord_embed_footer_text", "discord_embed_footer_icon_url", "discord_embed_timestamp", "discord_allow_user_mentions", "discord_allow_role_mentions", "discord_allow_everyone_mentions", "discord_suppress_embeds", "discord_suppress_notifications", "discord_thread_name", "discord_applied_tags", "active", "created_at") SELECT "id", "type", "name", "webhook_url", "slack_bot_token", "slack_channel", "telegram_bot_token", "telegram_chat_id", "twilio_account_sid", "twilio_auth_token", "twilio_from", "twilio_to", "template", "down_template", "up_template", "discord_content", "discord_username", "discord_avatar_url", "discord_tts", "discord_embed_enabled", "discord_embed_title", "discord_embed_description", "discord_embed_url", "discord_embed_color", "discord_embed_author_name", "discord_embed_author_url", "discord_embed_author_icon_url", "discord_embed_thumbnail_url", "discord_embed_image_url", "discord_embed_footer_text", "discord_embed_footer_icon_url", "discord_embed_timestamp", "discord_allow_user_mentions", "discord_allow_role_mentions", "discord_allow_everyone_mentions", "discord_suppress_embeds", "discord_suppress_notifications", "discord_thread_name", "discord_applied_tags", "active", "created_at" FROM `notification_channels`;--> statement-breakpoint
DROP TABLE `notification_channels`;--> statement-breakpoint
ALTER TABLE `__new_notification_channels` RENAME TO `notification_channels`;--> statement-breakpoint
PRAGMA foreign_keys=ON;