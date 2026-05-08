import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import type { dbD1 } from "../db";
import {
  incidentEventTable,
  maintenanceEventTable,
  maintenanceMonitorTable,
  type IncidentEventInsert,
  type MaintenanceEventInsert,
} from "../schema/status-events";

type DB = ReturnType<typeof dbD1>;

export function getMaintenanceEvents(db: DB, limit = 20) {
  return db
    .select()
    .from(maintenanceEventTable)
    .orderBy(desc(maintenanceEventTable.startAt))
    .limit(limit)
    .all();
}

export function getMaintenanceEvent(db: DB, id: number) {
  return db.select().from(maintenanceEventTable).where(eq(maintenanceEventTable.id, id)).get();
}

export function getMonitorIdsForMaintenance(db: DB, maintenanceId: number) {
  return db
    .select({ monitorId: maintenanceMonitorTable.monitorId })
    .from(maintenanceMonitorTable)
    .where(eq(maintenanceMonitorTable.maintenanceId, maintenanceId))
    .all();
}

export async function setMonitorsForMaintenance(
  db: DB,
  maintenanceId: number,
  monitorIds: number[],
) {
  await db
    .delete(maintenanceMonitorTable)
    .where(eq(maintenanceMonitorTable.maintenanceId, maintenanceId));

  if (monitorIds.length > 0) {
    await db
      .insert(maintenanceMonitorTable)
      .values(monitorIds.map((monitorId) => ({ maintenanceId, monitorId })));
  }
}

export function getActiveMaintenanceEvent(db: DB, now = new Date().toISOString()) {
  return db
    .select()
    .from(maintenanceEventTable)
    .where(and(lte(maintenanceEventTable.startAt, now), gte(maintenanceEventTable.endAt, now)))
    .orderBy(desc(maintenanceEventTable.startAt))
    .limit(1)
    .get();
}

export function insertMaintenanceEvent(
  db: DB,
  event: Omit<MaintenanceEventInsert, "id" | "createdAt">,
) {
  return db.insert(maintenanceEventTable).values(event).returning();
}

export function updateMaintenanceEvent(
  db: DB,
  id: number,
  event: Partial<Omit<MaintenanceEventInsert, "id" | "createdAt">>,
) {
  return db.update(maintenanceEventTable).set(event).where(eq(maintenanceEventTable.id, id));
}

export function deleteMaintenanceEvent(db: DB, id: number) {
  return db.delete(maintenanceEventTable).where(eq(maintenanceEventTable.id, id));
}

export function getIncidents(db: DB, limit = 20) {
  return db
    .select()
    .from(incidentEventTable)
    .orderBy(desc(incidentEventTable.createdAt))
    .limit(limit)
    .all();
}

export function getActiveIncident(db: DB) {
  return db
    .select()
    .from(incidentEventTable)
    .where(isNull(incidentEventTable.resolvedAt))
    .orderBy(desc(incidentEventTable.createdAt))
    .limit(1)
    .get();
}

export function insertIncident(db: DB, incident: Omit<IncidentEventInsert, "id" | "createdAt">) {
  return db.insert(incidentEventTable).values(incident).returning();
}

export function updateIncident(
  db: DB,
  id: number,
  incident: Partial<Omit<IncidentEventInsert, "id" | "createdAt">>,
) {
  return db.update(incidentEventTable).set(incident).where(eq(incidentEventTable.id, id));
}

export function resolveIncident(db: DB, id: number) {
  return db
    .update(incidentEventTable)
    .set({ resolvedAt: new Date().toISOString() })
    .where(eq(incidentEventTable.id, id));
}
