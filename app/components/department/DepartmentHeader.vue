<script setup lang="ts">
import type { Department } from '~/types/department';

const props = defineProps<{
  department: Department;
}>();
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <UButton
            class="rounded-full"
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/console/departments"
          />
          <h1 class="text-2xl font-semibold text-gray-900">{{ department.name }}</h1>
        </div>
        <p class="text-gray-500">{{ department.description }}</p>
      </div>
      <UBadge
        :color="department.isActive ? 'success' : 'error'"
        :label="department.isActive ? 'Active' : 'Inactive'"
        size="lg"
        variant="soft"
      />
    </div>
  </div>

  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-building-office" />
        <h2 class="text-lg font-medium">Department Details</h2>
      </div>
    </template>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="text-sm text-gray-500">Created On</div>
        <div class="font-medium">
          {{ new Date(department.createdAt).toLocaleDateString() }}
        </div>
      </div>
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="text-sm text-gray-500">Total APIs</div>
        <div class="font-medium">{{ department.apiAssignments.length }}</div>
      </div>
    </div>
  </UCard>
</template>