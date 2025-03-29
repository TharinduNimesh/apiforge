<script setup lang="ts">
import type { ApiEndpoint } from '~/types/api';
import { usePocketBase } from '~/lib/pocketbase';

const props = defineProps<{
  endpoint: ApiEndpoint;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
  (e: 'close'): void;
}>();

const loading = ref(false);
const isOpen = ref(false);
const pb = usePocketBase();

const handleDelete = async () => {
  loading.value = true;
  try {
    // Delete the endpoint from PocketBase
    await pb.collection('endpoints').delete(props.endpoint.id);
    
    // Also delete all parameters associated with this endpoint
    // Note: This is not needed if you have cascade delete set up in PocketBase
    const parameters = await pb.collection('parameters').getList(1, 50, {
      filter: `endpoint = "${props.endpoint.id}"`
    });
    
    for (const param of parameters.items) {
      await pb.collection('parameters').delete(param.id);
    }

    // Show success toast
    useToast().add({
      title: 'Success',
      description: 'Endpoint deleted successfully',
      color: 'success'
    });

    emit('delete', props.endpoint.id);
    handleClose();
  } catch (error: any) {
    console.error('Error deleting endpoint:', error);
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to delete endpoint',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ content: 'min-w-[400px]' }"
  >
    <UButton
      color="error"
      variant="ghost"
      icon="i-heroicons-trash"
    />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Delete Endpoint</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="handleClose"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-full bg-error-50">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="h-6 w-6 text-error-500"
              />
            </div>
            <div class="space-y-1">
              <h4 class="font-medium">{{ props.endpoint.name }}</h4>
              <p class="text-sm text-gray-500">
                Are you sure you want to delete this endpoint? This action cannot be undone 
                and will remove all associated parameters.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="handleClose"
            />
            <UButton
              label="Delete"
              color="error"
              :loading="loading"
              @click="handleDelete"
            />
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>