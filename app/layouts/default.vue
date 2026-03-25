<template>
  <div class="min-h-screen bg-base-200">
    <!-- Main content -->
    <main class="container mx-auto max-w-5xl p-4 pt-6 fade-in">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-base-300">
      <div class="container mx-auto max-w-5xl px-4 flex items-center justify-between">
        <span class="text-xs text-base-content/30"
          >CF Healthcheck &mdash; Powered by Cloudflare Workers</span
        >
        <nav class="flex items-center gap-1">
          <button
            class="nav-link text-base-content/40 hover:text-base-content hover:bg-base-200"
            :title="themeLabel"
            @click="toggleTheme"
          >
            {{ theme === "dark" ? "☀" : "☾" }}
          </button>
          <template v-if="isLoggedIn">
            <NuxtLink
              to="/settings"
              class="nav-link text-base-content/40 hover:text-base-content hover:bg-base-200"
            >
              設定
            </NuxtLink>
            <button
              class="nav-link text-base-content/40 hover:text-base-content hover:bg-base-200"
              @click="logout"
            >
              ログアウト
            </button>
          </template>
          <NuxtLink
            v-else
            to="/login"
            class="nav-link text-base-content/40 hover:text-base-content hover:bg-base-200"
          >
            ログイン
          </NuxtLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
const token = ref<string | null>(null);

const isLoggedIn = computed(() => !!token.value);

const { theme, init: initTheme, toggle: toggleTheme } = useTheme();
const themeLabel = computed(() => (theme.value === "dark" ? "ライトモード" : "ダークモード"));

onMounted(() => {
  token.value = localStorage.getItem("auth_token");
  initTheme();
});

function logout() {
  localStorage.removeItem("auth_token");
  token.value = null;
  navigateTo("/login");
}
</script>

<style>
body {
  margin: 0;
}
* {
  box-sizing: border-box;
}
</style>

<style scoped>
.nav-link {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: none;
  background: none;
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.15s,
    background 0.15s;
}
</style>
