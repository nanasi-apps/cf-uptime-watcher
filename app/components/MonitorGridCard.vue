<template>
  <ElCard
    :body-style="{ height: '100%', padding: '1rem' }"
    class="grid-card-shell"
    shadow="hover"
    @click="$emit('click')"
  >
    <div class="grid-card">
      <div class="grid-card-header">
        <div class="grid-card-title-group">
          <span class="grid-dot" :class="dotClass"></span>
          <span class="grid-card-title">{{ monitor.name }}</span>
        </div>
        <ElTag :type="tagType" effect="light" round size="small">{{ statusText }}</ElTag>
      </div>

      <div class="history-bars-sm">
        <template v-if="bars.length > 0">
          <div
            v-for="(bar, i) in bars"
            :key="i"
            class="bar-sm"
            :class="bar.isUp ? 'bar-up' : 'bar-down'"
            :title="barTooltip(bar)"
          ></div>
        </template>
        <template v-else>
          <div v-for="i in 30" :key="'empty-' + i" class="bar-sm bar-empty"></div>
        </template>
      </div>

      <div class="grid-card-meta">
        <span v-if="monitor.uptimePercent !== null" class="grid-uptime" :class="uptimeColorClass">
          {{ monitor.uptimePercent }}%
        </span>
        <span v-if="monitor.lastCheck" class="grid-response-time">
          {{ monitor.lastCheck.responseTime }}ms
        </span>
      </div>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
import type { CheckResult, MonitorWithStatus } from "./types";

const props = defineProps<{ monitor: MonitorWithStatus }>();
defineEmits<{ click: [] }>();
const { t } = useI18n();

const { status, uptimeColorClass } = useMonitorStatus(
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

const statusText = computed(() => {
  const map: Record<string, string> = {
    up: "status.up",
    down: "status.down",
    pending: "status.pending",
  };
  return t(map[status.value]);
});

const tagType = computed(() => {
  const map: Record<string, "success" | "danger" | "info"> = {
    up: "success",
    down: "danger",
    pending: "info",
  };
  return map[status.value];
});

const bars = computed(() => {
  const checks = props.monitor.recentChecks ?? [];
  return checks.slice(-30);
});

function barTooltip(check: CheckResult) {
  const time = new Date(check.checkedAt).toLocaleString();
  const s = check.isUp ? t("status.up") : t("status.down");
  const rt = check.responseTime
    ? t("monitor.responseTimeSuffix", { time: check.responseTime })
    : "";
  return t("monitor.tooltip", { time, status: s, responseTime: rt });
}
</script>

<style scoped>
.grid-card-shell {
  height: 100%;
  cursor: pointer;
}

.grid-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.grid-card-header,
.grid-card-title-group {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.grid-card-header {
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.grid-card-title-group {
  align-items: center;
  gap: 0.5rem;
}

.grid-card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
}

.grid-dot {
  width: 0.5rem;
  height: 0.5rem;
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

.history-bars-sm {
  display: flex;
  gap: 1px;
  height: 1.5rem;
  align-items: stretch;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.bar-sm {
  flex: 1;
  min-width: 0;
  border-radius: 1px;
  transition: opacity 0.1s;
}

.grid-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 1.25rem;
  margin-top: 0.75rem;
}

.grid-uptime,
.grid-response-time {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.grid-uptime {
  font-weight: 600;
}

.grid-response-time {
  color: var(--app-text-subtle);
}

.bar-sm:hover {
  opacity: 0.7;
}

.bar-up {
  background-color: var(--status-up);
}
.bar-down {
  background-color: var(--status-down);
}
.bar-empty {
  background-color: var(--bar-empty);
}
</style>
