<template>
  <ElCard :body-style="{ padding: '1.25rem' }" class="monitor-header-shell" shadow="never">
    <div class="monitor-header-card">
      <div class="monitor-header-top">
        <div>
          <div class="monitor-title-row">
            <span class="header-status-dot" :class="dotClass"></span>
            <h2 class="monitor-title">{{ monitor.name }}</h2>
            <ElTag :type="tagType" effect="light" round size="small">{{ statusText }}</ElTag>
          </div>
          <div class="monitor-url">
            <span class="method-badge">{{ monitor.method }}</span>
            {{ monitor.url }}
          </div>
        </div>
        <div v-if="isAdmin" class="monitor-actions">
          <ElButton plain size="small" type="primary" :loading="checking" @click="$emit('check')">
            {{ t("monitor.checkNow") }}
          </ElButton>
          <ElButton plain size="small" type="primary" @click="$emit('duplicate')">
            {{ t("monitor.duplicate") }}
          </ElButton>
          <ElButton plain size="small" type="primary" @click="$emit('edit')">
            {{ t("common.edit") }}
          </ElButton>
          <ElButton size="small" type="danger" @click="$emit('delete')">
            {{ t("common.delete") }}
          </ElButton>
        </div>
      </div>

      <div class="stats-grid">
        <ElCard class="app-card-muted" shadow="never"
          ><ElStatistic
            :title="t('monitor.uptime')"
            :value="uptimeValue"
            :formatter="formatUptime"
            suffix="%"
        /></ElCard>
        <ElCard class="app-card-muted" shadow="never"
          ><ElStatistic
            :title="t('monitor.responseTime')"
            :value="responseTimeValue"
            :formatter="formatResponseTime"
            suffix="ms"
        /></ElCard>
        <ElCard class="app-card-muted" shadow="never"
          ><ElStatistic :title="t('monitor.timeout')" :value="monitor.timeout" suffix="s"
        /></ElCard>
        <ElCard class="app-card-muted" shadow="never"
          ><ElStatistic :title="t('monitor.expectedStatus')" :value="monitor.expectedStatus"
        /></ElCard>
      </div>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
import type { MonitorWithStatus } from "./types";

const props = defineProps<{
  monitor: MonitorWithStatus;
  checking: boolean;
  isAdmin: boolean;
}>();
defineEmits<{ check: []; delete: []; edit: []; duplicate: [] }>();
const { t } = useI18n();

const { status, uptimeColorClass, statusText } = useMonitorStatus(
  () => props.monitor.lastCheck,
  () => props.monitor.uptimePercent,
);

const dotClass = computed(() => {
  const map: Record<string, string> = {
    up: "dot-up",
    down: "dot-down",
    pending: "dot-pending",
  };
  return map[status.value];
});

const tagType = computed(() => {
  const map: Record<string, "success" | "danger" | "info"> = {
    up: "success",
    down: "danger",
    pending: "info",
  };
  return map[status.value];
});

const uptimeValue = computed(() => props.monitor.uptimePercent ?? 0);
const responseTimeValue = computed(() => props.monitor.lastCheck?.responseTime ?? 0);

function formatUptime(value: number) {
  return props.monitor.uptimePercent !== null ? String(value) : "-";
}

function formatResponseTime(value: number) {
  return props.monitor.lastCheck?.responseTime != null ? String(value) : "-";
}
</script>

<style scoped>
.monitor-header-shell {
  margin-bottom: 1.5rem;
}

.monitor-header-card {
  min-width: 0;
}

.monitor-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.monitor-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.monitor-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.monitor-url {
  color: var(--app-text-muted);
  font-size: 0.875rem;
  word-break: break-all;
}

.monitor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.header-status-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.dot-up {
  background-color: var(--status-up);
}
.dot-down {
  background-color: var(--status-down);
  animation: pulse-slow 2s ease-in-out infinite;
}
.dot-pending {
  background-color: var(--color-base-content, gray);
  opacity: 0.3;
}

.method-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--bar-empty);
  font-family: ui-monospace, monospace;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1.25rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
