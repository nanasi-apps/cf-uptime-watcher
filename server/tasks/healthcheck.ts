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
    const activeMaintenanceMonitorIds = activeMaintenance
      ? (await statusQueries.getMonitorIdsForMaintenance(db, activeMaintenance.id)).map(
          (row) => row.monitorId,
        )
      : [];
    const activeMaintenanceMonitorIdSet = new Set(activeMaintenanceMonitorIds);

    console.info({
      event: "healthcheck.task.start",
      activeMonitorCount: monitors.length,
      activeChannelCount: allChannels.length,
      hasActiveMaintenance: Boolean(activeMaintenance),
      activeMaintenanceMonitorCount: activeMaintenanceMonitorIds.length,
    });

    const monitorResults = await Promise.allSettled(
      monitors.map(async (monitor) => {
        try {
          const previousCheck = await queries.getLatestNonMaintenanceCheckResult(db, monitor.id);
          const previouslyUp = previousCheck?.isUp ?? true;

          const isUnderMaintenance = Boolean(
            activeMaintenance &&
            (activeMaintenanceMonitorIdSet.size === 0 ||
              activeMaintenanceMonitorIdSet.has(monitor.id)),
          );

          const result = isUnderMaintenance
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

          const linkedChannelIds = await mnQueries.getChannelIdsForMonitor(db, monitor.id);
          const channelIdSet = new Set(linkedChannelIds.map((row) => row.channelId));
          const monitorChannels = allChannels.filter((ch) => channelIdSet.has(ch.id));
          const stateChanged = previouslyUp !== result.isUp;

          console.info({
            event: "healthcheck.monitor.evaluated",
            monitorId: monitor.id,
            monitorName: monitor.name,
            maintenanceSuppressed: isUnderMaintenance,
            previouslyUp,
            isUp: result.isUp,
            stateChanged,
            linkedChannelCount: linkedChannelIds.length,
            activeMatchingChannelCount: monitorChannels.length,
            notifierCount: 0,
            notificationDispatchCompleted: false,
          });

          if (isUnderMaintenance) {
            console.info({
              event: "healthcheck.monitor.notification.dispatch.skipped",
              monitorId: monitor.id,
              monitorName: monitor.name,
              maintenanceSuppressed: isUnderMaintenance,
              previouslyUp,
              isUp: result.isUp,
              stateChanged,
              linkedChannelCount: linkedChannelIds.length,
              activeMatchingChannelCount: monitorChannels.length,
              notifierCount: 0,
              reason: "maintenance",
              notificationDispatchCompleted: false,
            });
            return;
          }

          if (!result.isUp) {
            console.error(
              `[CHECK FAILED] ${monitor.name} (${monitor.url}): ${result.statusCode ?? "N/A"} - ${result.errorMessage ?? "Unknown error"}`,
            );
          }

          if (stateChanged) {
            if (monitorChannels.length > 0) {
              const notifiers = buildNotifiersFromChannels(monitorChannels);

              if (notifiers.length === 0) {
                console.info({
                  event: "healthcheck.monitor.notification.dispatch.skipped",
                  monitorId: monitor.id,
                  monitorName: monitor.name,
                  maintenanceSuppressed: isUnderMaintenance,
                  previouslyUp,
                  isUp: result.isUp,
                  stateChanged,
                  linkedChannelCount: linkedChannelIds.length,
                  activeMatchingChannelCount: monitorChannels.length,
                  notifierCount: 0,
                  reason: "no_buildable_notifiers",
                  notificationDispatchCompleted: false,
                });
                return;
              }

              console.info({
                event: "healthcheck.monitor.notification.dispatch.start",
                monitorId: monitor.id,
                monitorName: monitor.name,
                maintenanceSuppressed: isUnderMaintenance,
                previouslyUp,
                isUp: result.isUp,
                stateChanged,
                linkedChannelCount: linkedChannelIds.length,
                activeMatchingChannelCount: monitorChannels.length,
                notifierCount: notifiers.length,
              });

              await sendNotifications(notifiers, { monitor, result, previouslyUp });

              console.info({
                event: "healthcheck.monitor.notification.dispatch.completed",
                monitorId: monitor.id,
                monitorName: monitor.name,
                maintenanceSuppressed: isUnderMaintenance,
                previouslyUp,
                isUp: result.isUp,
                stateChanged,
                linkedChannelCount: linkedChannelIds.length,
                activeMatchingChannelCount: monitorChannels.length,
                notifierCount: notifiers.length,
                notificationDispatchCompleted: true,
              });
              return;
            }

            console.info({
              event: "healthcheck.monitor.notification.dispatch.skipped",
              monitorId: monitor.id,
              monitorName: monitor.name,
              maintenanceSuppressed: isUnderMaintenance,
              previouslyUp,
              isUp: result.isUp,
              stateChanged,
              linkedChannelCount: linkedChannelIds.length,
              activeMatchingChannelCount: monitorChannels.length,
              notifierCount: 0,
              reason: "no_active_matching_channels",
              notificationDispatchCompleted: false,
            });
            return;
          }

          console.info({
            event: "healthcheck.monitor.notification.dispatch.skipped",
            monitorId: monitor.id,
            monitorName: monitor.name,
            maintenanceSuppressed: isUnderMaintenance,
            previouslyUp,
            isUp: result.isUp,
            stateChanged,
            linkedChannelCount: linkedChannelIds.length,
            activeMatchingChannelCount: monitorChannels.length,
            notifierCount: 0,
            reason: "state_unchanged",
            notificationDispatchCompleted: false,
          });
        } catch (error) {
          console.error({
            event: "healthcheck.monitor.failed",
            monitorId: monitor.id,
            monitorName: monitor.name,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }),
    );

    const failedMonitorResults = monitorResults.filter((result) => result.status === "rejected");

    console.info({
      event: "healthcheck.task.completed",
      activeMonitorCount: monitors.length,
      activeChannelCount: allChannels.length,
      failedMonitorCount: failedMonitorResults.length,
    });

    return { result: "ok" };
  },
});
