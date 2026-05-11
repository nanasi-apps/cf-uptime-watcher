<template>
  <StatsBar
    :down="downCount"
    :maintenance="maintenanceCount"
    :status-info="statusInfo"
    :total="monitors.length"
    :up="upCount"
  />
  <StatusInfoPanel :show-planned-maintenance="isAllSystemsUp" :status-info="statusInfo" />

  <div class="dashboard-toolbar">
    <div v-if="isAdmin" class="dashboard-actions">
      <ElButton plain size="small" type="primary" @click="showImportModal = true">
        {{ t("common.import") }}
      </ElButton>
      <ElButton size="small" type="primary" @click="showCreateModal = true">
        {{ t("common.addMonitor") }}
      </ElButton>
    </div>
    <div v-else></div>

    <!-- View mode toggle -->
    <ElSegmented
      :model-value="viewMode"
      :options="viewModeOptions"
      size="small"
      @update:model-value="handleViewModeChange"
    />
  </div>

  <div v-if="loading" class="dashboard-state">
    <div class="dashboard-state-title">{{ t("dashboard.loadingTitle") }}</div>
    <p class="dashboard-state-text">{{ t("dashboard.loadingDescription") }}</p>
  </div>

  <div v-else-if="monitors.length === 0" class="dashboard-state">
    <div class="dashboard-empty-icon">📡</div>
    <p class="dashboard-state-text">{{ t("dashboard.empty") }}</p>
    <p v-if="isAdmin" class="dashboard-state-hint">
      {{ t("dashboard.emptyAdminHint") }}
    </p>
  </div>

  <!-- List view -->
  <div v-if="viewMode === 'list'" class="monitor-list">
    <MonitorCard
      v-for="monitor in monitors"
      :key="monitor.id"
      :monitor="monitor"
      @click="openMonitor(monitor.id)"
    />
  </div>

  <!-- Grid view -->
  <div v-else class="monitor-grid">
    <MonitorGridCard
      v-for="monitor in monitors"
      :key="monitor.id"
      :monitor="monitor"
      @click="openMonitor(monitor.id)"
    />
  </div>

  <CreateMonitorModal
    v-if="isAdmin"
    :open="showCreateModal"
    @close="showCreateModal = false"
    @created="loadMonitors"
  />
  <ImportMonitorsModal
    v-if="isAdmin"
    :open="showImportModal"
    @close="showImportModal = false"
    @imported="loadMonitors"
  />
</template>

<script lang="ts" setup>
import type { MonitorWithStatus, StatusInformation } from "~/components/types";

type DashboardData = {
  monitors: MonitorWithStatus[];
  statusInfo: StatusInformation;
  isAdmin: boolean;
};

const client = useRpcClient();
const { read: readAuthToken, syncCookie: syncAuthCookie } = useAuthToken();

const { data: dashboardData, pending: loading } = await useLazyAsyncData("dashboard", () =>
  loadDashboardData(),
);

const monitors = ref<MonitorWithStatus[]>(dashboardData.value?.monitors ?? []);
const statusInfo = ref<StatusInformation | null>(dashboardData.value?.statusInfo ?? null);
const showCreateModal = ref(false);
const showImportModal = ref(false);
const isAdmin = ref((dashboardData.value?.isAdmin ?? false) || hasLocalAuthToken());

const { viewMode, init: initViewMode, set: setViewMode } = useViewMode();
const { t } = useI18n();
const viewModeOptions = computed(() => [
  { label: t("dashboard.viewList"), value: "list" },
  { label: t("dashboard.viewGrid"), value: "grid" },
]);

const upCount = computed(() => monitors.value.filter((m) => m.lastCheck?.status === "up").length);
const downCount = computed(
  () => monitors.value.filter((m) => m.lastCheck?.status === "down").length,
);
const maintenanceCount = computed(
  () => monitors.value.filter((m) => m.lastCheck?.status === "maintenance").length,
);
const isAllSystemsUp = computed(
  () =>
    monitors.value.length > 0 &&
    downCount.value === 0 &&
    maintenanceCount.value === 0 &&
    !statusInfo.value?.activeMaintenance &&
    !statusInfo.value?.activeIncident,
);

async function refreshDashboard() {
  const data = await loadDashboardData();
  applyDashboardData(data);
}

function applyDashboardData(data: DashboardData) {
  monitors.value = data.monitors;
  statusInfo.value = data.statusInfo;
  isAdmin.value = data.isAdmin || hasLocalAuthToken();
}

function hasLocalAuthToken() {
  return Boolean(readAuthToken());
}

async function loadDashboardData(): Promise<DashboardData> {
  const [monitors, statusInfo, isAdmin] = await Promise.all([
    client.monitor.list(),
    client.statusInfo.get(),
    client.auth
      .verify()
      .then(() => true)
      .catch(() => false),
  ]);

  return { monitors, statusInfo, isAdmin };
}

async function loadMonitors() {
  await refreshDashboard();
}

function handleViewModeChange(value: string | number | boolean) {
  if (value === "list" || value === "grid") setViewMode(value);
}

async function openMonitor(id: number) {
  await navigateTo(`/monitors/${id}`);
}

watch(dashboardData, (data) => {
  if (data) applyDashboardData(data);
});

onMounted(() => {
  const token = syncAuthCookie();
  isAdmin.value = isAdmin.value || Boolean(token);
  initViewMode();
});
</script>

<style scoped>
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
  min-width: 0;
  margin-bottom: 2rem;
}

.monitor-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  margin-bottom: 2rem;
}

.dashboard-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 1rem 0;
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-state {
  padding: 4rem 0;
  text-align: center;
}

.dashboard-state-title {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.dashboard-state-text {
  margin: 0;
  color: var(--app-text-muted);
}

.dashboard-state-hint {
  margin: 0.25rem 0 0;
  color: var(--app-text-subtle);
  font-size: 0.875rem;
}

.dashboard-empty-icon {
  margin-bottom: 0.75rem;
  font-size: 2.25rem;
  opacity: 0.2;
}
</style>
