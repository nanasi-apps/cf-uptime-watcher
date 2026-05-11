import { implement, ORPCError } from "@orpc/server";
import type { dbD1 } from "../database/drizzle/db";
import * as mnQueries from "../database/drizzle/queries/monitor-notifications";
import * as queries from "../database/drizzle/queries/monitors";
import * as channelQueries from "../database/drizzle/queries/notification-channels";
import * as statusQueries from "../database/drizzle/queries/status-events";
import type { NotificationChannel } from "../database/drizzle/schema/notification-channels";
import { performCheck } from "./check";
import { contract } from "./contract";
import { buildNotifiersFromChannels, sendNotifications } from "./notifiers";

type Context = {
  db: ReturnType<typeof dbD1>;
  password: string;
  authToken: string | null;
};

const SECRET_MASK = "********";

const os = implement(contract).$context<Context>();

function requireAuth(context: Context) {
  if (!context.password || !context.authToken || context.authToken !== context.password) {
    throw new ORPCError("UNAUTHORIZED");
  }
}

function isAuthenticated(context: Context): boolean {
  return !!(context.password && context.authToken && context.authToken === context.password);
}

function toNotificationChannelResponse(channel: NotificationChannel) {
  const baseChannel = {
    id: channel.id,
    name: channel.name,
    template: channel.template,
    downTemplate: channel.downTemplate,
    upTemplate: channel.upTemplate,
    active: channel.active,
    createdAt: channel.createdAt,
  };

  switch (channel.type) {
    case "discord":
      return {
        ...baseChannel,
        type: "discord" as const,
        webhookUrl: channel.webhookUrl ? SECRET_MASK : null,
        discordContent: channel.discordContent,
        discordUsername: channel.discordUsername,
        discordAvatarUrl: channel.discordAvatarUrl,
        discordTts: channel.discordTts,
        discordEmbedEnabled: channel.discordEmbedEnabled,
        discordEmbedTitle: channel.discordEmbedTitle,
        discordEmbedDescription: channel.discordEmbedDescription,
        discordDownEmbedDescription: channel.discordDownEmbedDescription,
        discordUpEmbedDescription: channel.discordUpEmbedDescription,
        discordEmbedUrl: channel.discordEmbedUrl,
        discordEmbedColor: channel.discordEmbedColor,
        discordEmbedAuthorName: channel.discordEmbedAuthorName,
        discordEmbedAuthorUrl: channel.discordEmbedAuthorUrl,
        discordEmbedAuthorIconUrl: channel.discordEmbedAuthorIconUrl,
        discordEmbedThumbnailUrl: channel.discordEmbedThumbnailUrl,
        discordEmbedImageUrl: channel.discordEmbedImageUrl,
        discordEmbedFooterText: channel.discordEmbedFooterText,
        discordEmbedFooterIconUrl: channel.discordEmbedFooterIconUrl,
        discordEmbedTimestamp: channel.discordEmbedTimestamp,
        discordAllowUserMentions: channel.discordAllowUserMentions,
        discordAllowRoleMentions: channel.discordAllowRoleMentions,
        discordAllowEveryoneMentions: channel.discordAllowEveryoneMentions,
        discordSuppressEmbeds: channel.discordSuppressEmbeds,
        discordSuppressNotifications: channel.discordSuppressNotifications,
        discordThreadName: channel.discordThreadName,
        discordAppliedTags: channel.discordAppliedTags,
      };
    case "slack":
      return {
        ...baseChannel,
        type: "slack" as const,
        slackMode: channel.slackBotToken ? ("bot" as const) : ("webhook" as const),
        webhookUrl: channel.webhookUrl ? SECRET_MASK : null,
        slackBotToken: channel.slackBotToken ? SECRET_MASK : null,
        slackChannel: channel.slackChannel,
      };
    case "telegram":
      return {
        ...baseChannel,
        type: "telegram" as const,
        telegramBotToken: channel.telegramBotToken ? SECRET_MASK : null,
        telegramChatId: channel.telegramChatId,
      };
    case "zapier":
      return {
        ...baseChannel,
        type: "zapier" as const,
        webhookUrl: channel.webhookUrl ? SECRET_MASK : null,
      };
    case "twilio":
      return {
        ...baseChannel,
        type: "twilio" as const,
        twilioAccountSid: channel.twilioAccountSid,
        twilioAuthToken: channel.twilioAuthToken ? SECRET_MASK : null,
        twilioFrom: channel.twilioFrom,
        twilioTo: channel.twilioTo,
      };
    default:
      throw new ORPCError("BAD_REQUEST", { message: "Unsupported notification channel type" });
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeSecretText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === SECRET_MASK) return undefined;
  return trimmed;
}

