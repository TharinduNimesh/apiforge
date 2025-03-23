<script setup lang="ts">
import type { Api, ApiEndpoint } from '~/types/api';
import { mockApis } from '~/data/mockApis';
import { mockEndpoints } from '~/data/mockEndpoints';
import { ref, computed } from 'vue';
import EndpointModal from '~/components/api/EndpointModal.vue';

definePageMeta({
  layout: 'console'
});

const route = useRoute();
const api = ref<Api | undefined>();
const selectedTab = ref('overview');
const loading = ref(false);

const isAdmin = ref(true); // TODO: Replace with actual auth check

onMounted(() => {
  // For now, use mock data
  api.value = mockApis.find(a => a.id === route.params.id);
  
  if (!api.value) {
    showError({ statusCode: 404, message: 'API not found' });
  }
});

// Initialize with the mock endpoints for the current API
const endpoints = computed(() => {
  if (!api.value?.id) return [];
  return mockEndpoints[api.value.id] || [];
});

const formattedDate = computed(() => {
  if (!api.value?.createdAt) return '';
  return new Date(api.value.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const tabs = [
  {
    label: 'Overview',
    description: 'View API details and performance metrics.',
    icon: 'i-heroicons-chart-bar',
    slot: 'overview',
    value: 'overview'
  },
  {
    label: 'Endpoints',
    description: 'Manage API endpoints and their configurations.',
    icon: 'i-heroicons-code-bracket',
    slot: 'endpoints',
    value: 'endpoints'
  }
];

const handleArchive = async () => {
  try {
    loading.value = true;
    // TODO: Implement archive functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (api.value) api.value.status = 'INACTIVE';
    useToast().add({
      title: 'Success',
      description: 'API archived successfully',
      color: 'success'
    });
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to archive API',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const handleUnarchive = async () => {
  try {
    loading.value = true;
    // TODO: Implement unarchive functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (api.value) api.value.status = 'ACTIVE';
    useToast().add({
      title: 'Success',
      description: 'API restored successfully',
      color: 'success'
    });
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to restore API',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  try {
    loading.value = true;
    // TODO: Implement delete functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigateTo('/console/apis');
    useToast().add({
      title: 'Success',
      description: 'API deleted successfully',
      color: 'success'
    });
  } catch (error) {
    useToast().add({
      title: 'Error',
      description: 'Failed to delete API',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const refreshEndpoints = () => {
  // TODO: Implement endpoints refresh
  console.log('Refreshing endpoints...');
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div v-if="api">
        <!-- API Header -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div class="relative p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <!-- Left Side -->
              <div class="flex items-center gap-4">
                <UButton
                  to="/console/apis"
                  variant="ghost"
                  icon="i-heroicons-arrow-left"
                  color="neutral"
                  class="hover:bg-gray-100/80 backdrop-blur-sm transition-all duration-200"
                />
                <div class="flex flex-col gap-3 min-w-0">
                  <!-- Header Row -->
                  <div>
                    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                      {{ api.name }}
                    </h1>
                  </div>
                  <!-- Status Indicators Row -->
                  <div class="flex gap-2 items-center">
                    <UBadge 
                      :color="api.type === 'FREE' ? 'success' : 'warning'" 
                      :label="api.type"
                      variant="subtle"
                      size="sm"
                    />
                    <div class="flex items-center gap-1.5">
                      <span 
                        :class="[
                          'flex h-2.5 w-2.5 rounded-full',
                          api.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                        ]"
                      ></span>
                      <UBadge 
                        :color="api.status === 'ACTIVE' ? 'success' : 'error'" 
                        :label="api.status"
                        variant="subtle"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Side - Admin Actions -->
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <template v-if="isAdmin">
                  <!-- Primary Actions -->
                  <div class="flex gap-2 w-full sm:w-auto">
                    <UButton
                      :to="`/console/apis/${api.id}/edit`"
                      icon="i-heroicons-pencil"
                      color="primary"
                      variant="ghost"
                      class="flex-1 sm:flex-none"
                    >
                      Edit
                    </UButton>
                    
                    <!-- Archive/Unarchive Button -->
                    <UModal>
                      <UButton
                        icon="i-heroicons-archive-box"
                        :color="api.status === 'ACTIVE' ? 'warning' : 'success'"
                        variant="ghost"
                        class="flex-1 sm:flex-none"
                      >
                        {{ api.status === 'ACTIVE' ? 'Archive' : 'Restore' }}
                      </UButton>

                      <template #content>
                        <UCard>
                          <template #header>
                            <div class="flex items-center gap-2">
                              <UIcon 
                                :name="api.status === 'ACTIVE' ? 'i-heroicons-archive-box' : 'i-heroicons-arrow-path'" 
                                :class="api.status === 'ACTIVE' ? 'text-warning-500' : 'text-success-500'"
                              />
                              <span class="text-lg font-medium">{{ api.status === 'ACTIVE' ? 'Archive' : 'Restore' }} API</span>
                            </div>
                          </template>

                          <p class="text-gray-600">
                            {{ api.status === 'ACTIVE' 
                              ? 'Are you sure you want to archive this API? It will become inaccessible to users until restored.'
                              : 'Are you sure you want to restore this API? It will become accessible to users again.'
                            }}
                          </p>

                          <template #footer>
                            <div class="flex justify-end gap-3">
                              <UButton
                                color="neutral"
                                variant="ghost"
                                type="button"
                                :disabled="loading"
                              >
                                Cancel
                              </UButton>
                              <UButton
                                :color="api.status === 'ACTIVE' ? 'warning' : 'success'"
                                :icon="api.status === 'ACTIVE' ? 'i-heroicons-archive-box' : 'i-heroicons-arrow-path'"
                                :loading="loading"
                                @click="api.status === 'ACTIVE' ? handleArchive : handleUnarchive"
                              >
                                {{ api.status === 'ACTIVE' ? 'Archive' : 'Restore' }}
                              </UButton>
                            </div>
                          </template>
                        </UCard>
                      </template>
                    </UModal>

                    <!-- Delete Button (Only shown for archived APIs) -->
                    <UModal>
                      <UButton
                        v-if="api.status !== 'ACTIVE'"
                        icon="i-heroicons-trash"
                        color="error"
                        variant="ghost"
                        class="flex-1 sm:flex-none"
                      >
                        Delete
                      </UButton>

                      <template #content>
                        <UCard>
                          <template #header>
                            <div class="flex items-center gap-2">
                              <UIcon name="i-heroicons-trash" class="text-error-500" />
                              <span class="text-lg font-medium">Delete API</span>
                            </div>
                          </template>

                          <p class="text-gray-600">
                            Are you sure you want to permanently delete this API? This action cannot be undone.
                          </p>

                          <template #footer>
                            <div class="flex justify-end gap-3">
                              <UButton
                                color="neutral"
                                variant="ghost"
                                type="button"
                                :disabled="loading"
                              >
                                Cancel
                              </UButton>
                              <UButton
                                color="error"
                                icon="i-heroicons-trash"
                                :loading="loading"
                                @click="handleDelete"
                              >
                                Delete
                              </UButton>
                            </div>
                          </template>
                        </UCard>
                      </template>
                    </UModal>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="mt-6">
          <UTabs 
            :items="tabs" 
            :model-value="selectedTab"
            @update:model-value="(val: string | number) => selectedTab = val.toString()"
            variant="pill"
            :ui="{
              list: 'w-full bg-gray-100/50 backdrop-blur-sm p-1 rounded-lg',
              trigger: 'flex-1 flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-md data-[selected=true]:text-gray-900 data-[selected=true]:bg-white data-[selected=true]:shadow-sm text-gray-500 hover:text-gray-700'
            }"
          >
            <!-- Overview Tab -->
            <template #overview="{ item }">
              <p class="text-gray-500 mb-4">
                {{ item.description }}
              </p>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- API Details -->
                <div class="lg:col-span-2">
                  <UCard>
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-information-circle" class="text-primary-500" />
                        <span class="text-lg font-medium">API Details</span>
                      </div>
                    </template>

                    <div class="space-y-6">
                      <div class="bg-gray-50/80 p-5 rounded-lg border border-gray-100">
                        <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <UIcon name="i-heroicons-document-text" class="text-primary-500" />
                          Description
                        </h3>
                        <p class="mt-2 text-gray-900">{{ api.description }}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-6">
                        <div class="bg-gray-50/80 p-5 rounded-lg border border-gray-100">
                          <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <UIcon name="i-heroicons-clock" class="text-warning-500" />
                            Rate Limit
                          </h3>
                          <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold text-primary-600">100</span>
                            <span class="text-gray-500">requests/hour</span>
                          </div>
                        </div>
                        <div class="bg-gray-50/80 p-5 rounded-lg border border-gray-100">
                          <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <UIcon name="i-heroicons-calendar" class="text-success-500" />
                            Created On
                          </h3>
                          <div class="text-2xl font-bold text-gray-900">
                            {{ formattedDate }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </UCard>
                </div>

                <!-- API Stats -->
                <div class="lg:col-span-1">
                  <ApiStats :apiId="api.id" />
                </div>
              </div>
            </template>

            <!-- Endpoints Tab -->
            <template #endpoints="{ item }">
              <p class="text-gray-500 mb-4">
                {{ item.description }}
              </p>

              <ApiEndpoints 
                :endpoints="endpoints"
                :apiId="api.id"
                :isActive="api.status === 'ACTIVE'"
                @refresh="refreshEndpoints"
              />
            </template>
          </UTabs>
        </div>
      </div>
    </div>
  </div>
</template>