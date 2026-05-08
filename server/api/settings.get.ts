import { createError, defineEventHandler } from "h3";
import { getSettingsData } from "../utils/public-data";
import { getDb, isAuthenticated } from "../utils/request-context";

export default defineEventHandler(async (event) => {
  if (!isAuthenticated(event))
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return getSettingsData(getDb(event));
});
