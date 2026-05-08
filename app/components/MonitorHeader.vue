<template>
  <ElCard :body-style="{ padding: 0 }" class="bg-base-100 mb-6" shadow="never">
    <div class="monitor-header-card">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="header-status-dot" :class="dotClass"></span>
            <h2 class="text-xl font-bold m-0">{{ monitor.name }}</h2>
            <ElTag :type="tagType" effect="light" round size="small">{{ statusText }}</ElTag>
          </div>
          <div class="text-sm text-base-content/60">
            <span class="method-badge">{{ monitor.method }}</span>
            {{ monitor.url }}
          </div>
        </div>
        <div v-if="isAdmin" class="flex gap-2 flex-wrap">
          <ElButton plain size="small" type="primary" :loading="checking" @click="$emit('check')">
            今すぐチェック
          </ElButton>
          <ElButton plain size="small" type="primary" @click="$emit('duplicate')">複製</ElButton>
          <ElButton plain size="small" type="primary" @click="$emit('edit')">編集</ElButton>
          <ElButton size="small" type="danger" @click="$emit('delete')">削除</ElButton>
        </div>
      </div>

      <div class="stats-grid mt-5">
        <ElCard class="bg-base-200/50" shadow="never"
          ><ElStatistic title="稼働率" :value="uptimeValue"
        /></ElCard>
        <ElCard class="bg-base-200/50" shadow="never"
          ><ElStatistic title="応答時間" :value="responseTimeValue"
        /></ElCard>
        <ElCard class="bg-base-200/50" shadow="never"
          ><ElStatistic title="タイムアウト" :value="`${monitor.timeout}s`"
        /></ElCard>
        <ElCard class="bg-base-200/50" shadow="never"
          ><ElStatistic title="期待ステータス" :value="monitor.expectedStatus"
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

const uptimeValue = computed(() =>
  props.monitor.uptimePercent !== null ? `${props.monitor.uptimePercent}%` : "-",
);

const responseTimeValue = computed(() =>
  props.monitor.lastCheck?.responseTime != null ? `${props.monitor.lastCheck.responseTime}ms` : "-",
);
</script>

<style scoped>
.monitor-header-card {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem;
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
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
