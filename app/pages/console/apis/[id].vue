<script setup lang="ts">
import type { Api } from '~/types/api';
import { mockApis } from '~/data/mockApis';

const route = useRoute();
const api = ref<Api | undefined>();

onMounted(() => {
  // For now, use mock data
  api.value = mockApis.find(a => a.id === route.params.id);
  
  if (!api.value) {
    showError({ statusCode: 404, message: 'API not found' });
  }
});
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div v-if="api">
        <div class="mb-6 flex items-center gap-4">
          <UButton
            to="/console"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            color="gray"
          />
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ api.name }}
          </h1>
          <UBadge
            :color="api.type === 'PAID' ? 'amber' : 'emerald'"
            variant="soft"
            size="lg"
          >
            {{ api.type }}
          </UBadge>
        </div>

        <!-- Placeholder content -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">API Details</h3>
              <UBadge
                :color="api.status === 'ACTIVE' ? 'green' : 'gray'"
                variant="soft"
              >
                {{ api.status }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-600">
              {{ api.description }}
            </p>

            <div class="flex items-center gap-2 text-sm text-gray-500">
              <UIcon name="i-heroicons-link" class="text-gray-400" />
              <span>{{ api.endpointCount }} Endpoints</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>