import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { monitorTable } from "./monitors";

export const checkResultTable = sqliteTable("check_results", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  monitorId: integer("monitor_id")
    .notNull()
    .references(() => monitorTable.id, { onDelete: "cascade" }),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // milliseconds
  isUp: integer("is_up", { mode: "boolean" }).notNull(),
  errorMessage: text("error_message"),
  checkedAt: text("checked_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type CheckResult = typeof checkResultTable.$inferSelect;
export type CheckResultInsert = typeof checkResultTable.$inferInsert;
