import { and, desc, eq, ne } from "drizzle-orm";
import type { dbD1 } from "../db";
import { checkResultTable } from "../schema/check-results";
import { monitorTable, type MonitorInsert } from "../schema/monitors";

type DB = ReturnType<typeof dbD1>;

export function getAllMonitors(db: DB) {
  return db.select().from(monitorTable).all();
}

export function getMonitorById(db: DB, id: number) {
  return db.select().from(monitorTable).where(eq(monitorTable.id, id)).get();
}

export function insertMonitor(db: DB, monitor: Omit<MonitorInsert, "id" | "createdAt">) {
  return db.insert(monitorTable).values(monitor).returning();
}

export function updateMonitor(
  db: DB,
  id: number,
  monitor: Partial<Omit<MonitorInsert, "id" | "createdAt">>,
) {
  return db.update(monitorTable).set(monitor).where(eq(monitorTable.id, id));
}

export function deleteMonitor(db: DB, id: number) {
  return db.delete(monitorTable).where(eq(monitorTable.id, id));
}

export function getActiveMonitors(db: DB) {
  return db.select().from(monitorTable).where(eq(monitorTable.active, true)).all();
}

export function insertCheckResult(
  db: DB,
  result: {
    monitorId: number;
    statusCode: number | null;
    responseTime: number | null;
    isUp: boolean;
    status?: "up" | "down" | "maintenance";
    errorMessage: string | null;
  },
) {
  return db.insert(checkResultTable).values({
    ...result,
    status: result.status ?? (result.isUp ? "up" : "down"),
    checkedAt: new Date().toISOString(),
  });
}

export async function hasCurrentDownMonitor(db: DB) {
  const monitors = await db.select().from(monitorTable).where(eq(monitorTable.active, true)).all();
  const downStates = await Promise.all(
    monitors.map(async (monitor) => {
      const latest = await getLatestCheckResult(db, monitor.id);
      return latest?.status === "down" || (!latest?.status && latest?.isUp === false);
    }),
  );
  return downStates.some(Boolean);
}

export async function getLatestNonMaintenanceCheckResult(db: DB, monitorId: number) {
  return db
    .select()
    .from(checkResultTable)
    .where(
      and(eq(checkResultTable.monitorId, monitorId), ne(checkResultTable.status, "maintenance")),
    )
    .orderBy(desc(checkResultTable.checkedAt))
    .limit(1)
    .get();
}

export function getCheckResults(db: DB, monitorId: number, limit = 100) {
  return db
    .select()
    .from(checkResultTable)
    .where(eq(checkResultTable.monitorId, monitorId))
    .orderBy(desc(checkResultTable.checkedAt))
    .limit(limit)
    .all();
}

export function getLatestCheckResult(db: DB, monitorId: number) {
  return db
    .select()
    .from(checkResultTable)
    .where(eq(checkResultTable.monitorId, monitorId))
    .orderBy(desc(checkResultTable.checkedAt))
    .limit(1)
    .get();
}
