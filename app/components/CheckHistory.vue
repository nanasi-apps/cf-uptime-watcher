<template>
  <ElCard :body-style="{ padding: 0 }" class="bg-base-100" shadow="never">
    <div class="check-history-section">
      <h3 class="font-bold text-lg mb-4 mt-0">チェック履歴</h3>

      <!-- Uptime bars -->
      <div class="history-bars-large">
        <div
          v-for="(check, i) in barData"
          :key="i"
          class="history-bar-lg"
          :class="check.isUp ? 'bar-up' : 'bar-down'"
          :title="tooltip(check)"
        ></div>
        <template v-if="history.length === 0">
          <div v-for="i in 90" :key="'empty-' + i" class="history-bar-lg bar-empty"></div>
        </template>
      </div>
      <div v-if="history.length > 0" class="bar-legend">
        <span class="text-xs text-base-content/40">{{ barData.length }}回前</span>
        <span class="text-xs text-base-content/40">最新</span>
      </div>

      <!-- Events list -->
      <div class="mt-6 space-y-2">
        <div v-for="check in history" :key="check.id" class="event-row">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="event-dot" :class="check.isUp ? 'dot-up' : 'dot-down'"></span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-sm">
                  {{ check.isUp ? "稼働中" : "停止" }}
                </span>
                <span v-if="check.statusCode" class="text-xs font-mono text-base-content/50">
                  HTTP {{ check.statusCode }}
                </span>
                <span
                  v-if="check.responseTime !== null"
                  class="text-xs font-mono text-base-content/50"
                >
                  {{ check.responseTime }}ms
                </span>
              </div>
              <div
                v-if="check.errorMessage"
                class="text-xs text-error mt-0.5"
                :class="isExpanded(check.id) ? '' : 'line-clamp-1'"
              >
                {{ check.errorMessage }}
              </div>
            </div>
          </div>
          <div class="text-xs text-base-content/40 shrink-0">
            {{ formatDate(check.checkedAt) }}
          </div>
          <ElButton
            v-if="shouldShowToggle(check.errorMessage)"
            class="shrink-0 ml-2"
            link
            size="small"
            type="primary"
            @click.stop="toggleExpanded(check.id)"
          >
            {{ isExpanded(check.id) ? "閉じる" : "詳細" }}
          </ElButton>
        </div>
        <div v-if="history.length === 0" class="text-center text-base-content/50 py-8">
          チェック履歴がありません
        </div>
      </div>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
import type { CheckResult } from "./types";

const props = defineProps<{ history: CheckResult[] }>();

const expandedIds = ref<number[]>([]);
const barData = computed(() => [...props.history].reverse().slice(-90));
const ERROR_TOGGLE_THRESHOLD = 80;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function tooltip(check: CheckResult) {
  const time = formatDate(check.checkedAt);
  const status = check.isUp ? "稼働中" : "停止";
  const rt = check.responseTime ? ` (${check.responseTime}ms)` : "";
  return `${time} - ${status}${rt}`;
}

function isExpanded(id: number) {
  return expandedIds.value.includes(id);
}

function toggleExpanded(id: number) {
  if (isExpanded(id)) {
    expandedIds.value = expandedIds.value.filter((expandedId) => expandedId !== id);
    return;
  }
  expandedIds.value = [...expandedIds.value, id];
}

function shouldShowToggle(errorMessage: string | null) {
  return Boolean(errorMessage && errorMessage.length > ERROR_TOGGLE_THRESHOLD);
}
</script>

<style scoped>
.check-history-section {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.history-bars-large {
  display: flex;
  gap: 1.5px;
  height: 2.5rem;
  align-items: stretch;
}

.history-bar-lg {
  flex: 1;
  min-width: 2px;
  border-radius: 2px;
  transition: opacity 0.1s;
  cursor: pointer;
}

.history-bar-lg:hover {
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

.event-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  transition: background 0.1s;
}

.event-row:hover {
  background: var(--surface-hover);
}

.event-dot {
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
}
</style>
