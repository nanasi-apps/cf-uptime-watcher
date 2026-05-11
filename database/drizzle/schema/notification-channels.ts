import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notificationChannelTable = sqliteTable("notification_channels", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "discord" | "slack" | "telegram" | "zapier" | "twilio"
  name: text("name").notNull(),
  webhookUrl: text("webhook_url"),
  slackBotToken: text("slack_bot_token"),
  slackChannel: text("slack_channel"),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioFrom: text("twilio_from"),
  twilioTo: text("twilio_to"),
  template: text("template"), // custom message template with {{variables}}
  downTemplate: text("down_template"),
  upTemplate: text("up_template"),
  discordContent: text("discord_content"),
  discordUsername: text("discord_username"),
  discordAvatarUrl: text("discord_avatar_url"),
  discordTts: integer("discord_tts", { mode: "boolean" }),
  discordEmbedEnabled: integer("discord_embed_enabled", { mode: "boolean" }),
  discordEmbedTitle: text("discord_embed_title"),
  discordEmbedDescription: text("discord_embed_description"),
  discordEmbedUrl: text("discord_embed_url"),
  discordEmbedColor: text("discord_embed_color"),
  discordEmbedAuthorName: text("discord_embed_author_name"),
  discordEmbedAuthorUrl: text("discord_embed_author_url"),
  discordEmbedAuthorIconUrl: text("discord_embed_author_icon_url"),
  discordEmbedThumbnailUrl: text("discord_embed_thumbnail_url"),
  discordEmbedImageUrl: text("discord_embed_image_url"),
  discordEmbedFooterText: text("discord_embed_footer_text"),
  discordEmbedFooterIconUrl: text("discord_embed_footer_icon_url"),
  discordEmbedTimestamp: integer("discord_embed_timestamp", { mode: "boolean" }),
  discordAllowUserMentions: integer("discord_allow_user_mentions", { mode: "boolean" }),
  discordAllowRoleMentions: integer("discord_allow_role_mentions", { mode: "boolean" }),
  discordAllowEveryoneMentions: integer("discord_allow_everyone_mentions", { mode: "boolean" }),
  discordSuppressEmbeds: integer("discord_suppress_embeds", { mode: "boolean" }),
  discordSuppressNotifications: integer("discord_suppress_notifications", { mode: "boolean" }),
  discordThreadName: text("discord_thread_name"),
  discordAppliedTags: text("discord_applied_tags"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type NotificationChannel = typeof notificationChannelTable.$inferSelect;
export type NotificationChannelInsert = typeof notificationChannelTable.$inferInsert;
