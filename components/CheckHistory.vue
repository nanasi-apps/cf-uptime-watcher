<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <h3 class="font-bold text-lg mb-4 mt-0">Check History</h3>

      <!-- Uptime bar -->
      <div class="flex gap-0.5 mb-4 h-8">
        <div
          v-for="(check, i) in barData"
          :key="i"
          class="flex-1 rounded-sm min-w-1 tooltip"
          :class="check.isUp ? 'bg-success' : 'bg-error'"
          :data-tip="tooltip(check)"
        ></div>
        <div v-if="history.length === 0" class="flex-1 bg-base-content/10 rounded-sm"></div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Status</th>
              <th>Status Code</th>
              <th>Response Time</th>
              <th>Error</th>
              <th>Checked At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="check in history" :key="check.id">
              <td>
                <span class="badge badge-sm" :class="check.isUp ? 'badge-success' : 'badge-error'">
                  {{ check.isUp ? "Up" : "Down" }}
                </span>
              </td>
              <td class="font-mono">{{ check.statusCode ?? "-" }}</td>
              <td class="font-mono">
                {{ check.responseTime !== null ? `${check.responseTime}ms` : "-" }}
              </td>
              <td class="text-sm text-error max-w-xs truncate">
                {{ check.errorMessage ?? "-" }}
              </td>
              <td class="text-sm">{{ formatDate(check.checkedAt) }}</td>
            </tr>
            <tr v-if="history.length === 0">
              <td colspan="5" class="text-center text-base-content/50 py-8">No checks yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { CheckResult } from "./types";

const props = defineProps<{ history: CheckResult[] }>();

const barData = computed(() => [...props.history].reverse().slice(-90));

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function tooltip(check: CheckResult) {
  const time = formatDate(check.checkedAt);
  const status = check.isUp ? "Up" : "Down";
  const rt = check.responseTime ? ` (${check.responseTime}ms)` : "";
  return `${time} - ${status}${rt}`;
}
</script>
