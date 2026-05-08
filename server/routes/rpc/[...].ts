import { createError, defineEventHandler, toWebRequest } from "h3";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "../../router";
import { getAuthToken, getDb } from "../../utils/request-context";

const rpcHandler = new RPCHandler(router);

export default defineEventHandler(async (event) => {
  const env = (event.context.cloudflare?.env ?? {}) as Env;
  const request = toWebRequest(event);

  const { matched, response } = await rpcHandler.handle(request, {
    prefix: "/rpc",
    context: {
      db: getDb(event),
      password: env.AUTH_PASSWORD,
      authToken: getAuthToken(event),
    },
  });

  if (matched) {
    return response;
  }

  throw createError({ statusCode: 404 });
});
