<template>
  <button type="button" class="btn" @click="state.count++">Counter {{ state.count }}</button>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const state = reactive({ count: 0 });
</script>
