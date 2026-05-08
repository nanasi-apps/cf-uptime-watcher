<template>
  <ElAlert :closable="false" :title="message" :type="alertType" center class="mb-6" show-icon />
</template>

<script lang="ts" setup>
const props = defineProps<{ total: number; up: number; down: number }>();

const alertType = computed(() => {
  if (props.total === 0) return "info";
  if (props.down === 0) return "success";
  if (props.down === props.total) return "error";
  return "warning";
});

const message = computed(() => {
  if (props.total === 0) return "モニターがありません";
  if (props.down === 0) return "全システム稼働中";
  if (props.down === props.total) return "全システム停止中";
  return `${props.down}件のシステムに問題が発生しています`;
});
</script>
