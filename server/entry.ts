import { RPCHandler } from "@orpc/server/fetch";
import { apply, serve } from "@photonjs/hono";
import { Hono } from "hono";
import { dbD1 } from "../database/drizzle/db";
import * as queries from "../database/drizzle/queries/monitors";
import { performCheck } from "./check";
import { dbMiddleware } from "./db-middleware";
import * as channelQueries from "../database/drizzle/queries/notification-channels";
import { buildNotifiersFromChannels, sendNotifications } from "./notifiers";
import { router } from "./router";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startApp() as unknown;

function startApp() {
  const app = new Hono<{ Bindings: Env }>();

  const rpcHandler = new RPCHandler(router);

  app.use("/rpc/*", async (c) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: {
        db: dbD1(c.env.DB),
        password: c.env.AUTH_PASSWORD,
        authToken: c.req.header("authorization")?.replace("Bearer ", "") ?? null,
      },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return c.notFound();
  });

  apply(app, [dbMiddleware]);

  const worker = serve(app, { port }) as unknown as Record<string, unknown>;

  // Add Cloudflare Cron Trigger handler
  worker.scheduled = async (_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) => {
    const db = dbD1(env.DB);
    const monitors = await queries.getActiveMonitors(db);
    const channels = await channelQueries.getActiveChannels(db);
    const notifiers = buildNotifiersFromChannels(channels);

    await Promise.allSettled(
      monitors.map(async (monitor) => {
        const previousCheck = await queries.getLatestCheckResult(db, monitor.id);
        const previouslyUp = previousCheck?.isUp ?? true;

        const result = await performCheck(monitor);
        await queries.insertCheckResult(db, {
          monitorId: monitor.id,
          ...result,
        });

        // Notify only on state change (up→down or down→up)
        const stateChanged = previouslyUp !== result.isUp;
        if (stateChanged && notifiers.length > 0) {
          await sendNotifications(notifiers, { monitor, result, previouslyUp });
        }
      }),
    );
  };

  return worker;
}
