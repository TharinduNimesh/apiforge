<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { usePocketBase } from '~/lib/pocketbase';
import type { ApiEndpoint } from '~/types/api';
import EndpointModal from '~/components/api/EndpointModal.vue';

definePageMeta({
  layout: 'console'
});

const pb = usePocketBase();
const loading = ref(false);
const toast = useToast();

const schema = z.object({
  name: z.string()
    .min(2, 'API name must be at least 2 characters')
    .max(100, 'API name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  type: z.enum(['FREE', 'PAID'], {
    errorMap: () => ({ message: 'Please select a valid API type' })
  }),
  baseUrl: z.string()
    .url('Please enter a valid URL')
    .min(1, 'Base URL is required'),
  rateLimit: z.number()
    .int('Rate limit must be a whole number')
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit must be less than 1000'),
  isActive: z.boolean(),
  endpoints: z.array(z.object({
    id: z.string(),
    name: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string(),
    description: z.string().default(''),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      in: z.enum(['body', 'header', 'path', 'query', 'formData'] as const),
      required: z.boolean(),
      description: z.string().default('')
    })),
    responses: z.array(z.any()).default([])
  }))
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: '',
  description: '',
  type: 'FREE',
  baseUrl: '',
  rateLimit: 60,
  isActive: true,
  endpoints: []
});

const typeItems = [
  { label: 'FREE', value: 'FREE' },
  { label: 'PAID', value: 'PAID' }
];

const handleSaveEndpoint = (endpoint: ApiEndpoint) => {
  const index = state.endpoints?.findIndex(e => e.id === endpoint.id);
  const endpointWithDefault = {
    ...endpoint,
    description: endpoint.description || ''  // Ensure description is always a string
  };
  
  if (index !== undefined && index !== -1) {
    if (state.endpoints) state.endpoints[index] = endpointWithDefault;
  } else {
    if (!state.endpoints) state.endpoints = [];
    state.endpoints.push(endpointWithDefault);
  }
};

const handleDeleteEndpoint = (endpointId: string) => {
  if (state.endpoints) {
    state.endpoints = state.endpoints.filter(e => e.id !== endpointId);
  }
};

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    loading.value = true;
    
    // Validate the form data
    const validatedData = schema.parse(event.data);
    
    // Create API record
    const apiData = {
      name: validatedData.name,
      description: validatedData.description,
      baseUrl: validatedData.baseUrl,
      isActive: validatedData.isActive,
      type: validatedData.type,
      rateLimit: validatedData.rateLimit,
      createdBy: pb.authStore.record?.id
    };

    const apiRecord = await pb.collection('apis').create(apiData);

    // Create endpoints for the API
    for (const endpoint of validatedData.endpoints) {
      const endpointData = {
        name: endpoint.name,
        description: endpoint.description,
        path: endpoint.path,
        method: endpoint.method,
        api: apiRecord.id
      };

      const endpointRecord = await pb.collection('endpoints').create(endpointData);

      // Create parameters for each endpoint
      for (const param of endpoint.parameters) {
        const paramData = {
          name: param.name,
          type: param.type,
          param_in: param.in,
          required: param.required,
          description: param.description,
          endpoint: endpointRecord.id
        };

        await pb.collection('parameters').create(paramData);
      }
    }

    toast.add({
      title: 'Success',
      description: 'API created successfully',
      color: 'success'
    });
    
    navigateTo('/console');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Format validation errors into a readable message
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      toast.add({
        title: 'Validation Error',
        description: errorMessages,
        color: 'error'
      });
    } else {
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to create API',
        color: 'error'
      });
    }
  } finally {
    loading.value = false;
  }
};
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

      <UForm @submit="handleSubmit($event)" :validation-schema="schema" :state="state" class="space-y-6">
        <!-- Basic Info Card -->
        <UCard>
          <template #header>
            <div class="text-lg font-medium">Basic Information</div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="API Name" name="name" required>
              <UInput v-model="state.name" placeholder="Enter API name" />
            </UFormField>

            <UFormField label="Type" name="type">
              <UTabs
                :content="false"
                :items="typeItems"
                v-model="state.type"
                color="neutral"
              />
            </UFormField>
          </div>

          <UFormField 
            label="Base URL" 
            name="baseUrl" 
            required
            class="mt-4"
          >
            <UInput
              v-model="state.baseUrl"
              placeholder="https://api.example.com"
            />
          </UFormField>

          <UFormField 
            label="Description" 
            name="description" 
            required
            class="mt-4"
          >
            <UTextarea
              v-model="state.description"
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
              v-model="state.rateLimit"
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

          <div v-if="state.endpoints?.length === 0" class="text-center py-12">
            <UIcon
              name="i-heroicons-square-3-stack-3d"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-semibold text-gray-900">No endpoints</h3>
            <p class="mt-1 text-sm text-gray-500">
              Start by adding an endpoint to your API
            </p>
            <div class="mt-6" v-if="state.endpoints?.length === 0">
              <EndpointModal @save="handleSaveEndpoint" />
            </div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="endpoint in state.endpoints"
              :key="endpoint.id"
              class="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-all duration-200"
            >
              <div class="p-4">
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="endpoint.method === 'GET' ? 'success' : 
                               endpoint.method === 'POST' ? 'info' :
                               endpoint.method === 'PUT' ? 'warning' :
                               endpoint.method === 'DELETE' ? 'error' : 'neutral'"
                        :label="endpoint.method"
                        variant="subtle"
                        class="font-mono"
                      />
                      <span class="font-medium text-gray-900">{{ endpoint.name }}</span>
                    </div>
                    <code class="text-sm text-primary-600 font-mono block">{{ endpoint.path }}</code>
                    <p v-if="endpoint.description" class="text-sm text-gray-500 mt-1">{{ endpoint.description }}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <EndpointModal 
                      :endpoint="endpoint"
                      @save="handleSaveEndpoint"
                    />
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      @click="handleDeleteEndpoint(endpoint.id!)"
                    />
                  </div>
                </div>

                <!-- Parameters -->
                <div v-if="endpoint.parameters?.length" class="mt-4 pt-4 border-t border-gray-100">
                  <h4 class="text-xs font-medium text-gray-500 uppercase mb-3">Parameters</h4>
                  <div class="space-y-2">
                    <div v-for="param in endpoint.parameters" :key="param.name" 
                      class="flex items-center gap-4 py-2 px-3 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm">{{ param.name }}</span>
                          <UBadge
                            :color="param.required ? 'error' : 'neutral'"
                            :label="param.required ? 'Required' : 'Optional'"
                            variant="subtle"
                            size="xs"
                          />
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                          <UBadge
                            color="neutral"
                            :label="param.type"
                            variant="subtle"
                            size="xs"
                          />
                          <UBadge
                            color="neutral"
                            :label="param.in"
                            variant="subtle"
                            size="xs"
                          />
                        </div>
                      </div>
                      <p v-if="param.description" class="text-sm text-gray-500 flex-1">
                        {{ param.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-3">
          <UButton
            to="/console"
            color="neutral"
            variant="ghost"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="loading"
          >
            Create API
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>