function validateChannelConfig(config: {
  type: string;
  webhookUrl?: string | null;
  slackMode?: "webhook" | "bot";
  slackBotToken?: string | null;
  slackChannel?: string | null;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  twilioFrom?: string | null;
  twilioTo?: string | null;
}) {
  if (["discord", "zapier"].includes(config.type) && !normalizeOptionalText(config.webhookUrl)) {
    throw new ORPCError("BAD_REQUEST", { message: "Webhook URL is required" });
  }

  if (
    config.type === "slack" &&
    config.slackMode === "webhook" &&
    !normalizeOptionalText(config.webhookUrl)
  ) {
    throw new ORPCError("BAD_REQUEST", { message: "Slack webhook URL is required" });
  }

  if (
    config.type === "slack" &&
    config.slackMode === "bot" &&
    (!normalizeOptionalText(config.slackBotToken) || !normalizeOptionalText(config.slackChannel))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Slack bot token and channel are required",
    });
  }

  if (
    config.type === "telegram" &&
    (!normalizeOptionalText(config.telegramBotToken) ||
      !normalizeOptionalText(config.telegramChatId))
  ) {
    throw new ORPCError("BAD_REQUEST", { message: "Telegram bot token and chat ID are required" });
  }

  if (
    config.type === "twilio" &&
    (!normalizeOptionalText(config.twilioAccountSid) ||
      !normalizeOptionalText(config.twilioAuthToken) ||
      !normalizeOptionalText(config.twilioFrom) ||
      !normalizeOptionalText(config.twilioTo))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Twilio account SID, auth token, from, and to are required",
    });
  }
}

type MonitorResponseData = {
  displayName: string | null;
  name: string;
  url?: string;
  headers?: string | null;
  body?: string | null;
};

/**
 * 権限がない場合は、displayName と内部情報（url など）を返さない
 */
export function maskMonitorData<T extends MonitorResponseData>(monitor: T, hasAuth: boolean) {
  if (hasAuth) {
    return monitor; // 権限ありなら全て表示
  }

  // 権限がない場合：displayName があれば使用、なければ name を使用
  const { url: _url, ...publicMonitor } = monitor;
  return {
    ...publicMonitor,
    name: monitor.displayName || monitor.name,
    headers: null,
    body: null,
  };
}

async function getMonitorWithChannelIds(db: ReturnType<typeof dbD1>, monitorId: number) {
  const rows = await mnQueries.getChannelIdsForMonitor(db, monitorId);
  return rows.map((r) => r.channelId);
}

function isUpStatus(check: { isUp: boolean; status?: string }) {
  return check.status ? check.status === "up" : check.isUp;
}

function isMaintenanceStatus(check: { status?: string }) {
  return check.status === "maintenance";
}

function buildMaintenanceCheck() {
  return {
    statusCode: null,
    responseTime: null,
    isUp: true,
    status: "maintenance" as const,
    errorMessage: null,
  };
}

