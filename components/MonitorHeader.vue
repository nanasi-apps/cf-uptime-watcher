<template>
  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-4 h-4 rounded-full"
              :class="
                monitor.lastCheck?.isUp
                  ? 'bg-success'
                  : monitor.lastCheck
                    ? 'bg-error'
                    : 'bg-base-content/30'
              "
            ></div>
            <h2 class="text-xl font-bold m-0">{{ monitor.name }}</h2>
            <span
              class="badge"
              :class="
                monitor.lastCheck?.isUp
                  ? 'badge-success'
                  : monitor.lastCheck
                    ? 'badge-error'
                    : 'badge-ghost'
              "
            >
              {{ monitor.lastCheck?.isUp ? "Up" : monitor.lastCheck ? "Down" : "Pending" }}
            </span>
          </div>
          <div class="text-sm text-base-content/60">
            <span class="badge badge-ghost badge-sm mr-1">{{ monitor.method }}</span>
            {{ monitor.url }}
          </div>
        </div>
        <div v-if="isAdmin" class="flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline" :disabled="checking" @click="$emit('check')">
            <span v-if="checking" class="loading loading-spinner loading-xs"></span>
            Check Now
          </button>
          <button class="btn btn-sm btn-outline btn-error" @click="$emit('delete')">Delete</button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <div>
          <div class="text-xs text-base-content/50 uppercase">Uptime</div>
          <div class="text-lg font-mono" :class="uptimeColor">
            {{ monitor.uptimePercent !== null ? `${monitor.uptimePercent}%` : "-" }}
          </div>
        </div>
        <div>
          <div class="text-xs text-base-content/50 uppercase">Response Time</div>
          <div class="text-lg font-mono">
            {{
              monitor.lastCheck?.responseTime != null ? `${monitor.lastCheck.responseTime}ms` : "-"
            }}
          </div>
        </div>
        <div>
          <div class="text-xs text-base-content/50 uppercase">Timeout</div>
          <div class="text-lg font-mono">{{ monitor.timeout }}s</div>
        </div>
        <div>
          <div class="text-xs text-base-content/50 uppercase">Expected Status</div>
          <div class="text-lg font-mono">{{ monitor.expectedStatus }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { MonitorWithStatus } from "./types";

const props = defineProps<{
  monitor: MonitorWithStatus;
  checking: boolean;
  isAdmin: boolean;
}>();
defineEmits<{ check: []; delete: [] }>();

const uptimeColor = computed(() => {
  const p = props.monitor.uptimePercent;
  if (p === null) return "";
  if (p >= 99) return "text-success";
  if (p >= 95) return "text-warning";
  return "text-error";
});
</script>
