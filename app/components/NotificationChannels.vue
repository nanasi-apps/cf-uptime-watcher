<template>
  <AppCard>
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-lg m-0">通知</h3>
      <AppButton variant="outline" size="sm" @click="showAdd = true">+ Webhook追加</AppButton>
    </div>

    <div v-if="channels.length === 0" class="text-center py-4 text-base-content/50 text-sm">
      通知チャンネルがありません。
    </div>

    <div class="space-y-2">
      <div
        v-for="ch in channels"
        :key="ch.id"
        class="flex items-center gap-3 p-3 rounded-lg bg-base-200"
      >
        <AppBadge :variant="ch.type === 'discord' ? 'primary' : 'secondary'" size="sm">
          {{ ch.type }}
        </AppBadge>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm">{{ ch.name }}</div>
          <div class="text-xs text-base-content/50 truncate">
            {{ hasCustomSettings(ch) ? "カスタム設定" : "デフォルト設定" }}
          </div>
        </div>
        <AppButton variant="ghost" size="xs" :loading="testingId === ch.id" @click="testSend(ch)">
          テスト
        </AppButton>
        <AppButton variant="ghost" size="xs" @click="openEdit(ch)">編集</AppButton>
        <AppToggle v-model="ch.active" label="" @update:model-value="toggleActive(ch)" />
        <AppButton variant="ghost" size="xs" class="text-error" @click="remove(ch)">X</AppButton>
      </div>
    </div>

    <!-- Add dialog -->
    <AppModal :open="showAdd" title="通知チャンネル追加" @close="showAdd = false">
      <form @submit.prevent="handleCreate">
        <div class="mb-4">
          <AppInput v-model="form.name" label="名前" placeholder="本番アラート" required />
        </div>

        <div class="mb-4">
          <AppSelect v-model="form.type" label="タイプ" :options="typeOptions" />
        </div>

        <div class="mb-4">
          <AppInput
            v-model="form.webhookUrl"
            label="Webhook URL"
            type="text"
            placeholder="https://discord.com/api/webhooks/..."
            required
          />
        </div>

        <div class="mb-4">
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
        </div>

        <div v-if="form.type === 'discord'" class="mb-4">
          <AppCollapsible title="Discord Payload設定">
            <AppTextarea
              v-model="form.discordContent"
              label="Content"
              :rows="3"
              placeholder="{{status}} {{monitor.name}}"
              monospace
            />
            <AppInput v-model="form.discordUsername" label="Username" placeholder="Healthcheck" />
            <AppInput
              v-model="form.discordAvatarUrl"
              label="Avatar URL"
              type="text"
              placeholder="https://example.com/avatar.png"
            />
            <AppToggle v-model="form.discordTts" label="TTSで送信" />
            <p class="mt-2 text-xs text-base-content/50">
              Content、Username、Avatar URL はテンプレート変数を使えます。未入力なら Embed
              のみ送信します。
            </p>
          </AppCollapsible>
        </div>

        <AppAlert v-if="error" variant="error" class="text-sm mb-4">{{ error }}</AppAlert>

        <div class="modal-action">
          <AppButton variant="ghost" @click="showAdd = false">キャンセル</AppButton>
          <AppButton type="submit" variant="primary" :loading="loading">追加</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Edit dialog -->
    <AppModal :open="showEdit" title="チャンネル編集" @close="showEdit = false">
      <form @submit.prevent="handleUpdate">
        <div class="mb-4">
          <AppInput v-model="editForm.name" label="名前" required />
        </div>

        <div class="mb-4">
          <AppInput v-model="editForm.webhookUrl" label="Webhook URL" type="text" required />
        </div>

        <div class="mb-4">
          <AppTextarea
            v-model="editForm.downTemplate"
            label="ダウン時テンプレート"
            :rows="5"
            :placeholder="defaultTemplate"
            monospace
          />
          <AppTextarea
            v-model="editForm.upTemplate"
            label="復旧時テンプレート"
            :rows="5"
            :placeholder="defaultTemplate"
            monospace
          />
          <TemplateHelp />
        </div>

        <div v-if="editForm.type === 'discord'" class="mb-4">
          <AppCollapsible title="Discord Payload設定">
            <AppTextarea
              v-model="editForm.discordContent"
              label="Content"
              :rows="3"
              placeholder="{{status}} {{monitor.name}}"
              monospace
            />
            <AppInput
              v-model="editForm.discordUsername"
              label="Username"
              placeholder="Healthcheck"
            />
            <AppInput
              v-model="editForm.discordAvatarUrl"
              label="Avatar URL"
              type="text"
              placeholder="https://example.com/avatar.png"
            />
            <AppToggle v-model="editForm.discordTts" label="TTSで送信" />
            <p class="mt-2 text-xs text-base-content/50">
              Content、Username、Avatar URL はテンプレート変数を使えます。未入力なら Embed
              のみ送信します。
            </p>
          </AppCollapsible>
        </div>

        <AppAlert v-if="editError" variant="error" class="text-sm mb-4">{{ editError }}</AppAlert>

        <div class="modal-action">
          <AppButton variant="ghost" @click="showEdit = false">キャンセル</AppButton>
          <AppButton type="submit" variant="primary" :loading="editLoading">保存</AppButton>
        </div>
      </form>
    </AppModal>
  </AppCard>
