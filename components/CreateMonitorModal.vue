<template>
  <dialog :open="open" class="modal modal-bottom sm:modal-middle" @close="$emit('close')">
    <div class="modal-box w-11/12 max-w-lg">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="$emit('close')"
      >
        X
      </button>
      <h3 class="font-bold text-lg mb-6">Add Monitor</h3>

      <form @submit.prevent="handleSubmit">
        <!-- Name & URL -->
        <label class="floating-label mb-4">
          <span>Name</span>
          <input
            v-model="form.name"
            type="text"
            placeholder="My API"
            class="input input-bordered w-full"
            required
          />
        </label>

        <label class="floating-label mb-4">
          <span>URL</span>
          <input
            v-model="form.url"
            type="url"
            placeholder="https://api.example.com/health"
            class="input input-bordered w-full"
            required
          />
        </label>

        <!-- Method & Timeout -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <label class="floating-label">
            <span>Method</span>
            <select v-model="form.method" class="select select-bordered w-full">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>

          <label class="floating-label">
            <span>Timeout (sec)</span>
            <input
              v-model.number="form.timeout"
              type="number"
              min="1"
              max="120"
              placeholder="30"
              class="input input-bordered w-full"
              required
            />
          </label>
        </div>

        <!-- Expected Status -->
        <label class="floating-label mb-4">
          <span>Expected Status</span>
          <input
            v-model.number="form.expectedStatus"
            type="number"
            min="100"
            max="599"
            placeholder="200"
            class="input input-bordered w-full"
          />
        </label>

        <!-- POST body (conditional) -->
        <div v-if="form.method === 'POST'">
          <div class="collapse collapse-arrow bg-base-200 mb-4">
            <input type="checkbox" />
            <div class="collapse-title font-medium text-sm">Request Body</div>
            <div class="collapse-content">
              <textarea
                v-model="form.body"
                class="textarea textarea-bordered w-full font-mono text-sm"
                rows="4"
                placeholder='{"key": "value"}'
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Headers (collapsible) -->
        <div class="collapse collapse-arrow bg-base-200 mb-4">
          <input type="checkbox" />
          <div class="collapse-title font-medium text-sm">Custom Headers</div>
          <div class="collapse-content">
            <textarea
              v-model="form.headers"
              class="textarea textarea-bordered w-full font-mono text-sm"
              rows="3"
              placeholder='{"Authorization": "Bearer token"}'
            ></textarea>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="alert alert-error text-sm mb-4">{{ error }}</div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            Create
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { client } from "../server/client";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; created: [] }>();

const form = ref({
  name: "",
  url: "",
  method: "GET" as "GET" | "POST",
  timeout: 30,
  expectedStatus: 200,
  headers: "",
  body: "",
});

const loading = ref(false);
const error = ref("");

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await client.monitor.create({
      name: form.value.name,
      url: form.value.url,
      method: form.value.method,
      timeout: form.value.timeout,
      expectedStatus: form.value.expectedStatus,
      headers: form.value.headers || null,
      body: form.value.method === "POST" ? form.value.body || null : null,
    });
    form.value = {
      name: "",
      url: "",
      method: "GET",
      timeout: 30,
      expectedStatus: 200,
      headers: "",
      body: "",
    };
    emit("created");
    emit("close");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to create monitor";
  } finally {
    loading.value = false;
  }
}
</script>
