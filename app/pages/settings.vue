<template>
  <div>
    <header class="settings-header mb-6">
      <div class="settings-header-row">
        <div>
          <h1 class="text-2xl font-bold m-0">{{ t("settings.title") }}</h1>
          <p class="text-sm app-muted mt-2 mb-0">
            {{ t("settings.description") }}
          </p>
        </div>
        <NuxtLink to="/" class="home-link">{{ t("settings.home") }}</NuxtLink>
      </div>
    </header>

    <!-- Tabs -->
    <ElSegmented v-model="activeTab" :options="tabOptions" class="mb-6" name="settings-tabs" />

    <!-- Monitor settings tab -->
    <div v-if="activeTab === 'monitors'" class="settings-layout">
      <!-- Left: Monitor list -->
      <ElCard :body-style="{ padding: 0 }" class="settings-sidebar" shadow="never">
        <div class="sidebar-header">
          <span class="text-sm font-semibold">{{ t("settings.monitorList") }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs app-subtle">{{
              t("settings.count", { count: monitors.length })
            }}</span>
            <ElButton plain size="small" type="primary" @click="showImportModal = true">
              {{ t("common.import") }}
            </ElButton>
            <ElButton size="small" type="primary" @click="startCreateMonitor">
              {{ t("common.add") }}
            </ElButton>
          </div>
        </div>
        <div class="sidebar-list">
          <ElButton
            v-for="m in monitors"
            :key="m.id"
            class="sidebar-item"
            :class="{ active: monitorPaneMode === 'edit' && selectedMonitorId === m.id }"
            text
            @click="selectMonitor(m.id)"
          >
            <span class="sidebar-dot" :class="sidebarDotClass(m.lastCheck)"></span>
            <span class="truncate text-sm">{{ m.name }}</span>
          </ElButton>
          <div v-if="monitors.length === 0" class="text-center text-sm app-subtle py-8">
            {{ t("settings.emptyMonitors") }}
          </div>
        </div>
      </ElCard>

      <!-- Right: Monitor settings form -->
      <ElCard :body-style="{ padding: '1.25rem' }" class="settings-content" shadow="never">
        <div v-if="monitorPaneMode === 'idle'" class="text-center app-subtle py-16">
          {{ t("settings.selectMonitorHint") }}
        </div>
        <template v-else>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold m-0">
                {{
                  monitorPaneMode === "create"
                    ? t("monitorForm.createTitle")
                    : selectedMonitor?.name
                }}
              </h2>
              <p class="text-sm app-muted mt-1 mb-0">
                {{
                  monitorPaneMode === "create"
                    ? t("settings.createMonitorDescription")
                    : t("settings.editMonitorDescription")
                }}
              </p>
            </div>
            <div v-if="monitorPaneMode === 'edit' && selectedMonitor" class="flex gap-2">
              <ElButton
                plain
                size="small"
                type="primary"
                @click="duplicateMonitor(selectedMonitor)"
              >
                {{ t("monitor.duplicate") }}
              </ElButton>
              <ElButton size="small" type="danger" @click="deleteMonitor(selectedMonitor)">
                {{ t("common.delete") }}
              </ElButton>
            </div>
          </div>

          <ElForm
            class="aligned-form"
            label-position="right"
            label-width="14rem"
            @submit.prevent="saveMonitor"
          >
            <div class="space-y-4">
              <ElFormItem :label="t('monitorForm.name')" required
                ><ElInput v-model="editForm.name" required
              /></ElFormItem>
              <ElFormItem :label="t('monitorForm.displayName')"
                ><ElInput v-model="editForm.displayName"
              /></ElFormItem>
              <ElFormItem :label="t('monitorForm.url')" required
                ><ElInput v-model="editForm.url" type="url" required
              /></ElFormItem>

              <div class="grid grid-cols-2 gap-4">
                <ElFormItem :label="t('monitorForm.method')"
                  ><ElSelect v-model="editForm.method" class="w-full"
                    ><ElOption
                      v-for="option in methodOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value" /></ElSelect
                ></ElFormItem>
                <ElFormItem :label="t('monitorForm.timeoutSeconds')" required
                  ><ElInput v-model="editForm.timeout" type="number" required min="1" max="120"
                /></ElFormItem>
              </div>

              <ElFormItem :label="t('monitorForm.expectedStatus')"
                ><ElInput v-model="editForm.expectedStatus" type="number" min="100" max="599"
              /></ElFormItem>

              <div v-if="editForm.method === 'POST'">
                <div class="mb-4">
                  <ElFormItem label="Content-Type"
                    ><ElSelect
                      :model-value="selectedContentType"
                      class="w-full"
                      @update:model-value="handleContentTypeChange"
                      ><ElOption
                        v-for="option in contentTypeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value" /></ElSelect
                  ></ElFormItem>
                </div>

                <ElCollapse
                  ><ElCollapseItem :title="t('monitorForm.requestBody')"
                    ><ElFormItem :label="t('monitorForm.body')"
                      ><ElInput
                        v-model="editForm.body"
                        :rows="4"
                        placeholder='{"key": "value"}'
                        type="textarea" /></ElFormItem></ElCollapseItem
                ></ElCollapse>
              </div>

              <ElCollapse
                ><ElCollapseItem :title="t('monitorForm.customHeaders')"
                  ><ElFormItem :label="t('monitorForm.headers')"
                    ><ElInput
                      v-model="editForm.headers"
                      :rows="3"
                      placeholder='{"Authorization": "Bearer token"}'
                      type="textarea" /></ElFormItem></ElCollapseItem
              ></ElCollapse>

              <label v-if="monitorPaneMode === 'edit'" class="inline-flex items-center gap-3"
                ><span class="text-sm">{{ t("monitorForm.active") }}</span
                ><ElSwitch v-model="editForm.active"
              /></label>

              <!-- Channel selector inline -->
              <div v-if="monitorPaneMode === 'edit'" class="settings-section">
                <h3 class="text-sm font-semibold mb-2">{{ t("channels.title") }}</h3>
                <div v-if="channels.length === 0" class="text-sm app-subtle">
                  {{ t("settings.noChannels") }}
                </div>
                <div class="space-y-1">
                  <label v-for="ch in channels" :key="ch.id" class="channel-row">
                    <ElCheckbox
                      :model-value="editChannelIds.has(ch.id)"
                      @change="toggleChannel(ch.id)"
                    />
                    <ElTag
                      :type="ch.type === 'discord' ? 'primary' : 'info'"
                      effect="light"
                      round
                      size="small"
                    >
                      {{ ch.type }}
                    </ElTag>
                    <span class="text-sm">{{ ch.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <ElAlert
              v-if="saveError"
              :closable="false"
              class="text-sm mt-4"
              :title="saveError"
              type="error"
              show-icon
            />

            <div class="flex justify-end gap-2 mt-6">
              <ElButton text type="primary" @click="resetMonitorPane">{{
                t("common.cancel")
              }}</ElButton>
              <ElButton native-type="submit" type="primary" :loading="saving">
                {{ monitorPaneMode === "create" ? t("common.create") : t("common.save") }}
              </ElButton>
            </div>
          </ElForm>
        </template>
      </ElCard>
    </div>

    <!-- Notification channels tab -->
    <div v-if="activeTab === 'channels'">
      <NotificationChannels />
    </div>

    <!-- Bulk webhook assignment tab -->
    <div v-if="activeTab === 'bulk'" class="bulk-section">
      <ElCard :body-style="{ padding: '1.25rem' }" class="settings-card" shadow="never">
        <h2 class="text-lg font-bold mb-4">{{ t("settings.bulkTitle") }}</h2>
        <p class="text-sm app-muted mb-4">
          {{ t("settings.bulkDescription") }}
        </p>

        <!-- Channel selection -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold mb-2">{{ t("settings.bulkChannels") }}</h3>
          <div v-if="channels.length === 0" class="text-sm app-subtle">
            {{ t("settings.bulkNoChannels") }}
          </div>
          <div class="space-y-1">
            <label v-for="ch in channels" :key="ch.id" class="channel-row">
              <ElCheckbox
                :model-value="bulkChannelIds.has(ch.id)"
                @change="toggleBulkChannel(ch.id)"
              />
              <ElTag
                :type="ch.type === 'discord' ? 'primary' : 'info'"
                effect="light"
                round
                size="small"
              >
                {{ ch.type }}
              </ElTag>
              <span class="text-sm">{{ ch.name }}</span>
            </label>
          </div>
        </div>

        <!-- Monitor selection -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold">{{ t("settings.bulkTargets") }}</h3>
            <div class="flex gap-2">
              <ElButton link size="small" type="primary" @click="selectAllMonitors">
                {{ t("settings.selectAll") }}
              </ElButton>
              <ElButton link size="small" type="primary" @click="deselectAllMonitors">
                {{ t("settings.deselectAll") }}
              </ElButton>
            </div>
          </div>
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <label v-for="m in monitors" :key="m.id" class="channel-row">
              <ElCheckbox
                :model-value="bulkMonitorIds.has(m.id)"
                @change="toggleBulkMonitor(m.id)"
              />
              <span class="text-sm">{{ m.name }}</span>
            </label>
          </div>
        </div>

        <!-- Bulk mode -->
        <div class="mb-6">
          <ElFormItem :label="t('settings.bulkMode')"
            ><ElSelect v-model="bulkMode" class="w-full"
              ><ElOption
                v-for="option in bulkModeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></ElSelect
          ></ElFormItem>
        </div>

        <ElAlert
          v-if="bulkResult"
          :closable="false"
          class="text-sm mb-4"
          :title="bulkResult"
          :type="bulkResultVariant === 'error' ? 'error' : 'success'"
          show-icon
        />

        <ElButton
          type="primary"
          :loading="bulkSaving"
          :disabled="bulkChannelIds.size === 0 || bulkMonitorIds.size === 0"
          @click="applyBulkChannels"
        >
          {{ t("settings.bulkApply", { count: bulkMonitorIds.size }) }}
        </ElButton>
      </ElCard>
    </div>

    <div v-if="activeTab === 'maintenance'" class="settings-layout">
      <ElCard :body-style="{ padding: 0 }" class="settings-sidebar" shadow="never">
        <div class="sidebar-header">
          <span class="text-sm font-semibold">{{ t("settings.maintenanceList") }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs app-subtle">{{
              t("settings.count", { count: statusInfo?.maintenanceEvents.length ?? 0 })
            }}</span>
            <ElButton size="small" type="primary" @click="startCreateMaintenance">
              {{ t("common.add") }}
            </ElButton>
          </div>
        </div>
        <div class="sidebar-list">
          <ElButton
            v-for="event in statusInfo?.maintenanceEvents ?? []"
            :key="event.id"
            class="sidebar-item sidebar-item-stacked"
            :class="{
              active: maintenancePaneMode === 'edit' && selectedMaintenanceId === event.id,
            }"
            text
            @click="selectMaintenance(event.id)"
          >
            <span class="sidebar-dot dot-maintenance"></span>
            <span class="sidebar-item-body">
              <span class="truncate text-sm">{{ event.title }}</span>
              <span class="sidebar-item-meta">{{
                formatShortPeriod(event.startAt, event.endAt)
              }}</span>
            </span>
          </ElButton>
          <div
            v-if="(statusInfo?.maintenanceEvents.length ?? 0) === 0"
            class="text-center text-sm app-subtle py-8"
          >
            {{ t("settings.emptyMaintenance") }}
          </div>
        </div>
      </ElCard>

      <ElCard :body-style="{ padding: '1.25rem' }" class="settings-content" shadow="never">
        <div v-if="maintenancePaneMode === 'idle'" class="text-center app-subtle py-16">
          {{ t("settings.selectMaintenanceHint") }}
        </div>
        <ElForm v-else class="space-y-4" label-position="top" @submit.prevent="saveMaintenance">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold m-0">
                {{
                  maintenancePaneMode === "create"
                    ? t("settings.createMaintenance")
                    : t("settings.editMaintenance")
                }}
              </h2>
              <p class="text-sm app-subtle mt-1 mb-0">{{ t("settings.maintenanceDescription") }}</p>
            </div>
            <ElButton
              v-if="maintenancePaneMode === 'edit'"
              plain
              size="small"
              type="danger"
              @click="deleteSelectedMaintenance"
            >
              {{ t("common.delete") }}
            </ElButton>
          </div>

          <ElFormItem :label="t('statusInfo.titleLabel')" required>
            <ElInput v-model="maintenanceForm.title" />
          </ElFormItem>
          <ElFormItem :label="t('statusInfo.periodLabel')" required>
            <ElDatePicker
              v-model="maintenanceForm.range"
              :end-placeholder="t('statusInfo.endAt')"
              :start-placeholder="t('statusInfo.startAt')"
              type="datetimerange"
            />
          </ElFormItem>
          <ElFormItem :label="t('statusInfo.messageLabel')">
            <ElInput v-model="maintenanceForm.message" :rows="4" type="textarea" />
          </ElFormItem>
          <ElFormItem :label="t('settings.maintenanceAffectedServices')">
            <ElSelect
              v-model="maintenanceForm.monitorIds"
              class="w-full"
              clearable
              collapse-tags
              multiple
              :placeholder="t('settings.maintenanceAllServices')"
            >
              <ElOption
                v-for="monitor in monitors"
                :key="monitor.id"
                :label="monitor.name"
                :value="monitor.id"
              />
            </ElSelect>
            <p class="form-help">{{ t("settings.maintenanceAffectedServicesHelp") }}</p>
          </ElFormItem>
          <ElAlert
            v-if="maintenanceError"
            :closable="false"
            :title="maintenanceError"
            show-icon
            type="error"
          />
          <div class="flex justify-end gap-2 mt-6">
            <ElButton text type="primary" @click="resetMaintenancePane">{{
              t("common.cancel")
            }}</ElButton>
            <ElButton native-type="submit" type="primary" :loading="maintenanceSaving">
              {{ maintenancePaneMode === "create" ? t("common.create") : t("common.save") }}
            </ElButton>
          </div>
        </ElForm>
      </ElCard>
    </div>

    <div v-if="activeTab === 'incidents'" class="settings-layout">
      <ElCard :body-style="{ padding: 0 }" class="settings-sidebar" shadow="never">
        <div class="sidebar-header">
          <span class="text-sm font-semibold">{{ t("settings.incidentList") }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs app-subtle">{{
              t("settings.count", { count: statusInfo?.incidents.length ?? 0 })
            }}</span>
            <ElButton
              :disabled="!statusInfo?.canCreateIncident"
              size="small"
              type="primary"
              @click="startCreateIncident"
            >
              {{ t("common.add") }}
            </ElButton>
          </div>
        </div>
        <div class="sidebar-list">
          <ElButton
            v-for="incident in statusInfo?.incidents ?? []"
            :key="incident.id"
            class="sidebar-item sidebar-item-stacked"
            :class="{ active: incidentPaneMode === 'edit' && selectedIncidentId === incident.id }"
            text
            @click="selectIncident(incident.id)"
          >
            <span class="sidebar-dot" :class="incident.resolvedAt ? 'dot-up' : 'dot-down'"></span>
            <span class="sidebar-item-body">
              <span class="truncate text-sm">{{ incident.title }}</span>
              <span class="sidebar-item-meta">{{ formatShortDate(incident.createdAt) }}</span>
            </span>
          </ElButton>
          <div
            v-if="(statusInfo?.incidents.length ?? 0) === 0"
            class="text-center text-sm app-subtle py-8"
          >
            {{ t("settings.emptyIncidents") }}
          </div>
        </div>
      </ElCard>

      <ElCard :body-style="{ padding: '1.25rem' }" class="settings-content" shadow="never">
        <div v-if="incidentPaneMode === 'idle'" class="text-center app-subtle py-16">
          {{ incidentIdleHint }}
        </div>
        <ElForm v-else class="space-y-4" label-position="top" @submit.prevent="saveIncident">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold m-0">
                {{
                  incidentPaneMode === "create"
                    ? t("settings.createIncident")
                    : t("settings.editIncident")
                }}
              </h2>
              <p class="text-sm app-subtle mt-1 mb-0">{{ t("settings.incidentDescription") }}</p>
            </div>
          </div>

          <ElFormItem :label="t('statusInfo.titleLabel')" required>
            <ElInput v-model="incidentForm.title" />
          </ElFormItem>
          <ElFormItem :label="t('statusInfo.messageLabel')">
            <ElInput v-model="incidentForm.message" :rows="4" type="textarea" />
          </ElFormItem>
          <label v-if="incidentPaneMode === 'edit'" class="inline-flex items-center gap-3">
            <span class="text-sm">{{ t("settings.incidentResolved") }}</span>
            <ElSwitch v-model="incidentForm.resolved" />
          </label>
          <ElAlert
            v-if="incidentError"
            :closable="false"
            :title="incidentError"
            show-icon
            type="error"
          />
          <div class="flex justify-end gap-2 mt-6">
            <ElButton text type="primary" @click="resetIncidentPane">{{
              t("common.cancel")
            }}</ElButton>
            <ElButton native-type="submit" type="primary" :loading="incidentSaving">
              {{ incidentPaneMode === "create" ? t("common.create") : t("common.save") }}
            </ElButton>
          </div>
        </ElForm>
      </ElCard>
    </div>

    <ClientOnly>
      <ImportMonitorsModal
        v-if="showImportModal"
        :open="showImportModal"
        @close="showImportModal = false"
        @imported="loadMonitors"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import type {
  IncidentEvent,
  MaintenanceEvent,
  MonitorWithStatus,
  StatusInformation,
} from "~/components/types";

