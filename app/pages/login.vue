<template>
  <div class="login-page">
    <ElCard :body-style="{ padding: 0 }" class="login-card" shadow="always">
      <div class="login-card-body">
        <div class="login-header">
          <span class="login-mark"> HC </span>
          <h2 class="login-title">{{ t("login.title") }}</h2>
          <p class="login-description">{{ t("login.description") }}</p>
        </div>

        <form @submit.prevent="handleLogin">
          <ElFormItem class="password-field" :error="error" :label="t('login.password')" required>
            <ElInput id="password" v-model="password" type="password" required />
          </ElFormItem>

          <div v-if="error" class="login-error">{{ error }}</div>

          <div class="login-actions">
            <ElButton native-type="submit" class="login-submit" type="primary" :loading="loading">
              {{ t("common.login") }}
            </ElButton>
          </div>
        </form>
      </div>
    </ElCard>
  </div>
</template>

<script lang="ts" setup>
const password = ref("");
const error = ref("");
const loading = ref(false);
const { t } = useI18n();

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    const result = await client.auth.login({ password: password.value });
    if (result.success) {
      localStorage.setItem("auth_token", password.value);
      document.cookie = `auth_token=${encodeURIComponent(password.value)}; path=/; SameSite=Lax`;
      navigateTo("/");
    } else {
      error.value = t("login.invalidPassword");
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 70vh;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 24rem;
  animation: slide-up 0.25s ease-out;
}

.login-card-body {
  padding: 1.5rem;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.login-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: var(--el-color-primary);
  color: var(--app-primary-text);
  font-size: 1.125rem;
  font-weight: 900;
}

.login-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.login-description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.875rem;
}

.password-field {
  margin-top: 1rem;
}

.login-error {
  margin-top: 0.75rem;
  color: var(--el-color-danger);
  font-size: 0.875rem;
  text-align: center;
}

.login-actions {
  margin-top: 1.5rem;
}

.login-submit {
  width: 100%;
}
</style>
