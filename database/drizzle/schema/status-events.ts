import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { monitorTable } from "./monitors";

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

export const maintenanceMonitorTable = sqliteTable(
  "maintenance_monitors",
  {
    maintenanceId: integer("maintenance_id")
      .notNull()
      .references(() => maintenanceEventTable.id, { onDelete: "cascade" }),
    monitorId: integer("monitor_id")
      .notNull()
      .references(() => monitorTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.maintenanceId, table.monitorId] })],
);

export type MaintenanceEvent = typeof maintenanceEventTable.$inferSelect;
export type MaintenanceEventInsert = typeof maintenanceEventTable.$inferInsert;
export type IncidentEvent = typeof incidentEventTable.$inferSelect;
export type IncidentEventInsert = typeof incidentEventTable.$inferInsert;
