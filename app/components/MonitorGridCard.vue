<template>
  <div class="grid-card bg-base-100" @click="$emit('click')">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="grid-dot" :class="dotClass"></span>
        <span class="font-semibold text-sm truncate">{{ monitor.name }}</span>
      </div>
      <span class="status-label" :class="statusLabelClass">{{ statusText }}</span>
    </div>

    <div class="text-xs text-base-content/50 truncate mb-3">
      {{ monitor.url }}
    </div>

    <div class="history-bars-sm">
      <template v-if="bars.length > 0">
        <div
          v-for="(bar, i) in bars"
          :key="i"
          class="bar-sm tooltip"
          :class="bar.isUp ? 'bar-up' : 'bar-down'"
          :data-tip="barTooltip(bar)"
        ></div>
      </template>
      <template v-else>
        <div v-for="i in 30" :key="'empty-' + i" class="bar-sm bar-empty"></div>
      </template>
    </div>

    <div class="flex items-center justify-between mt-2">
      <span
        v-if="monitor.uptimePercent !== null"
        class="font-mono text-xs font-semibold"
        :class="uptimeColorClass"
      >
        {{ monitor.uptimePercent }}%
      </span>
      <span v-if="monitor.lastCheck" class="text-xs text-base-content/40 font-mono">
        {{ monitor.lastCheck.responseTime }}ms
      </span>
    </div>
  </div>
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

const statusLabelClass = computed(() => {
  const map: Record<string, string> = {
    up: "label-up",
    down: "label-down",
    pending: "label-pending",
  };
  return map[status.value];
});

const bars = computed(() => {
  const checks = props.monitor.recentChecks ?? [];
  return checks.slice(-30);
});

function barTooltip(check: CheckResult) {
  const time = new Date(check.checkedAt).toLocaleString();
  const s = check.isUp ? "稼働中" : "停止";
  const rt = check.responseTime ? ` (${check.responseTime}ms)` : "";
  return `${time} - ${s}${rt}`;
}
</script>

<style scoped>
.grid-card {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  /* make cards stretch to equal height inside the grid */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.grid-card:hover {
  box-shadow: 0 2px 8px var(--border-subtle);
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

.status-label {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.label-up {
  background-color: var(--status-up-bg);
  color: var(--status-up-fg);
}
.label-down {
  background-color: var(--status-down-bg);
  color: var(--status-down-fg);
}
.label-pending {
  background-color: var(--color-base-200);
  color: var(--color-base-content, gray);
  opacity: 0.7;
}

.history-bars-sm {
  display: flex;
  gap: 1px;
  height: 1.25rem;
  align-items: stretch;
}

.bar-sm {
  flex: 1;
  min-width: 2px;
  border-radius: 1px;
  transition: opacity 0.1s;
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
