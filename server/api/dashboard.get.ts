import { defineEventHandler } from "h3";
import { getMonitorsWithStatus, getStatusInformation } from "../utils/public-data";
import { getDb, isAuthenticated } from "../utils/request-context";

export default defineEventHandler(async (event) => {
  const db = getDb(event);
  const hasAuth = isAuthenticated(event);
  const [monitors, statusInfo] = await Promise.all([
    getMonitorsWithStatus(db, hasAuth),
    getStatusInformation(db),
  ]);

  return { monitors, statusInfo, isAdmin: hasAuth };
});