type MonitorPaneMode = "idle" | "create" | "edit";
type MaintenancePaneMode = "idle" | "create" | "edit";
type IncidentPaneMode = "idle" | "create" | "edit";

interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl?: string | null;
  template: string | null;
  active: boolean;
  createdAt: string;
}

type SettingsData = {
  monitors: MonitorWithStatus[];
  statusInfo: StatusInformation;
  channels: Channel[];
};

const client = useRpcClient();

const { data: settingsData } = await useAsyncData("settings-data", () => loadSettingsData());

const activeTab = ref<"monitors" | "channels" | "bulk" | "maintenance" | "incidents">("monitors");
const { t } = useI18n();
const monitors = ref<MonitorWithStatus[]>(settingsData.value?.monitors ?? []);
const statusInfo = ref<StatusInformation | null>(settingsData.value?.statusInfo ?? null);
const channels = ref<Channel[]>(settingsData.value?.channels ?? []);
const monitorPaneMode = ref<MonitorPaneMode>("idle");
const maintenancePaneMode = ref<MaintenancePaneMode>("idle");
const incidentPaneMode = ref<IncidentPaneMode>("idle");
const selectedMonitorId = ref<number | null>(null);
const selectedMaintenanceId = ref<number | null>(null);
const selectedIncidentId = ref<number | null>(null);
const showImportModal = ref(false);

