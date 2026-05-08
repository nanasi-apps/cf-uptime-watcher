import type { dbD1 } from "../../database/drizzle/db";
import * as mnQueries from "../../database/drizzle/queries/monitor-notifications";
import * as monitorQueries from "../../database/drizzle/queries/monitors";
import * as channelQueries from "../../database/drizzle/queries/notification-channels";
import * as statusQueries from "../../database/drizzle/queries/status-events";

type DB = ReturnType<typeof dbD1>;

function isUpStatus(check: { isUp: boolean; status?: string }) {
  return check.status ? check.status === "up" : check.isUp;
}

function isMaintenanceStatus(check: { status?: string }) {
  return check.status === "maintenance";
}

function maskMonitorData<T extends { displayName?: string | null; name: string; url: string }>(
  monitor: T,
  hasAuth: boolean,
) {
  if (hasAuth) return monitor;

  return {
    ...monitor,
    name: monitor.displayName || monitor.name,
    url: monitor.url || "Hidden",
    headers: null,
    body: null,
  };
}

async function getMonitorWithChannelIds(db: DB, monitorId: number) {
  const rows = await mnQueries.getChannelIdsForMonitor(db, monitorId);
  return rows.map((row) => row.channelId);
}

export async function getStatusInformation(db: DB) {
  const [maintenanceEvents, activeMaintenance, incidents, activeIncident] = await Promise.all([
    statusQueries.getMaintenanceEvents(db),
    statusQueries.getActiveMaintenanceEvent(db),
    statusQueries.getIncidents(db),
    statusQueries.getActiveIncident(db),
  ]);

  const maintenanceEventsWithMonitorIds = await Promise.all(
    maintenanceEvents.map(async (event) => ({
      ...event,
      monitorIds: (await statusQueries.getMonitorIdsForMaintenance(db, event.id)).map(
        (row) => row.monitorId,
      ),
    })),
  );

  const activeMaintenanceWithMonitorIds = activeMaintenance
    ? {
        ...activeMaintenance,
        monitorIds: (await statusQueries.getMonitorIdsForMaintenance(db, activeMaintenance.id)).map(
          (row) => row.monitorId,
        ),
      }
    : null;

  const hasDownMonitor = await monitorQueries.hasCurrentDownMonitor(db);
  return {
    maintenanceEvents: maintenanceEventsWithMonitorIds,
    activeMaintenance: activeMaintenanceWithMonitorIds,
    incidents,
    activeIncident: activeIncident ?? null,
    canCreateIncident: hasDownMonitor && !activeMaintenance,
  };
}

export async function getMonitorsWithStatus(db: DB, hasAuth: boolean) {
  const monitors = await monitorQueries.getAllMonitors(db);
  return Promise.all(
    monitors.map(async (monitor) => {
      const lastCheck = (await monitorQueries.getLatestCheckResult(db, monitor.id)) ?? null;
      const history = await monitorQueries.getCheckResults(db, monitor.id, 100);
      const uptimeHistory = history.filter((check) => !isMaintenanceStatus(check));
      const upChecks = uptimeHistory.filter((check) => isUpStatus(check)).length;
      const uptimePercent =
        uptimeHistory.length > 0
          ? Math.round((upChecks / uptimeHistory.length) * 10000) / 100
          : null;
      const channelIds = await getMonitorWithChannelIds(db, monitor.id);
      const recentChecks = [...history].reverse().slice(-90);

      return maskMonitorData(
        { ...monitor, lastCheck, uptimePercent, channelIds, recentChecks },
        hasAuth,
      );
    }),
  );
}

export async function getMonitorDetail(db: DB, id: number, hasAuth: boolean) {
  const monitor = await monitorQueries.getMonitorById(db, id);
  if (!monitor) return { monitor: null, history: [] };

  const lastCheck = (await monitorQueries.getLatestCheckResult(db, monitor.id)) ?? null;
  const history = await monitorQueries.getCheckResults(db, monitor.id, 200);
  const uptimeHistory = history.filter((check) => !isMaintenanceStatus(check));
  const upChecks = uptimeHistory.filter((check) => isUpStatus(check)).length;
  const uptimePercent =
    uptimeHistory.length > 0 ? Math.round((upChecks / uptimeHistory.length) * 10000) / 100 : null;
  const channelIds = await getMonitorWithChannelIds(db, monitor.id);

  return {
    monitor: maskMonitorData({ ...monitor, lastCheck, uptimePercent, channelIds }, hasAuth),
    history,
  };
}

export async function getMaintenanceDetail(db: DB, id: number, hasAuth: boolean) {
  const event = await statusQueries.getMaintenanceEvent(db, id);
  const maintenance = event
    ? {
        ...event,
        monitorIds: (await statusQueries.getMonitorIdsForMaintenance(db, event.id)).map(
          (row) => row.monitorId,
        ),
      }
    : null;

  return {
    maintenance,
    monitors: await getMonitorsWithStatus(db, hasAuth),
  };
}

export async function getSettingsData(db: DB) {
  const [monitors, statusInfo, channels] = await Promise.all([
    getMonitorsWithStatus(db, true),
    getStatusInformation(db),
    channelQueries.getAllChannels(db),
  ]);

  return { monitors, statusInfo, channels };
}
