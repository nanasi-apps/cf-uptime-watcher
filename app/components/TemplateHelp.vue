<template>
  <div v-pre class="mt-2 text-xs text-base-content/50">
    <p class="mb-1 font-medium">テンプレート変数:</p>
    <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono">
      <span
        ><code>{{ monitor.name }}</code></span
      >
      <span>モニター名</span>
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
      <span>HTTPステータス</span>
      <span
        ><code>{{ responseTime }}</code></span
      >
      <span>例: 120ms</span>
      <span
        ><code>{{ error }}</code></span
      >
      <span>エラーメッセージ</span>
      <span
        ><code>{{ timestamp }}</code></span
      >
      <span>ISO タイムスタンプ</span>
    </div>
    <p class="mt-2">
      ダウン時テンプレートと復旧時テンプレートを個別に設定できます。未入力の場合はデフォルトテンプレートを使用します。
    </p>
    <p class="mt-2">
      メンション: Discord <code>&lt;@USER_ID&gt;</code> <code>&lt;@&amp;ROLE_ID&gt;</code> / Slack
      <code>&lt;@USER_ID&gt;</code> <code>&lt;!channel&gt;</code>
    </p>
  </div>
</template>
