<template>
  <div v-pre class="mt-2 text-xs text-base-content/50">
    <p class="mb-1 font-medium">Variables:</p>
    <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono">
      <span
        ><code>{{ monitor.name }}</code></span
      >
      <span>Monitor name</span>
      <span
        ><code>{{ monitor.url }}</code></span
      >
      <span>URL</span>
      <span
        ><code>{{ monitor.method }}</code></span
      >
      <span>GET / POST</span>
      <span
        ><code>{{ status }}</code></span
      >
      <span>DOWN / RECOVERED</span>
      <span
        ><code>{{ statusCode }}</code></span
      >
      <span>HTTP status</span>
      <span
        ><code>{{ responseTime }}</code></span
      >
      <span>e.g. 120ms</span>
      <span
        ><code>{{ error }}</code></span
      >
      <span>Error message</span>
      <span
        ><code>{{ timestamp }}</code></span
      >
      <span>ISO timestamp</span>
    </div>
    <p class="mt-2">
      Mentions: Discord <code>&lt;@USER_ID&gt;</code> <code>&lt;@&amp;ROLE_ID&gt;</code> / Slack
      <code>&lt;@USER_ID&gt;</code> <code>&lt;!channel&gt;</code>
    </p>
  </div>
</template>
