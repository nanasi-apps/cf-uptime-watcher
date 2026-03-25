<template>
  <div>
    <header class="settings-header mb-6">
      <div class="settings-header-row">
        <div>
          <h1 class="text-2xl font-bold m-0">設定</h1>
          <p class="text-sm text-base-content/50 mt-2 mb-0">
            モニター、通知チャンネル、Webhook をまとめて管理します。
          </p>
        </div>
        <NuxtLink to="/" class="home-link">ホームへ戻る</NuxtLink>
      </div>
    </header>

    <!-- Tabs -->
    <div class="settings-tabs mb-6">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'monitors' }"
        @click="activeTab = 'monitors'"
      >
        モニター設定
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'channels' }"
        @click="activeTab = 'channels'"
      >
        通知チャンネル
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'bulk' }" @click="activeTab = 'bulk'">
        一括Webhook設定
      </button>
    </div>

    <!-- Monitor settings tab -->
    <div v-if="activeTab === 'monitors'" class="settings-layout">
      <!-- Left: Monitor list -->
      <div class="settings-sidebar bg-base-100">
        <div class="sidebar-header">
          <span class="text-sm font-semibold">モニター一覧</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-base-content/40">{{ monitors.length }}件</span>
            <AppButton variant="outline" size="xs" @click="showImportModal = true">
              インポート
            </AppButton>
            <AppButton variant="primary" size="xs" @click="showCreateModal = true">
              + 追加
            </AppButton>
          </div>
        </div>
        <div class="sidebar-list">
          <button
            v-for="m in monitors"
            :key="m.id"
            class="sidebar-item"
            :class="{ active: selectedMonitorId === m.id }"
            @click="selectMonitor(m.id)"
          >
            <span
              class="sidebar-dot"
              :class="m.lastCheck?.isUp ? 'dot-up' : m.lastCheck ? 'dot-down' : 'dot-pending'"
            ></span>
            <span class="truncate text-sm">{{ m.name }}</span>
          </button>
          <div v-if="monitors.length === 0" class="text-center text-sm text-base-content/40 py-8">
            モニターがありません
          </div>
        </div>
      </div>

      <!-- Right: Monitor settings form -->
      <div class="settings-content bg-base-100">
        <div v-if="!selectedMonitor" class="text-center text-base-content/40 py-16">
          左のリストからモニターを選択してください
        </div>
        <template v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0">{{ selectedMonitor.name }}</h2>
            <div class="flex gap-2">
              <AppButton variant="outline" size="sm" @click="duplicateMonitor(selectedMonitor)">
                複製
              </AppButton>
              <AppButton variant="danger" size="sm" @click="deleteMonitor(selectedMonitor)">
                削除
              </AppButton>
            </div>
          </div>

          <form @submit.prevent="saveMonitor">
            <div class="space-y-4">
              <AppInput v-model="editForm.name" label="名前" required />
              <AppInput v-model="editForm.url" label="URL" type="url" required />

              <div class="grid grid-cols-2 gap-4">
                <AppSelect v-model="editForm.method" label="メソッド" :options="methodOptions" />
                <AppInput
                  v-model="editForm.timeout"
                  label="タイムアウト (秒)"
                  type="number"
                  required
                  min="1"
                  max="120"
                />
              </div>

              <AppInput
                v-model="editForm.expectedStatus"
                label="期待ステータス"
                type="number"
                min="100"
                max="599"
              />

              <div v-if="editForm.method === 'POST'">
                <AppCollapsible title="リクエストボディ">
                  <AppTextarea
                    v-model="editForm.body"
                    label="ボディ"
                    :rows="4"
                    placeholder='{"key": "value"}'
                    monospace
                  />
                </AppCollapsible>
              </div>

              <AppCollapsible title="カスタムヘッダー">
                <AppTextarea
                  v-model="editForm.headers"
                  label="ヘッダー"
                  :rows="3"
                  placeholder='{"Authorization": "Bearer token"}'
                  monospace
                />
              </AppCollapsible>

              <AppToggle v-model="editForm.active" label="有効" />

              <!-- Channel selector inline -->
              <div class="settings-section">
                <h3 class="text-sm font-semibold mb-2">通知チャンネル</h3>
                <div v-if="channels.length === 0" class="text-sm text-base-content/40">
                  通知チャンネルが未設定です
                </div>
                <div class="space-y-1">
                  <label v-for="ch in channels" :key="ch.id" class="channel-row">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm checkbox-primary"
                      :checked="editChannelIds.has(ch.id)"
                      @change="toggleChannel(ch.id)"
                    />
                    <AppBadge :variant="ch.type === 'discord' ? 'primary' : 'secondary'" size="sm">
                      {{ ch.type }}
                    </AppBadge>
                    <span class="text-sm">{{ ch.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <AppAlert v-if="saveError" variant="error" class="text-sm mt-4">{{
              saveError
            }}</AppAlert>

            <div class="flex justify-end mt-6">
              <AppButton type="submit" variant="primary" :loading="saving">保存</AppButton>
            </div>
          </form>
        </template>
      </div>
    </div>

    <!-- Notification channels tab -->
    <div v-if="activeTab === 'channels'">
      <NotificationChannels />
    </div>

    <!-- Bulk webhook assignment tab -->
    <div v-if="activeTab === 'bulk'" class="bulk-section">
      <div class="settings-card bg-base-100">
        <h2 class="text-lg font-bold mb-4">一括Webhook割当</h2>
        <p class="text-sm text-base-content/50 mb-4">
          複数のモニターに対して通知チャンネルを一括で設定できます。
        </p>

        <!-- Channel selection -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold mb-2">割り当てるチャンネル</h3>
          <div v-if="channels.length === 0" class="text-sm text-base-content/40">
            通知チャンネルがありません。先に「通知チャンネル」タブで追加してください。
          </div>
          <div class="space-y-1">
            <label v-for="ch in channels" :key="ch.id" class="channel-row">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                :checked="bulkChannelIds.has(ch.id)"
                @change="toggleBulkChannel(ch.id)"
              />
              <AppBadge :variant="ch.type === 'discord' ? 'primary' : 'secondary'" size="sm">
                {{ ch.type }}
              </AppBadge>
              <span class="text-sm">{{ ch.name }}</span>
            </label>
          </div>
        </div>

        <!-- Monitor selection -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold">対象モニター</h3>
            <div class="flex gap-2">
              <button class="text-xs text-primary hover:underline" @click="selectAllMonitors">
                全選択
              </button>
              <button class="text-xs text-primary hover:underline" @click="deselectAllMonitors">
                全解除
              </button>
            </div>
          </div>
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <label v-for="m in monitors" :key="m.id" class="channel-row">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                :checked="bulkMonitorIds.has(m.id)"
                @change="toggleBulkMonitor(m.id)"
              />
              <span class="text-sm">{{ m.name }}</span>
            </label>
          </div>
        </div>

        <!-- Bulk mode -->
        <div class="mb-6">
          <AppSelect v-model="bulkMode" label="動作" :options="bulkModeOptions" />
        </div>

        <AppAlert v-if="bulkResult" :variant="bulkResultVariant" class="text-sm mb-4">
          {{ bulkResult }}
        </AppAlert>

        <AppButton
          variant="primary"
          :loading="bulkSaving"
          :disabled="bulkChannelIds.size === 0 || bulkMonitorIds.size === 0"
          @click="applyBulkChannels"
        >
          {{ bulkMonitorIds.size }}件のモニターに適用
        </AppButton>
      </div>
    </div>

    <CreateMonitorModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="onMonitorCreated"
    />
    <ImportMonitorsModal
      :open="showImportModal"
      @close="showImportModal = false"
      @imported="loadMonitors"
    />
  </div>
</template>

<script lang="ts" setup>
import type { MonitorWithStatus } from "~/components/types";

definePageMeta({ middleware: "auth" });

interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl: string;
  template: string | null;
  active: boolean;
  createdAt: string;
}

const activeTab = ref<"monitors" | "channels" | "bulk">("monitors");
const monitors = ref<MonitorWithStatus[]>([]);
const channels = ref<Channel[]>([]);
const selectedMonitorId = ref<number | null>(null);
const showCreateModal = ref(false);
const showImportModal = ref(false);

// Edit form
const editForm = ref({
  name: "",
  url: "",
  method: "GET",
  timeout: "30",
  expectedStatus: "200",
  headers: "",
  body: "",
  active: true,
});
const editChannelIds = ref(new Set<number>());
const saving = ref(false);
const saveError = ref("");

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

const bulkModeOptions = [
  { value: "replace", label: "置換（既存を上書き）" },
  { value: "add", label: "追加（既存に追加）" },
];

const selectedMonitor = computed(
  () => monitors.value.find((m) => m.id === selectedMonitorId.value) ?? null,
);

function selectMonitor(id: number) {
  selectedMonitorId.value = id;
  const m = monitors.value.find((mon) => mon.id === id);
  if (m) {
    editForm.value = {
      name: m.name,
      url: m.url,
      method: m.method,
      timeout: String(m.timeout),
      expectedStatus: String(m.expectedStatus),
      headers: m.headers ?? "",
      body: m.body ?? "",
      active: m.active,
    };
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
  if (!selectedMonitorId.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    await client.monitor.update({
      id: selectedMonitorId.value,
      name: editForm.value.name,
      url: editForm.value.url,
      method: editForm.value.method as "GET" | "POST",
      timeout: Number(editForm.value.timeout),
      expectedStatus: Number(editForm.value.expectedStatus),
      headers: editForm.value.headers || null,
      body: editForm.value.method === "POST" ? editForm.value.body || null : null,
      active: editForm.value.active,
    });
    await client.monitor.setChannels({
      id: selectedMonitorId.value,
      channelIds: [...editChannelIds.value],
    });
    await loadMonitors();
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : "保存に失敗しました";
  } finally {
    saving.value = false;
  }
}

async function duplicateMonitor(m: MonitorWithStatus) {
  try {
    const created = await client.monitor.create({
      name: `${m.name} (コピー)`,
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
    alert(`複製に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
  }
}

async function deleteMonitor(m: MonitorWithStatus) {
  if (!confirm(`「${m.name}」を削除しますか？`)) return;
  await client.monitor.delete({ id: m.id });
  selectedMonitorId.value = null;
  await loadMonitors();
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

    bulkResult.value = `${targetIds.length}件のモニターに通知チャンネルを設定しました`;
    bulkResultVariant.value = "success";
    await loadMonitors();
  } catch (e) {
    bulkResult.value = e instanceof Error ? e.message : "一括設定に失敗しました";
    bulkResultVariant.value = "error";
  } finally {
    bulkSaving.value = false;
  }
}

async function onMonitorCreated() {
  await loadMonitors();
  // 新しく作成されたモニターを選択
  if (monitors.value.length > 0) {
    selectMonitor(monitors.value[monitors.value.length - 1].id);
  }
}

async function loadMonitors() {
  monitors.value = await client.monitor.list();
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
  await Promise.all([loadMonitors(), loadChannels()]);
});
</script>

<style scoped>
.settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
}

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

.tab-btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: none;
  color: var(--color-base-content, gray);
  opacity: 0.5;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition:
    opacity 0.15s,
    border-color 0.15s;
}

.tab-btn:hover {
  opacity: 0.8;
}

.tab-btn.active {
  opacity: 1;
  border-bottom-color: var(--status-up);
}

.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  min-height: 500px;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

.settings-sidebar {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
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
  padding: 0.625rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-subtle);
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
.dot-pending {
  background-color: var(--color-base-content, gray);
  opacity: 0.3;
}

.settings-content {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem;
  align-self: start;
}

.settings-section {
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 0.5rem;
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

.settings-card,
.bulk-section .settings-card {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
</style>
