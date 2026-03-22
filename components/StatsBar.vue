<template>
  <div class="stats shadow w-full mb-6 bg-base-100">
    <div class="stat">
      <div class="stat-title">Total</div>
      <div class="stat-value text-lg">{{ total }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Up</div>
      <div class="stat-value text-lg text-success">{{ up }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Down</div>
      <div class="stat-value text-lg text-error">{{ down }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ total: number; up: number; down: number }>();
</script>
