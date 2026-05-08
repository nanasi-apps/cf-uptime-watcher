<template>
  <ElCard :body-style="{ padding: '1.25rem' }" shadow="never">
    <div class="check-history-section">
      <h3 class="history-title">{{ t("monitor.history") }}</h3>

      <!-- Uptime bars -->
      <div class="history-bars-large">
        <div
          v-for="(check, i) in barData"
          :key="i"
          class="history-bar-lg"
          :class="barClass(check)"
          :title="tooltip(check)"
        ></div>
        <template v-if="history.length === 0">
          <div v-for="i in 90" :key="'empty-' + i" class="history-bar-lg bar-empty"></div>
        </template>
      </div>
      <div v-if="history.length > 0" class="bar-legend">
        <span>{{ t("monitor.previousCount", { count: barData.length }) }}</span>
        <span>{{ t("monitor.latest") }}</span>
      </div>

      <div class="event-list">
        <div v-for="check in history" :key="check.id" class="event-row">
          <div class="event-main">
            <span class="event-dot" :class="dotClass(check)"></span>
            <div class="event-body">
              <div class="event-meta">
                <span class="event-status">
                  {{ statusText(check) }}
                </span>
                <span v-if="check.statusCode" class="event-code">
                  HTTP {{ check.statusCode }}
                </span>
                <span v-if="check.responseTime !== null" class="event-code">
                  {{ check.responseTime }}ms
                </span>
              </div>
              <div
                v-if="check.errorMessage"
                class="event-error"
                :class="isExpanded(check.id) ? '' : 'event-error-clamped'"
              >
                {{ check.errorMessage }}
              </div>
            </div>
          </div>
          <div class="event-time">
            {{ formatDate(check.checkedAt) }}
          </div>
          <ElButton
            v-if="shouldShowToggle(check.errorMessage)"
            class="event-toggle"
            link
            size="small"
            type="primary"
            @click.stop="toggleExpanded(check.id)"
          >
            {{ isExpanded(check.id) ? t("common.close") : t("common.details") }}
          </ElButton>
        </div>
        <div v-if="history.length === 0" class="history-empty">
          {{ t("monitor.noHistory") }}
        </div>
      </div>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
import type { CheckResult } from "./types";

const props = defineProps<{ history: CheckResult[] }>();
const { t } = useI18n();

const expandedIds = ref<number[]>([]);
const barData = computed(() => [...props.history].reverse().slice(-90));
const ERROR_TOGGLE_THRESHOLD = 80;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function tooltip(check: CheckResult) {
  const time = formatDate(check.checkedAt);
  const status = statusText(check);
  const rt = check.responseTime
    ? t("monitor.responseTimeSuffix", { time: check.responseTime })
    : "";
  return t("monitor.tooltip", { time, status, responseTime: rt });
}

function statusText(check: CheckResult) {
  if (check.status === "maintenance") return t("status.maintenance");
  return check.isUp ? t("status.up") : t("status.down");
}

function barClass(check: CheckResult) {
  if (check.status === "maintenance") return "bar-maintenance";
  return check.isUp ? "bar-up" : "bar-down";
}

function dotClass(check: CheckResult) {
  if (check.status === "maintenance") return "dot-maintenance";
  return check.isUp ? "dot-up" : "dot-down";
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
  min-width: 0;
}

.history-title {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 700;
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
.bar-maintenance {
  background-color: var(--status-maintenance);
}
.bar-empty {
  background-color: var(--bar-empty);
}

.bar-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  color: var(--app-text-subtle);
  font-size: 0.75rem;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

.event-main,
.event-meta {
  display: flex;
  align-items: center;
}

.event-main {
  flex: 1;
  min-width: 0;
  gap: 0.75rem;
}

.event-body {
  flex: 1;
  min-width: 0;
}

.event-meta {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.event-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.event-code {
  color: var(--app-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.event-error {
  margin-top: 0.125rem;
  color: var(--el-color-danger);
  font-size: 0.75rem;
}

.event-error-clamped {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.event-time {
  flex-shrink: 0;
  color: var(--app-text-subtle);
  font-size: 0.75rem;
}

.event-toggle {
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.history-empty {
  padding: 2rem 0;
  color: var(--app-text-muted);
  text-align: center;
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
.dot-maintenance {
  background-color: var(--status-maintenance);
}
</style>
