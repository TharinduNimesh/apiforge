<script setup lang="ts">
interface Props {
  modelValue: {
    search: string;
    role: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    search: "",
    role: "ALL",
  }),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Props["modelValue"]): void;
}>();

const roleItems = [
  { label: 'All Roles', value: 'ALL' },
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' }
];

const updateFilter = (key: keyof Props["modelValue"], value: any) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};

const clearFilters = () => {
  emit("update:modelValue", {
    search: "",
    role: "ALL",
  });
};

const hasActiveFilters = computed(() => {
  return props.modelValue.search !== "" || props.modelValue.role !== "ALL";
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <!-- Search Bar -->
    <div class="p-4 lg:p-6">
      <UInput
        v-model="modelValue.search"
        placeholder="Search users..."
        icon="i-heroicons-magnifying-glass"
        class="w-full"
      />
    </div>

    <!-- Filters -->
    <div class="px-4 lg:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center gap-4">
      <!-- Role Filters -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 font-medium">Role:</span>
        <UTabs
          :content="false"
          :items="roleItems"
          :model-value="modelValue.role"
          @update:model-value="value => updateFilter('role', value)"
          color="neutral"
        />
      </div>

      <div class="flex-1" />

      <!-- Clear Filters Button -->
      <UButton
        v-if="hasActiveFilters"
        icon="i-heroicons-x-mark"
        label="Clear Filters"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="clearFilters"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.u-tabs) {
  --tab-min-w: auto;
}

:deep(.u-tab) {
  padding-left: 1rem;
  padding-right: 1rem;
  min-width: fit-content;
}
</style>