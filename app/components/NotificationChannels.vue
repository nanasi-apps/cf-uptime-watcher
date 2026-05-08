<template>
  <div class="notification-settings-layout">
    <div class="notification-sidebar bg-base-100">
      <div class="sidebar-header">
        <span class="text-sm font-semibold">{{ t("notifications.listTitle") }}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-base-content/40">{{
            t("settings.count", { count: channels.length })
          }}</span>
          <ElButton size="small" type="primary" @click="startCreate">{{
            t("notifications.addWebhook")
          }}</ElButton>
        </div>
      </div>

      <div class="sidebar-list">
        <ElButton
          v-for="ch in channels"
          :key="ch.id"
          class="sidebar-item"
          :class="{ active: paneMode === 'edit' && selectedChannelId === ch.id }"
          text
          @click="selectChannel(ch)"
        >
          <span class="sidebar-dot" :class="ch.active ? 'dot-active' : 'dot-inactive'"></span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <ElTag
                :type="ch.type === 'discord' ? 'primary' : 'info'"
                effect="light"
                round
                size="small"
              >
                {{ ch.type }}
              </ElTag>
              <span class="truncate text-sm font-medium">{{ ch.name }}</span>
            </div>
            <div class="mt-1 truncate text-xs text-base-content/50">
              {{
                hasCustomSettings(ch)
                  ? t("notifications.customSettings")
                  : t("notifications.defaultSettings")
              }}
            </div>
          </div>
        </ElButton>

        <div
          v-if="channels.length === 0"
          class="px-4 py-8 text-center text-sm text-base-content/40"
        >
          {{ t("notifications.empty") }}
        </div>
      </div>
    </div>

    <div class="notification-content bg-base-100">
      <div v-if="paneMode === 'idle'" class="py-16 text-center text-base-content/40">
        {{ t("notifications.idle") }}
      </div>

      <template v-else>
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-bold">
              {{
                paneMode === "create"
                  ? t("notifications.createTitle")
                  : form.name || t("notifications.editTitle")
              }}
            </h2>
            <p class="mt-1 mb-0 text-sm text-base-content/50">
              {{
                paneMode === "create"
                  ? t("notifications.createDescription")
                  : t("notifications.editDescription")
              }}
            </p>
          </div>
          <div v-if="paneMode === 'edit' && selectedChannel" class="flex shrink-0 gap-2">
            <ElButton
              plain
              size="small"
              type="primary"
              :loading="testingId === selectedChannel.id"
              @click="testSend(selectedChannel)"
            >
              {{ t("common.test") }}
            </ElButton>
            <ElButton type="danger" size="small" @click="remove(selectedChannel)">{{
              t("common.delete")
            }}</ElButton>
          </div>
        </div>

        <ElForm
          class="aligned-form"
          label-position="right"
          label-width="12rem"
          @submit.prevent="saveChannel"
        >
          <div class="space-y-4">
            <ElFormItem :label="t('notifications.name')" required
              ><ElInput
                v-model="form.name"
                :placeholder="t('notifications.namePlaceholder')"
                required
            /></ElFormItem>

            <ElFormItem v-if="paneMode === 'create'" :label="t('notifications.type')"
              ><ElSelect v-model="form.type" class="w-full"
                ><ElOption
                  v-for="option in typeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value" /></ElSelect
            ></ElFormItem>
            <div v-else class="flex items-center gap-2 rounded-lg bg-base-200 p-3">
              <span class="text-sm text-base-content/50">{{ t("notifications.type") }}</span>
              <ElTag
                :type="form.type === 'discord' ? 'primary' : 'info'"
                effect="light"
                round
                size="small"
              >
                {{ form.type }}
              </ElTag>
            </div>

            <ElFormItem :label="t('notifications.webhookUrl')" required
              ><ElInput
                v-model="form.webhookUrl"
                placeholder="https://discord.com/api/webhooks/..."
                required
            /></ElFormItem>

            <ElCollapse>
              <ElCollapseItem :title="t('notifications.messageTemplate')">
                <ElFormItem :label="t('notifications.downTemplate')"
                  ><ElInput
                    v-model="form.downTemplate"
                    :rows="5"
                    :placeholder="defaultTemplate"
                    type="textarea"
                /></ElFormItem>
                <ElFormItem :label="t('notifications.upTemplate')"
                  ><ElInput
                    v-model="form.upTemplate"
                    :rows="5"
                    :placeholder="defaultTemplate"
                    type="textarea"
                /></ElFormItem>
                <TemplateHelp />
              </ElCollapseItem>
            </ElCollapse>

            <ElCollapse v-if="form.type === 'discord'">
              <ElCollapseItem :title="t('notifications.discordPayload')">
                <div class="discord-payload-settings">
                  <div class="discord-field-group">
                    <ElFormItem label="Username"
                      ><ElInput v-model="form.discordUsername" placeholder="Healthcheck"
                    /></ElFormItem>
                    <ElFormItem label="Avatar URL"
                      ><ElInput
                        v-model="form.discordAvatarUrl"
                        placeholder="https://example.com/avatar.png"
                    /></ElFormItem>
                    <ElFormItem :label="t('notifications.tts')">
                      <div>
                        <ElSwitch v-model="form.discordTts" />
                        <p class="mt-1 mb-0 text-xs text-base-content/50">
                          {{ t("notifications.ttsHelp") }}
                        </p>
                      </div>
                    </ElFormItem>
                  </div>

                  <div class="settings-subsection">
                    <h3 class="text-sm font-semibold">{{ t("notifications.embed") }}</h3>
                    <ElFormItem label="Embed Title"
                      ><ElInput v-model="form.discordEmbedTitle" placeholder="{{monitor.name}}"
                    /></ElFormItem>
                    <ElFormItem label="Embed URL"
                      ><ElInput v-model="form.discordEmbedUrl" placeholder="{{monitor.url}}"
                    /></ElFormItem>
                    <ElFormItem label="Embed Color"
                      ><ElInput v-model="form.discordEmbedColor" placeholder="#00ff00"
                    /></ElFormItem>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.embedTimestamp") }}</span
                      ><ElSwitch v-model="form.discordEmbedTimestamp"
                    /></label>
                  </div>

                  <div class="settings-subsection">
                    <h3 class="text-sm font-semibold">{{ t("notifications.embedMedia") }}</h3>
                    <ElFormItem label="Author Name"
                      ><ElInput v-model="form.discordEmbedAuthorName"
                    /></ElFormItem>
                    <ElFormItem label="Author URL"
                      ><ElInput v-model="form.discordEmbedAuthorUrl"
                    /></ElFormItem>
                    <ElFormItem label="Author Icon URL"
                      ><ElInput v-model="form.discordEmbedAuthorIconUrl"
                    /></ElFormItem>
                    <ElFormItem label="Thumbnail URL"
                      ><ElInput v-model="form.discordEmbedThumbnailUrl"
                    /></ElFormItem>
                    <ElFormItem label="Image URL"
                      ><ElInput v-model="form.discordEmbedImageUrl"
                    /></ElFormItem>
                    <ElFormItem label="Footer Text"
                      ><ElInput v-model="form.discordEmbedFooterText"
                    /></ElFormItem>
                    <ElFormItem label="Footer Icon URL"
                      ><ElInput v-model="form.discordEmbedFooterIconUrl"
                    /></ElFormItem>
                  </div>

                  <div class="settings-subsection">
                    <h3 class="text-sm font-semibold">{{ t("notifications.mentionsFlags") }}</h3>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.allowUserMentions") }}</span
                      ><ElSwitch v-model="form.discordAllowUserMentions"
                    /></label>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.allowRoleMentions") }}</span
                      ><ElSwitch v-model="form.discordAllowRoleMentions"
                    /></label>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.allowEveryoneMentions") }}</span
                      ><ElSwitch v-model="form.discordAllowEveryoneMentions"
                    /></label>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.suppressEmbeds") }}</span
                      ><ElSwitch v-model="form.discordSuppressEmbeds"
                    /></label>
                    <label class="inline-flex items-center gap-3"
                      ><span class="text-sm">{{ t("notifications.suppressNotifications") }}</span
                      ><ElSwitch v-model="form.discordSuppressNotifications"
                    /></label>
                  </div>

                  <p class="text-xs text-base-content/50">
                    {{ t("notifications.discordNote") }}
                  </p>
                </div>
              </ElCollapseItem>
            </ElCollapse>

            <label class="inline-flex items-center gap-3"
              ><span class="text-sm">{{ t("monitorForm.active") }}</span
              ><ElSwitch v-model="form.active"
            /></label>
          </div>

          <ElAlert
            v-if="error"
            :closable="false"
            class="mt-4 text-sm"
            :title="error"
            type="error"
            show-icon
          />

          <div class="mt-6 flex justify-end gap-2">
            <ElButton text type="primary" @click="resetPane">{{ t("common.cancel") }}</ElButton>
            <ElButton native-type="submit" type="primary" :loading="saving">
              {{ paneMode === "create" ? t("common.add") : t("common.save") }}
            </ElButton>
          </div>
        </ElForm>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from "element-plus";

