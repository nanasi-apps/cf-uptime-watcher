<template>
  <ElTag :type="tagType" effect="light" round size="small">
    {{ label }}
  </ElTag>
</template>

<script lang="ts" setup>
const props = defineProps<{
  status: "up" | "down" | "maintenance" | "pending";
}>();
const { t } = useI18n();

const tagType = computed(() => {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    up: "success",
    down: "danger",
    maintenance: "warning",
    pending: "info",
  };
  return map[props.status] ?? "info";
});

const label = computed(() => {
  const map: Record<string, string> = {
    up: t("status.up"),
    down: t("status.down"),
    maintenance: t("status.maintenance"),
    pending: t("status.pending"),
  };
  return map[props.status];
});
</script>
