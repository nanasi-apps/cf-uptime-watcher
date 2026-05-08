import { implement, ORPCError } from "@orpc/server";
import type { dbD1 } from "../database/drizzle/db";
import * as mnQueries from "../database/drizzle/queries/monitor-notifications";
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
  if (!context.password || !context.authToken || context.authToken !== context.password) {
    throw new ORPCError("UNAUTHORIZED");
  }
}

function isAuthenticated(context: Context): boolean {
  return !!(context.password && context.authToken && context.authToken === context.password);
}

/**
 * 権限がない場合は、displayName と内部情報（url など）を隠す
 */
function maskMonitorData(monitor: Record<string, any>, hasAuth: boolean) {
  if (hasAuth) {
    return monitor; // 権限ありなら全て表示
  }

  // 権限がない場合：displayName があれば使用、なければ name を使用
  return {
    ...monitor,
    name: monitor.displayName || monitor.name,
    url: monitor.url || "Hidden",
    headers: null,
    body: null,
  };
}

async function getMonitorWithChannelIds(db: ReturnType<typeof dbD1>, monitorId: number) {
  const rows = await mnQueries.getChannelIdsForMonitor(db, monitorId);
  return rows.map((r) => r.channelId);
}

// Public: read-only endpoints
const listMonitors = os.monitor.list.handler(async ({ context }) => {
  const hasAuth = isAuthenticated(context);
  const monitors = await queries.getAllMonitors(context.db);
  const results = await Promise.all(
    monitors.map(async (m) => {
      const lastCheck = (await queries.getLatestCheckResult(context.db, m.id)) ?? null;
      const history = await queries.getCheckResults(context.db, m.id, 100);
      const upChecks = history.filter((c) => c.isUp).length;
      const uptimePercent =
        history.length > 0 ? Math.round((upChecks / history.length) * 10000) / 100 : null;
      const channelIds = await getMonitorWithChannelIds(context.db, m.id);
      const recentChecks = [...history].reverse().slice(-90);
      return maskMonitorData({ ...m, lastCheck, uptimePercent, channelIds, recentChecks }, hasAuth);
    }),
  );
  return results as any;
});

const getMonitor = os.monitor.get.handler(async ({ context, input }) => {
  const hasAuth = isAuthenticated(context);
  const monitor = await queries.getMonitorById(context.db, input.id);
  if (!monitor) return null;
  const lastCheck = (await queries.getLatestCheckResult(context.db, monitor.id)) ?? null;
  const history = await queries.getCheckResults(context.db, monitor.id, 100);
  const upChecks = history.filter((c) => c.isUp).length;
  const uptimePercent =
    history.length > 0 ? Math.round((upChecks / history.length) * 10000) / 100 : null;
  const channelIds = await getMonitorWithChannelIds(context.db, monitor.id);
  return maskMonitorData({ ...monitor, lastCheck, uptimePercent, channelIds }, hasAuth) as any;
});

const monitorHistory = os.monitor.history.handler(async ({ context, input }) => {
  return queries.getCheckResults(context.db, input.id, input.limit ?? 100);
});

// Protected: write endpoints
const createMonitor = os.monitor.create.handler(async ({ context, input }) => {
  requireAuth(context);
  const result = await queries.insertMonitor(context.db, {
    name: input.name,
    displayName: input.displayName ?? input.name, // displayNameがなければnameを使用
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

const setMonitorChannels = os.monitor.setChannels.handler(async ({ context, input }) => {
  requireAuth(context);
  await mnQueries.setChannelsForMonitor(context.db, input.id, input.channelIds);
  return { status: "OK" as const };
});

const importMonitors = os.monitor.import.handler(async ({ context, input }) => {
  requireAuth(context);

  const existingMonitors = await queries.getAllMonitors(context.db);
  const existingUrls = new Set(existingMonitors.map((m) => m.url));

  const details: Array<{
    name: string;
    status: "imported" | "skipped" | "error";
    message?: string;
  }> = [];
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of input.monitors) {
    try {
      if (input.skipDuplicates && existingUrls.has(m.url)) {
        details.push({ name: m.name, status: "skipped", message: "URL already exists" });
        skipped++;
        continue;
      }

      await queries.insertMonitor(context.db, {
        name: m.name,
        displayName: m.name, // 暫定的にnameを使用
        url: m.url,
        method: m.method,
        headers: m.headers ?? null,
        body: m.body ?? null,
        timeout: m.timeout ?? 30,
        expectedStatus: m.expectedStatus ?? 200,
        active: true,
      });
      details.push({ name: m.name, status: "imported" });
      imported++;
      existingUrls.add(m.url);
    } catch (e) {
      details.push({
        name: m.name,
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
      errors++;
    }
  }

  return { imported, skipped, errors, details };
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
    downTemplate: input.downTemplate ?? null,
    upTemplate: input.upTemplate ?? null,
    discordContent: input.discordContent ?? null,
    discordUsername: input.discordUsername ?? null,
    discordAvatarUrl: input.discordAvatarUrl ?? null,
    discordTts: input.discordTts ?? null,
    discordEmbedEnabled: input.discordEmbedEnabled ?? null,
    discordEmbedTitle: input.discordEmbedTitle ?? null,
    discordEmbedDescription: input.discordEmbedDescription ?? null,
    discordEmbedUrl: input.discordEmbedUrl ?? null,
    discordEmbedColor: input.discordEmbedColor ?? null,
    discordEmbedAuthorName: input.discordEmbedAuthorName ?? null,
    discordEmbedAuthorUrl: input.discordEmbedAuthorUrl ?? null,
    discordEmbedAuthorIconUrl: input.discordEmbedAuthorIconUrl ?? null,
    discordEmbedThumbnailUrl: input.discordEmbedThumbnailUrl ?? null,
    discordEmbedImageUrl: input.discordEmbedImageUrl ?? null,
    discordEmbedFooterText: input.discordEmbedFooterText ?? null,
    discordEmbedFooterIconUrl: input.discordEmbedFooterIconUrl ?? null,
    discordEmbedTimestamp: input.discordEmbedTimestamp ?? null,
    discordAllowUserMentions: input.discordAllowUserMentions ?? null,
    discordAllowRoleMentions: input.discordAllowRoleMentions ?? null,
    discordAllowEveryoneMentions: input.discordAllowEveryoneMentions ?? null,
    discordSuppressEmbeds: input.discordSuppressEmbeds ?? null,
    discordSuppressNotifications: input.discordSuppressNotifications ?? null,
    discordThreadName: input.discordThreadName ?? null,
    discordAppliedTags: input.discordAppliedTags ?? null,
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
      displayName: null,
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
  if (!context.password) {
    return { success: false };
  }
  return { success: input.password === context.password };
});

const verifyAuth = os.auth.verify.handler(async ({ context }) => {
  requireAuth(context);
  return { valid: true as const };
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
    import: importMonitors,
    setChannels: setMonitorChannels,
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
    verify: verifyAuth,
  },
});
