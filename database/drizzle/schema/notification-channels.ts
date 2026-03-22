import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notificationChannelTable = sqliteTable("notification_channels", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "discord" | "slack"
  name: text("name").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  template: text("template"), // custom message template with {{variables}}
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type NotificationChannel = typeof notificationChannelTable.$inferSelect;
export type NotificationChannelInsert = typeof notificationChannelTable.$inferInsert;
