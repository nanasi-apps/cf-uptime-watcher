import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const maintenanceEventTable = sqliteTable("maintenance_events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const incidentEventTable = sqliteTable("incident_events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type MaintenanceEvent = typeof maintenanceEventTable.$inferSelect;
export type MaintenanceEventInsert = typeof maintenanceEventTable.$inferInsert;
export type IncidentEvent = typeof incidentEventTable.$inferSelect;
export type IncidentEventInsert = typeof incidentEventTable.$inferInsert;
