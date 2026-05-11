ALTER TABLE `notification_channels` ADD `slack_bot_token` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `slack_channel` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `telegram_bot_token` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `telegram_chat_id` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `twilio_account_sid` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `twilio_auth_token` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `twilio_from` text;
--> statement-breakpoint
ALTER TABLE `notification_channels` ADD `twilio_to` text;
