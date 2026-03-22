<template>
  <div>
    <a href="/" class="btn btn-ghost btn-sm mb-4">&larr; Back</a>

    <div v-if="!monitor" class="text-center py-12 text-base-content/60">Loading...</div>

    <template v-else>
      <MonitorHeader
        :monitor="monitor"
        :checking="checking"
        :is-admin="isAdmin"
        @check="checkNow"
        @delete="confirmDelete"
      />
      <CheckHistory :history="history" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import { navigate } from "vike/client/router";
import { client } from "../../../server/client";
import type { MonitorWithStatus, CheckResult } from "../../../components/types";
import MonitorHeader from "../../../components/MonitorHeader.vue";
import CheckHistory from "../../../components/CheckHistory.vue";

const pageContext = usePageContext();
const monitorId = Number(pageContext.routeParams!.id);

const monitor = ref<MonitorWithStatus | null>(null);
const history = ref<CheckResult[]>([]);
const checking = ref(false);
const isAdmin = ref(false);

async function loadMonitor() {
  const data = await client.monitor.get({ id: monitorId });
  if (data) {
    monitor.value = data;
  }
}

async function loadHistory() {
  history.value = await client.monitor.history({ id: monitorId, limit: 200 });
}

async function checkNow() {
  checking.value = true;
  try {
    await client.monitor.checkNow({ id: monitorId });
    await Promise.all([loadMonitor(), loadHistory()]);
  } finally {
    checking.value = false;
  }
}

async function confirmDelete() {
  if (confirm(`Delete "${monitor.value?.name}"?`)) {
    await client.monitor.delete({ id: monitorId });
    navigate("/");
  }
}

onMounted(async () => {
  isAdmin.value = !!localStorage.getItem("auth_token");
  await Promise.all([loadMonitor(), loadHistory()]);
});
</script>
