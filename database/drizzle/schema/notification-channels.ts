import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notificationChannelTable = sqliteTable("notification_channels", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "discord" | "slack" | "telegram" | "zapier" | "twilio"
  name: text("name").notNull(),
  webhookUrl: text("webhook_url").default(sql`NULL`),
  slackBotToken: text("slack_bot_token").default(sql`NULL`),
  slackChannel: text("slack_channel").default(sql`NULL`),
  telegramBotToken: text("telegram_bot_token").default(sql`NULL`),
  telegramChatId: text("telegram_chat_id").default(sql`NULL`),
  twilioAccountSid: text("twilio_account_sid").default(sql`NULL`),
  twilioAuthToken: text("twilio_auth_token").default(sql`NULL`),
  twilioFrom: text("twilio_from").default(sql`NULL`),
  twilioTo: text("twilio_to").default(sql`NULL`),
  template: text("template").default(sql`NULL`), // custom message template with {{variables}}
  downTemplate: text("down_template").default(sql`NULL`),
  upTemplate: text("up_template").default(sql`NULL`),
  discordContent: text("discord_content").default(sql`NULL`),
  discordUsername: text("discord_username").default(sql`NULL`),
  discordAvatarUrl: text("discord_avatar_url").default(sql`NULL`),
  discordTts: integer("discord_tts", { mode: "boolean" }).default(sql`NULL`),
  discordEmbedEnabled: integer("discord_embed_enabled", { mode: "boolean" }).default(sql`NULL`),
  discordEmbedTitle: text("discord_embed_title").default(sql`NULL`),
  discordEmbedDescription: text("discord_embed_description").default(sql`NULL`),
  discordDownEmbedDescription: text("discord_down_embed_description").default(sql`NULL`),
  discordUpEmbedDescription: text("discord_up_embed_description").default(sql`NULL`),
  discordEmbedUrl: text("discord_embed_url").default(sql`NULL`),
  discordEmbedColor: text("discord_embed_color").default(sql`NULL`),
  discordEmbedAuthorName: text("discord_embed_author_name").default(sql`NULL`),
  discordEmbedAuthorUrl: text("discord_embed_author_url").default(sql`NULL`),
  discordEmbedAuthorIconUrl: text("discord_embed_author_icon_url").default(sql`NULL`),
  discordEmbedThumbnailUrl: text("discord_embed_thumbnail_url").default(sql`NULL`),
  discordEmbedImageUrl: text("discord_embed_image_url").default(sql`NULL`),
  discordEmbedFooterText: text("discord_embed_footer_text").default(sql`NULL`),
  discordEmbedFooterIconUrl: text("discord_embed_footer_icon_url").default(sql`NULL`),
  discordEmbedTimestamp: integer("discord_embed_timestamp", { mode: "boolean" }).default(sql`NULL`),
  discordAllowUserMentions: integer("discord_allow_user_mentions", { mode: "boolean" }).default(
    sql`NULL`,
  ),
  discordAllowRoleMentions: integer("discord_allow_role_mentions", { mode: "boolean" }).default(
    sql`NULL`,
  ),
  discordAllowEveryoneMentions: integer("discord_allow_everyone_mentions", {
    mode: "boolean",
  }).default(sql`NULL`),
  discordSuppressEmbeds: integer("discord_suppress_embeds", { mode: "boolean" }).default(sql`NULL`),
  discordSuppressNotifications: integer("discord_suppress_notifications", {
    mode: "boolean",
  }).default(sql`NULL`),
  discordThreadName: text("discord_thread_name").default(sql`NULL`),
  discordAppliedTags: text("discord_applied_tags").default(sql`NULL`),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type NotificationChannel = typeof notificationChannelTable.$inferSelect;
export type NotificationChannelInsert = typeof notificationChannelTable.$inferInsert;
