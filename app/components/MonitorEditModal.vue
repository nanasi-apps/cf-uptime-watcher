<template>
  <ElDialog
    :model-value="open"
    title="モニター編集"
    width="32rem"
    align-center
    @close="$emit('close')"
  >
    <ElForm
      class="aligned-form"
      label-position="right"
      label-width="12rem"
      @submit.prevent="handleSubmit"
    >
      <div class="mb-4">
        <ElFormItem label="名前（内部用）" required
          ><ElInput v-model="form.name" required
        /></ElFormItem>
      </div>

      <div class="mb-4">
        <ElFormItem label="表示名（権限がない時に見える名前）"
          ><ElInput v-model="form.displayName"
        /></ElFormItem>
      </div>

      <div class="mb-4">
        <ElFormItem label="URL" required
          ><ElInput v-model="form.url" type="url" placeholder="https://example.com" required
        /></ElFormItem>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <ElFormItem label="メソッド"
          ><ElSelect v-model="form.method" class="w-full"
            ><ElOption
              v-for="option in methodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value" /></ElSelect
        ></ElFormItem>

        <ElFormItem label="タイムアウト (秒)" required
          ><ElInput v-model="form.timeout" type="number" required min="1" max="120"
        /></ElFormItem>
      </div>

      <div class="mb-4">
        <ElFormItem label="期待ステータス"
          ><ElInput v-model="form.expectedStatus" type="number" min="100" max="599"
        /></ElFormItem>
      </div>

      <div v-if="form.method === 'POST'">
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

        <div class="mb-4">
          <ElCollapse
            ><ElCollapseItem title="リクエストボディ"
              ><ElFormItem label="ボディ"
                ><ElInput
                  v-model="form.body"
                  :rows="4"
                  placeholder='{"key": "value"}'
                  type="textarea" /></ElFormItem></ElCollapseItem
          ></ElCollapse>
        </div>
      </div>

      <div class="mb-4">
        <ElCollapse
          ><ElCollapseItem title="カスタムヘッダー"
            ><ElFormItem label="ヘッダー"
              ><ElInput
                v-model="form.headers"
                :rows="3"
                placeholder='{"Authorization": "Bearer token"}'
                type="textarea" /></ElFormItem></ElCollapseItem
        ></ElCollapse>
      </div>

      <div class="form-control mb-4">
        <label class="inline-flex items-center gap-3"
          ><span class="text-sm">有効</span><ElSwitch v-model="form.active"
        /></label>
      </div>

      <ElAlert
        v-if="error"
        :closable="false"
        class="text-sm mb-4"
        :title="error"
        type="error"
        show-icon
      />

      <div class="flex justify-end gap-2 mt-6">
        <ElButton text type="primary" @click="$emit('close')">キャンセル</ElButton>
        <ElButton native-type="submit" type="primary" :loading="loading">保存</ElButton>
      </div>
    </ElForm>
  </ElDialog>
</template>

<script lang="ts" setup>
import type { MonitorWithStatus } from "./types";

const props = defineProps<{ open: boolean; monitor: MonitorWithStatus | null }>();
const emit = defineEmits<{ close: []; updated: [] }>();

const form = ref({
  name: "",
  displayName: "",
  url: "",
  method: "GET",
  timeout: "30",
  expectedStatus: "200",
  headers: "",
  body: "",
  active: true,
});

const loading = ref(false);
const error = ref("");

const headersRef = computed({
  get: () => form.value.headers,
  set: (v: string) => {
    form.value.headers = v;
  },
});

const { parseHeaders, selectedContentType, handleContentTypeChange, CONTENT_TYPE_OPTIONS } =
  useHeadersEditor(headersRef);

const methodOptions = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
];

const contentTypeOptions = [
  { value: "", label: "なし" },
  ...CONTENT_TYPE_OPTIONS.map((ct) => ({ value: ct, label: ct })),
  { value: "custom", label: "カスタム / ヘッダーJSONを保持" },
];

watch(
  () => props.monitor,
  (m) => {
    if (m) {
      form.value = {
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
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.monitor) return;
  error.value = "";
  loading.value = true;
  try {
    parseHeaders(form.value.headers);

    await client.monitor.update({
      id: props.monitor.id,
      name: form.value.name,
      displayName: form.value.displayName || null,
      url: form.value.url,
      method: form.value.method as "GET" | "POST",
      timeout: Number(form.value.timeout),
      expectedStatus: Number(form.value.expectedStatus),
      headers: form.value.headers || null,
      body: form.value.method === "POST" ? form.value.body || null : null,
      active: form.value.active,
    });
    emit("updated");
    emit("close");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "更新に失敗しました";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
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
</style>