// Edit form
const editForm = ref(blankMonitorForm());
const editChannelIds = ref(new Set<number>());
const saving = ref(false);
const saveError = ref("");
const maintenanceSaving = ref(false);
const maintenanceError = ref("");
const incidentSaving = ref(false);
const incidentError = ref("");

const maintenanceForm = ref(blankMaintenanceForm());
const incidentForm = ref(blankIncidentForm());

// Bulk assignment
const bulkChannelIds = ref(new Set<number>());
const bulkMonitorIds = ref(new Set<number>());
const bulkMode = ref("replace");
const bulkSaving = ref(false);
const bulkResult = ref("");
const bulkResultVariant = ref<"success" | "error">("success");

const methodOptions = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
];

async function loadSettingsData(): Promise<SettingsData | null> {
  try {
    const [monitors, statusInfo, channels] = await Promise.all([
      client.monitor.list(),
      client.statusInfo.get(),
      client.notification.list(),
    ]);

    return { monitors, statusInfo, channels };
  } catch {
    return null;
  }
}

const headersRef = computed({
  get: () => editForm.value.headers,
  set: (value: string) => {
    editForm.value.headers = value;
  },
});

const { parseHeaders, selectedContentType, handleContentTypeChange, CONTENT_TYPE_OPTIONS } =
  useHeadersEditor(headersRef);

