<template>
  <ElAlert
    :closable="false"
    :title="message"
    :type="alertType"
    center
    class="stats-alert"
    show-icon
  />
</template>

<script lang="ts" setup>
const props = defineProps<{ total: number; up: number; down: number }>();
const { t } = useI18n();

const alertType = computed(() => {
  if (props.total === 0) return "info";
  if (props.down === 0) return "success";
  if (props.down === props.total) return "error";
  return "warning";
});

const message = computed(() => {
  if (props.total === 0) return t("stats.empty");
  if (props.down === 0) return t("stats.allUp");
  if (props.down === props.total) return t("stats.allDown");
  return t("stats.partialDown", { count: props.down });
});
</script>

<style scoped>
.stats-alert {
  margin-bottom: 1.5rem;
}
</style>
