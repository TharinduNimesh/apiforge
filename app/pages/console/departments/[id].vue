<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading">
        <div class="mb-6">
          <USkeleton class="h-8 w-64 mb-2" />
          <USkeleton class="h-6 w-32" />
        </div>
        
        <div class="space-y-6">
          <UCard>
            <div class="space-y-4">
              <USkeleton class="h-6 w-48" />
              <USkeleton class="h-4 w-full" />
              <div class="grid grid-cols-2 gap-4">
                <USkeleton class="h-16 w-full" />
                <USkeleton class="h-16 w-full" />
              </div>
            </div>
          </UCard>

          <!-- API Assignments Loading -->
          <UCard>
            <div class="space-y-4">
              <USkeleton class="h-6 w-48" />
              <div class="space-y-2">
                <div v-for="n in 3" :key="n" class="flex items-center justify-between gap-4">
                  <USkeleton class="h-12 w-64" />
                  <USkeleton class="h-12 w-32" />
                  <USkeleton class="h-8 w-8" />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <template v-else-if="department">
        <DepartmentHeader :department="department" />

        <div class="space-y-6">
          <DepartmentApiAssignments
            :department="department"
            :apis="apis"
            :available-apis="availableApis"
            @update:api-assignments="handleApiAssignmentsUpdate"
          />

          <DepartmentUserAssignments
            :department="department"
            :available-users="availableUsers"
            :assigned-users="assignedUsers"
            @update:user-assignments="handleUserAssignmentsUpdate"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed } from 'vue';
import type { Department } from '~/types/department';
import type { Api } from '~/types/api';
import type { User } from '~/types/user';
import { mockDepartments } from '~/data/mockDepartments';
import { mockApis } from '~/data/mockApis';
import { mockUsers } from '~/data/mockUsers';

const route = useRoute();
const toast = useToast();

const department = ref<Department | null>(null);
const loading = ref(true);
const apis = ref<Api[]>(mockApis);
const users = ref<User[]>(mockUsers);

// Computed properties for API assignments
const availableApis = computed(() => 
  apis.value.filter(api => 
    !department.value?.apiAssignments.some(assignment => assignment.apiId === api.id)
  )
);

// Computed properties for User assignments
const assignedUsers = computed(() => {
  if (!department.value) return [];
  return department.value.userAssignments
    .map(userId => users.value.find(u => u.id === userId))
    .filter((user): user is User => user !== undefined);
});

const availableUsers = computed(() => 
  users.value.filter(user => 
    !department.value?.userAssignments.includes(user.id)
  )
);

const fetchDepartment = async () => {
  try {
    loading.value = true;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    department.value = mockDepartments.find(d => d.id === route.params.id) || null;
    
    if (!department.value) {
      throw new Error('Department not found');
    }
  } catch (error: any) {
    console.error('Error fetching department:', error);
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to load department details',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Event handlers for assignment updates
const handleApiAssignmentsUpdate = (assignments: Department['apiAssignments']) => {
  if (department.value) {
    department.value.apiAssignments = assignments;
  }
};

const handleUserAssignmentsUpdate = (assignments: string[]) => {
  if (department.value) {
    department.value.userAssignments = assignments;
  }
};

onMounted(() => {
  fetchDepartment();
});
</script>