const contentTypeOptions = computed(() => [
  { value: "", label: t("settings.contentTypeNone") },
  ...CONTENT_TYPE_OPTIONS.map((contentType) => ({ value: contentType, label: contentType })),
  { value: "custom", label: t("settings.contentTypeCustom") },
]);

const bulkModeOptions = computed(() => [
  { value: "replace", label: t("settings.bulkReplace") },
  { value: "add", label: t("settings.bulkAdd") },
]);

const tabOptions = computed(() => [
  { value: "monitors", label: t("settings.monitorTab") },
  { value: "maintenance", label: t("settings.maintenanceTab") },
  { value: "incidents", label: t("settings.incidentTab") },
  { value: "channels", label: t("settings.channelsTab") },
  { value: "bulk", label: t("settings.bulkTab") },
]);

const selectedMonitor = computed(
  () => monitors.value.find((m) => m.id === selectedMonitorId.value) ?? null,
);
const selectedMaintenance = computed(
  () =>
    statusInfo.value?.maintenanceEvents.find((event) => event.id === selectedMaintenanceId.value) ??
    null,
);
const selectedIncident = computed(
  () =>
    statusInfo.value?.incidents.find((incident) => incident.id === selectedIncidentId.value) ??
    null,
);
const incidentIdleHint = computed(() => {
  if (statusInfo.value?.canCreateIncident) return t("settings.selectIncidentHint");
  if (statusInfo.value?.activeMaintenance) return t("statusInfo.incidentDisabledMaintenance");
  return t("statusInfo.incidentDisabledNoDown");
});

