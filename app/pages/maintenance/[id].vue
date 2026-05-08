<template>
  <div>
    <nav class="maintenance-breadcrumbs">
      <ol>
        <li>
          <NuxtLink to="/">{{ t("monitor.title") }}</NuxtLink>
        </li>
        <li class="maintenance-breadcrumb-current">
          {{ maintenance?.title ?? t("maintenance.loading") }}
        </li>
      </ol>
    </nav>

    <ElCard v-if="loading" shadow="never">
      <div class="loading-skeleton">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text-short"></div>
      </div>
    </ElCard>

    <ElCard v-else-if="maintenance" :body-style="{ padding: '1.25rem' }" shadow="never">
      <div class="maintenance-detail">
        <div class="maintenance-header">
          <ElTag :type="tagType" effect="light" round>{{ statusLabel }}</ElTag>
          <h1 class="maintenance-title">{{ maintenance.title }}</h1>
        </div>

        <dl class="maintenance-meta">
          <div>
            <dt>{{ t("statusInfo.startAt") }}</dt>
            <dd>{{ formatDate(maintenance.startAt) }}</dd>
          </div>
          <div>
            <dt>{{ t("statusInfo.endAt") }}</dt>
            <dd>{{ formatDate(maintenance.endAt) }}</dd>
          </div>
        </dl>

        <section class="affected-services">
          <h2>{{ t("maintenance.affectedServices") }}</h2>
          <div v-if="affectedMonitors.length > 0" class="affected-service-list">
            <NuxtLink
              v-for="monitor in affectedMonitors"
              :key="monitor.id"
              class="affected-service-item"
              :to="`/monitors/${monitor.id}`"
            >
              <StatusDot :status="monitorStatus(monitor)" />
              <span>{{ monitor.name }}</span>
            </NuxtLink>
          </div>
          <p v-else class="maintenance-message app-subtle">
            {{ t("maintenance.allServicesAffected") }}
          </p>
        </section>

        <p v-if="maintenance.message" class="maintenance-message">
          {{ maintenance.message }}
        </p>
        <p v-else class="maintenance-message app-subtle">
          {{ t("maintenance.noMessage") }}
        </p>
      </div>
    </ElCard>

    <ElEmpty v-else :description="t('maintenance.notFound')">
      <ElButton type="primary" @click="navigateTo('/')">
        {{ t("settings.home") }}
      </ElButton>
    </ElEmpty>
  </div>
</template>

<script setup lang="ts">
import type { MaintenanceEvent, MonitorWithStatus } from "~/components/types";

const route = useRoute();
const { t } = useI18n();

const maintenanceId = computed(() => parseMaintenanceId(route.params.id, route.path));
const maintenance = ref<MaintenanceEvent | null>(null);
const monitors = ref<MonitorWithStatus[]>([]);
const loading = ref(false);

const affectedMonitors = computed(() => {
  const monitorIds = maintenance.value?.monitorIds ?? [];
  if (monitorIds.length === 0) return [];

  const monitorIdSet = new Set(monitorIds);
  return monitors.value.filter((monitor) => monitorIdSet.has(monitor.id));
});

const statusLabel = computed(() => {
  if (!maintenance.value) return "";

  const now = Date.now();
  const startAt = new Date(maintenance.value.startAt).getTime();
  const endAt = new Date(maintenance.value.endAt).getTime();
  if (now < startAt) return t("maintenance.statusPlanned");
  if (now <= endAt) return t("maintenance.statusActive");
  return t("maintenance.statusEnded");
});

const tagType = computed(() => {
  if (!maintenance.value) return "info";

  const now = Date.now();
  const startAt = new Date(maintenance.value.startAt).getTime();
  const endAt = new Date(maintenance.value.endAt).getTime();
  if (now < startAt) return "warning";
  if (now <= endAt) return "warning";
  return "info";
});

function parseMaintenanceId(param: unknown, path: string) {
  const value = Array.isArray(param) ? param[0] : param;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);

  const match = path.match(/^\/maintenance\/(\d+)(?:\/|$)/);
  return match ? Number(match[1]) : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function monitorStatus(monitor: MonitorWithStatus) {
  if (monitor.lastCheck?.status === "up" || monitor.lastCheck?.status === "down") {
    return monitor.lastCheck.status;
  }
  return "pending";
}

async function loadMaintenance() {
  if (maintenanceId.value === null) return;

  loading.value = true;
  try {
    const [maintenanceEvent, monitorList] = await Promise.all([
      client.statusInfo.getMaintenance({ id: maintenanceId.value }),
      client.monitor.list(),
    ]);
    maintenance.value = maintenanceEvent;
    monitors.value = monitorList;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (maintenanceId.value === null) {
    await navigateTo("/");
    return;
  }

  await loadMaintenance();
});
</script>

<style scoped>
.maintenance-breadcrumbs {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.maintenance-breadcrumbs ol {
  display: flex;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.maintenance-breadcrumbs li + li::before {
  content: "/";
  margin-right: 0.5rem;
  color: var(--app-text-subtle);
}

.maintenance-breadcrumb-current {
  color: var(--app-text-muted);
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: pulse-slow 2s ease-in-out infinite;
}

.skeleton-line {
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

.skeleton-text-short {
  width: 50%;
  height: 1rem;
}

.maintenance-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.maintenance-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.maintenance-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.maintenance-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  margin: 0;
}

.maintenance-meta div {
  padding: 0.875rem;
  border-radius: 0.5rem;
  background: var(--el-fill-color-light);
}

.maintenance-meta dt {
  margin-bottom: 0.25rem;
  color: var(--app-text-subtle);
  font-size: 0.75rem;
}

.maintenance-meta dd {
  margin: 0;
  font-weight: 600;
}

.maintenance-message {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.affected-services h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.affected-service-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.affected-service-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  color: var(--app-text);
  background: var(--el-fill-color-light);
  text-decoration: none;
}

.affected-service-item:hover {
  background: var(--surface-hover);
}
</style>
