<script setup lang="ts">
import type { ApiEndpoint } from '~/types/api';

defineProps<{
  endpoint: ApiEndpoint;
}>();

const emit = defineEmits(['close']);
</script>

<template>
  <div class="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
    <div class="flex items-center gap-4">
      <div>
        <h1 class="text-lg font-medium text-gray-900" id="drawer-title">{{ endpoint.name }}</h1>
        <p class="text-sm text-gray-500" id="drawer-description">{{ endpoint.path }}</p>
      </div>
    </div>
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-heroicons-x-mark"
      class="shrink-0"
      aria-label="Close drawer"
      @click="emit('close')"
    />
  </div>
</template>