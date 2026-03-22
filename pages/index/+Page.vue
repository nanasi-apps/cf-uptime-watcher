<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold m-0">Monitors</h1>
      <button v-if="isAdmin" class="btn btn-primary btn-sm" @click="showCreateModal = true">
        + Add Monitor
      </button>
    </div>

    <StatsBar :total="monitors.length" :up="upCount" :down="downCount" />

    <div v-if="monitors.length === 0" class="text-center py-12 text-base-content/60">
      No monitors yet.
    </div>
    <div class="space-y-3 mb-8">
      <MonitorCard
        v-for="monitor in monitors"
        :key="monitor.id"
        :monitor="monitor"
        @click="goToMonitor(monitor.id)"
      />
    </div>

    <!-- Notification channels (admin only) -->
    <NotificationChannels v-if="isAdmin" />

    <CreateMonitorModal
      v-if="isAdmin"
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="loadMonitors"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { navigate } from "vike/client/router";
import { client } from "../../server/client";
import type { MonitorWithStatus } from "../../components/types";
import MonitorCard from "../../components/MonitorCard.vue";
import StatsBar from "../../components/StatsBar.vue";
import CreateMonitorModal from "../../components/CreateMonitorModal.vue";
import NotificationChannels from "../../components/NotificationChannels.vue";

const monitors = ref<MonitorWithStatus[]>([]);
const showCreateModal = ref(false);
const isAdmin = ref(false);

const upCount = computed(() => monitors.value.filter((m) => m.lastCheck?.isUp).length);
const downCount = computed(
  () => monitors.value.filter((m) => m.lastCheck && !m.lastCheck.isUp).length,
);

function goToMonitor(id: number) {
  navigate(`/monitors/${id}`);
}

async function loadMonitors() {
  monitors.value = await client.monitor.list();
}

onMounted(() => {
  isAdmin.value = !!localStorage.getItem("auth_token");
  loadMonitors();
});
</script>
