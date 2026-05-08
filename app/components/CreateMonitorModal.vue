<template>
  <ElDialog
    :model-value="open"
    :title="t('monitorForm.createTitle')"
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
      <!-- Name & URL -->
      <div class="form-block">
        <ElFormItem :label="t('monitorForm.name')" required
          ><ElInput v-model="form.name" placeholder="My API" required
        /></ElFormItem>
      </div>

      <div class="form-block">
        <ElFormItem :label="t('monitorForm.displayName')"
          ><ElInput v-model="form.displayName" placeholder="My Service Monitor"
        /></ElFormItem>
      </div>

      <div class="form-block">
        <ElFormItem :label="t('monitorForm.url')" required
          ><ElInput
            v-model="form.url"
            type="url"
            placeholder="https://api.example.com/health"
            required
        /></ElFormItem>
      </div>

      <!-- Method & Timeout -->
      <div class="form-grid form-block">
        <ElFormItem :label="t('monitorForm.method')"
          ><ElSelect v-model="form.method" class="full-width"
            ><ElOption
              v-for="option in methodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value" /></ElSelect
        ></ElFormItem>

        <ElFormItem :label="t('monitorForm.timeoutSeconds')" required
          ><ElInput
            v-model="form.timeout"
            type="number"
            placeholder="30"
            required
            min="1"
            max="120"
        /></ElFormItem>
      </div>

      <!-- Expected Status -->
      <div class="form-block">
        <ElFormItem :label="t('monitorForm.expectedStatus')"
          ><ElInput
            v-model="form.expectedStatus"
            type="number"
            placeholder="200"
            min="100"
            max="599"
        /></ElFormItem>
      </div>

      <!-- POST body (conditional) -->
      <div v-if="form.method === 'POST'">
        <div class="form-block">
          <ElFormItem label="Content-Type"
            ><ElSelect
              :model-value="selectedContentType"
              class="full-width"
              @update:model-value="handleContentTypeChange"
              ><ElOption
                v-for="option in contentTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></ElSelect
          ></ElFormItem>
        </div>

        <div class="form-block">
          <ElCollapse
            ><ElCollapseItem :title="t('monitorForm.requestBody')"
              ><ElFormItem :label="t('monitorForm.body')"
                ><ElInput
                  v-model="form.body"
                  :rows="4"
                  placeholder='{"key": "value"}'
                  type="textarea" /></ElFormItem></ElCollapseItem
          ></ElCollapse>
        </div>
      </div>

      <!-- Headers (collapsible) -->
      <div class="form-block">
        <ElCollapse
          ><ElCollapseItem :title="t('monitorForm.customHeaders')"
            ><ElFormItem :label="t('monitorForm.headers')"
              ><ElInput
                v-model="form.headers"
                :rows="3"
                placeholder='{"Authorization": "Bearer token"}'
                type="textarea" /></ElFormItem></ElCollapseItem
        ></ElCollapse>
      </div>

      <!-- Error -->
      <ElAlert
        v-if="error"
        :closable="false"
        class="form-alert"
        :title="error"
        type="error"
        show-icon
      />

      <!-- Actions -->
      <div class="form-actions">
        <ElButton text type="primary" @click="$emit('close')">{{ t("common.cancel") }}</ElButton>
        <ElButton native-type="submit" type="primary" :loading="loading">{{
          t("common.create")
        }}</ElButton>
      </div>
    </ElForm>
  </ElDialog>
</template>

<script lang="ts" setup>
defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; created: [] }>();
const { t } = useI18n();

const form = ref({
  name: "",
  displayName: "",
  url: "",
  method: "GET",
  timeout: "30",
  expectedStatus: "200",
  headers: "",
  body: "",
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

const contentTypeOptions = computed(() => [
  { value: "", label: t("settings.contentTypeNone") },
  ...CONTENT_TYPE_OPTIONS.map((ct) => ({ value: ct, label: ct })),
  { value: "custom", label: t("settings.contentTypeCustom") },
]);

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    parseHeaders(form.value.headers);

    await client.monitor.create({
      name: form.value.name,
      displayName: form.value.displayName || null,
      url: form.value.url,
      method: form.value.method as "GET" | "POST",
      timeout: Number(form.value.timeout),
      expectedStatus: Number(form.value.expectedStatus),
      headers: form.value.headers || null,
      body: form.value.method === "POST" ? form.value.body || null : null,
    });
    form.value = {
      name: "",
      displayName: "",
      url: "",
      method: "GET",
      timeout: "30",
      expectedStatus: "200",
      headers: "",
      body: "",
    };
    emit("created");
    emit("close");
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("import.createFailed");
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

.form-block {
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.full-width {
  width: 100%;
}

.form-alert {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.aligned-form :deep(.el-collapse-item__header) {
  padding: 0 1rem;
}

.aligned-form :deep(.el-collapse-item__content) {
  padding: 1rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
