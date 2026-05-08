<template>
  <footer class="app-footer">
    <div class="app-footer-inner">
      <span class="footer-copy">{{ t("app.footer") }}</span>
      <nav class="footer-nav">
        <ElLink
          href="https://github.com/mattyatea/cf-uptime-watcher"
          rel="noopener noreferrer"
          target="_blank"
          underline="never"
          title="GitHub"
        >
          <svg class="github-icon" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
        </ElLink>
        <ClientOnly>
          <ElButton link size="small" :title="themeLabel" type="primary" @click="toggleTheme">
            {{ theme === "dark" ? "☀" : "☾" }}
          </ElButton>
          <ElSelect
            :model-value="locale"
            :aria-label="t('locale.label')"
            size="small"
            class="locale-select"
            :teleported="false"
            @update:model-value="setLocale"
          >
            <ElOption :label="t('locale.ja')" value="ja" />
            <ElOption :label="t('locale.en')" value="en" />
          </ElSelect>
        </ClientOnly>
        <template v-if="isLoggedIn">
          <NuxtLink to="/settings" class="nav-link">
            {{ t("common.settings") }}
          </NuxtLink>
          <ElButton link size="small" type="primary" @click="logout">
            {{ t("common.logout") }}
          </ElButton>
        </template>
        <NuxtLink v-else to="/login" class="nav-link">
          {{ t("common.login") }}
        </NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<script lang="ts" setup>
const token = ref<string | null>(null);
const { locale, setLocale, t } = useI18n();

const isLoggedIn = computed(() => !!token.value);

const { theme, init: initTheme, toggle: toggleTheme } = useTheme();
const themeLabel = computed(() => (theme.value === "dark" ? t("theme.light") : t("theme.dark")));

onMounted(() => {
  token.value = localStorage.getItem("auth_token");
  initTheme();
});

function logout() {
  localStorage.removeItem("auth_token");
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
  token.value = null;
  navigateTo("/login");
}
</script>

<style scoped>
.app-footer {
  padding: 1.5rem 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.app-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer-copy {
  font-size: 0.75rem;
  color: var(--app-text-subtle);
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.github-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
}

.locale-select {
  width: 7.5rem;
}

.nav-link {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--app-text-subtle);
  font-size: 0.875rem;
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
}

.nav-link:hover {
  color: var(--app-text);
  background: var(--surface-hover);
}
</style>
