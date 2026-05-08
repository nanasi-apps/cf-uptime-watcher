<template>
  <div>
    <StatsBar :total="monitors.length" :up="upCount" :down="downCount" />

    <div class="flex items-center justify-between mb-4 gap-2">
      <div v-if="isAdmin" class="flex gap-2">
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

    <div v-if="loading" class="text-center py-16">
      <div class="text-2xl mb-2">{{ t("dashboard.loadingTitle") }}</div>
      <p class="text-base-content/50 m-0">{{ t("dashboard.loadingDescription") }}</p>
    </div>

    <div v-else-if="monitors.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3 opacity-20">📡</div>
      <p class="text-base-content/50 m-0">{{ t("dashboard.empty") }}</p>
      <p v-if="isAdmin" class="text-base-content/40 text-sm mt-1 mb-0">
        {{ t("dashboard.emptyAdminHint") }}
      </p>
    </div>

    <!-- List view -->
    <div v-if="viewMode === 'list'" class="monitor-list space-y-3 mb-8">
      <MonitorCard
        v-for="monitor in monitors"
        :key="monitor.id"
        :monitor="monitor"
        @click="navigateTo(`/monitors/${monitor.id}`)"
      />
    </div>

    <!-- Grid view -->
    <div v-else class="monitor-grid mb-8">
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
  </div>
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
}

.monitor-list {
  min-width: 0;
}
</style>
