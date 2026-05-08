<template>
  <ElCard :body-style="{ padding: '1rem' }" class="channel-selector" shadow="never">
    <h3 class="channel-selector-title">{{ t("channels.title") }}</h3>

    <div v-if="allChannels.length === 0" class="channel-empty">
      {{ t("channels.empty") }}
    </div>

    <div class="channel-list">
      <label v-for="ch in allChannels" :key="ch.id" class="channel-option">
        <ElCheckbox :model-value="selectedIds.has(ch.id)" @change="toggle(ch.id)" />
        <ElTag :type="ch.type === 'discord' ? 'primary' : 'info'" effect="light" round size="small">
          {{ ch.type }}
        </ElTag>
        <span class="channel-name">{{ ch.name }}</span>
      </label>
    </div>
  </ElCard>
</template>

<script lang="ts" setup>
interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl: string;
  template: string | null;
  active: boolean;
  createdAt: string;
}

const props = defineProps<{ monitorId: number; channelIds: number[] }>();
const { t } = useI18n();

const allChannels = ref<Channel[]>([]);
const selectedIds = ref(new Set<number>());

watch(
  () => props.channelIds,
  (ids) => {
    selectedIds.value = new Set(ids);
  },
  { immediate: true },
);

async function toggle(channelId: number) {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(channelId)) {
    newSet.delete(channelId);
  } else {
    newSet.add(channelId);
  }
  selectedIds.value = newSet;

  await client.monitor.setChannels({
    id: props.monitorId,
    channelIds: [...newSet],
  });
}

onMounted(async () => {
  allChannels.value = await client.notification.list();
});
</script>

<style scoped>
.channel-selector {
  margin-bottom: 1.5rem;
}

.channel-selector-title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 700;
}

.channel-empty {
  color: var(--app-text-muted);
  font-size: 0.875rem;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.channel-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.channel-option:hover {
  background: var(--surface-hover);
}

.channel-name {
  font-size: 0.875rem;
}
</style>
