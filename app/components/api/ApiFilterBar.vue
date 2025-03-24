<script setup lang="ts">
interface Props {
  modelValue: {
    search: string;
    type: "ALL" | "FREE" | "PAID";
    status: "ALL" | "ACTIVE" | "INACTIVE";
    sort: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    search: "",
    type: "ALL",
    status: "ALL",
    sort: "name",
  }),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Props["modelValue"]): void;
}>();

const typeItems = [
  { label: 'All APIs', value: 'ALL' },
  { label: 'FREE', value: 'FREE' },
  { label: 'PAID', value: 'PAID' }
];

const statusItems = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

const sortOptions = [
  { label: "Name (A-Z)", value: "name", icon: "i-heroicons-bars-arrow-down" },
  { label: "Name (Z-A)", value: "-name", icon: "i-heroicons-bars-arrow-up" },
  { label: "Newest First", value: "-createdAt", icon: "i-heroicons-calendar" },
  { label: "Oldest First", value: "createdAt", icon: "i-heroicons-calendar-days" },
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
    type: "ALL",
    status: "ALL",
    sort: "name",
  });
};

const hasActiveFilters = computed(() => {
  return (
    props.modelValue.search !== "" ||
    props.modelValue.type !== "ALL" ||
    props.modelValue.status !== "ALL"
  );
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <!-- Search Bar -->
    <div class="p-4 lg:p-6">
      <UInput
        v-model="modelValue.search"
        placeholder="Search APIs..."
        icon="i-heroicons-magnifying-glass"
        class="w-full"
      />
    </div>

    <!-- Filters -->
    <div class="px-4 lg:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center gap-4">
      <!-- Type Filters -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 font-medium">Show:</span>
        <UTabs
          :content="false"
          :items="typeItems"
          :model-value="(modelValue.type as string) || 'ALL'"
          @update:model-value="value => updateFilter('type', value)"
          color="neutral"
        />
      </div>

      <!-- Status Filters -->
      <div v-if="isAdmin()" class="flex items-center gap-3">
        <span class="text-sm text-gray-500 font-medium">Status:</span>
        <UTabs
          :content="false"
          :items="statusItems"
          :model-value="modelValue.status"
          @update:model-value="value => updateFilter('status', value)"
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

      <!-- Sort Options -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 font-medium">Sort by:</span>
        <USelectMenu
          v-model="modelValue.sort"
          :items="sortOptions"
          value-key="value"
          :search-input="false"
          class="w-[200px]"
          :ui="{ 
              base: 'flex items-center gap-2'
          }"
        />
      </div>
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