function blankMonitorForm() {
  return {
    name: "",
    displayName: "",
    url: "",
    method: "GET",
    timeout: "30",
    expectedStatus: "200",
    headers: "",
    body: "",
    active: true,
  };
}

function blankMaintenanceForm() {
  return {
    title: "",
    message: "",
    range: [] as Date[],
    monitorIds: [] as number[],
  };
}

function blankIncidentForm() {
  return {
    title: "",
    message: "",
    resolved: false,
  };
}

function monitorToForm(m: MonitorWithStatus) {
  return {
    name: m.name,
    displayName: m.displayName || "",
    url: m.url,
    method: m.method,
    timeout: String(m.timeout),
    expectedStatus: String(m.expectedStatus),
    headers: m.headers ?? "",
    body: m.body ?? "",
    active: m.active,
  };
}

function maintenanceToForm(event: MaintenanceEvent) {
  return {
    title: event.title,
    message: event.message ?? "",
    range: [new Date(event.startAt), new Date(event.endAt)],
    monitorIds: event.monitorIds,
  };
}

function incidentToForm(incident: IncidentEvent) {
  return {
    title: incident.title,
    message: incident.message ?? "",
    resolved: Boolean(incident.resolvedAt),
  };
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function formatShortPeriod(startAt: string, endAt: string) {
  return `${formatShortDate(startAt)} - ${formatShortDate(endAt)}`;
}

function startCreateMonitor() {
  monitorPaneMode.value = "create";
  selectedMonitorId.value = null;
  editForm.value = blankMonitorForm();
  editChannelIds.value = new Set();
  saveError.value = "";
}

function resetMonitorPane() {
  monitorPaneMode.value = "idle";
  selectedMonitorId.value = null;
  editForm.value = blankMonitorForm();
  editChannelIds.value = new Set();
  saveError.value = "";
}

function selectMonitor(id: number) {
  monitorPaneMode.value = "edit";
  selectedMonitorId.value = id;
  const m = monitors.value.find((mon) => mon.id === id);
  if (m) {
    editForm.value = monitorToForm(m);
    editChannelIds.value = new Set(m.channelIds);
    saveError.value = "";
  }
}

async function toggleChannel(channelId: number) {
  const newSet = new Set(editChannelIds.value);
  if (newSet.has(channelId)) {
    newSet.delete(channelId);
  } else {
    newSet.add(channelId);
  }
  editChannelIds.value = newSet;
}

async function saveMonitor() {
  saving.value = true;
  saveError.value = "";
  try {
    parseHeaders(editForm.value.headers);

    const monitorInput = {
      name: editForm.value.name,
      displayName: editForm.value.displayName || null,
      url: editForm.value.url,
      method: editForm.value.method as "GET" | "POST",
      timeout: Number(editForm.value.timeout),
      expectedStatus: Number(editForm.value.expectedStatus),
      headers: editForm.value.headers || null,
      body: editForm.value.method === "POST" ? editForm.value.body || null : null,
    };

    if (monitorPaneMode.value === "create") {
      const created = await client.monitor.create(monitorInput);
      await loadMonitors();
      selectMonitor(created.id);
      return;
    }

    if (monitorPaneMode.value === "edit" && selectedMonitorId.value) {
      await client.monitor.update({
        id: selectedMonitorId.value,
        ...monitorInput,
        active: editForm.value.active,
      });
      await client.monitor.setChannels({
        id: selectedMonitorId.value,
        channelIds: [...editChannelIds.value],
      });
      await loadMonitors();
    }
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : t("settings.saveFailed");
  } finally {
    saving.value = false;
  }
}

async function duplicateMonitor(m: MonitorWithStatus) {
  try {
    parseHeaders(m.headers ?? "");

    const created = await client.monitor.create({
      name: `${m.name} (${t("monitor.copySuffix")})`,
      displayName: m.displayName ? `${m.displayName} (${t("monitor.copySuffix")})` : null,
      url: m.url,
      method: m.method as "GET" | "POST",
      headers: m.headers,
      body: m.body,
      timeout: m.timeout,
      expectedStatus: m.expectedStatus,
    });
    await loadMonitors();
    selectMonitor(created.id);
  } catch (e) {
    ElMessage.error(
      t("monitor.duplicateFailed", {
        message: e instanceof Error ? e.message : t("common.unknownError"),
      }),
    );
  }
}

async function deleteMonitor(m: MonitorWithStatus) {
  try {
    await ElMessageBox.confirm(
      t("monitor.deleteConfirmMessage", { name: m.name }),
      t("monitor.deleteConfirmTitle"),
      {
        confirmButtonText: t("common.delete"),
        cancelButtonText: t("common.cancel"),
        type: "warning",
      },
    );
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(e instanceof Error ? e.message : String(e));
    }
    return;
  }
  await client.monitor.delete({ id: m.id });
  resetMonitorPane();
  await loadMonitors();
}

