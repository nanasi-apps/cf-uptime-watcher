<template>
  <div
    class="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    @click="$emit('click')"
  >
    <div class="card-body p-4 flex-row items-center gap-4">
      <div class="w-3 h-3 rounded-full shrink-0" :class="statusColor"></div>

      <div class="flex-1 min-w-0">
        <div class="font-semibold truncate">{{ monitor.name }}</div>
        <div class="text-sm text-base-content/60 truncate">
          <span class="badge badge-ghost badge-sm mr-1">{{ monitor.method }}</span>
          {{ monitor.url }}
        </div>
      </div>

      <div class="text-right shrink-0 hidden sm:block">
        <div v-if="monitor.uptimePercent !== null" class="text-sm font-mono" :class="uptimeColor">
          {{ monitor.uptimePercent }}%
        </div>
        <div v-if="monitor.lastCheck" class="text-xs text-base-content/50">
          {{ monitor.lastCheck.responseTime }}ms
        </div>
      </div>

      <div class="shrink-0">
        <span class="badge badge-sm" :class="statusBadge">
          {{ statusText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { MonitorWithStatus } from "./types";

const props = defineProps<{ monitor: MonitorWithStatus }>();
defineEmits<{ click: [] }>();

const statusColor = computed(() => {
  if (!props.monitor.lastCheck) return "bg-base-content/30";
  return props.monitor.lastCheck.isUp ? "bg-success" : "bg-error";
});

const statusBadge = computed(() => {
  if (!props.monitor.lastCheck) return "badge-ghost";
  return props.monitor.lastCheck.isUp ? "badge-success" : "badge-error";
});

const statusText = computed(() => {
  if (!props.monitor.lastCheck) return "Pending";
  return props.monitor.lastCheck.isUp ? "Up" : "Down";
});

const uptimeColor = computed(() => {
  const p = props.monitor.uptimePercent;
  if (p === null) return "";
  if (p >= 99) return "text-success";
  if (p >= 95) return "text-warning";
  return "text-error";
});
</script>
