<template>
  <ElAlert
    :closable="false"
    :title="message"
    :type="alertType"
    center
    class="stats-alert"
    show-icon
  />
</template>

<script lang="ts" setup>
import type { StatusInformation } from "./types";

const props = defineProps<{
  total: number;
  up: number;
  down: number;
  maintenance: number;
  statusInfo: StatusInformation | null;
}>();
const { t } = useI18n();

const alertType = computed(() => {
  if (props.statusInfo?.activeMaintenance || props.maintenance > 0) return "warning";
  if (props.statusInfo?.activeIncident) return "error";
  if (props.total === 0) return "info";
  if (props.down === 0) return "success";
  if (props.down === props.total) return "error";
  return "warning";
});

const message = computed(() => {
  if (props.statusInfo?.activeMaintenance) return t("stats.maintenance");
  if (props.maintenance > 0) return t("stats.partialMaintenance", { count: props.maintenance });
  if (props.statusInfo?.activeIncident) return t("stats.incident");
  if (props.total === 0) return t("stats.empty");
  if (props.down === 0) return t("stats.allUp");
  if (props.down === props.total) return t("stats.allDown");
  return t("stats.partialDown", { count: props.down });
});
</script>

<style scoped>
.stats-alert {
  margin-bottom: 1.5rem;
}
</style>
