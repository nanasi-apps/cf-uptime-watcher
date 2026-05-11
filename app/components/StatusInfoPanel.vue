<template>
  <div class="status-info-panel">
    <ElAlert
      v-if="statusInfo?.activeMaintenance"
      :closable="false"
      :description="statusInfo.activeMaintenance.message || maintenancePeriod"
      :title="statusInfo.activeMaintenance.title"
      class="status-info-alert"
      show-icon
      type="warning"
      @click="navigateToMaintenance(statusInfo.activeMaintenance.id)"
    />
    <ElAlert
      v-else-if="statusInfo?.activeIncident"
      :closable="false"
      :description="statusInfo.activeIncident.message || incidentCreatedAt"
      :title="statusInfo.activeIncident.title"
      class="status-info-alert"
      show-icon
      type="error"
    />
    <ElAlert
      v-else-if="showPlannedMaintenance && upcomingMaintenance"
      :closable="false"
      :description="plannedMaintenanceDescription"
      :title="t('statusInfo.plannedMaintenance')"
      class="status-info-alert"
      show-icon
      type="warning"
      @click="navigateToMaintenance(upcomingMaintenance.id)"
    />
  </div>
</template>

<script setup lang="ts">
import type { StatusInformation } from "./types";

const props = defineProps<{
  statusInfo: StatusInformation | null;
  showPlannedMaintenance: boolean;
}>();
const { t } = useI18n();

const upcomingMaintenance = computed(() => {
  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  return (
    (props.statusInfo?.maintenanceEvents ?? [])
      .filter((event) => {
        const startAt = new Date(event.startAt);
        return startAt > now && startAt <= oneMonthFromNow;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] ?? null
  );
});

const maintenancePeriod = computed(() => {
  const maintenance = props.statusInfo?.activeMaintenance;
  if (!maintenance) return "";
  return t("statusInfo.maintenancePeriod", {
    start: formatDate(maintenance.startAt),
    end: formatDate(maintenance.endAt),
  });
});

const incidentCreatedAt = computed(() => {
  const incident = props.statusInfo?.activeIncident;
  return incident
    ? t("statusInfo.incidentCreatedAt", { time: formatDate(incident.createdAt) })
    : "";
});

const plannedMaintenanceDescription = computed(() => {
  const maintenance = upcomingMaintenance.value;
  if (!maintenance) return "";
  if (maintenance.message) return maintenance.message;
  return t("statusInfo.plannedMaintenancePeriod", {
    title: maintenance.title,
    start: formatDate(maintenance.startAt),
    end: formatDate(maintenance.endAt),
  });
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

async function navigateToMaintenance(id: number) {
  await navigateTo(`/maintenance/${id}`);
}
</script>

<style scoped>
.status-info-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-info-alert {
  cursor: pointer;
  margin-bottom: 0.25rem;
}
</style>