</template>

<script lang="ts" setup>
interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl: string;
  template: string | null;
  downTemplate: string | null;
  upTemplate: string | null;
  discordContent: string | null;
  discordUsername: string | null;
  discordAvatarUrl: string | null;
  discordTts: boolean | null;
  active: boolean;
  createdAt: string;
}

const defaultTemplate =
  "[{{status}}] {{monitor.name}}\nURL: {{monitor.url}}\nStatus: {{statusCode}} | Response: {{responseTime}}\n{{error}}";

const channels = ref<Channel[]>([]);
const showAdd = ref(false);
const showEdit = ref(false);
const loading = ref(false);
const editLoading = ref(false);
const testingId = ref<number | null>(null);
const error = ref("");
const editError = ref("");

const form = ref({
  name: "",
  type: "discord",
  webhookUrl: "",
  downTemplate: "",
  upTemplate: "",
  discordContent: "",
  discordUsername: "",
  discordAvatarUrl: "",
  discordTts: false,
});

const editForm = ref({
  id: 0,
  type: "discord",
  name: "",
  webhookUrl: "",
  downTemplate: "",
  upTemplate: "",
  discordContent: "",
  discordUsername: "",
  discordAvatarUrl: "",
  discordTts: false,
});

const typeOptions = [
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
];

async function load() {
  channels.value = await client.notification.list();
}

async function handleCreate() {
  error.value = "";
  loading.value = true;
  try {
    await client.notification.create({
      name: form.value.name,
      type: form.value.type as "discord" | "slack",
      webhookUrl: form.value.webhookUrl,
      downTemplate: form.value.downTemplate || null,
      upTemplate: form.value.upTemplate || null,
      discordContent: form.value.type === "discord" ? form.value.discordContent || null : null,
      discordUsername: form.value.type === "discord" ? form.value.discordUsername || null : null,
      discordAvatarUrl: form.value.type === "discord" ? form.value.discordAvatarUrl || null : null,
      discordTts: form.value.type === "discord" ? form.value.discordTts : null,
    });
    form.value = {
      name: "",
      type: "discord",
      webhookUrl: "",
      downTemplate: "",
      upTemplate: "",
      discordContent: "",
      discordUsername: "",
      discordAvatarUrl: "",
      discordTts: false,
    };
    showAdd.value = false;
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "チャンネルの追加に失敗しました";
  } finally {
    loading.value = false;
  }
}

function openEdit(ch: Channel) {
  editForm.value = {
    id: ch.id,
    type: ch.type,
    name: ch.name,
    webhookUrl: ch.webhookUrl,
    downTemplate: ch.downTemplate ?? "",
    upTemplate: ch.upTemplate ?? "",
    discordContent: ch.discordContent ?? "",
    discordUsername: ch.discordUsername ?? "",
    discordAvatarUrl: ch.discordAvatarUrl ?? "",
    discordTts: ch.discordTts ?? false,
  };
  editError.value = "";
  showEdit.value = true;
}

async function handleUpdate() {
  editError.value = "";
  editLoading.value = true;
  try {
    await client.notification.update({
      id: editForm.value.id,
      name: editForm.value.name,
      webhookUrl: editForm.value.webhookUrl,
      downTemplate: editForm.value.downTemplate || null,
      upTemplate: editForm.value.upTemplate || null,
      discordContent:
        editForm.value.type === "discord" ? editForm.value.discordContent || null : null,
      discordUsername:
        editForm.value.type === "discord" ? editForm.value.discordUsername || null : null,
      discordAvatarUrl:
        editForm.value.type === "discord" ? editForm.value.discordAvatarUrl || null : null,
      discordTts: editForm.value.type === "discord" ? editForm.value.discordTts : null,
    });
    showEdit.value = false;
    await load();
  } catch (e) {
    editError.value = e instanceof Error ? e.message : "更新に失敗しました";
  } finally {
    editLoading.value = false;
  }
}

function hasCustomSettings(ch: Channel) {
  return !!(
    ch.template ||
    ch.downTemplate ||
    ch.upTemplate ||
    ch.discordContent ||
    ch.discordUsername ||
    ch.discordAvatarUrl ||
    ch.discordTts
  );
}

async function toggleActive(ch: Channel) {
  await client.notification.update({ id: ch.id, active: !ch.active });
  await load();
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
  if (confirm(`「${ch.name}」を削除しますか？`)) {
    await client.notification.delete({ id: ch.id });
    await load();
  }
}

onMounted(load);
</script>
