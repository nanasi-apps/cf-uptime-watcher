<template>
  <ElTag :type="tagType" effect="light" round size="small">
    {{ label }}
  </ElTag>
</template>

<script lang="ts" setup>
const props = defineProps<{
  status: "up" | "down" | "pending";
}>();

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
    up: "稼働中",
    down: "停止",
    pending: "待機中",
  };
  return map[props.status];
});
</script>
