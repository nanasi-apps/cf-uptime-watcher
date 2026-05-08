<template>
  <div class="mt-2 text-xs text-base-content/50">
    <p class="mb-1 font-medium">{{ t("templateHelp.title") }}</p>
    <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono">
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
    <p class="mt-2">
      {{ t("templateHelp.description") }}
    </p>
    <p class="mt-2">
      {{ t("templateHelp.mentions", { discordUser: "<@USER_ID>", discordRole: "<@&ROLE_ID>",
      slackUser: "<@USER_ID>", slackChannel: "<!channel>", }) }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>
