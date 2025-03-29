`<script setup lang="ts">
import { ref, computed } from 'vue';

interface ApiKeyForm {
  name: string;
  expiresIn: string;
}

const emit = defineEmits<{
  (e: 'submit', form: ApiKeyForm): void;
  (e: 'close'): void;
}>();

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

const resetForm = () => {
  form.value = {
    name: '',
    expiresIn: '30'
  };
};

const handleClose = () => {
  isOpen.value = false;
  resetForm();
  emit('close');
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    emit('submit', form.value);
    resetForm();
    isOpen.value = false;
    emit('close');
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
placeholder="Select expiration"
              key="value"
              name="label"
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
        </form>
      </UCard>
    </template>
  </UModal>
</template>`
