<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <ElCard :body-style="{ padding: 0 }" class="w-full max-w-sm slide-up" shadow="always">
      <div class="p-6">
        <div class="flex flex-col items-center gap-3 mb-2">
          <span
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-content text-lg font-black"
          >
            HC
          </span>
          <h2 class="text-xl font-bold m-0">管理者ログイン</h2>
          <p class="text-sm text-base-content/50 m-0">パスワードを入力してください</p>
        </div>

        <form @submit.prevent="handleLogin">
          <ElFormItem class="mt-4" :error="error" label="パスワード" required>
            <ElInput id="password" v-model="password" type="password" required />
          </ElFormItem>

          <div v-if="error" class="mt-3 text-sm text-error text-center">{{ error }}</div>

          <div class="mt-6">
            <ElButton native-type="submit" class="w-full" type="primary" :loading="loading">
              ログイン
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

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    const result = await client.auth.login({ password: password.value });
    if (result.success) {
      localStorage.setItem("auth_token", password.value);
      navigateTo("/");
    } else {
      error.value = "パスワードが正しくありません";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>
