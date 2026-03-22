import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const monitorTable = sqliteTable("monitors", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("GET"),
  headers: text("headers"), // JSON string
  body: text("body"), // POST body
  timeout: integer("timeout").notNull().default(30),
  expectedStatus: integer("expected_status").notNull().default(200),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type Monitor = typeof monitorTable.$inferSelect;
export type MonitorInsert = typeof monitorTable.$inferInsert;
