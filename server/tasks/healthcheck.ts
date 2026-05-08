import { defineTask } from "nitropack/runtime";
import { dbD1 } from "../../database/drizzle/db";
import * as queries from "../../database/drizzle/queries/monitors";
import * as channelQueries from "../../database/drizzle/queries/notification-channels";
import * as mnQueries from "../../database/drizzle/queries/monitor-notifications";
import * as statusQueries from "../../database/drizzle/queries/status-events";
import { performCheck } from "../check";
import { buildNotifiersFromChannels, sendNotifications } from "../notifiers";

export default defineTask({
  meta: { name: "healthcheck", description: "Run health checks on all active monitors" },
  async run() {
    const env = (globalThis as Record<string, unknown>).__env__ as Env | undefined;
    if (!env?.DB) {
      console.error("[healthcheck task] No env.DB available");
      return { result: "no-env" };
    }

    const db = dbD1(env.DB);
    const monitors = await queries.getActiveMonitors(db);
    const allChannels = await channelQueries.getActiveChannels(db);
    const activeMaintenance = await statusQueries.getActiveMaintenanceEvent(db);

    await Promise.allSettled(
      monitors.map(async (monitor) => {
        const previousCheck = await queries.getLatestNonMaintenanceCheckResult(db, monitor.id);
        const previouslyUp = previousCheck?.isUp ?? true;

        const result = activeMaintenance
          ? {
              statusCode: null,
              responseTime: null,
              isUp: true,
              status: "maintenance" as const,
              errorMessage: null,
            }
          : await performCheck(monitor);
        await queries.insertCheckResult(db, {
          monitorId: monitor.id,
          ...result,
        });

        if (activeMaintenance) return;

        if (!result.isUp) {
          console.error(
            `[CHECK FAILED] ${monitor.name} (${monitor.url}): ${result.statusCode ?? "N/A"} - ${result.errorMessage ?? "Unknown error"}`,
          );
        }

        const stateChanged = previouslyUp !== result.isUp;
        if (stateChanged) {
          const linkedChannelIds = await mnQueries.getChannelIdsForMonitor(db, monitor.id);
          const channelIdSet = new Set(linkedChannelIds.map((r) => r.channelId));
          const monitorChannels = allChannels.filter((ch) => channelIdSet.has(ch.id));

          if (monitorChannels.length > 0) {
            const notifiers = buildNotifiersFromChannels(monitorChannels);
            await sendNotifications(notifiers, { monitor, result, previouslyUp });
          }
        }
      }),
    );

    return { result: "ok" };
  },
});
