import { implement } from "@orpc/server";
import type { dbD1 } from "../database/drizzle/db";
import * as queries from "../database/drizzle/queries/monitors";
import * as channelQueries from "../database/drizzle/queries/notification-channels";
import { performCheck } from "./check";
import { contract } from "./contract";
import { buildNotifiersFromChannels, sendNotifications } from "./notifiers";

type Context = {
  db: ReturnType<typeof dbD1>;
  password: string;
  authToken: string | null;
};

const os = implement(contract).$context<Context>();

function requireAuth(context: Context) {
  if (!context.authToken || context.authToken !== context.password) {
    throw new Error("Unauthorized");
  }
}

// Public: read-only endpoints
const listMonitors = os.monitor.list.handler(async ({ context }) => {
  const monitors = await queries.getAllMonitors(context.db);
  const results = await Promise.all(
    monitors.map(async (m) => {
      const lastCheck = (await queries.getLatestCheckResult(context.db, m.id)) ?? null;
      const history = await queries.getCheckResults(context.db, m.id, 100);
      const upChecks = history.filter((c) => c.isUp).length;
      const uptimePercent =
        history.length > 0 ? Math.round((upChecks / history.length) * 10000) / 100 : null;
      return { ...m, lastCheck, uptimePercent };
    }),
  );
  return results;
});

const getMonitor = os.monitor.get.handler(async ({ context, input }) => {
  const monitor = await queries.getMonitorById(context.db, input.id);
  if (!monitor) return null;
  const lastCheck = (await queries.getLatestCheckResult(context.db, monitor.id)) ?? null;
  const history = await queries.getCheckResults(context.db, monitor.id, 100);
  const upChecks = history.filter((c) => c.isUp).length;
  const uptimePercent =
    history.length > 0 ? Math.round((upChecks / history.length) * 10000) / 100 : null;
  return { ...monitor, lastCheck, uptimePercent };
});

const monitorHistory = os.monitor.history.handler(async ({ context, input }) => {
  return queries.getCheckResults(context.db, input.id, input.limit ?? 100);
});

// Protected: write endpoints
const createMonitor = os.monitor.create.handler(async ({ context, input }) => {
  requireAuth(context);
  const result = await queries.insertMonitor(context.db, {
    name: input.name,
    url: input.url,
    method: input.method,
    headers: input.headers ?? null,
    body: input.body ?? null,
    timeout: input.timeout,
    expectedStatus: input.expectedStatus ?? 200,
    active: true,
  });
  return result[0]!;
});

const updateMonitor = os.monitor.update.handler(async ({ context, input }) => {
  requireAuth(context);
  const { id, ...rest } = input;
  await queries.updateMonitor(context.db, id, rest);
  return { status: "OK" as const };
});

const deleteMonitor = os.monitor.delete.handler(async ({ context, input }) => {
  requireAuth(context);
  await queries.deleteMonitor(context.db, input.id);
  return { status: "OK" as const };
});

const checkNow = os.monitor.checkNow.handler(async ({ context, input }) => {
  requireAuth(context);
  const monitor = await queries.getMonitorById(context.db, input.id);
  if (!monitor) throw new Error("Monitor not found");
  const result = await performCheck(monitor);
  await queries.insertCheckResult(context.db, {
    monitorId: monitor.id,
    ...result,
  });
  const latest = await queries.getLatestCheckResult(context.db, monitor.id);
  return latest!;
});

// Notification channels (all protected)
const listChannels = os.notification.list.handler(async ({ context }) => {
  requireAuth(context);
  return channelQueries.getAllChannels(context.db);
});

const createChannel = os.notification.create.handler(async ({ context, input }) => {
  requireAuth(context);
  const result = await channelQueries.insertChannel(context.db, {
    type: input.type,
    name: input.name,
    webhookUrl: input.webhookUrl,
    template: input.template ?? null,
    active: true,
  });
  return result[0]!;
});

const updateChannel = os.notification.update.handler(async ({ context, input }) => {
  requireAuth(context);
  const { id, ...rest } = input;
  await channelQueries.updateChannel(context.db, id, rest);
  return { status: "OK" as const };
});

const deleteChannel = os.notification.delete.handler(async ({ context, input }) => {
  requireAuth(context);
  await channelQueries.deleteChannel(context.db, input.id);
  return { status: "OK" as const };
});

const testChannel = os.notification.test.handler(async ({ context, input }) => {
  requireAuth(context);
  const channels = await channelQueries.getAllChannels(context.db);
  const channel = channels.find((c) => c.id === input.id);
  if (!channel) throw new Error("Channel not found");

  const notifiers = buildNotifiersFromChannels([channel]);
  await sendNotifications(notifiers, {
    monitor: {
      id: 0,
      name: "Test Monitor",
      url: "https://example.com",
      method: "GET",
      headers: null,
      body: null,
      timeout: 30,
      expectedStatus: 200,
      active: true,
      createdAt: new Date().toISOString(),
    },
    result: {
      statusCode: null,
      responseTime: null,
      isUp: false,
      errorMessage: "This is a test notification",
    },
    previouslyUp: true,
  });
  return { status: "OK" as const };
});

const login = os.auth.login.handler(async ({ context, input }) => {
  return { success: input.password === context.password };
});

export const router = os.router({
  monitor: {
    list: listMonitors,
    get: getMonitor,
    create: createMonitor,
    update: updateMonitor,
    delete: deleteMonitor,
    history: monitorHistory,
    checkNow: checkNow,
  },
  notification: {
    list: listChannels,
    create: createChannel,
    update: updateChannel,
    delete: deleteChannel,
    test: testChannel,
  },
  auth: {
    login: login,
  },
});
