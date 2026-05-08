<template>
  <span class="status-dot" :class="dotClass"></span>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  status: "up" | "down" | "pending";
}>();

const dotClass = computed(() => {
  const map: Record<string, string> = {
    up: "status-dot-up",
    down: "status-dot-down",
    pending: "status-dot-pending",
  };
  return map[props.status];
});
</script>

<style scoped>
.status-dot {
  display: inline-block;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.status-dot-up {
  background: var(--status-up);
}

.status-dot-down {
  background: var(--status-down);
  animation: pulse-slow 2s ease-in-out infinite;
}

.status-dot-pending {
  background: var(--status-pending);
  opacity: 0.45;
}
</style>
