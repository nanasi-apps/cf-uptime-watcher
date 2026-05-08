<template>
  <StatsBar :total="monitors.length" :up="upCount" :down="downCount" />

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
      @click="navigateTo(`/monitors/${monitor.id}`)"
    />
  </div>

  <!-- Grid view -->
  <div v-else class="monitor-grid">
    <MonitorGridCard
      v-for="monitor in monitors"
      :key="monitor.id"
      :monitor="monitor"
      @click="navigateTo(`/monitors/${monitor.id}`)"
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
import type { MonitorWithStatus } from "~/components/types";

const monitors = ref<MonitorWithStatus[]>([]);
const showCreateModal = ref(false);
const showImportModal = ref(false);
const isAdmin = ref(false);

const { viewMode, init: initViewMode, set: setViewMode } = useViewMode();
const { t } = useI18n();
const viewModeOptions = computed(() => [
  { label: t("dashboard.viewList"), value: "list" },
  { label: t("dashboard.viewGrid"), value: "grid" },
]);

const upCount = computed(() => monitors.value.filter((m) => m.lastCheck?.isUp).length);
const downCount = computed(
  () => monitors.value.filter((m) => m.lastCheck && !m.lastCheck.isUp).length,
);

const loading = ref(false);

async function loadMonitors() {
  loading.value = true;
  try {
    monitors.value = await client.monitor.list();
  } catch (err) {
    // keep previous monitors on error and log for debugging
    // you may want to show a user-facing error later
    // eslint-disable-next-line no-console
    console.error("failed to load monitors", err);
  } finally {
    loading.value = false;
  }
}

function handleViewModeChange(value: string | number | boolean) {
  if (value === "list" || value === "grid") setViewMode(value);
}

onMounted(() => {
  isAdmin.value = !!localStorage.getItem("auth_token");
  initViewMode();
  loadMonitors();
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
