import { createRouterClient } from "@orpc/server";
import { getCookie, getHeader } from "h3";
import { dbD1 } from "~~/database/drizzle/db";
import { router } from "~~/server/router";
import type { RpcClient } from "~/utils/rpc-client";

export default defineNuxtPlugin(() => {
  const event = useRequestEvent();
  const env = (event?.context.cloudflare?.env ?? {}) as Env;

  const client: RpcClient = createRouterClient(router, {
    context: {
      db: dbD1(env.DB),
      password: env.AUTH_PASSWORD,
      authToken: event
        ? (getHeader(event, "authorization")?.replace("Bearer ", "") ??
          getCookie(event, "auth_token") ??
          null)
        : null,
    },
  });

  return {
    provide: {
      client,
    },
  };
});
