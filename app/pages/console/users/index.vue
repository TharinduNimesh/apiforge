<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed, onMounted, h, resolveComponent } from 'vue';
import type { User } from '~/types/user';
import type { TableColumn } from '@nuxt/ui';
import { mockUsers } from '~/data/mockUsers';

const UBadge = resolveComponent('UBadge');

const users = ref<User[]>(mockUsers);
const loading = ref(true);

const fetchUsers = async () => {
  try {
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    users.value = mockUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load users. Please try again later.',
      color: 'error',
    });
    users.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});

const filters = ref({
  search: "",
  role: "ALL",
});

const pagination = ref<{
  page: number;
  rows: number;
  total: number;
}>({
  page: 1,
  rows: 10,
  total: 0,
});

const filteredUsers = computed(() => {
  const filtered = users.value.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.value.search.toLowerCase());
      
    const matchesRole =
      filters.value.role === "ALL" || user.role === filters.value.role;

    return matchesSearch && matchesRole;
  });

  pagination.value.total = filtered.length;

  const start = pagination.value.page - 1;
  const end = start + pagination.value.rows;

  return filtered.slice(start * pagination.value.rows, end * pagination.value.rows);
});

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
};

const hasUsers = computed(() => users.value.length > 0);
const hasFilteredResults = computed(() => filteredUsers.value.length > 0);

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'user':
      return 'info';
    default:
      return 'neutral';
  }
};

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      return h(UBadge, {
        color: getRoleBadgeColor(row.getValue('role')),
        variant: 'subtle',
        class: 'capitalize'
      }, () => row.getValue('role'))
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleDateString()
    }
  }
];

const emptyMessage = computed(() => {
  if (users.value.length > 0 && filteredUsers.value.length === 0) {
    if (filters.value.search) {
      return `No users found matching "${filters.value.search}"`;
    }
    if (filters.value.role !== 'ALL') {
      return `No ${filters.value.role.toLowerCase()} users found`;
    }
    return 'No users match the selected filters';
  }
  return 'No users available';
});
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-gray-800">
          Users Management
        </h2>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6">
        <UserFilterBar v-model="filters" />
      </div>

      <!-- Loading State -->
      <div v-if="loading">
        <!-- Skeleton for results count -->
        <div class="mb-4 flex items-center">
          <USkeleton class="h-6 w-48" />
        </div>
        
        <!-- Skeleton for table -->
        <UCard>
          <div class="space-y-4">
            <div v-for="n in 5" :key="n" class="flex items-center gap-4">
              <USkeleton class="h-8 w-32" />
              <USkeleton class="h-8 w-48" />
              <USkeleton class="h-8 w-24" />
              <USkeleton class="h-8 w-32" />
            </div>
          </div>
        </UCard>
      </div>

      <template v-else>
        <!-- Empty States -->
        <div v-if="!hasUsers" class="text-center py-12">
          <div class="space-y-6">
            <div class="flex justify-center">
              <UIcon name="i-heroicons-users" class="text-4xl text-gray-400" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-medium text-gray-900">No Users Available</h3>
              <p class="text-gray-500 max-w-sm mx-auto">
                No users have been added to the system yet.
              </p>
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
                No users match your current filters. Try adjusting or clearing your filters.
              </p>
            </div>
            <div>
              <UButton
                label="Clear All Filters"
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                @click="filters = { search: '', role: 'ALL' }"
              />
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
              Users
            </p>
          </div>

          <!-- Users Table -->
          <UCard>
            <UTable
              :data="filteredUsers"
              :columns="columns"
              :hover="true"
              class="[&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg"
            />

            <!-- Pagination -->
            <template v-if="pagination.total > pagination.rows">
              <div class="mt-4 flex justify-center">
                <UPagination
                  v-model="pagination.page"
                  :total="pagination.total"
                  :page-size="pagination.rows"
                  :page-count="Math.ceil(pagination.total / pagination.rows)"
                  :ui="{
                    root: 'flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1'
                  }"
                  @update:model-value="onPageChange"
                />
              </div>
            </template>
          </UCard>
        </template>
      </template>
    </div>
  </div>
</template>