async function getStatusInfo(context: Context) {
  const [maintenanceEvents, activeMaintenance, incidents, activeIncident] = await Promise.all([
    statusQueries.getMaintenanceEvents(context.db),
    statusQueries.getActiveMaintenanceEvent(context.db),
    statusQueries.getIncidents(context.db),
    statusQueries.getActiveIncident(context.db),
  ]);
  const maintenanceEventsWithMonitorIds = await Promise.all(
    maintenanceEvents.map(async (event) => ({
      ...event,
      monitorIds: (await statusQueries.getMonitorIdsForMaintenance(context.db, event.id)).map(
        (row) => row.monitorId,
      ),
    })),
  );
  const activeMaintenanceWithMonitorIds = activeMaintenance
    ? {
        ...activeMaintenance,
        monitorIds: (
          await statusQueries.getMonitorIdsForMaintenance(context.db, activeMaintenance.id)
        ).map((row) => row.monitorId),
      }
    : null;
  const hasDownMonitor = await queries.hasCurrentDownMonitor(context.db);
  return {
    maintenanceEvents: maintenanceEventsWithMonitorIds,
    activeMaintenance: activeMaintenanceWithMonitorIds,
    incidents,
    activeIncident: activeIncident ?? null,
    canCreateIncident: hasDownMonitor && !activeMaintenance,
  };
}