type PaneMode = "idle" | "create" | "edit";
type ChannelType = "discord" | "slack";

interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl: string;
  template: string | null;
  downTemplate: string | null;
  upTemplate: string | null;
  discordUsername: string | null;
  discordAvatarUrl: string | null;
  discordTts: boolean | null;
  discordEmbedTitle: string | null;
  discordEmbedUrl: string | null;
  discordEmbedColor: string | null;
  discordEmbedAuthorName: string | null;
  discordEmbedAuthorUrl: string | null;
  discordEmbedAuthorIconUrl: string | null;
  discordEmbedThumbnailUrl: string | null;
  discordEmbedImageUrl: string | null;
  discordEmbedFooterText: string | null;
  discordEmbedFooterIconUrl: string | null;
  discordEmbedTimestamp: boolean | null;
  discordAllowUserMentions: boolean | null;
  discordAllowRoleMentions: boolean | null;
  discordAllowEveryoneMentions: boolean | null;
  discordSuppressEmbeds: boolean | null;
  discordSuppressNotifications: boolean | null;
  active: boolean;
  createdAt: string;
}

interface ChannelForm {
  type: ChannelType;
  name: string;
  webhookUrl: string;
  downTemplate: string;
  upTemplate: string;
  discordUsername: string;
  discordAvatarUrl: string;
  discordTts: boolean;
  discordEmbedTitle: string;
  discordEmbedUrl: string;
  discordEmbedColor: string;
  discordEmbedAuthorName: string;
  discordEmbedAuthorUrl: string;
  discordEmbedAuthorIconUrl: string;
  discordEmbedThumbnailUrl: string;
  discordEmbedImageUrl: string;
  discordEmbedFooterText: string;
  discordEmbedFooterIconUrl: string;
  discordEmbedTimestamp: boolean;
  discordAllowUserMentions: boolean;
  discordAllowRoleMentions: boolean;
  discordAllowEveryoneMentions: boolean;
  discordSuppressEmbeds: boolean;
  discordSuppressNotifications: boolean;
  active: boolean;
}

