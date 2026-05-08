<template>
  <ElDialog
    :model-value="open"
    :title="t('import.title')"
    width="42rem"
    align-center
    @close="handleClose"
  >
    <div v-if="!result" class="space-y-4">
      <div>
        <p class="mb-2 text-sm font-medium">{{ t("import.jsonFile") }}</p>
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

      <div class="form-control">
        <label class="inline-flex items-center gap-3"
          ><span class="text-sm">{{ t("import.skipDuplicates") }}</span
          ><ElSwitch v-model="skipDuplicates"
        /></label>
      </div>

      <div v-if="preview.length > 0" class="bg-base-200 rounded-lg p-4">
        <h4 class="font-medium text-sm mb-2">
          {{ t("import.preview", { count: preview.length }) }}
        </h4>
        <div class="max-h-48 overflow-y-auto space-y-1">
          <div
            v-for="(item, i) in preview.slice(0, 10)"
            :key="i"
            class="text-xs flex items-center gap-2"
          >
            <ElTag type="info" effect="plain" round size="small">{{ item.method }}</ElTag>
            <span class="truncate">{{ item.name }}</span>
            <span class="text-base-content/50 truncate flex-1">{{ item.url }}</span>
          </div>
          <div v-if="preview.length > 10" class="text-xs text-base-content/50 text-center py-2">
            {{ t("import.more", { count: preview.length - 10 }) }}
          </div>
        </div>
      </div>

      <ElAlert
        v-if="error"
        :closable="false"
        class="text-sm"
        :title="error"
        type="error"
        show-icon
      />

      <div class="flex justify-end gap-2 mt-6">
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

    <div v-else class="space-y-4">
      <div class="flex gap-4">
        <ElCard class="flex-1" shadow="never">
          <ElStatistic :title="t('import.imported')" :value="result.imported" />
        </ElCard>
        <ElCard class="flex-1" shadow="never">
          <ElStatistic :title="t('import.skipped')" :value="result.skipped" />
        </ElCard>
        <ElCard class="flex-1" shadow="never">
          <ElStatistic :title="t('import.errors')" :value="result.errors" />
        </ElCard>
      </div>

      <div
        v-if="result.details.some((d) => d.status !== 'imported')"
        class="bg-base-200 rounded-lg p-4"
      >
        <h4 class="font-medium text-sm mb-2">{{ t("import.details") }}</h4>
        <div class="max-h-64 overflow-y-auto space-y-1">
          <div
            v-for="(detail, i) in result.details.filter((d) => d.status !== 'imported')"
            :key="i"
            class="text-xs flex items-center gap-2"
          >
            <ElTag
              :type="detail.status === 'skipped' ? 'warning' : 'danger'"
              effect="light"
              round
              size="small"
            >
              {{ detail.status === "skipped" ? t("import.skipped") : t("import.errors") }}
            </ElTag>
            <span class="truncate">{{ detail.name }}</span>
            <span v-if="detail.message" class="text-base-content/50 truncate flex-1">
              {{ detail.message }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
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
