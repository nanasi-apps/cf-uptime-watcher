<template>
  <div class="template-help">
    <p class="template-help-title">{{ t("templateHelp.title") }}</p>
    <div class="template-help-grid">
      <span><code v-text="'{{ monitor.name }}'"></code></span>
      <span>{{ t("templateHelp.monitorName") }}</span>
      <span><code v-text="'{{ monitor.url }}'"></code></span>
      <span>{{ t("templateHelp.url") }}</span>
      <span><code v-text="'{{ monitor.method }}'"></code></span>
      <span>{{ t("templateHelp.method") }}</span>
      <span><code v-text="'{{ status }}'"></code></span>
      <span>{{ t("templateHelp.status") }}</span>
      <span><code v-text="'{{ statusCode }}'"></code></span>
      <span>{{ t("templateHelp.statusCode") }}</span>
      <span><code v-text="'{{ responseTime }}'"></code></span>
      <span>{{ t("templateHelp.responseTime") }}</span>
      <span><code v-text="'{{ error }}'"></code></span>
      <span>{{ t("templateHelp.error") }}</span>
      <span><code v-text="'{{ timestamp }}'"></code></span>
      <span>{{ t("templateHelp.timestamp") }}</span>
    </div>
    <p class="template-help-text">
      {{ t("templateHelp.description") }}
    </p>
    <p class="template-help-text">
      {{ t("templateHelp.mentions", { discordUser: "<@USER_ID>", discordRole: "<@&ROLE_ID>",
      slackUser: "<@USER_ID>", slackChannel: "<!channel>", }) }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>

<style scoped>
.template-help {
  margin-top: 0.5rem;
  color: var(--app-text-muted);
  font-size: 0.75rem;
}

.template-help-title {
  margin: 0 0 0.25rem;
  font-weight: 500;
}

.template-help-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 1rem;
  row-gap: 0.125rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.template-help-text {
  margin: 0.5rem 0 0;
}
</style>
