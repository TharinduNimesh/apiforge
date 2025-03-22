<script setup lang="ts">
const formData = ref({
  name: '',
  description: '',
  type: 'FREE',
  status: 'INACTIVE'
});

const { pending, execute } = useAsyncData('createApi', async () => {
  // Mock API call for now
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
});

const handleSubmit = async () => {
  try {
    await execute();
    useToast().add({
      title: 'Success',
      description: 'API created successfully',
      color: 'green'
    });
    navigateTo('/console');
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to create API',
      color: 'red'
    });
  }
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-3xl sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center gap-4">
        <UButton
          to="/console"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          color="gray"
        />
        <h1 class="text-2xl font-semibold text-gray-900">
          Create New API
        </h1>
      </div>

      <UCard>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <UFormField label="API Name" name="name" required>
            <UInput v-model="formData.name" placeholder="Enter API name" />
          </UFormField>

          <UFormField label="Description" name="description" required>
            <UTextarea 
              v-model="formData.description" 
              placeholder="Describe your API"
              :rows="4"
            />
          </UFormField>

          <UFormField label="Type" name="type" required>
            <URadio 
              v-model="formData.type" 
              name="type"
              :options="[
                { label: 'Free', value: 'FREE' },
                { label: 'Paid', value: 'PAID' }
              ]"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              to="/console"
              color="gray"
              variant="ghost"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="pending"
            >
              Create API
            </UButton>
          </div>
        </form>
      </UCard>
    </div>
  </div>
</template>