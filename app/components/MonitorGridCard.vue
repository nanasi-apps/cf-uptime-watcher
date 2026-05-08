<template>
  <ElCard
    :body-style="{ padding: 0 }"
    class="bg-base-100 h-full"
    shadow="hover"
    @click="$emit('click')"
  >
    <div class="grid-card">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <span class="grid-dot" :class="dotClass"></span>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ monitor.name }}</div>
            <div class="text-xs text-base-content/50 truncate mt-0.5">
              {{ monitor.url }}
            </div>
          </div>
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

      <div class="grid-card-meta mt-3">
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
  min-width: 0;
  overflow: hidden;
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
