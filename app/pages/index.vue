<template>
  <div>
    <StatsBar :total="monitors.length" :up="upCount" :down="downCount" />

    <div class="flex items-center justify-between mb-4 gap-2">
      <div v-if="isAdmin" class="flex gap-2">
        <AppButton variant="outline" size="sm" @click="showImportModal = true">
          インポート
        </AppButton>
        <AppButton variant="primary" size="sm" @click="showCreateModal = true">
          + モニター追加
        </AppButton>
      </div>
      <div v-else></div>

      <!-- View mode toggle -->
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          title="リスト表示"
          @click="setViewMode('list')"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="6.75" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="11.5" width="14" height="2.5" rx="0.5" />
          </svg>
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          title="グリッド表示"
          @click="setViewMode('grid')"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16">
      <div class="text-2xl mb-2">ロード中…</div>
      <p class="text-base-content/50 m-0">読み込み中です。しばらくお待ちください。</p>
    </div>

    <div v-else-if="monitors.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3 opacity-20">📡</div>
      <p class="text-base-content/50 m-0">モニターがまだありません。</p>
      <p v-if="isAdmin" class="text-base-content/40 text-sm mt-1 mb-0">
        「+ モニター追加」ボタンから追加してください。
      </p>
    </div>

    <!-- List view -->
    <div v-if="viewMode === 'list'" class="space-y-3 mb-8">
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

onMounted(() => {
  isAdmin.value = !!localStorage.getItem("auth_token");
  initViewMode();
  loadMonitors();
});
</script>

<style scoped>
.view-toggle {
  display: flex;
  border: 1px solid var(--border-subtle);
  border-radius: 0.5rem;
  overflow: hidden;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.625rem;
  border: none;
  background: transparent;
  color: var(--color-base-content, gray);
  opacity: 0.4;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
}

.toggle-btn:hover {
  background: var(--surface-hover);
  opacity: 0.7;
}

.toggle-btn.active {
  background: var(--bar-empty);
  opacity: 1;
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--border-subtle);
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .monitor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
