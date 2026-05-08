<template>
  <div class="notification-settings-layout">
    <div class="notification-sidebar bg-base-100">
      <div class="sidebar-header">
        <span class="text-sm font-semibold">Webhook一覧</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-base-content/40">{{ channels.length }}件</span>
          <AppButton variant="primary" size="xs" @click="startCreate">+ Webhook追加</AppButton>
        </div>
      </div>

      <div class="sidebar-list">
        <button
          v-for="ch in channels"
          :key="ch.id"
          class="sidebar-item"
          :class="{ active: paneMode === 'edit' && selectedChannelId === ch.id }"
          @click="selectChannel(ch)"
        >
          <span class="sidebar-dot" :class="ch.active ? 'dot-active' : 'dot-inactive'"></span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <AppBadge :variant="ch.type === 'discord' ? 'primary' : 'secondary'" size="sm">
                {{ ch.type }}
              </AppBadge>
              <span class="truncate text-sm font-medium">{{ ch.name }}</span>
            </div>
            <div class="mt-1 truncate text-xs text-base-content/50">
              {{ hasCustomSettings(ch) ? "カスタム設定" : "デフォルト設定" }}
            </div>
          </div>
        </button>

        <div
          v-if="channels.length === 0"
          class="px-4 py-8 text-center text-sm text-base-content/40"
        >
          通知チャンネルがありません
        </div>
      </div>
    </div>

    <div class="notification-content bg-base-100">
      <div v-if="paneMode === 'idle'" class="py-16 text-center text-base-content/40">
        左のリストからWebhookを選択、または新規作成してください
      </div>

      <template v-else>
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-bold">
              {{ paneMode === "create" ? "Webhook追加" : form.name || "Webhook編集" }}
            </h2>
            <p class="mt-1 mb-0 text-sm text-base-content/50">
              {{
                paneMode === "create"
                  ? "新しい通知チャンネルを作成します"
                  : "Webhookの通知内容とDiscord項目を編集します"
              }}
            </p>
          </div>
          <div v-if="paneMode === 'edit' && selectedChannel" class="flex shrink-0 gap-2">
            <AppButton
              variant="outline"
              size="sm"
              :loading="testingId === selectedChannel.id"
              @click="testSend(selectedChannel)"
            >
              テスト
            </AppButton>
            <AppButton variant="danger" size="sm" @click="remove(selectedChannel)">削除</AppButton>
          </div>
        </div>

        <form @submit.prevent="saveChannel">
          <div class="space-y-4">
            <AppInput v-model="form.name" label="名前" placeholder="本番アラート" required />

            <AppSelect
              v-if="paneMode === 'create'"
              v-model="form.type"
              label="タイプ"
              :options="typeOptions"
            />
            <div v-else class="flex items-center gap-2 rounded-lg bg-base-200 p-3">
              <span class="text-sm text-base-content/50">タイプ</span>
              <AppBadge :variant="form.type === 'discord' ? 'primary' : 'secondary'" size="sm">
                {{ form.type }}
              </AppBadge>
            </div>

            <AppInput
              v-model="form.webhookUrl"
              label="Webhook URL"
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              required
            />

            <AppCollapsible title="メッセージテンプレート">
              <AppTextarea
                v-model="form.downTemplate"
                label="ダウン時テンプレート"
                :rows="5"
                :placeholder="defaultTemplate"
                monospace
              />
              <AppTextarea
                v-model="form.upTemplate"
                label="復旧時テンプレート"
                :rows="5"
                :placeholder="defaultTemplate"
                monospace
              />
              <TemplateHelp />
            </AppCollapsible>

            <AppCollapsible v-if="form.type === 'discord'" title="Discord Payload設定">
              <AppInput v-model="form.discordUsername" label="Username" placeholder="Healthcheck" />
              <AppInput
                v-model="form.discordAvatarUrl"
                label="Avatar URL"
                type="text"
                placeholder="https://example.com/avatar.png"
              />
              <AppToggle v-model="form.discordTts" label="TTSで送信" />

              <div class="settings-subsection">
                <h3 class="mb-2 text-sm font-semibold">Embed</h3>
                <div class="discord-field-group">
                  <AppInput
                    v-model="form.discordEmbedTitle"
                    label="Embed Title"
                    placeholder="{{monitor.name}}"
                  />
                  <AppInput
                    v-model="form.discordEmbedUrl"
                    label="Embed URL"
                    placeholder="{{monitor.url}}"
                  />
                  <AppInput
                    v-model="form.discordEmbedColor"
                    label="Embed Color"
                    placeholder="#00ff00"
                  />
                  <AppToggle v-model="form.discordEmbedTimestamp" label="Timestampを付ける" />
                </div>
              </div>

              <div class="settings-subsection">
                <h3 class="mb-2 text-sm font-semibold">Embed Author / Image / Footer</h3>
                <div class="discord-field-group">
                  <AppInput v-model="form.discordEmbedAuthorName" label="Author Name" />
                  <AppInput v-model="form.discordEmbedAuthorUrl" label="Author URL" />
                  <AppInput v-model="form.discordEmbedAuthorIconUrl" label="Author Icon URL" />
                  <AppInput v-model="form.discordEmbedThumbnailUrl" label="Thumbnail URL" />
                  <AppInput v-model="form.discordEmbedImageUrl" label="Image URL" />
                  <AppInput v-model="form.discordEmbedFooterText" label="Footer Text" />
                  <AppInput v-model="form.discordEmbedFooterIconUrl" label="Footer Icon URL" />
                </div>
              </div>

              <div class="settings-subsection">
                <h3 class="mb-2 text-sm font-semibold">Mentions / Flags</h3>
                <div class="discord-field-group">
                  <AppToggle v-model="form.discordAllowUserMentions" label="User mentionsを許可" />
                  <AppToggle v-model="form.discordAllowRoleMentions" label="Role mentionsを許可" />
                  <AppToggle v-model="form.discordAllowEveryoneMentions" label="@everyoneを許可" />
                  <AppToggle v-model="form.discordSuppressEmbeds" label="リンクEmbedを抑制" />
                  <AppToggle v-model="form.discordSuppressNotifications" label="通知を抑制" />
                </div>
              </div>

              <p class="mt-2 text-xs text-base-content/50">
                メッセージ本文はダウン時/復旧時テンプレートからEmbed本文として送信されます。Username、Avatar
                URL、Embed項目はテンプレート変数を使えます。
              </p>
            </AppCollapsible>

            <AppToggle v-model="form.active" label="有効" />
          </div>

          <AppAlert v-if="error" variant="error" class="mt-4 text-sm">{{ error }}</AppAlert>

          <div class="mt-6 flex justify-end gap-2">
            <AppButton variant="ghost" @click="resetPane">キャンセル</AppButton>
            <AppButton type="submit" variant="primary" :loading="saving">
              {{ paneMode === "create" ? "追加" : "保存" }}
            </AppButton>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
    error.value = e instanceof Error ? e.message : "保存に失敗しました";
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
    alert(`テスト通知を「${ch.name}」に送信しました`);
  } catch (e) {
    alert(`失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
  } finally {
    testingId.value = null;
  }
}

async function remove(ch: Channel) {
  if (!confirm(`「${ch.name}」を削除しますか？`)) return;

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
  padding: 0.75rem 1rem;
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
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 0.5rem;
}

.discord-field-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
</style>
