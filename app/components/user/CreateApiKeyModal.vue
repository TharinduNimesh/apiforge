`<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePocketBase } from '~/lib/pocketbase';

interface ApiKeyForm {
  name: string;
  expiresIn: string;
}

const emit = defineEmits<{
  (e: "submit", form: ApiKeyForm): void;
  (e: "close"): void;
}>();

const pb = usePocketBase();
const isOpen = ref(false);

const form = ref<ApiKeyForm>({
  name: '',
  expiresIn: '30'
});

const expirationOptions = [
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
  { label: '180 days', value: '180' },
  { label: '365 days', value: '365' }
];

const isLoading = ref(false);
const generatedKey = ref<string | null>(null);

const resetForm = () => {
  form.value = {
    name: '',
    expiresIn: '30'
  };
  generatedKey.value = null;
};

const handleClose = () => {
  isOpen.value = false;
  resetForm();
  emit('close');
};

const handleSubmit = async () => {
  if (isLoading.value) return;
  if (!pb.authStore.record?.id) return;

  try {
    isLoading.value = true;

    // Call the backend endpoint to generate and store API key
    const response = await useFetch('/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`
      },
      body: {
        name: form.value.name,
        expiresIn: parseInt(form.value.expiresIn)
      }
    });

    if (response.error.value) {
      throw new Error(response.error.value?.message || 'Failed to create API key');
    }

    // Fix type issue by providing null as fallback
    generatedKey.value = response.data.value?.key || null;

    useToast().add({
      title: 'Success',
      description: 'API Key created successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });

    emit('submit', form.value);
  } catch (error: any) {
    console.error('Error creating API key:', error);
    useToast().add({
      title: 'Error',
      description: error?.message || 'Failed to create API key',
      color: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};

const isSubmitDisabled = computed(() => {
  return form.value.name.trim() === '' || isLoading.value;
});

const copyApiKey = async () => {
  if (!generatedKey.value) return;

  try {
    await navigator.clipboard.writeText(generatedKey.value);
    useToast().add({
      title: 'Success',
      description: 'API Key copied to clipboard',
      color: 'success',
      icon: 'i-heroicons-clipboard-document-check'
    });
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to copy API key',
      color: 'error'
    });
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'min-w-[500px]' }">
    <UButton 
      color="primary" 
      icon="i-heroicons-plus"
      label="Create New API Key"
    />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Create New API Key</h2>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="handleClose"
            />
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Success State - Show Generated Key -->
          <template v-if="generatedKey">
            <UAlert
              color="success"
              title="API Key Created Successfully"
              description="Make sure to copy your API key now. For security reasons, you won't be able to see it again."
              icon="i-heroicons-check-circle"
              variant="soft"
            />

            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div class="flex items-center justify-between gap-2">
                <code class="text-sm font-mono break-all">{{ generatedKey }}</code>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-clipboard"
                  @click="copyApiKey"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <UButton
                color="neutral"
                variant="ghost"
                label="Close"
                @click="handleClose"
              />
              <UButton
                color="primary"
                label="Create Another Key"
                @click="resetForm"
              />
            </div>
          </template>

          <!-- Create Key Form -->
          <template v-else>
            <!-- API Key Name -->
            <UFormField label="Key Name" required>
              <UInput
                v-model="form.name"
                placeholder="Enter key name"
                required
              />
            </UFormField>

            <!-- Expiration -->
            <UFormField label="Expires In" required>
              <USelectMenu
                class="w-full"
                v-model="form.expiresIn"
                :items="expirationOptions"
                label-key="label"
                value-key="value"
                required
              />
            </UFormField>

            <!-- Footer Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancel"
                @click="handleClose"
              />
              <UButton
                type="submit"
                color="primary"
                label="Create API Key"
                :loading="isLoading"
                :disabled="isSubmitDisabled"
              />
            </div>
          </template>
        </form>
      </UCard>
    </template>
  </UModal>
</template>`
