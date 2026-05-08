<template>
  <ElCard
    :body-style="{ padding: '1rem 1.25rem' }"
    class="monitor-card"
    shadow="hover"
    @click="$emit('click')"
  >
    <div class="monitor-row">
      <div class="monitor-row-header">
        <div class="monitor-title-group">
          <span class="status-dot" :class="dotClass"></span>
          <span class="monitor-title">{{ monitor.name }}</span>
        </div>
        <div class="monitor-meta-group">
          <span v-if="monitor.lastCheck" class="response-time">
            {{ monitor.lastCheck.responseTime }}ms
          </span>
          <span v-if="monitor.uptimePercent !== null" class="uptime-pct" :class="uptimeColorClass">
            {{ monitor.uptimePercent }}%
          </span>
          <ElTag :type="tagType" effect="light" round size="small">
            {{ statusText }}
          </ElTag>
        </div>
      </div>
      <div class="history-bars">
        <template v-if="bars.length > 0">
          <div
            v-for="(bar, i) in bars"
            :key="i"
            class="history-bar"
            :class="bar.isUp ? 'bar-up' : 'bar-down'"
            :title="barTooltip(bar)"
          ></div>
        </template>
        <template v-else>
          <div v-for="i in 45" :key="'empty-' + i" class="history-bar bar-empty"></div>
        </template>
      </div>
      <div class="bar-legend">
        <span>{{ barsAgo }}</span>
        <span>{{ t("monitor.now") }}</span>
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
  return checks.slice(-90);
});

const barsAgo = computed(() => {
  const count = bars.value.length;
  if (count === 0) return t("monitor.noData");
  return t("monitor.previousCount", { count });
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
.monitor-card {
  cursor: pointer;
}

.monitor-row {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.monitor-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
  gap: 1rem;
}

.monitor-title-group,
.monitor-meta-group {
  display: flex;
  align-items: center;
  min-width: 0;
}

.monitor-title-group {
  gap: 0.5rem;
}

.monitor-meta-group {
  flex-shrink: 0;
  gap: 0.75rem;
}

.monitor-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.response-time,
.bar-legend {
  color: var(--app-text-muted);
  font-size: 0.75rem;
}

.status-dot {
  width: 0.625rem;
  height: 0.625rem;
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

.history-bars {
  display: flex;
  gap: 1.5px;
  height: 2rem;
  align-items: stretch;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.history-bar {
  flex: 1;
  min-width: 0;
  border-radius: 1.5px;
  transition: opacity 0.1s;
}

.history-bar:hover {
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

.bar-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.uptime-pct {
  min-width: 3.5rem;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .response-time {
    display: none;
  }
}
</style>