function startCreateMaintenance() {
  maintenancePaneMode.value = "create";
  selectedMaintenanceId.value = null;
  maintenanceForm.value = blankMaintenanceForm();
  maintenanceError.value = "";
}

function resetMaintenancePane() {
  maintenancePaneMode.value = "idle";
  selectedMaintenanceId.value = null;
  maintenanceForm.value = blankMaintenanceForm();
  maintenanceError.value = "";
}

function selectMaintenance(id: number) {
  maintenancePaneMode.value = "edit";
  selectedMaintenanceId.value = id;
  const event = statusInfo.value?.maintenanceEvents.find((item) => item.id === id);
  if (event) {
    maintenanceForm.value = maintenanceToForm(event);
    maintenanceError.value = "";
  }
}

async function saveMaintenance() {
  const [startAt, endAt] = maintenanceForm.value.range;
  if (!maintenanceForm.value.title || !startAt || !endAt) {
    maintenanceError.value = t("statusInfo.requiredError");
    return;
  }

  maintenanceSaving.value = true;
  maintenanceError.value = "";
  try {
    const input = {
      title: maintenanceForm.value.title,
      message: maintenanceForm.value.message || null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      monitorIds: maintenanceForm.value.monitorIds,
    };
    if (maintenancePaneMode.value === "create") {
      const created = await client.statusInfo.createMaintenance(input);
      await refreshStatusSettings();
      selectMaintenance(created.id);
      return;
    }
    if (maintenancePaneMode.value === "edit" && selectedMaintenanceId.value) {
      await client.statusInfo.updateMaintenance({ id: selectedMaintenanceId.value, ...input });
      await refreshStatusSettings();
      selectMaintenance(selectedMaintenanceId.value);
    }
  } catch (e) {
    maintenanceError.value = e instanceof Error ? e.message : t("settings.saveFailed");
  } finally {
    maintenanceSaving.value = false;
  }
}

