<script setup lang="ts">
import type { Department } from '~/types/department';
import type { User } from '~/types/user';
import { ref, computed } from 'vue';

interface Props {
  department: Department;
  availableUsers: User[];
  assignedUsers: User[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:userAssignments', assignments: string[]): void;
}>();

// Modal States
const selectedUserId = ref<string>('');
const toast = useToast();

const selectedUser = computed(() => 
  props.availableUsers.find(user => user.id === selectedUserId.value)
);

const handleUserAssign = async () => {
  if (!selectedUser.value || !props.department.isActive) return;

  try {
    const newAssignments = [...props.department.userAssignments, selectedUser.value.id];
    emit('update:userAssignments', newAssignments);
    
    toast.add({
      title: 'Success',
      description: 'User assigned successfully',
      color: 'success',
    });
    
    // Reset form state
    selectedUserId.value = '';
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to assign user',
      color: 'error',
    });
  }
};

const handleUserRemove = async (userId: string) => {
  if (!props.department.isActive) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAssignments = props.department.userAssignments.filter(id => id !== userId);
    emit('update:userAssignments', newAssignments);
    
    toast.add({
      title: 'Success',
      description: 'User removed successfully',
      color: 'success',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to remove user',
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
          <UIcon name="i-heroicons-users" />
          <h2 class="text-lg font-medium">User Assignments</h2>
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
            label="Assign User"
            :disabled="!department.isActive"
          />

          <template #header>
            <h3 class="text-lg font-medium">Assign User to Department</h3>
          </template>

          <template #body>
            <div class="space-y-4">
              <UFormField label="Select User">
                <USelectMenu
                  v-model="selectedUserId"
                  :items="availableUsers"
                  label-key="name"
                  value-key="id"
                  placeholder="Choose a user"
                  class="w-full"
                >
                  <template #item="{ item }">
                    <div class="flex items-center gap-2">
                      <UAvatar
                        :alt="item.name"
                        :src="'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name)"
                        size="sm"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium">{{ item.name }}</div>
                        <div class="text-sm text-gray-500 truncate">
                          {{ item.email }}
                        </div>
                      </div>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <div class="flex justify-end">
                <UButton
                  color="primary"
                  label="Assign"
                  :disabled="!selectedUser"
                  @click="handleUserAssign"
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

    <div v-if="department.userAssignments.length === 0" class="text-center py-8">
      <UIcon
        name="i-heroicons-users"
        class="mx-auto h-12 w-12 text-gray-400"
      />
      <h3 class="mt-2 text-sm font-semibold text-gray-900">No Users Assigned</h3>
      <p class="mt-1 text-sm text-gray-500">
        Get started by assigning users to this department.
      </p>
    </div>

    <div v-else class="divide-y">
      <div
        v-for="user in assignedUsers"
        :key="user.id"
        class="py-4 first:pt-0 last:pb-0"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 min-w-0">
            <UAvatar
              :alt="user.name"
              :src="'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)"
              size="sm"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ user.name }}</div>
              <div class="text-sm text-gray-500 truncate">{{ user.email }}</div>
            </div>
          </div>

          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="handleUserRemove(user.id)"
            :disabled="!department.isActive"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>