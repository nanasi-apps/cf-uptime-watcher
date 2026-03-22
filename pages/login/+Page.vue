<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <div class="card w-full max-w-sm bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center text-2xl">Login</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-control mt-4">
            <label class="label" for="password">
              <span class="label-text">Password</span>
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter password"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div v-if="error" class="mt-2 text-sm text-error">{{ error }}</div>
          <div class="form-control mt-6">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { navigate } from "vike/client/router";
import { client } from "../../server/client";

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
      navigate("/");
    } else {
      error.value = "Invalid password";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>
