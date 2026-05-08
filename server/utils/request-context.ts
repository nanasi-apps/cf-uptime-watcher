import { getCookie, getHeader, type H3Event } from "h3";
import { dbD1 } from "../../database/drizzle/db";

export function getDb(event: H3Event) {
  const env = (event.context.cloudflare?.env ?? {}) as Env;
  return dbD1(env.DB);
}

export function getAuthToken(event: H3Event) {
  return (
    getHeader(event, "authorization")?.replace("Bearer ", "") ??
    getCookie(event, "auth_token") ??
    null
  );
}

export function isAuthenticated(event: H3Event) {
  const env = (event.context.cloudflare?.env ?? {}) as Env;
  const authToken = getAuthToken(event);
  return Boolean(env.AUTH_PASSWORD && authToken && authToken === env.AUTH_PASSWORD);
}
