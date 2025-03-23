<script setup lang="ts">
import type { ApiEndpoint } from '~/types/api';
import { ref, computed } from 'vue';
import EndpointModal from './EndpointModal.vue';
import { mockEndpoints } from '~/data/mockEndpoints';
import EndpointDrawer from './drawer/EndpointDrawer.vue';

type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

interface Props {
  endpoints: ApiEndpoint[];
  apiId: string;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  endpoints: () => [],
  isActive: true
});

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const selectedEndpoint = ref<ApiEndpoint | null>(null);
const showEndpointModal = ref(false);
const loading = ref(false);

// Add new ref for tracking expanded rows
const expandedRows = ref<Set<string>>(new Set());

const toggleRow = (endpointId: string) => {
  if (expandedRows.value.has(endpointId)) {
    expandedRows.value.delete(endpointId);
  } else {
    expandedRows.value.add(endpointId);
  }
};

const getMethodColor = (method: string): NuxtUIColor => {
  switch (method) {
    case 'GET': return 'success';
    case 'POST': return 'info';
    case 'PUT': return 'warning';
    case 'DELETE': return 'error';
    case 'PATCH': return 'warning';
    default: return 'neutral';
  }
};

const handleAddEndpoint = () => {
  selectedEndpoint.value = {
    id: crypto.randomUUID(),
    name: '',
    method: 'GET',
    path: '',
    description: '',
    parameters: [],
    responses: []
  };
  showEndpointModal.value = true;
};

const handleEditEndpoint = (endpoint: ApiEndpoint) => {
  selectedEndpoint.value = { ...endpoint };
  showEndpointModal.value = true;
};

const handleSaveEndpoint = async (endpoint: ApiEndpoint) => {
  try {
    loading.value = true;
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the endpoints list
    emit('refresh');
    
    useToast().add({
      title: 'Success',
      description: 'Endpoint saved successfully',
      color: 'success'
    });
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to save endpoint',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const handleDeleteEndpoint = async () => {
  if (!selectedEndpoint.value) return;
  
  try {
    loading.value = true;
    // TODO: Implement API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    useToast().add({
      title: 'Success',
      description: 'Endpoint deleted successfully',
      color: 'success'
    });
    
    emit('refresh');
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to delete endpoint',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (endpoint: ApiEndpoint) => {
  selectedEndpoint.value = endpoint;
};

interface EndpointAccordionItem extends ApiEndpoint {
  label: string;
  color: NuxtUIColor;
  icon: string;
}

// Transform endpoints into accordion items
const endpointItems = computed<EndpointAccordionItem[]>(() => {
  return props.endpoints.map(endpoint => ({
    ...endpoint,
    label: endpoint.name || endpoint.path,
    color: getMethodColor(endpoint.method),
    icon: endpoint.method === 'GET' ? 'i-heroicons-arrow-down-circle' :
          endpoint.method === 'POST' ? 'i-heroicons-plus-circle' :
          endpoint.method === 'PUT' ? 'i-heroicons-arrow-path' :
          endpoint.method === 'DELETE' ? 'i-heroicons-trash' :
          'i-heroicons-code-bracket',
  }));
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-code-bracket" class="text-primary-500" />
        <span class="text-lg font-medium">API Endpoints</span>
      </div>
    </template>

    <div v-if="endpoints.length === 0" class="text-center py-8">
      <UIcon
        name="i-heroicons-code-bracket"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-semibold text-gray-900">No endpoints</h3>
      <p class="mt-1 text-sm text-gray-500">
        No endpoints available.
      </p>
    </div>

    <div v-else class="overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="w-10"></th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Path
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="endpoint in endpoints" :key="endpoint.id">
            <tr class="hover:bg-gray-50">
              <td class="pl-4">
                <button 
                  class="p-1 hover:bg-gray-100 rounded-md transition-transform duration-200"
                  :class="{ 'rotate-90': expandedRows.has(endpoint.id) }"
                  @click="toggleRow(endpoint.id)"
                >
                  <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400"/>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ endpoint.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge
                  :color="getMethodColor(endpoint.method)"
                  :label="endpoint.method"
                  variant="subtle"
                  class="font-mono"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {{ endpoint.path }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <EndpointDrawer
                    v-if="endpoint"
                    :endpoint="endpoint"
                    :api="{ id: endpoint.id }"
                  />
                  <!-- Delete Modal -->
                  <UModal>
                    <UButton
                      v-if="isActive"
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      size="sm"
                    />

                    <template #content>
                      <UCard>
                        <template #header>
                          <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-trash" class="text-error-500" />
                            <span class="text-lg font-medium">Delete Endpoint</span>
                          </div>
                        </template>

                        <p class="text-gray-600">
                          Are you sure you want to delete this endpoint? This action cannot be undone.
                        </p>
                        <div class="mt-4 space-y-2">
                          <div class="flex items-center gap-2">
                            <UBadge
                              :color="getMethodColor(endpoint.method)"
                              :label="endpoint.method"
                              variant="subtle"
                              class="font-mono"
                            />
                            <span class="font-medium">{{ endpoint.name }}</span>
                          </div>
                          <div class="font-mono text-sm text-gray-600">
                            {{ endpoint.path }}
                          </div>
                        </div>

                        <template #footer>
                          <div class="flex justify-end gap-3">
                            <UButton
                              color="neutral"
                              variant="ghost"
                              label="Cancel"
                              :disabled="loading"
                            />
                            <UButton
                              color="error"
                              icon="i-heroicons-trash"
                              label="Delete"
                              :loading="loading"
                              @click="handleDeleteEndpoint"
                            />
                          </div>
                        </template>
                      </UCard>
                    </template>
                  </UModal>
                </div>
              </td>
            </tr>
            <!-- Expanded Content -->
            <tr v-show="expandedRows.has(endpoint.id)">
              <td colspan="5" class="px-8 py-4 bg-gray-50">
                <div class="space-y-6">
                  <!-- Description Section -->
                  <div v-if="endpoint.description" class="space-y-2">
                    <h4 class="text-sm font-medium text-gray-900">Description</h4>
                    <p class="text-sm text-gray-600">{{ endpoint.description }}</p>
                  </div>

                  <!-- Parameters Table -->
                  <div v-if="endpoint.parameters?.length" class="space-y-2">
                    <h4 class="text-sm font-medium text-gray-900">Parameters</h4>
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg">
                        <thead class="bg-gray-100">
                          <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="param in endpoint.parameters" :key="param.name" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {{ param.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {{ param.type }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                              <UBadge
                                :color="param.required ? 'error' : 'neutral'"
                                :label="param.required ? 'Required' : 'Optional'"
                                variant="subtle"
                                size="xs"
                              />
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                              {{ param.description }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </UCard>

  <!-- Add/Edit Endpoint Modal -->
  <EndpointModal
    v-if="selectedEndpoint"
    :endpoint="selectedEndpoint"
    @save="handleSaveEndpoint"
  />
</template>

<style scoped>
.rotate-90 {
  transform: rotate(90deg);
}
</style>