<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed, onMounted, h, resolveComponent } from 'vue';
import type { Department } from '~/types/department';
import type { TableColumn } from '@nuxt/ui';
import { mockDepartments } from '~/data/mockDepartments';

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const departments = ref<Department[]>(mockDepartments);
const loading = ref(true);
const selectedDepartment = ref<Department | null>(null);

const fetchDepartments = async () => {
  try {
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    departments.value = mockDepartments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load departments. Please try again later.',
      color: 'error',
    });
    departments.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDepartments();
});

const filters = ref<{
  search: string;
  status: 'ALL' | 'active' | 'inactive';
}>({
  search: "",
  status: "ALL",
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

const filteredDepartments = computed(() => {
  const filtered = departments.value.filter((dept) => {
    const searchTerm = filters.value.search.toLowerCase();
    const matchesSearch = !searchTerm || 
      dept.name.toLowerCase().includes(searchTerm) || 
      dept.description.toLowerCase().includes(searchTerm);
    
    const deptStatus = dept.isActive ? 'active' : 'inactive';
    const matchesStatus = filters.value.status === "ALL" || deptStatus === filters.value.status;
    
    return matchesSearch && matchesStatus;
  });

  pagination.value.total = filtered.length;

  const start = pagination.value.page - 1;
  const end = start + pagination.value.rows;

  return filtered.slice(start * pagination.value.rows, end * pagination.value.rows);
});

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
};

const hasDepartments = computed(() => departments.value.length > 0);
const hasFilteredResults = computed(() => filteredDepartments.value.length > 0);

const menuItems = computed(() => [
  {
    label: 'View Details',
    icon: 'i-heroicons-information-circle',
    to: `/console/departments/${selectedDepartment.value?.id}`
  },
  {
    label: selectedDepartment.value?.isActive ? 'Deactivate' : 'Activate',
    icon: selectedDepartment.value?.isActive ? 'i-heroicons-power-off' : 'i-heroicons-check',
    click: () => toggleDepartmentStatus()
  }
]);

const toggleDepartmentStatus = () => {
  if (selectedDepartment.value) {
    const dept = departments.value.find(d => d.id === selectedDepartment.value?.id);
    if (dept) {
      dept.isActive = !dept.isActive;
      
      useToast().add({
        title: 'Success',
        description: `Department ${dept.isActive ? 'activated' : 'deactivated'} successfully`,
        color: 'success'
      });
    }
  }
};

const getStatusColor = (isActive: boolean): 'success' | 'error' => isActive ? 'success' : 'error';

const columns: TableColumn<Department>[] = [
  {
    accessorKey: 'name',
    header: 'Department',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col gap-1' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'font-medium' }, row.getValue('name')),
          h(UBadge, {
            color: getStatusColor(row.original.isActive),
            variant: 'subtle',
            label: row.original.isActive ? 'Active' : 'Inactive'
          })
        ]),
        h('div', { class: 'text-sm text-gray-500' }, row.original.description)
      ])
    }
  },
  {
    accessorKey: 'userAssignments',
    header: 'Active Users',
    cell: ({ row }) => {
      return h(UBadge, {
        color: 'info',
        variant: 'subtle',
        label: row.original.userAssignments.length.toString()
      })
    }
  },
  {
    accessorKey: 'apiAssignments',
    header: 'Active APIs',
    cell: ({ row }) => {
      return h(UBadge, {
        color: 'success',
        variant: 'subtle',
        label: row.original.apiAssignments.length.toString()
      })
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleDateString()
    }
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(UDropdownMenu, {
        items: menuItems.value,
        ui: {
          content: 'w-48',
          item: 'flex items-center gap-2 w-full cursor-pointer select-none px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-500',
          activeItem: 'text-orange-500 bg-orange-50'
        },
        mode: 'click',
        onOpen: () => selectedDepartment.value = row.original
      }, () => h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-heroicons-ellipsis-horizontal'
      }))
    }
  }
];

const emptyMessage = computed(() => {
  if (departments.value.length > 0 && filteredDepartments.value.length === 0) {
    if (filters.value.search) {
      return `No departments found matching "${filters.value.search}"`;
    }
    if (filters.value.status !== 'ALL') {
      return `No ${filters.value.status} departments found`;
    }
    return 'No departments match the selected filters';
  }
  return 'No departments available';
});

const createDepartment = () => {
  // TODO: Implement department creation
  console.log('Create department clicked');
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-gray-800">
          Departments Management
        </h2>
        <UButton
          icon="i-heroicons-plus"
          label="Create Department"
          color="primary"
          @click="createDepartment"
        />
      </div>

      <!-- Filter Bar -->
      <div class="mb-6">
        <DepartmentFilterBar v-model="filters" />
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
              <USkeleton class="h-8 w-48" />
              <USkeleton class="h-8 w-24" />
              <USkeleton class="h-8 w-24" />
              <USkeleton class="h-8 w-32" />
              <USkeleton class="h-8 w-8" />
            </div>
          </div>
        </UCard>
      </div>

      <template v-else>
        <!-- Empty States -->
        <div v-if="!hasDepartments" class="text-center py-12">
          <div class="space-y-6">
            <div class="flex justify-center">
              <UIcon name="i-heroicons-building-office" class="text-4xl text-gray-400" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-medium text-gray-900">No Departments Available</h3>
              <p class="text-gray-500 max-w-sm mx-auto">
                Start by creating your first department.
              </p>
            </div>
            <UButton
              icon="i-heroicons-plus"
              label="Create Department"
              color="primary"
              @click="createDepartment"
            />
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
                No departments match your current filters. Try adjusting or clearing your filters.
              </p>
            </div>
            <div>
              <UButton
                label="Clear All Filters"
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                @click="filters = { search: '', status: 'ALL' }"
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
              Departments
            </p>
          </div>

          <!-- Departments Table -->
          <UCard>
            <UTable
              :data="filteredDepartments"
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