const defaultTemplate =
  "[{{status}}] {{monitor.name}}\nURL: {{monitor.url}}\nStatus: {{statusCode}} | Response: {{responseTime}}\n{{error}}";

const channels = ref<Channel[]>([]);
const paneMode = ref<PaneMode>("idle");
const selectedChannelId = ref<number | null>(null);
const saving = ref(false);
const testingId = ref<number | null>(null);
const error = ref("");
const { t } = useI18n();

const form = ref<ChannelForm>(blankForm());

const typeOptions = [
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
];

const selectedChannel = computed(
  () => channels.value.find((channel) => channel.id === selectedChannelId.value) ?? null,
);

async function load() {
  channels.value = await client.notification.list();
}

function blankForm(): ChannelForm {
  return {
    type: "discord",
    name: "",
    webhookUrl: "",
    downTemplate: "",
    upTemplate: "",
    discordUsername: "",
    discordAvatarUrl: "",
    discordTts: false,
    discordEmbedTitle: "",
    discordEmbedUrl: "",
    discordEmbedColor: "",
    discordEmbedAuthorName: "",
    discordEmbedAuthorUrl: "",
    discordEmbedAuthorIconUrl: "",
    discordEmbedThumbnailUrl: "",
    discordEmbedImageUrl: "",
    discordEmbedFooterText: "",
    discordEmbedFooterIconUrl: "",
    discordEmbedTimestamp: true,
    discordAllowUserMentions: false,
    discordAllowRoleMentions: false,
    discordAllowEveryoneMentions: false,
    discordSuppressEmbeds: false,
    discordSuppressNotifications: false,
    active: true,
  };
}

