<script setup lang="ts">
import type { Department } from '~/types/department';
import type { Api } from '~/types/api';
import { ref, watchEffect, onMounted } from 'vue';
import { usePocketBase } from '~/lib/pocketbase';

interface Props {
  department: Department;
  apis: Api[];
  availableApis: Api[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:apiAssignments', assignments: Department['apiAssignments']): void;
}>();

const pb = usePocketBase();
const toast = useToast();

// Modal States
const selectedApi = ref<Api | undefined>(undefined);
const newRateLimit = ref<number>(100);

// Track original rate limits and assignments
const originalRateLimits = ref<Record<string, number>>({});
const departmentApiRecords = ref<Record<string, string>>({});  // Store API assignment record IDs
const currentRateLimits = ref<Record<string, number>>({});  // Track current rate limits

// Update tracking when assignments change
watchEffect(() => {
  props.department.apiAssignments.forEach(assignment => {
    if (!(assignment.apiId in originalRateLimits.value)) {
      originalRateLimits.value[assignment.apiId] = assignment.rateLimit;
      currentRateLimits.value[assignment.apiId] = assignment.rateLimit;
    }
  });
});

// Track API assignment record IDs
const fetchApiAssignmentRecords = async () => {
  try {
    const records = await pb.collection('department_apis').getList(1, 50, {
      filter: `department_id = "${props.department.id}"`
    });
    
    records.items.forEach(record => {
      departmentApiRecords.value[record.api_id] = record.id;
    });
  } catch (error) {
    console.error('Error fetching API assignment records:', error);
  }
};

onMounted(() => {
  fetchApiAssignmentRecords();
});

const isRateLimitChanged = (apiId: string, currentLimit: number) => {
  currentRateLimits.value[apiId] = currentLimit;
  return originalRateLimits.value[apiId] !== currentRateLimits.value[apiId];
};

const getApiDetails = (apiId: string) => {
  return props.apis.find(api => api.id === apiId);
};

const handleApiAssign = async () => {
  if (!selectedApi.value || !props.department.isActive) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAssignments = [...props.department.apiAssignments, {
      apiId: selectedApi.value.id,
      rateLimit: newRateLimit.value
    }];
    
    emit('update:apiAssignments', newAssignments);
    
    toast.add({
      title: 'Success',
      description: 'API assigned successfully',
      color: 'success',
    });
    
    // Reset form state
    selectedApi.value = undefined;
    newRateLimit.value = 100;
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to assign API',
      color: 'error',
    });
  }
};

const handleApiRemove = async (apiId: string) => {
  if (!props.department.isActive) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAssignments = props.department.apiAssignments.filter(a => a.apiId !== apiId);
    emit('update:apiAssignments', newAssignments);
    
    toast.add({
      title: 'Success',
      description: 'API removed successfully',
      color: 'success',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to remove API',
      color: 'error',
    });
  }
};

const handleRateLimitUpdate = async (apiId: string, newLimit: number) => {
  if (!props.department.isActive) return;

  try {
    const recordId = departmentApiRecords.value[apiId];
    if (!recordId) {
      throw new Error('API assignment record not found');
    }

    // Update rate limit in PocketBase
    await pb.collection('department_apis').update(recordId, {
      rate_limit: newLimit
    });
    
    // Update local state
    const newAssignments = props.department.apiAssignments.map(assignment =>
      assignment.apiId === apiId 
        ? { ...assignment, rateLimit: newLimit }
        : assignment
    );
    
    emit('update:apiAssignments', newAssignments);
    originalRateLimits.value[apiId] = newLimit; // Update the original value after successful update
    
    toast.add({
      title: 'Success',
      description: 'Rate limit updated successfully',
      color: 'success',
    });
  } catch (error: any) {
    console.error('Error updating rate limit:', error);
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update rate limit',
      color: 'error',
    });
  }
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-link" />
          <h2 class="text-lg font-medium">API Assignments</h2>
        </div>
        <UModal
          :ui="{ wrapper: 'sm:max-w-xl' }"
          :close="{
            color: 'neutral',
            variant: 'ghost',
            class: 'rounded-full'
          }"
        >
          <UButton
            color="primary"
            icon="i-heroicons-plus"
            label="Assign API"
            :disabled="!department.isActive"
          />

          <template #header>
            <h3 class="text-lg font-medium">Assign API to Department</h3>
          </template>

          <template #body>
            <div class="space-y-4">
              <UFormField label="Select API">
                <USelectMenu
                  v-model="selectedApi"
                  :items="availableApis"
                  option-attribute="name"
                  value-attribute="id"
                  placeholder="Choose an API"
                  :selected-value="selectedApi?.id"
                  class="w-full"
                >
                  <template #item="{ item }">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="item.type === 'PAID' ? 'warning' : 'success'"
                        :label="item.type === 'PAID' ? 'Premium' : 'Free'"
                        variant="subtle"
                        size="sm"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium">{{ item.name }}</div>
                        <div class="text-sm text-gray-500 truncate">
                          {{ item.description }}
                        </div>
                      </div>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <UFormField label="Rate Limit">
                <UInput
                  v-model="newRateLimit"
                >
                  <template #trailing>/hour</template>
                </UInput>
              </UFormField>

              <div class="flex justify-end">
                <UButton
                  color="primary"
                  label="Assign"
                  :disabled="!selectedApi"
                  @click="handleApiAssign"
                />
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </template>

    <UAlert
      v-if="!department.isActive"
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      title="Department Inactive"
      description="This department is currently inactive. Editing is disabled."
      class="mb-4"
      variant="subtle"
    />

    <div v-if="department.apiAssignments.length === 0" class="text-center py-8">
      <UIcon
        name="i-heroicons-link-slash"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-semibold text-gray-900">No APIs Assigned</h3>
      <p class="mt-1 text-sm text-gray-500">
        Get started by assigning an API to this department.
      </p>
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="assignment in department.apiAssignments"
        :key="assignment.apiId"
        class="py-4 first:pt-0 last:pb-0"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 min-w-0">
            <UBadge
              :color="getApiDetails(assignment.apiId)?.type === 'PAID' ? 'warning' : 'success'"
              :label="getApiDetails(assignment.apiId)?.type === 'PAID' ? 'Premium' : 'Free'"
              variant="subtle"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">
                {{ getApiDetails(assignment.apiId)?.name }}
              </div>
              <div class="text-sm text-gray-500 truncate">
                {{ getApiDetails(assignment.apiId)?.description }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="currentRateLimits[assignment.apiId] ?? assignment.rateLimit"
                @update:model-value="(value) => {
                  currentRateLimits[assignment.apiId] = Number(value);
                  isRateLimitChanged(assignment.apiId, Number(value));
                }"
                :disabled="!department.isActive"
              >
                <template #trailing>/hour</template>
              </UInput>

              <UButton
                v-if="isRateLimitChanged(assignment.apiId, currentRateLimits[assignment.apiId] ?? assignment.rateLimit)"
                color="success"
                variant="ghost"
                icon="i-heroicons-check"
                @click="handleRateLimitUpdate(assignment.apiId, currentRateLimits[assignment.apiId] || assignment.rateLimit)"
                :disabled="!department.isActive"
              />
            </div>

            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="handleApiRemove(assignment.apiId)"
              :disabled="!department.isActive"
            />
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>