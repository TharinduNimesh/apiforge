<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref } from 'vue';
import type { ApiEndpoint, ApiParameter } from '~/types/api';
import EndpointModal from '~/components/api/EndpointModal.vue';

interface CreateApiForm {
  name: string;
  description: string;
  type: 'FREE' | 'PAID';
  baseUrl: string;
  rateLimit: number;
  endpoints: ApiEndpoint[];
}

const formData = ref<CreateApiForm>({
  name: '',
  description: '',
  type: 'FREE',
  baseUrl: '',
  rateLimit: 60,
  endpoints: []
});

const endpointModal = ref({
  isOpen: false,
  editingEndpoint: {
    id: '',
    name: '',
    method: 'GET',
    path: '',
    description: '',
    parameters: [],
    responses: []
  } as ApiEndpoint
});

const handleAddEndpoint = () => {
  endpointModal.value.editingEndpoint = {
    id: crypto.randomUUID(),
    name: '',
    method: 'GET',
    path: '',
    description: '',
    parameters: [],
    responses: []
  };
  endpointModal.value.isOpen = true;
};

const handleEditEndpoint = (endpoint: ApiEndpoint) => {
  endpointModal.value.editingEndpoint = { ...endpoint };
  endpointModal.value.isOpen = true;
};

const handleSaveEndpoint = (endpoint: ApiEndpoint) => {
  const index = formData.value.endpoints.findIndex(e => e.id === endpoint.id);
  if (index !== -1) {
    formData.value.endpoints[index] = endpoint;
  } else {
    formData.value.endpoints.push(endpoint);
  }
};

// Form validation rules
const rules = {
  name: (value: string) => !!value || 'API name is required',
  description: (value: string) => !!value || 'Description is required',
  baseUrl: (value: string) => {
    if (!value) return 'Base URL is required';
    try {
      new URL(value);
      return true;
    } catch (e) {
      return 'Please enter a valid URL';
    }
  }
};

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
      color: 'success'
    });
    navigateTo('/console/apis');
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to create API',
      color: 'error'
    });
  }
};

const handleDeleteEndpoint = (endpointId: string) => {
  formData.value.endpoints = formData.value.endpoints.filter(
    e => e.id !== endpointId
  );
};

const typeItems = [
  { label: 'FREE', value: 'FREE' },
  { label: 'PAID', value: 'PAID' }
];

</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center gap-4">
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-left"
          color="neutral"
          @click="$router.back()"
          class="rounded-full"
        />
        <h1 class="text-2xl font-semibold text-gray-900">
          Create New API
        </h1>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Info Card -->
        <UCard>
          <template #header>
            <div class="text-lg font-medium">Basic Information</div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="API Name" name="name" :validate="rules.name" required>
              <UInput v-model="formData.name" placeholder="Enter API name" />
            </UFormField>

            <UFormField label="Type" name="type">
              <UTabs
                :content="false"
                :items="typeItems"
                v-model="formData.type"
                color="neutral"
              />
            </UFormField>
          </div>

          <UFormField 
            label="Base URL" 
            name="baseUrl" 
            :validate="rules.baseUrl"
            required
            class="mt-4"
          >
            <UInput
              v-model="formData.baseUrl"
              placeholder="https://api.example.com"
            />
          </UFormField>

          <UFormField 
            label="Description" 
            name="description" 
            :validate="rules.description"
            required
            class="mt-4"
          >
            <UTextarea
              v-model="formData.description"
              :rows="4"
              placeholder="Describe your API..."
            />
          </UFormField>

          <UFormField 
            label="Rate Limit (requests per hour)" 
            name="rateLimit"
            class="mt-4"
          >
            <UInput
              v-model="formData.rateLimit"
              type="number"
              :min="1"
              :max="1000"
            />
          </UFormField>
        </UCard>

        <!-- Endpoints Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="text-lg font-medium">Endpoints</div>
              <EndpointModal @save="handleSaveEndpoint" />
            </div>
          </template>

          <div v-if="formData.endpoints.length === 0" class="text-center py-12">
            <UIcon
              name="i-heroicons-square-3-stack-3d"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-semibold text-gray-900">No endpoints</h3>
            <p class="mt-1 text-sm text-gray-500">
              Start by adding an endpoint to your API
            </p>
            <div class="mt-6">
              <EndpointModal @save="handleSaveEndpoint" />
            </div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="endpoint in formData.endpoints"
              :key="endpoint.id"
              class="relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UBadge
                      :color="endpoint.method === 'GET' ? 'success' : 
                             endpoint.method === 'POST' ? 'info' :
                             endpoint.method === 'PUT' ? 'warning' :
                             endpoint.method === 'DELETE' ? 'error' : 'neutral'"
                      :label="endpoint.method"
                    />
                    <span class="font-medium">{{ endpoint.name }}</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ endpoint.path }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    @click="handleEditEndpoint(endpoint)"
                  />
                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="handleDeleteEndpoint(endpoint.id!)"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-3">
          <UButton
            to="/console/apis"
            color="neutral"
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
    </div>
  </div>
</template>