async function deleteSelectedMaintenance() {
  if (!selectedMaintenance.value) return;
  try {
    await ElMessageBox.confirm(
      t("settings.deleteMaintenanceConfirm", { title: selectedMaintenance.value.title }),
      t("settings.deleteMaintenanceTitle"),
      {
        confirmButtonText: t("common.delete"),
        cancelButtonText: t("common.cancel"),
        type: "warning",
      },
    );
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(e instanceof Error ? e.message : String(e));
    }
    return;
  }
  await client.statusInfo.deleteMaintenance({ id: selectedMaintenance.value.id });
  resetMaintenancePane();
  await refreshStatusSettings();
}

function startCreateIncident() {
  if (!statusInfo.value?.canCreateIncident) {
    incidentError.value = incidentIdleHint.value;
    return;
  }
  incidentPaneMode.value = "create";
  selectedIncidentId.value = null;
  incidentForm.value = blankIncidentForm();
  incidentError.value = "";
}

function resetIncidentPane() {
  incidentPaneMode.value = "idle";
  selectedIncidentId.value = null;
  incidentForm.value = blankIncidentForm();
  incidentError.value = "";
}

function selectIncident(id: number) {
  incidentPaneMode.value = "edit";
  selectedIncidentId.value = id;
  const incident = statusInfo.value?.incidents.find((item) => item.id === id);
  if (incident) {
    incidentForm.value = incidentToForm(incident);
    incidentError.value = "";
  }
}

async function saveIncident() {
  if (!incidentForm.value.title) {
    incidentError.value = t("statusInfo.requiredError");
    return;
  }

  incidentSaving.value = true;
  incidentError.value = "";
  try {
    const input = {
      title: incidentForm.value.title,
      message: incidentForm.value.message || null,
    };
    if (incidentPaneMode.value === "create") {
      const created = await client.statusInfo.createIncident(input);
      await refreshStatusSettings();
      selectIncident(created.id);
      return;
    }
    if (incidentPaneMode.value === "edit" && selectedIncidentId.value) {
      await client.statusInfo.updateIncident({
        id: selectedIncidentId.value,
        ...input,
        resolved: incidentForm.value.resolved,
      });
      await refreshStatusSettings();
      selectIncident(selectedIncidentId.value);
    }
  } catch (e) {
    incidentError.value = e instanceof Error ? e.message : t("settings.saveFailed");
  } finally {
    incidentSaving.value = false;
  }
}

