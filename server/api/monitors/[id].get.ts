import { createError, defineEventHandler, getRouterParam } from "h3";
import { getMonitorDetail } from "../../utils/public-data";
import { getDb, isAuthenticated } from "../../utils/request-context";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id))
    throw createError({ statusCode: 400, statusMessage: "Invalid monitor ID" });

  return getMonitorDetail(getDb(event), id, isAuthenticated(event));
});
