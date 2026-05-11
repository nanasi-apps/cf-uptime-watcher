<template>
  <div>
    <nav class="monitor-breadcrumbs">
      <ol>
        <li>
          <NuxtLink to="/">{{ t("monitor.title") }}</NuxtLink>
        </li>
        <li class="monitor-breadcrumb-current">{{ monitor?.name ?? t("monitor.loading") }}</li>
      </ol>
    </nav>

    <div v-if="!monitor" class="monitor-loading">
      <ElCard shadow="never">
        <div class="loading-skeleton">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-text"></div>
          <div class="skeleton-grid">
            <div v-for="i in 4" :key="i" class="skeleton-stat"></div>
          </div>
        </div>
      </ElCard>
    </div>

    <template v-else>
      <MonitorHeader
        :monitor="monitor"
        :checking="checking"
        :is-admin="isAdmin"
        @check="checkNow"
        @delete="confirmDelete"
        @edit="showEditModal = true"
        @duplicate="duplicateMonitor"
      />

      <MonitorChannelSelector
        v-if="isAdmin && monitorId !== null"
        :monitor-id="monitorId"
        :channel-ids="monitor.channelIds"
      />

      <CheckHistory :history="history" />

      <MonitorEditModal
        v-if="isAdmin"
        :open="showEditModal"
        :monitor="monitor"
        @close="showEditModal = false"
        @updated="loadMonitor"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import type { MonitorWithStatus, CheckResult } from "~/components/types";

const route = useRoute();
const monitorId = computed(() => parseMonitorId(route.params.id, route.path));
const monitorDataKey = computed(() => `monitor-${monitorId.value ?? "invalid"}`);
const { t } = useI18n();
const client = useRpcClient();
const { syncCookie: syncAuthCookie } = useAuthToken();

if (monitorId.value === null) {
  await navigateTo("/");
}

const { data: monitorData } = await useAsyncData(monitorDataKey, () => loadMonitorData(), {
  watch: [monitorId],
});

const monitor = ref<MonitorWithStatus | null>(null);
const history = ref<CheckResult[]>([]);
const checking = ref(false);
const isAdmin = ref(false);
const showEditModal = ref(false);

function parseMonitorId(param: unknown, path: string) {
  const value = Array.isArray(param) ? param[0] : param;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);

  const match = path.match(/^\/monitors\/(\d+)(?:\/|$)/);
  return match ? Number(match[1]) : null;
}

async function loadMonitor() {
  if (monitorId.value === null) return;

  monitor.value = await client.monitor.get({ id: monitorId.value });
}

async function loadHistory() {
  if (monitorId.value === null) return;

  history.value = await client.monitor.history({ id: monitorId.value, limit: 200 });
}

async function loadMonitorData(): Promise<{
  monitor: MonitorWithStatus | null;
  history: CheckResult[];
}> {
  if (monitorId.value === null) return { monitor: null, history: [] };

  const [monitor, history] = await Promise.all([
    client.monitor.get({ id: monitorId.value }),
    client.monitor.history({ id: monitorId.value, limit: 200 }),
  ]);

  return { monitor, history };
}

watch(
  monitorData,
  (data) => {
    monitor.value = data?.monitor ?? null;
    history.value = data?.history ?? [];
  },
  { immediate: true },
);

watch(monitorId, async (id) => {
  if (id === null) await navigateTo("/");
});

async function checkNow() {
  if (monitorId.value === null) return;

  checking.value = true;
  try {
    await client.monitor.checkNow({ id: monitorId.value });
    await Promise.all([loadMonitor(), loadHistory()]);
  } finally {
    checking.value = false;
  }
}

async function confirmDelete() {
  try {
    await ElMessageBox.confirm(
      t("monitor.deleteConfirmMessage", { name: monitor.value?.name ?? "" }),
      t("monitor.deleteConfirmTitle"),
      {
        confirmButtonText: t("common.delete"),
        cancelButtonText: t("common.cancel"),
        type: "warning",
      },
    );
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(e instanceof Error ? e.message : String(e));
    }
    return;
  }
  if (monitorId.value === null) return;

  await client.monitor.delete({ id: monitorId.value });
  await navigateTo("/");
}

async function duplicateMonitor() {
  if (!monitor.value?.url) return;
  const m = monitor.value;
  try {
    const created = await client.monitor.create({
      name: `${m.name} (${t("monitor.copySuffix")})`,
      url: m.url,
      method: m.method as "GET" | "POST",
      headers: m.headers,
      body: m.body,
      timeout: m.timeout,
      expectedStatus: m.expectedStatus,
    });
    await navigateTo(`/monitors/${created.id}`);
  } catch (e) {
    ElMessage.error(
      t("monitor.duplicateFailed", {
        message: e instanceof Error ? e.message : t("common.unknownError"),
      }),
    );
  }
}

onMounted(async () => {
  isAdmin.value = Boolean(syncAuthCookie());
});
</script>

<style scoped>
.monitor-breadcrumbs {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.monitor-breadcrumbs ol {
  display: flex;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.monitor-breadcrumbs li + li::before {
  content: "/";
  margin-right: 0.5rem;
  color: var(--app-text-subtle);
}

.monitor-breadcrumb-current {
  color: var(--app-text-muted);
}

.monitor-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: pulse-slow 2s ease-in-out infinite;
}

.skeleton-line,
.skeleton-stat {
  border-radius: 0.25rem;
  background: var(--el-fill-color);
}

.skeleton-title {
  width: 33%;
  height: 1.5rem;
}

.skeleton-text {
  width: 66%;
  height: 1rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.skeleton-stat {
  height: 3rem;
}
</style>
