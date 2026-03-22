import { desc, eq } from "drizzle-orm";
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
    errorMessage: string | null;
  },
) {
  return db.insert(checkResultTable).values({
    ...result,
    checkedAt: new Date().toISOString(),
  });
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