// Public: read-only endpoints
const listMonitors = os.monitor.list.handler(async ({ context }) => {
  const hasAuth = isAuthenticated(context);
  const monitors = await queries.getAllMonitors(context.db);
  const results = await Promise.all(
    monitors.map(async (m) => {
      const lastCheck = (await queries.getLatestCheckResult(context.db, m.id)) ?? null;
      const history = await queries.getCheckResults(context.db, m.id, 100);
      const uptimeHistory = history.filter((c) => !isMaintenanceStatus(c));
      const upChecks = uptimeHistory.filter((c) => isUpStatus(c)).length;
      const uptimePercent =
        uptimeHistory.length > 0
          ? Math.round((upChecks / uptimeHistory.length) * 10000) / 100
          : null;
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
  const uptimeHistory = history.filter((c) => !isMaintenanceStatus(c));
  const upChecks = uptimeHistory.filter((c) => isUpStatus(c)).length;
  const uptimePercent =
    uptimeHistory.length > 0 ? Math.round((upChecks / uptimeHistory.length) * 10000) / 100 : null;
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
  const activeMaintenance = await statusQueries.getActiveMaintenanceEvent(context.db);
  const result = activeMaintenance ? buildMaintenanceCheck() : await performCheck(monitor);
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

const getStatusInformation = os.statusInfo.get.handler(async ({ context }) => {
  return getStatusInfo(context);
});

const getMaintenance = os.statusInfo.getMaintenance.handler(async ({ context, input }) => {
  const event = await statusQueries.getMaintenanceEvent(context.db, input.id);
  if (!event) return null;

  return {
    ...event,
    monitorIds: (await statusQueries.getMonitorIdsForMaintenance(context.db, event.id)).map(
      (row) => row.monitorId,
    ),
  };
});

const createMaintenance = os.statusInfo.createMaintenance.handler(async ({ context, input }) => {
  requireAuth(context);
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new ORPCError("BAD_REQUEST", { message: "Maintenance endAt must be after startAt" });
  }

  const result = await statusQueries.insertMaintenanceEvent(context.db, {
    title: input.title,
    message: input.message ?? null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
  const created = result[0]!;
  const monitorIds = input.monitorIds ?? [];
  await statusQueries.setMonitorsForMaintenance(context.db, created.id, monitorIds);
  return { ...created, monitorIds };
});

const updateMaintenance = os.statusInfo.updateMaintenance.handler(async ({ context, input }) => {
  requireAuth(context);
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new ORPCError("BAD_REQUEST", { message: "Maintenance endAt must be after startAt" });
  }

  await statusQueries.updateMaintenanceEvent(context.db, input.id, {
    title: input.title,
    message: input.message ?? null,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
  await statusQueries.setMonitorsForMaintenance(context.db, input.id, input.monitorIds ?? []);
  return { status: "OK" as const };
});

const deleteMaintenance = os.statusInfo.deleteMaintenance.handler(async ({ context, input }) => {
  requireAuth(context);
  await statusQueries.deleteMaintenanceEvent(context.db, input.id);
  return { status: "OK" as const };
});

const createIncident = os.statusInfo.createIncident.handler(async ({ context, input }) => {
  requireAuth(context);
  const activeMaintenance = await statusQueries.getActiveMaintenanceEvent(context.db);
  if (activeMaintenance) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Incident cannot be created during maintenance",
    });
  }
  if (!(await queries.hasCurrentDownMonitor(context.db))) {
    throw new ORPCError("BAD_REQUEST", { message: "Incident requires a currently down monitor" });
  }

  const result = await statusQueries.insertIncident(context.db, {
    title: input.title,
    message: input.message ?? null,
    resolvedAt: null,
  });
  return result[0]!;
});

const updateIncident = os.statusInfo.updateIncident.handler(async ({ context, input }) => {
  requireAuth(context);
  await statusQueries.updateIncident(context.db, input.id, {
    title: input.title,
    message: input.message ?? null,
    resolvedAt: input.resolved ? new Date().toISOString() : null,
  });
  return { status: "OK" as const };
});

const resolveIncident = os.statusInfo.resolveIncident.handler(async ({ context, input }) => {
  requireAuth(context);
  await statusQueries.resolveIncident(context.db, input.id);
  return { status: "OK" as const };
});

// Notification channels (all protected)
const listChannels = os.notification.list.handler(async ({ context }) => {
  requireAuth(context);
  return (await channelQueries.getAllChannels(context.db)).map(toNotificationChannelResponse);
});

const createChannel = os.notification.create.handler(async ({ context, input }) => {
  requireAuth(context);

  const baseChannel = {
    type: input.type,
    name: input.name,
    template: input.template ?? null,
    downTemplate: input.downTemplate ?? null,
    upTemplate: input.upTemplate ?? null,
    active: true,
  };

  const result = await channelQueries.insertChannel(
    context.db,
    (() => {
      switch (input.type) {
        case "discord": {
          const webhookUrl = normalizeOptionalText(input.webhookUrl) ?? "";
          validateChannelConfig({ type: input.type, webhookUrl });
          return {
            ...baseChannel,
            webhookUrl,
            discordContent: input.discordContent ?? null,
            discordUsername: input.discordUsername ?? null,
            discordAvatarUrl: input.discordAvatarUrl ?? null,
            discordTts: input.discordTts ?? null,
            discordEmbedEnabled: input.discordEmbedEnabled ?? null,
            discordEmbedTitle: input.discordEmbedTitle ?? null,
            discordEmbedDescription: input.discordEmbedDescription ?? null,
            discordDownEmbedDescription: input.discordDownEmbedDescription ?? null,
            discordUpEmbedDescription: input.discordUpEmbedDescription ?? null,
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
          };
        }
        case "slack": {
          const channelConfig = {
            type: input.type,
            slackMode: input.slackMode,
            webhookUrl:
              input.slackMode === "webhook"
                ? (normalizeOptionalText(input.webhookUrl) ?? "")
                : null,
            slackBotToken:
              input.slackMode === "bot" ? normalizeOptionalText(input.slackBotToken) : null,
            slackChannel:
              input.slackMode === "bot" ? normalizeOptionalText(input.slackChannel) : null,
          };
          validateChannelConfig(channelConfig);
          return {
            ...baseChannel,
            webhookUrl: channelConfig.webhookUrl,
            slackBotToken: channelConfig.slackBotToken,
            slackChannel: channelConfig.slackChannel,
          };
        }
        case "telegram": {
          const channelConfig = {
            type: input.type,
            telegramBotToken: normalizeOptionalText(input.telegramBotToken),
            telegramChatId: normalizeOptionalText(input.telegramChatId),
          };
          validateChannelConfig(channelConfig);
          return {
            ...baseChannel,
            webhookUrl: null,
            telegramBotToken: channelConfig.telegramBotToken,
            telegramChatId: channelConfig.telegramChatId,
          };
        }
        case "zapier": {
          const webhookUrl = normalizeOptionalText(input.webhookUrl) ?? "";
          validateChannelConfig({ type: input.type, webhookUrl });
          return { ...baseChannel, webhookUrl };
        }
        case "twilio": {
          const channelConfig = {
            type: input.type,
            twilioAccountSid: normalizeOptionalText(input.twilioAccountSid),
            twilioAuthToken: normalizeOptionalText(input.twilioAuthToken),
            twilioFrom: normalizeOptionalText(input.twilioFrom),
            twilioTo: normalizeOptionalText(input.twilioTo),
          };
          validateChannelConfig(channelConfig);
          return {
            ...baseChannel,
            webhookUrl: null,
            twilioAccountSid: channelConfig.twilioAccountSid,
            twilioAuthToken: channelConfig.twilioAuthToken,
            twilioFrom: channelConfig.twilioFrom,
            twilioTo: channelConfig.twilioTo,
          };
        }
      }
    })(),
  );
  return toNotificationChannelResponse(result[0]!);
});

const updateChannel = os.notification.update.handler(async ({ context, input }) => {
  requireAuth(context);
  const current = await channelQueries.getChannelById(context.db, input.id);
  if (!current) throw new ORPCError("NOT_FOUND", { message: "Channel not found" });

  const baseChannel = {
    type: input.type,
    name: input.name,
    template: input.template ?? null,
    downTemplate: input.downTemplate ?? null,
    upTemplate: input.upTemplate ?? null,
    active: input.active,
  };
  const preserveCurrentSecrets = current.type === input.type;
  const clearedProviderFields = {
    webhookUrl: null,
    slackBotToken: null,
    slackChannel: null,
    telegramBotToken: null,
    telegramChatId: null,
    twilioAccountSid: null,
    twilioAuthToken: null,
    twilioFrom: null,
    twilioTo: null,
    discordContent: null,
    discordUsername: null,
    discordAvatarUrl: null,
    discordTts: null,
    discordEmbedEnabled: null,
    discordEmbedTitle: null,
    discordEmbedDescription: null,
    discordDownEmbedDescription: null,
    discordUpEmbedDescription: null,
    discordEmbedUrl: null,
    discordEmbedColor: null,
    discordEmbedAuthorName: null,
    discordEmbedAuthorUrl: null,
    discordEmbedAuthorIconUrl: null,
    discordEmbedThumbnailUrl: null,
    discordEmbedImageUrl: null,
    discordEmbedFooterText: null,
    discordEmbedFooterIconUrl: null,
    discordEmbedTimestamp: null,
    discordAllowUserMentions: null,
    discordAllowRoleMentions: null,
    discordAllowEveryoneMentions: null,
    discordSuppressEmbeds: null,
    discordSuppressNotifications: null,
    discordThreadName: null,
    discordAppliedTags: null,
  };

  await channelQueries.updateChannel(
    context.db,
    input.id,
    (() => {
      switch (input.type) {
        case "discord": {
          const webhookUrl =
            normalizeSecretText(input.webhookUrl) ??
            (preserveCurrentSecrets ? current.webhookUrl : null);
          validateChannelConfig({ type: input.type, webhookUrl });
          return {
            ...clearedProviderFields,
            ...baseChannel,
            webhookUrl,
            discordContent: input.discordContent ?? null,
            discordUsername: input.discordUsername ?? null,
            discordAvatarUrl: input.discordAvatarUrl ?? null,
            discordTts: input.discordTts ?? null,
            discordEmbedEnabled: input.discordEmbedEnabled ?? null,
            discordEmbedTitle: input.discordEmbedTitle ?? null,
            discordEmbedDescription: input.discordEmbedDescription ?? null,
            discordDownEmbedDescription: input.discordDownEmbedDescription ?? null,
            discordUpEmbedDescription: input.discordUpEmbedDescription ?? null,
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
          };
        }
        case "slack": {
          const slackBotToken =
            normalizeSecretText(input.slackBotToken) ??
            (preserveCurrentSecrets ? current.slackBotToken : null);
          const channelConfig = {
            type: input.type,
            slackMode: input.slackMode,
            webhookUrl:
              input.slackMode === "webhook"
                ? (normalizeSecretText(input.webhookUrl) ??
                  (preserveCurrentSecrets ? current.webhookUrl : null))
                : null,
            slackBotToken: input.slackMode === "bot" ? slackBotToken : null,
            slackChannel:
              input.slackMode === "bot" ? normalizeOptionalText(input.slackChannel) : null,
          };
          validateChannelConfig(channelConfig);
          return {
            ...clearedProviderFields,
            ...baseChannel,
            webhookUrl: channelConfig.webhookUrl,
            slackBotToken: channelConfig.slackBotToken,
            slackChannel: channelConfig.slackChannel,
          };
        }
        case "telegram": {
          const telegramBotToken =
            normalizeSecretText(input.telegramBotToken) ??
            (preserveCurrentSecrets ? current.telegramBotToken : null);
          const channelConfig = {
            type: input.type,
            telegramBotToken,
            telegramChatId: normalizeOptionalText(input.telegramChatId),
          };
          validateChannelConfig(channelConfig);
          return {
            ...clearedProviderFields,
            ...baseChannel,
            telegramBotToken,
            telegramChatId: channelConfig.telegramChatId,
          };
        }
        case "zapier": {
          const webhookUrl =
            normalizeSecretText(input.webhookUrl) ??
            (preserveCurrentSecrets ? current.webhookUrl : null);
          validateChannelConfig({ type: input.type, webhookUrl });
          return { ...clearedProviderFields, ...baseChannel, webhookUrl };
        }
        case "twilio": {
          const twilioAuthToken =
            normalizeSecretText(input.twilioAuthToken) ??
            (preserveCurrentSecrets ? current.twilioAuthToken : null);
          const channelConfig = {
            type: input.type,
            twilioAccountSid: normalizeOptionalText(input.twilioAccountSid),
            twilioAuthToken,
            twilioFrom: normalizeOptionalText(input.twilioFrom),
            twilioTo: normalizeOptionalText(input.twilioTo),
          };
          validateChannelConfig(channelConfig);
          return {
            ...clearedProviderFields,
            ...baseChannel,
            twilioAccountSid: channelConfig.twilioAccountSid,
            twilioAuthToken,
            twilioFrom: channelConfig.twilioFrom,
            twilioTo: channelConfig.twilioTo,
          };
        }
      }
    })(),
  );
  return { status: "OK" as const };
});

const deleteChannel = os.notification.delete.handler(async ({ context, input }) => {
  requireAuth(context);
  await channelQueries.deleteChannel(context.db, input.id);
  return { status: "OK" as const };
});

const testChannel = os.notification.test.handler(async ({ context, input }) => {
  requireAuth(context);
  const channel = await channelQueries.getChannelById(context.db, input.id);
  if (!channel) throw new ORPCError("NOT_FOUND", { message: "Channel not found" });

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
      status: "down",
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
  statusInfo: {
    get: getStatusInformation,
    getMaintenance: getMaintenance,
    createMaintenance: createMaintenance,
    updateMaintenance: updateMaintenance,
    deleteMaintenance: deleteMaintenance,
    createIncident: createIncident,
    updateIncident: updateIncident,
    resolveIncident: resolveIncident,
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