// Bulk
function toggleBulkChannel(id: number) {
  const s = new Set(bulkChannelIds.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  bulkChannelIds.value = s;
}

function toggleBulkMonitor(id: number) {
  const s = new Set(bulkMonitorIds.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  bulkMonitorIds.value = s;
}

function selectAllMonitors() {
  bulkMonitorIds.value = new Set(monitors.value.map((m) => m.id));
}

function deselectAllMonitors() {
  bulkMonitorIds.value = new Set();
}

async function applyBulkChannels() {
  bulkSaving.value = true;
  bulkResult.value = "";
  try {
    const targetIds = [...bulkMonitorIds.value];
    const channelIdsToSet = [...bulkChannelIds.value];

    for (const monitorId of targetIds) {
      let finalChannelIds = channelIdsToSet;
      if (bulkMode.value === "add") {
        const monitor = monitors.value.find((m) => m.id === monitorId);
        if (monitor) {
          const existing = new Set(monitor.channelIds);
          for (const cid of channelIdsToSet) existing.add(cid);
          finalChannelIds = [...existing];
        }
      }
      await client.monitor.setChannels({ id: monitorId, channelIds: finalChannelIds });
    }

    bulkResult.value = t("settings.bulkSuccess", { count: targetIds.length });
    bulkResultVariant.value = "success";
    await loadMonitors();
  } catch (e) {
    bulkResult.value = e instanceof Error ? e.message : t("settings.bulkFailed");
    bulkResultVariant.value = "error";
  } finally {
    bulkSaving.value = false;
  }
}

async function loadMonitors() {
  monitors.value = await client.monitor.list();
}

async function loadStatusInfo() {
  statusInfo.value = await client.statusInfo.get();
}

async function refreshStatusSettings() {
  await Promise.all([loadMonitors(), loadStatusInfo()]);
}

function sidebarDotClass(check: MonitorWithStatus["lastCheck"]) {
  if (!check) return "dot-pending";
  if (check.status === "maintenance") return "dot-maintenance";
  return check.status === "up" ? "dot-up" : "dot-down";
}

async function loadChannels() {
  channels.value = await client.notification.list();
}

onMounted(async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    navigateTo("/login");
    return;
  }
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  await Promise.all([loadMonitors(), loadChannels(), loadStatusInfo()]);
});
</script>

<style scoped>
.settings-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.settings-header-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.home-link {
  flex-shrink: 0;
  font-size: 0.875rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.5rem;
  color: var(--color-base-content, gray);
  text-decoration: none;
  transition:
    background 0.15s,
    border-color 0.15s,
    opacity 0.15s;
}

.home-link:hover {
  background: var(--surface-hover);
  opacity: 0.9;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(16rem, 18rem) minmax(0, 1fr);
  gap: 1.5rem;
  min-height: 500px;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

.settings-sidebar {
  overflow: hidden;
  align-self: start;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-list {
  max-height: 600px;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: auto;
  justify-content: flex-start;
  margin-left: 0;
  padding: 0.625rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-subtle);
  white-space: normal;
}

.sidebar-item :deep(> span) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.sidebar-item:last-child {
  border-bottom: none;
}

.sidebar-item:hover {
  background: var(--surface-hover);
}

.sidebar-item.active {
  background: var(--surface-hover);
}

.sidebar-item-stacked :deep(> span) {
  align-items: flex-start;
}

.sidebar-item-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.sidebar-item-meta {
  overflow: hidden;
  color: var(--app-text-subtle);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-dot {
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
.dot-pending {
  background-color: var(--color-base-content, gray);
  opacity: 0.3;
}

.settings-content {
  align-self: start;
}

.settings-section {
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 0.5rem;
}

.aligned-form :deep(.el-form-item__label) {
  justify-content: flex-end;
}

.aligned-form :deep(.el-form-item__content) {
  min-width: 0;
}

.aligned-form :deep(.el-collapse-item__header) {
  padding: 0 1rem;
}

.aligned-form :deep(.el-collapse-item__content) {
  padding: 1rem;
}

@media (max-width: 768px) {
  .aligned-form :deep(.el-form-item) {
    display: block;
  }

  .aligned-form :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: auto !important;
    margin-bottom: 0.375rem;
  }
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.1s;
}

.channel-row:hover {
  background: var(--surface-hover);
}
</style>
