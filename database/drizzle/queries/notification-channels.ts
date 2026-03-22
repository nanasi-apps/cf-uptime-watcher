import { eq } from "drizzle-orm";
import type { dbD1 } from "../db";
import {
  notificationChannelTable,
  type NotificationChannelInsert,
} from "../schema/notification-channels";

type DB = ReturnType<typeof dbD1>;

export function getAllChannels(db: DB) {
  return db.select().from(notificationChannelTable).all();
}

export function getActiveChannels(db: DB) {
  return db
    .select()
    .from(notificationChannelTable)
    .where(eq(notificationChannelTable.active, true))
    .all();
}

export function insertChannel(
  db: DB,
  channel: Omit<NotificationChannelInsert, "id" | "createdAt">,
) {
  return db.insert(notificationChannelTable).values(channel).returning();
}

export function updateChannel(
  db: DB,
  id: number,
  channel: Partial<Omit<NotificationChannelInsert, "id" | "createdAt">>,
) {
  return db
    .update(notificationChannelTable)
    .set(channel)
    .where(eq(notificationChannelTable.id, id));
}

export function deleteChannel(db: DB, id: number) {
  return db.delete(notificationChannelTable).where(eq(notificationChannelTable.id, id));
}
