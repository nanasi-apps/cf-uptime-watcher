<template>
  <ElDialog
    :model-value="open"
    :title="t('import.title')"
    width="42rem"
    align-center
    @close="handleClose"
  >
    <div v-if="!result" class="import-panel">
      <div>
        <p class="import-label">{{ t("import.jsonFile") }}</p>
        <ElUpload
          ref="uploadRef"
          accept=".json,application/json"
          :auto-upload="false"
          :limit="1"
          @change="handleFileChange"
        >
          <ElButton>{{ t("import.selectFile") }}</ElButton>
        </ElUpload>
      </div>

      <div>
        <label class="switch-row"
          ><span class="import-text">{{ t("import.skipDuplicates") }}</span
          ><ElSwitch v-model="skipDuplicates"
        /></label>
      </div>

      <div v-if="preview.length > 0" class="import-preview">
        <h4 class="import-preview-title">
          {{ t("import.preview", { count: preview.length }) }}
        </h4>
        <div class="import-preview-list preview-short">
          <div v-for="(item, i) in preview.slice(0, 10)" :key="i" class="import-row">
            <ElTag type="info" effect="plain" round size="small">{{ item.method }}</ElTag>
            <span class="import-row-title">{{ item.name }}</span>
            <span class="import-row-detail">{{ item.url }}</span>
          </div>
          <div v-if="preview.length > 10" class="import-more">
            {{ t("import.more", { count: preview.length - 10 }) }}
          </div>
        </div>
      </div>

      <ElAlert
        v-if="error"
        :closable="false"
        class="import-alert"
        :title="error"
        type="error"
        show-icon
      />

      <div class="import-actions">
        <ElButton text type="primary" @click="handleClose">{{ t("common.cancel") }}</ElButton>
        <ElButton
          type="primary"
          :disabled="!preview.length"
          :loading="loading"
          @click="handleImport"
        >
          {{
            t("import.importButton", {
              count: preview.length > 0 ? t("import.importCount", { count: preview.length }) : "",
            })
          }}
        </ElButton>
      </div>
    </div>

    <div v-else class="import-panel">
      <div class="import-stats">
        <ElCard class="import-stat" shadow="never">
          <ElStatistic :title="t('import.imported')" :value="result.imported" />
        </ElCard>
        <ElCard class="import-stat" shadow="never">
          <ElStatistic :title="t('import.skipped')" :value="result.skipped" />
        </ElCard>
        <ElCard class="import-stat" shadow="never">
          <ElStatistic :title="t('import.errors')" :value="result.errors" />
        </ElCard>
      </div>

      <div v-if="result.details.some((d) => d.status !== 'imported')" class="import-preview">
        <h4 class="import-preview-title">{{ t("import.details") }}</h4>
        <div class="import-preview-list preview-tall">
          <div
            v-for="(detail, i) in result.details.filter((d) => d.status !== 'imported')"
            :key="i"
            class="import-row"
          >
            <ElTag
              :type="detail.status === 'skipped' ? 'warning' : 'danger'"
              effect="light"
              round
              size="small"
            >
              {{ detail.status === "skipped" ? t("import.skipped") : t("import.errors") }}
            </ElTag>
            <span class="import-row-title">{{ detail.name }}</span>
            <span v-if="detail.message" class="import-row-detail">
              {{ detail.message }}
            </span>
          </div>
        </div>
      </div>

      <div class="import-actions">
        <ElButton type="primary" @click="handleClose">{{ t("common.done") }}</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<script lang="ts" setup>
import type { UploadFile, UploadInstance } from "element-plus";

interface MonitorInput {
  name: string;
  url: string;
  method: "GET" | "POST";
  headers?: string | null;
  body?: string | null;
  timeout?: number;
  expectedStatus?: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: Array<{
    name: string;
    status: "imported" | "skipped" | "error";
    message?: string;
  }>;
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [];
}>();

const uploadRef = ref<UploadInstance>();
const preview = ref<MonitorInput[]>([]);
const skipDuplicates = ref(true);
const loading = ref(false);
const error = ref("");
const result = ref<ImportResult | null>(null);
const { t } = useI18n();
const client = useRpcClient();

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      reset();
    }
  },
);

function reset() {
  preview.value = [];
  error.value = "";
  result.value = null;
  loading.value = false;
  uploadRef.value?.clearFiles();
}

function handleClose() {
  emit("close");
}

function handleFileChange(uploadFile: UploadFile) {
  const file = uploadFile.raw;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error(t("import.invalidFormat"));
      }

      preview.value = parsed.map((item: unknown) => {
        const m = item as Record<string, unknown>;
        if (!m.name || typeof m.name !== "string") {
          throw new Error(t("import.nameRequired"));
        }
        if (!m.url || typeof m.url !== "string") {
          throw new Error(t("import.urlRequired"));
        }
        if (!m.method || (m.method !== "GET" && m.method !== "POST")) {
          throw new Error(t("import.methodRequired"));
        }
        return {
          name: m.name,
          url: m.url,
          method: m.method,
          headers: typeof m.headers === "string" ? m.headers : null,
          body: typeof m.body === "string" ? m.body : null,
          timeout: typeof m.timeout === "number" ? m.timeout : 30,
          expectedStatus: typeof m.expectedStatus === "number" ? m.expectedStatus : 200,
        };
      });

      error.value = "";
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("import.invalidJson");
      preview.value = [];
    }
  };
  reader.readAsText(file);
}

async function handleImport() {
  if (!preview.value.length) return;

  loading.value = true;
  error.value = "";

  try {
    const res = await client.monitor.import({
      monitors: preview.value,
      skipDuplicates: skipDuplicates.value,
    });
    result.value = res;
    emit("imported");
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("import.importFailed");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.import-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-label,
.import-preview-title {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.import-text,
.import-alert {
  font-size: 0.875rem;
}

.import-preview {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--app-surface-muted);
}

.import-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.preview-short {
  max-height: 12rem;
}

.preview-tall {
  max-height: 16rem;
}

.import-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.import-row-title,
.import-row-detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-row-detail {
  flex: 1;
  color: var(--app-text-muted);
}

.import-more {
  padding: 0.5rem 0;
  color: var(--app-text-muted);
  font-size: 0.75rem;
  text-align: center;
}

.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.import-stats {
  display: flex;
  gap: 1rem;
}

.import-stat {
  flex: 1;
}

@media (max-width: 640px) {
  .import-stats {
    flex-direction: column;
  }
}
</style>
