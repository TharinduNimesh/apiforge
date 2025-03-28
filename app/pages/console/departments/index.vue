<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed } from 'vue';
import type { DepartmentView } from '~/types/department';
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui';
import type { Api } from '~/types/api';
import CreateDepartmentModal from '~/components/department/CreateDepartmentModal.vue';
import { usePocketBase } from '~/lib/pocketbase';

const departments = ref<DepartmentView[]>([]);
const apis = ref<Api[]>([]);
const loading = ref(true);
const toast = useToast();
const pb = usePocketBase();

const fetchDepartments = async () => {
  try {
    loading.value = true;
    const records = await pb.collection('department_details').getList(
      pagination.value.page,
      pagination.value.rows,
      {
        filter: filters.value.status !== 'ALL' 
          ? `is_active = ${filters.value.status === 'active'}`
          : '',
        sort: '-created'
      }
    );
    
    departments.value = records.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      is_active: item.is_active,
      created: item.created,
      updated: item.updated,
      user_count: item.user_count,
      api_count: item.api_count
    }));
    pagination.value.total = records.totalItems;
  } catch (error) {
    console.error('Error fetching departments:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load departments. Please try again later.',
      color: 'error',
    });
    departments.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchApis = async () => {
  try {
    const records = await pb.collection('apis').getFullList();
    apis.value = records.map(record => ({
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.type,
      status: record.status,
      createdAt: record.created,
      updatedAt: record.updated,
      rateLimit: 0, // Default value
      endpointCount: 0 // Default value
    })) as Api[];
  } catch (error) {
    console.error('Error fetching APIs:', error);
    apis.value = [];
  }
};

onMounted(() => {
  fetchDepartments();
  fetchApis();
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
  return departments.value.filter((dept) => {
    const searchTerm = filters.value.search.toLowerCase();
    return !searchTerm || 
      dept.name.toLowerCase().includes(searchTerm) || 
      dept.description.toLowerCase().includes(searchTerm);
  });
});

const toggleDepartmentStatus = async (department: DepartmentView) => {
  try {
    await pb.collection('departments').update(department.id, {
      is_active: !department.is_active
    });
    
    const deptIndex = departments.value.findIndex(d => d.id === department.id);
    if (deptIndex !== -1) {
      departments.value[deptIndex] = {
        ...departments.value[deptIndex],
        is_active: !department.is_active
      } as DepartmentView;
    }
    
    toast.add({
      title: 'Success',
      description: `Department ${!department.is_active ? 'activated' : 'deactivated'} successfully`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    
    fetchDepartments(); // Refresh the list
  } catch (error) {
    console.error('Error toggling department status:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to update department status',
      color: 'error',
    });
  }
};

const columns: TableColumn<DepartmentView>[] = [
  {
    accessorKey: 'name',
    header: 'Department'
  },
  {
    accessorKey: 'user_count',
    header: 'Active Users'
  },
  {
    accessorKey: 'api_count',
    header: 'Active APIs'
  },
  {
    accessorKey: 'created',
    header: 'Created At'
  },
  {
    id: 'actions'
  }
];

function getDropdownActions(department: DepartmentView): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'View Details',
        icon: 'i-heroicons-information-circle',
        to: `/console/departments/${department.id}`
      }
    ],
    [
      department.is_active ? {
        label: 'Deactivate Department',
        icon: 'i-heroicons-power-20-solid',
        color: 'error',
        onSelect: () => toggleDepartmentStatus(department)
      } : {
        label: 'Activate Department',
        icon: 'i-heroicons-check',
        color: 'success',
        onSelect: () => toggleDepartmentStatus(department)
      }
    ]
  ]
}

const hasDepartments = computed(() => departments.value.length > 0);
const hasFilteredResults = computed(() => filteredDepartments.value.length > 0);

const handleDepartmentCreate = async (form: any) => {
  try {
    const data = {
      name: form.name,
      description: form.description,
      is_active: true
    };
    
    const record = await pb.collection('departments').create(data);
    
    // Create department-api assignments if any
    if (form.apiAssignments?.length) {
      for (const apiId of form.apiAssignments) {
        await pb.collection('department_apis').create({
          department_id: record.id,
          api_id: apiId,
          rate_limit: 1000 // Default rate limit
        });
      }
    }
    
    toast.add({
      title: 'Success',
      description: 'Department created successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    
    fetchDepartments(); // Refresh the list
  } catch (error) {
    console.error('Error creating department:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to create department',
      color: 'error'
    });
  }
};

const onPageChange = (newPage: number) => {
  pagination.value.page = newPage;
  fetchDepartments();
};

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
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-gray-800">
          Departments Management
        </h2>
        <CreateDepartmentModal :apis="apis" @submit="handleDepartmentCreate" />
      </div>

      <!-- Filter Bar -->
      <div class="mb-6">
        <DepartmentFilterBar v-model="filters" />
      </div>

      <!-- Loading State -->
      <div v-if="loading">
        <div class="mb-4 flex items-center">
          <USkeleton class="h-6 w-48" />
        </div>
        
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
            <CreateDepartmentModal :apis="apis" @submit="handleDepartmentCreate" />
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
              hover
            >
              <template #name-cell="{ row }">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ row.original.name }}</span>
                    <UBadge
                      :color="row.original.is_active ? 'success' : 'error'"
                      variant="subtle"
                      :label="row.original.is_active ? 'Active' : 'Inactive'"
                    />
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ row.original.description }}
                  </div>
                </div>
              </template>

              <template #userAssignments-cell="{ row }">
                <UBadge
                  color="info"
                  variant="subtle"
                  :label="row.original.user_count.toString()"
                />
              </template>

              <template #apiAssignments-cell="{ row }">
                <UBadge
                  color="success"
                  variant="subtle"
                  :label="row.original.api_count.toString()"
                />
              </template>

              <template #createdAt-cell="{ row }">
                {{ new Date(row.getValue('created')).toLocaleDateString() }}
              </template>

              <template #actions-cell="{ row }">
                <UDropdownMenu :items="getDropdownActions(row.original)">
                  <UButton
                    icon="i-heroicons-ellipsis-horizontal"
                    color="neutral"
                    variant="ghost"
                  />
                </UDropdownMenu>
              </template>
            </UTable>

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