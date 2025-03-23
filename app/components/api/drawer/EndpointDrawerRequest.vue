<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ApiEndpoint } from '~/types/api';

const props = defineProps<{
  endpoint: ApiEndpoint;
}>();

const emit = defineEmits(['update:data']);
const requestData = ref<Record<string, any>>({});

// Initialize form data based on endpoint parameters
const initRequestData = () => {
  requestData.value = {};
  if (props.endpoint.parameters) {
    props.endpoint.parameters.forEach(param => {
      if (param.type === 'number') {
        requestData.value[param.name] = null;
      } else if (param.type === 'file') {
        requestData.value[param.name] = param.fileConfig?.multiple ? [] : null;
      } else if (param.type === 'json') {
        requestData.value[param.name] = '{}';
      } else {
        requestData.value[param.name] = '';
      }
    });
  }
  emit('update:data', requestData.value);
};

// Watch for endpoint changes and initialize data
watch(() => props.endpoint, initRequestData, { immediate: true });
watch(requestData, (value) => emit('update:data', value), { deep: true });

// Form validation
const validateForm = () => {
  const errors: string[] = [];
  props.endpoint.parameters?.forEach(param => {
    if (param.required && (!requestData.value[param.name] || requestData.value[param.name] === '')) {
      errors.push(`${param.name} is required`);
    }
  });
  return errors;
};
</script>

<template>
  <div class="h-full overflow-auto">
    <div class="p-6 space-y-8">
      <!-- URL Preview -->
      <UCard
        :ui="{ 
          body: 'p-4'
        }"
      >
        <div class="flex items-center gap-2">
          <UBadge :color="endpoint.method === 'GET' ? 'success' : 'info'" :label="endpoint.method" variant="subtle" class="font-mono" />
          <code class="text-sm text-primary-700 font-mono">{{ endpoint.path }}</code>
        </div>
      </UCard>

      <!-- Description Card -->
      <UCard
        v-if="endpoint.description"
        :ui="{ 
          body: 'p-4'
        }"
      >
        <p class="text-sm text-gray-700">{{ endpoint.description }}</p>
      </UCard>

      <!-- Parameters Form -->
      <form v-if="endpoint.parameters?.length" class="space-y-6" @submit.prevent>
        <h3 class="text-sm font-medium text-gray-700">Request Parameters</h3>
        <div class="space-y-4">
          <UFormField
            v-for="param in endpoint.parameters"
            :key="param.name"
            :label="param.name"
            :required="param.required"
          >
            <template #description>
              <span class="text-xs text-gray-500">{{ param.description }}</span>
            </template>
            <template #default>
              <template v-if="param.type === 'json'">
                <UTextarea
                  v-model="requestData[param.name]"
                  :name="param.name"
                  :required="param.required"
                  :rows="6"
                  class="font-mono text-sm"
                  placeholder="{}"
                />
              </template>
              <template v-else-if="param.type === 'number'">
                <UInput
                  v-model.number="requestData[param.name]"
                  :name="param.name"
                  :required="param.required"
                  type="number"
                  :placeholder="`Enter ${param.name}...`"
                />
              </template>
              <template v-else>
                <UInput
                  v-model="requestData[param.name]"
                  :name="param.name"
                  :required="param.required"
                  :placeholder="`Enter ${param.name}...`"
                />
              </template>
            </template>
          </UFormField>
        </div>
      </form>
    </div>
  </div>
</template>