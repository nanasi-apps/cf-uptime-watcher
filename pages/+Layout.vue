<!-- https://vike.dev/Layout -->

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-sm">
      <div class="flex-1">
        <a href="/" class="btn btn-ghost text-xl">CF Healthcheck</a>
      </div>
      <div class="flex-none flex gap-1">
        <template v-if="isLoggedIn">
          <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
        </template>
        <a v-else href="/login" class="btn btn-ghost btn-sm">Login</a>
      </div>
    </div>
    <div class="container mx-auto max-w-6xl p-4">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import "./tailwind.css";
import { computed, ref, onMounted } from "vue";
import { navigate } from "vike/client/router";

const token = ref<string | null>(null);

const isLoggedIn = computed(() => !!token.value);

onMounted(() => {
  token.value = localStorage.getItem("auth_token");
});

function logout() {
  localStorage.removeItem("auth_token");
  token.value = null;
  navigate("/login");
}
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
* {
  box-sizing: border-box;
}
</style>
