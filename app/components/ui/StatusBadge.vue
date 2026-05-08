<template>
  <ElTag :type="tagType" effect="light" round size="small">
    {{ label }}
  </ElTag>
</template>

<script lang="ts" setup>
const props = defineProps<{
  status: "up" | "down" | "pending";
}>();
const { t } = useI18n();

const tagType = computed(() => {
  const map: Record<string, "success" | "danger" | "info"> = {
    up: "success",
    down: "danger",
    pending: "info",
  };
  return map[props.status] ?? "info";
});

const label = computed(() => {
  const map: Record<string, string> = {
    up: t("status.up"),
    down: t("status.down"),
    pending: t("status.pending"),
  };
  return map[props.status];
});
</script>
