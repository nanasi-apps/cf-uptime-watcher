<template>
  <ElCard :body-style="{ padding: '1rem' }" class="mb-6" shadow="never">
    <h3 class="font-bold text-lg m-0 mb-3">{{ t("channels.title") }}</h3>

    <div v-if="allChannels.length === 0" class="text-sm text-base-content/50">
      {{ t("channels.empty") }}
    </div>

    <div class="space-y-2">
      <label
        v-for="ch in allChannels"
        :key="ch.id"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 cursor-pointer"
      >
        <ElCheckbox :model-value="selectedIds.has(ch.id)" @change="toggle(ch.id)" />
        <ElTag :type="ch.type === 'discord' ? 'primary' : 'info'" effect="light" round size="small">
          {{ ch.type }}
        </ElTag>
        <span class="text-sm">{{ ch.name }}</span>
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