function formFromChannel(channel: Channel): ChannelForm {
  return {
    type: channel.type === "slack" ? "slack" : "discord",
    name: channel.name,
    webhookUrl: channel.webhookUrl,
    downTemplate: channel.downTemplate ?? "",
    upTemplate: channel.upTemplate ?? "",
    discordUsername: channel.discordUsername ?? "",
    discordAvatarUrl: channel.discordAvatarUrl ?? "",
    discordTts: channel.discordTts ?? false,
    discordEmbedTitle: channel.discordEmbedTitle ?? "",
    discordEmbedUrl: channel.discordEmbedUrl ?? "",
    discordEmbedColor: channel.discordEmbedColor ?? "",
    discordEmbedAuthorName: channel.discordEmbedAuthorName ?? "",
    discordEmbedAuthorUrl: channel.discordEmbedAuthorUrl ?? "",
    discordEmbedAuthorIconUrl: channel.discordEmbedAuthorIconUrl ?? "",
    discordEmbedThumbnailUrl: channel.discordEmbedThumbnailUrl ?? "",
    discordEmbedImageUrl: channel.discordEmbedImageUrl ?? "",
    discordEmbedFooterText: channel.discordEmbedFooterText ?? "",
    discordEmbedFooterIconUrl: channel.discordEmbedFooterIconUrl ?? "",
    discordEmbedTimestamp: channel.discordEmbedTimestamp ?? true,
    discordAllowUserMentions: channel.discordAllowUserMentions ?? false,
    discordAllowRoleMentions: channel.discordAllowRoleMentions ?? false,
    discordAllowEveryoneMentions: channel.discordAllowEveryoneMentions ?? false,
    discordSuppressEmbeds: channel.discordSuppressEmbeds ?? false,
    discordSuppressNotifications: channel.discordSuppressNotifications ?? false,
    active: channel.active,
  };
}

function startCreate() {
  paneMode.value = "create";
  selectedChannelId.value = null;
  form.value = blankForm();
  error.value = "";
}

function selectChannel(channel: Channel) {
  paneMode.value = "edit";
  selectedChannelId.value = channel.id;
  form.value = formFromChannel(channel);
  error.value = "";
}

function resetPane() {
  paneMode.value = "idle";
  selectedChannelId.value = null;
  form.value = blankForm();
  error.value = "";
}

function channelPayload() {
  const isDiscord = form.value.type === "discord";

  return {
    name: form.value.name,
    webhookUrl: form.value.webhookUrl,
    downTemplate: form.value.downTemplate || null,
    upTemplate: form.value.upTemplate || null,
    discordUsername: isDiscord ? form.value.discordUsername || null : null,
    discordAvatarUrl: isDiscord ? form.value.discordAvatarUrl || null : null,
    discordTts: isDiscord ? form.value.discordTts : null,
    discordEmbedTitle: isDiscord ? form.value.discordEmbedTitle || null : null,
    discordEmbedUrl: isDiscord ? form.value.discordEmbedUrl || null : null,
    discordEmbedColor: isDiscord ? form.value.discordEmbedColor || null : null,
    discordEmbedAuthorName: isDiscord ? form.value.discordEmbedAuthorName || null : null,
    discordEmbedAuthorUrl: isDiscord ? form.value.discordEmbedAuthorUrl || null : null,
    discordEmbedAuthorIconUrl: isDiscord ? form.value.discordEmbedAuthorIconUrl || null : null,
    discordEmbedThumbnailUrl: isDiscord ? form.value.discordEmbedThumbnailUrl || null : null,
    discordEmbedImageUrl: isDiscord ? form.value.discordEmbedImageUrl || null : null,
    discordEmbedFooterText: isDiscord ? form.value.discordEmbedFooterText || null : null,
    discordEmbedFooterIconUrl: isDiscord ? form.value.discordEmbedFooterIconUrl || null : null,
    discordEmbedTimestamp: isDiscord ? form.value.discordEmbedTimestamp : null,
    discordAllowUserMentions: isDiscord ? form.value.discordAllowUserMentions : null,
    discordAllowRoleMentions: isDiscord ? form.value.discordAllowRoleMentions : null,
    discordAllowEveryoneMentions: isDiscord ? form.value.discordAllowEveryoneMentions : null,
    discordSuppressEmbeds: isDiscord ? form.value.discordSuppressEmbeds : null,
    discordSuppressNotifications: isDiscord ? form.value.discordSuppressNotifications : null,
    active: form.value.active,
  };
}

