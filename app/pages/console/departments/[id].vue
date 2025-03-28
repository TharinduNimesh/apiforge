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
        <DepartmentHeader 
          :department="mapToDepartmentProps(department)"
        />

        <div class="space-y-6">
          <UCard class="border border-gray-100">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- API Count -->
              <div class="bg-gray-50/80 p-5 rounded-lg border border-gray-100">
                <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <UIcon name="i-heroicons-link" class="text-primary-500" />
                  Active APIs
                </h3>
                <div class="text-2xl font-bold text-gray-900">
                  {{ departmentApis.length }}
                </div>
              </div>

              <!-- User Count -->
              <div class="bg-gray-50/80 p-5 rounded-lg border border-gray-100">
                <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <UIcon name="i-heroicons-users" class="text-success-500" />
                  Active Users
                </h3>
                <div class="text-2xl font-bold text-gray-900">
                  {{ departmentUsers.length }}
                </div>
              </div>
            </div>
          </UCard>

          <DepartmentApiAssignments
            :department="mapToDepartmentProps(department)"
            :apis="apis"
            :available-apis="availableApis"
            @update:api-assignments="handleApiAssignmentsUpdate"
          />

          <DepartmentUserAssignments
            :department="mapToDepartmentProps(department)"
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
import type { Api } from '~/types/api';
import type { User } from '~/types/user';
import type { Department } from '~/types/department';
import { usePocketBase } from '~/lib/pocketbase';

const route = useRoute();
const toast = useToast();
const pb = usePocketBase();

interface DepartmentData {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created: string;
  updated: string;
  created_by: string;
}

interface DepartmentApiAssignment {
  id: string;
  department_id: string;
  api_id: string;
  rate_limit: number;
}

interface DepartmentUserAssignment {
  id: string;
  department_id: string;
  user_id: string;
}

const department = ref<DepartmentData | null>(null);
const departmentApis = ref<DepartmentApiAssignment[]>([]);
const departmentUsers = ref<DepartmentUserAssignment[]>([]);
const loading = ref(true);
const apis = ref<Api[]>([]);
const users = ref<User[]>([]);

// Computed properties for API assignments
const availableApis = computed(() => 
  apis.value.filter(api => 
    !departmentApis.value.some(assignment => assignment.api_id === api.id)
  )
);

// Computed properties for User assignments
const assignedUsers = computed(() => {
  return users.value.filter(user => 
    departmentUsers.value.some(assignment => assignment.user_id === user.id)
  );
});

const availableUsers = computed(() => 
  users.value.filter(user => 
    !departmentUsers.value.some(assignment => assignment.user_id === user.id)
  )
);

const mapToDepartmentProps = (dept: DepartmentData): Department => ({
  id: dept.id,
  name: dept.name,
  description: dept.description,
  isActive: dept.is_active,
  createdAt: dept.created,
  createdBy: dept.created_by,
  apiAssignments: departmentApis.value.map(api => ({
    apiId: api.api_id,
    rateLimit: api.rate_limit
  })),
  userAssignments: departmentUsers.value.map(user => user.user_id)
});

const fetchDepartmentData = async () => {
  try {
    loading.value = true;
    
    // Fetch department details
    department.value = await pb.collection('departments').getOne(route.params.id as string);
    
    // Fetch department API assignments
    const apiAssignments = await pb.collection('department_apis').getList(1, 50, {
      filter: `department_id = "${route.params.id}"`,
      expand: 'api_id'
    });
    departmentApis.value = apiAssignments.items.map(item => ({
      id: item.id,
      department_id: item.department_id,
      api_id: item.api_id,
      rate_limit: item.rate_limit
    }));

    // Fetch department user assignments
    const userAssignments = await pb.collection('department_users').getList(1, 50, {
      filter: `department_id = "${route.params.id}"`,
      expand: 'user_id'
    });
    departmentUsers.value = userAssignments.items.map(item => ({
      id: item.id,
      department_id: item.department_id,
      user_id: item.user_id
    }));

    // Fetch all APIs for available APIs list
    const apiRecords = await pb.collection('apis').getFullList();
    apis.value = apiRecords.map(record => ({
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.type,
      status: record.status,
      rateLimit: record.rate_limit,
      endpointCount: record.endpoint_count,
      createdAt: record.created
    }));

    // Fetch all users for available users list
    const userRecords = await pb.collection('users').getFullList();
    users.value = userRecords.map(record => ({
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      createdAt: record.created
    }));

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
const handleApiAssignmentsUpdate = async (assignments: { apiId: string; rateLimit: number }[]) => {
  try {
    if (!department.value) return;

    // Delete removed assignments
    const currentAssignmentIds = departmentApis.value.map(a => a.api_id);
    const newAssignmentIds = assignments.map(a => a.apiId);
    const removedApiIds = currentAssignmentIds.filter(id => !newAssignmentIds.includes(id));

    for (const apiId of removedApiIds) {
      const assignment = departmentApis.value.find(a => a.api_id === apiId);
      if (assignment) {
        await pb.collection('department_apis').delete(assignment.id);
      }
    }

    // Add new assignments
    for (const assignment of assignments) {
      if (!currentAssignmentIds.includes(assignment.apiId)) {
        await pb.collection('department_apis').create({
          department_id: department.value.id,
          api_id: assignment.apiId,
          rate_limit: assignment.rateLimit
        });
      }
    }

    // Refresh assignments
    await fetchDepartmentData();
    
    toast.add({
      title: 'Success',
      description: 'API assignments updated successfully',
      color: 'success',
    });
  } catch (error: any) {
    console.error('Error updating API assignments:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to update API assignments',
      color: 'error',
    });
  }
};

const handleUserAssignmentsUpdate = async (userIds: string[]) => {
  try {
    if (!department.value) return;

    // Delete removed assignments
    const currentUserIds = departmentUsers.value.map(a => a.user_id);
    const removedUserIds = currentUserIds.filter(id => !userIds.includes(id));

    for (const userId of removedUserIds) {
      const assignment = departmentUsers.value.find(a => a.user_id === userId);
      if (assignment) {
        await pb.collection('department_users').delete(assignment.id);
      }
    }

    // Add new assignments
    for (const userId of userIds) {
      if (!currentUserIds.includes(userId)) {
        await pb.collection('department_users').create({
          department_id: department.value.id,
          user_id: userId
        });
      }
    }

    // Refresh assignments
    await fetchDepartmentData();
    
    toast.add({
      title: 'Success',
      description: 'User assignments updated successfully',
      color: 'success',
    });
  } catch (error: any) {
    console.error('Error updating user assignments:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to update user assignments',
      color: 'error',
    });
  }
};

onMounted(() => {
  fetchDepartmentData();
});
</script>