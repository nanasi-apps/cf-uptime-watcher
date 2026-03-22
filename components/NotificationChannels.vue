<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg m-0">Notifications</h3>
        <button class="btn btn-sm btn-outline" @click="showAdd = true">+ Add Webhook</button>
      </div>

      <div v-if="channels.length === 0" class="text-center py-4 text-base-content/50 text-sm">
        No notification channels.
      </div>

      <div class="space-y-2">
        <div
          v-for="ch in channels"
          :key="ch.id"
          class="flex items-center gap-3 p-3 rounded-lg bg-base-200"
        >
          <div
            class="badge badge-sm"
            :class="ch.type === 'discord' ? 'badge-primary' : 'badge-secondary'"
          >
            {{ ch.type }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ ch.name }}</div>
            <div class="text-xs text-base-content/50 truncate">
              {{ ch.template ? "Custom template" : "Default template" }}
            </div>
          </div>
          <button
            class="btn btn-ghost btn-xs"
            :disabled="testingId === ch.id"
            @click="testSend(ch)"
          >
            <span v-if="testingId === ch.id" class="loading loading-spinner loading-xs"></span>
            <span v-else>Test</span>
          </button>
          <button class="btn btn-ghost btn-xs" @click="openEdit(ch)">Edit</button>
          <input
            type="checkbox"
            class="toggle toggle-sm toggle-success"
            :checked="ch.active"
            @change="toggleActive(ch)"
          />
          <button class="btn btn-ghost btn-xs text-error" @click="remove(ch)">X</button>
        </div>
      </div>

      <!-- Add dialog -->
      <dialog :open="showAdd" class="modal modal-bottom sm:modal-middle" @close="showAdd = false">
        <div class="modal-box w-11/12 max-w-lg">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            @click="showAdd = false"
          >
            X
          </button>
          <h3 class="font-bold text-lg mb-4">Add Notification Channel</h3>
          <form @submit.prevent="handleCreate">
            <label class="floating-label mb-4">
              <span>Name</span>
              <input
                v-model="form.name"
                type="text"
                placeholder="Production alerts"
                class="input input-bordered w-full"
                required
              />
            </label>

            <label class="floating-label mb-4">
              <span>Type</span>
              <select v-model="form.type" class="select select-bordered w-full">
                <option value="discord">Discord</option>
                <option value="slack">Slack</option>
              </select>
            </label>

            <label class="floating-label mb-4">
              <span>Webhook URL</span>
              <input
                v-model="form.webhookUrl"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                class="input input-bordered w-full"
                required
              />
            </label>

            <div class="collapse collapse-arrow bg-base-200 mb-4">
              <input type="checkbox" />
              <div class="collapse-title font-medium text-sm">Message Template</div>
              <div class="collapse-content">
                <textarea
                  v-model="form.template"
                  class="textarea textarea-bordered w-full font-mono text-xs"
                  rows="5"
                  :placeholder="defaultTemplate"
                ></textarea>
                <TemplateHelp />
              </div>
            </div>

            <div v-if="error" class="alert alert-error text-sm mb-4">{{ error }}</div>

            <div class="modal-action">
              <button type="button" class="btn btn-ghost" @click="showAdd = false">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                Add
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showAdd = false">close</button>
        </form>
      </dialog>

      <!-- Edit dialog -->
      <dialog :open="showEdit" class="modal modal-bottom sm:modal-middle" @close="showEdit = false">
        <div class="modal-box w-11/12 max-w-lg">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            @click="showEdit = false"
          >
            X
          </button>
          <h3 class="font-bold text-lg mb-4">Edit Channel</h3>
          <form @submit.prevent="handleUpdate">
            <label class="floating-label mb-4">
              <span>Name</span>
              <input
                v-model="editForm.name"
                type="text"
                class="input input-bordered w-full"
                required
              />
            </label>

            <label class="floating-label mb-4">
              <span>Webhook URL</span>
              <input
                v-model="editForm.webhookUrl"
                type="url"
                class="input input-bordered w-full"
                required
              />
            </label>

            <div class="form-control mb-4">
              <label class="label"><span class="label-text">Message Template</span></label>
              <textarea
                v-model="editForm.template"
                class="textarea textarea-bordered w-full font-mono text-xs"
                rows="5"
                :placeholder="defaultTemplate"
              ></textarea>
              <TemplateHelp />
            </div>

            <div v-if="editError" class="alert alert-error text-sm mb-4">{{ editError }}</div>

            <div class="modal-action">
              <button type="button" class="btn btn-ghost" @click="showEdit = false">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="editLoading">
                <span v-if="editLoading" class="loading loading-spinner loading-sm"></span>
                Save
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showEdit = false">close</button>
        </form>
      </dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { client } from "../server/client";
import TemplateHelp from "./TemplateHelp.vue";

interface Channel {
  id: number;
  type: string;
  name: string;
  webhookUrl: string;
  template: string | null;
  active: boolean;
  createdAt: string;
}

const defaultTemplate =
  "[{{status}}] {{monitor.name}}\nURL: {{monitor.url}}\nStatus: {{statusCode}} | Response: {{responseTime}}\n{{error}}";

const channels = ref<Channel[]>([]);
const showAdd = ref(false);
const showEdit = ref(false);
const loading = ref(false);
const editLoading = ref(false);
const testingId = ref<number | null>(null);
const error = ref("");
const editError = ref("");

const form = ref({
  name: "",
  type: "discord" as "discord" | "slack",
  webhookUrl: "",
  template: "",
});

const editForm = ref({ id: 0, name: "", webhookUrl: "", template: "" });

async function load() {
  channels.value = await client.notification.list();
}

async function handleCreate() {
  error.value = "";
  loading.value = true;
  try {
    await client.notification.create({
      name: form.value.name,
      type: form.value.type,
      webhookUrl: form.value.webhookUrl,
      template: form.value.template || null,
    });
    form.value = { name: "", type: "discord", webhookUrl: "", template: "" };
    showAdd.value = false;
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to add channel";
  } finally {
    loading.value = false;
  }
}

function openEdit(ch: Channel) {
  editForm.value = {
    id: ch.id,
    name: ch.name,
    webhookUrl: ch.webhookUrl,
    template: ch.template ?? "",
  };
  editError.value = "";
  showEdit.value = true;
}

async function handleUpdate() {
  editError.value = "";
  editLoading.value = true;
  try {
    await client.notification.update({
      id: editForm.value.id,
      name: editForm.value.name,
      webhookUrl: editForm.value.webhookUrl,
      template: editForm.value.template || null,
    });
    showEdit.value = false;
    await load();
  } catch (e) {
    editError.value = e instanceof Error ? e.message : "Failed to update";
  } finally {
    editLoading.value = false;
  }
}

async function toggleActive(ch: Channel) {
  await client.notification.update({ id: ch.id, active: !ch.active });
  await load();
}

async function testSend(ch: Channel) {
  testingId.value = ch.id;
  try {
    await client.notification.test({ id: ch.id });
    alert(`Test notification sent to "${ch.name}"`);
  } catch (e) {
    alert(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  } finally {
    testingId.value = null;
  }
}

async function remove(ch: Channel) {
  if (confirm(`Delete "${ch.name}"?`)) {
    await client.notification.delete({ id: ch.id });
    await load();
  }
}

onMounted(load);
</script>
