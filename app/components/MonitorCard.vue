<template>
  <ElCard :body-style="{ padding: 0 }" class="bg-base-100" shadow="hover" @click="$emit('click')">
    <div class="monitor-row">
      <div class="monitor-row-header">
        <div class="flex items-center gap-2 min-w-0">
          <span class="status-dot" :class="dotClass"></span>
          <span class="font-semibold truncate">{{ monitor.name }}</span>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span v-if="monitor.lastCheck" class="text-xs text-base-content/50 hidden sm:inline">
            {{ monitor.lastCheck.responseTime }}ms
          </span>
          <span
            v-if="monitor.uptimePercent !== null"
            class="uptime-pct font-mono text-sm font-semibold"
            :class="uptimeColorClass"
          >
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
        <span class="text-xs text-base-content/40">{{ barsAgo }}</span>
        <span class="text-xs text-base-content/40">今</span>
      </div>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
import type { CheckResult, MonitorWithStatus } from "./types";

const props = defineProps<{ monitor: MonitorWithStatus }>();
defineEmits<{ click: [] }>();

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
    up: "稼働中",
    down: "停止",
    pending: "待機中",
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

const bars = computed(() => {
  const checks = props.monitor.recentChecks ?? [];
  return checks.slice(-90);
});

const barsAgo = computed(() => {
  const count = bars.value.length;
  if (count === 0) return "データなし";
  return `${count}回前`;
});

function barTooltip(check: CheckResult) {
  const time = new Date(check.checkedAt).toLocaleString();
  const s = check.isUp ? "稼働中" : "停止";
  const rt = check.responseTime ? ` (${check.responseTime}ms)` : "";
  return `${time} - ${s}${rt}`;
}
</script>

<style scoped>
.monitor-row {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}

.monitor-row:hover {
  box-shadow: 0 2px 8px var(--border-subtle);
}

.monitor-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
  gap: 1rem;
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
}
</style>
