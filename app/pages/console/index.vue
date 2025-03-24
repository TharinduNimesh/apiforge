<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed } from 'vue';
import type { Api as ApiType } from '~/types/api';
import { mockApis } from '~/data/mockApis';
import CreateApiModal from '~/components/api/CreateApiModal.vue'

// Initialize with empty array and fetch on client side only to avoid hydration issues
const apis = ref<ApiType[]>([]);
const loading = ref(true);

// Add fetch function that runs only on client side
const fetchApis = async () => {
  try {
    loading.value = true;
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    apis.value = mockApis;
  } catch (error: any) {
    console.error('Error fetching APIs:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load APIs. Please try again later.',
      color: 'error',
    });
    apis.value = []; // Reset APIs on error
  } finally {
    loading.value = false;
  }
};

// Only fetch APIs on client side to avoid hydration mismatches
onMounted(() => {
  fetchApis();
});

// Add filter state
const filters = ref({
  search: "",
  type: "ALL" as "ALL" | "FREE" | "PAID",
  status: "ALL" as "ALL" | "ACTIVE" | "INACTIVE",
  sort: "name",
});

// Pagination state
const pagination = ref({
  page: 1,
  rows: 6,
  total: 0,
});

// Modified computed for pagination with client-side only data
const filteredApis = computed(() => {
  const filtered = apis.value
    .filter((api) => {
      const matchesSearch = api.name
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());
      const matchesType =
        filters.value.type === "ALL" || api.type === filters.value.type;
      const matchesStatus =
        filters.value.status === "ALL" || api.status === filters.value.status;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const isDesc = filters.value.sort.startsWith("-");
      const field = (isDesc ? filters.value.sort.slice(1) : filters.value.sort) as keyof Pick<ApiType, 'name' | 'createdAt'>;
      const direction = isDesc ? -1 : 1;

      if (field === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }

      if (field === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }

      return 0;
    });

  // Update total records for pagination
  pagination.value.total = filtered.length;

  // Calculate start and end index
  const start = (pagination.value.page - 1) * pagination.value.rows;
  const end = start + pagination.value.rows;

  // Return paginated results
  return filtered.slice(start, end);
});

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
};

const hasApis = computed(() => apis.value.length > 0);
const hasFilteredResults = computed(() => filteredApis.value.length > 0);

const handleActivateApi = async (apiId: string) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update local state to simulate API activation
    apis.value = apis.value.map(api =>
      api.id === apiId ? { ...api, status: 'ACTIVE' } : api
    );

    useToast().add({
      title: 'Success',
      description: 'API activated successfully',
      color: 'success'
    });
  } catch (error) {
    console.error('Error activating API:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to activate API',
      color: 'error'
    });
  }
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-gray-800">
          Available APIs
        </h2>
        <div v-if="isAdmin()">
          <CreateApiModal @refresh="fetchApis" />
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6">
        <ApiFilterBar v-model="filters" />
      </div>

      <!-- Loading State -->
      <div v-if="loading">
        <!-- Skeleton for results count -->
        <div class="mb-4 flex items-center">
          <USkeleton class="h-6 w-48" />
        </div>

        <!-- Grid of skeleton cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div v-for="n in 6" :key="n" class="relative bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="space-y-4">
              <USkeleton class="h-6 w-3/4" />
              <USkeleton class="h-4 w-1/2" />
              <div class="space-y-2">
                <USkeleton class="h-4 w-full" />
                <USkeleton class="h-4 w-5/6" />
              </div>
              <div class="flex items-center justify-between pt-4">
                <USkeleton class="h-4 w-24" />
                <USkeleton class="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <!-- Empty States -->
        <div v-if="!hasApis" class="text-center py-12">
          <div class="space-y-6">
            <div class="flex justify-center">
              <UIcon name="i-heroicons-database" class="text-4xl text-gray-400" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-medium text-gray-900">No APIs Available</h3>
              <p class="text-gray-500 max-w-sm mx-auto">
                {{ isAdmin()
                  ? "Start by creating your first API to make it available to users."
                  : "No APIs are currently available. Please check back later."
                }}
              </p>
            </div>
            <div v-if="isAdmin()">
              <CreateApiModal @refresh="fetchApis" />
            </div>
          </div>
        </div>

        <div v-else-if="!hasFilteredResults" class="text-center py-12">
          <div class="space-y-6">
            <div class="flex justify-center">
              <UIcon name="i-heroicons-funnel" class="text-4xl text-gray-400" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-medium text-gray-900">No Matching Results</h3>
              <p class="text-gray-500 max-w-sm mx-auto">
                No APIs match your current filters. Try adjusting or clearing your filters.
              </p>
            </div>
            <div>
              <UButton label="Clear All Filters" icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="filters = {
                search: '',
                type: 'ALL',
                status: 'ALL',
                sort: 'name'
              }" />
            </div>
          </div>
        </div>

        <!-- Results Display -->
        <template v-else>
          <!-- Results count -->
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm text-gray-500">
              Showing
              <span class="font-medium text-gray-900">
                {{ ((pagination.page - 1) * pagination.rows) + 1 }} -
                {{ Math.min(pagination.page * pagination.rows, pagination.total) }}
              </span>
              of
              <span class="font-medium text-gray-900">
                {{ pagination.total }}
              </span>
              APIs
            </p>
          </div>

          <!-- API Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <ApiCard v-for="api in filteredApis" :key="api.id" v-bind="api"
              :onActivate="isAdmin() ? handleActivateApi : undefined" />
          </div>

          <!-- Pagination -->
          <UPagination v-if="pagination.total > pagination.rows" v-model="pagination.page" :total="pagination.total"
            :page-size="pagination.rows" :page-count="Math.ceil(pagination.total / pagination.rows)" 
            @update:model-value="onPageChange" />
        </template>
      </template>
    </div>
  </div>
</template>