async function saveChannel() {
  error.value = "";
  saving.value = true;

  try {
    if (paneMode.value === "create") {
      const created = await client.notification.create({
        type: form.value.type,
        ...channelPayload(),
      });
      await load();
      const createdChannel = channels.value.find((channel) => channel.id === created.id) ?? created;
      selectChannel(createdChannel);
      return;
    }

    if (paneMode.value === "edit" && selectedChannelId.value) {
      await client.notification.update({
        id: selectedChannelId.value,
        ...channelPayload(),
      });
      await load();
      const updatedChannel = selectedChannel.value;
      if (updatedChannel) {
        selectChannel(updatedChannel);
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("settings.saveFailed");
  } finally {
    saving.value = false;
  }
}

function hasCustomSettings(ch: Channel) {
  return !!(
    ch.template ||
    ch.downTemplate ||
    ch.upTemplate ||
    ch.discordUsername ||
    ch.discordAvatarUrl ||
    ch.discordTts ||
    ch.discordEmbedTitle ||
    ch.discordEmbedUrl ||
    ch.discordEmbedColor ||
    ch.discordEmbedAuthorName ||
    ch.discordEmbedAuthorUrl ||
    ch.discordEmbedAuthorIconUrl ||
    ch.discordEmbedThumbnailUrl ||
    ch.discordEmbedImageUrl ||
    ch.discordEmbedFooterText ||
    ch.discordEmbedFooterIconUrl ||
    ch.discordEmbedTimestamp === false ||
    ch.discordAllowUserMentions ||
    ch.discordAllowRoleMentions ||
    ch.discordAllowEveryoneMentions ||
    ch.discordSuppressEmbeds ||
    ch.discordSuppressNotifications
  );
}

async function testSend(ch: Channel) {
  testingId.value = ch.id;
  try {
    await client.notification.test({ id: ch.id });
    ElMessage.success(t("notifications.testSent", { name: ch.name }));
  } catch (e) {
    ElMessage.error(
      t("notifications.testFailed", {
        message: e instanceof Error ? e.message : t("common.unknownError"),
      }),
    );
  } finally {
    testingId.value = null;
  }
}

async function remove(ch: Channel) {
  try {
    await ElMessageBox.confirm(
      t("notifications.deleteConfirm", { name: ch.name }),
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

  await client.notification.delete({ id: ch.id });
  if (selectedChannelId.value === ch.id) {
    resetPane();
  }
  await load();
}

onMounted(load);
</script>

<style scoped>
.notification-settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  min-height: 500px;
}

@media (max-width: 768px) {
  .notification-settings-layout {
    grid-template-columns: 1fr;
  }
}

.notification-sidebar,
.notification-content {
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  align-self: start;
}

.notification-sidebar {
  overflow: hidden;
}

.notification-content {
  padding: 1.25rem;
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
  padding: 0.75rem 1rem;
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

.sidebar-item:hover,
.sidebar-item.active {
  background: var(--surface-hover);
}

.sidebar-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.dot-active {
  background-color: var(--status-up);
}

.dot-inactive {
  background-color: var(--color-base-content, gray);
  opacity: 0.3;
}

.settings-subsection {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 0.5rem;
}

.discord-payload-settings,
.discord-field-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
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
</style>
