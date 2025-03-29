<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ApiEndpoint } from '~/types/api';
import { usePocketBase } from '~/lib/pocketbase';

const pb = usePocketBase();

const props = defineProps<{
  endpoint: ApiEndpoint;
}>();

const emit = defineEmits<{
  'update:data': [data: Record<string, any>];
  'response': [response: any];
  'error': [error: string | null];
  'loading': [loading: boolean];
}>();

const requestData = ref<Record<string, any>>({});
const loading = ref(false);

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

// Expose submit function to parent
defineExpose({
  submitRequest: async () => {
    try {
      loading.value = true;
      emit('loading', true);
      emit('error', null);
      emit('response', null);

      const errors = validateForm();
      if (errors.length > 0) {
        emit('error', errors.join('\n'));
        return;
      }

      // Parse any JSON parameters
      const processedData = { ...requestData.value };
      props.endpoint.parameters?.forEach(param => {
        if (param.type === 'json' && processedData[param.name]) {
          try {
            processedData[param.name] = JSON.parse(processedData[param.name]);
          } catch (e) {
            throw new Error(`Invalid JSON in parameter ${param.name}`);
          }
        }
      });

      // Make API call using the endpoint ID with authorization token
      const response = await $fetch(`/api/call-endpoint/${props.endpoint.id}`, {
        method: 'POST',
        body: processedData,
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`
        }
      });

      // Include rate limit info in the response
      emit('response', response);
    } catch (error: any) {
      console.error('API call error:', error);
      
      // Handle rate limit exceeded specifically
      if (error.status === 429) {
        const response = {
          statusCode: 429,
          data: {
            error: 'Rate Limit Exceeded',
            message: error.data?.message || 'You have exceeded your rate limit for this API.',
            details: 'Please try again later or contact your department administrator if you need a higher rate limit.'
          }
        };
        emit('response', response);
      } else {
        emit('error', error.message || 'Failed to make API call');
        if (error.data) {
          emit('response', { status: error.status, data: error.data });
        }
      }
    } finally {
      loading.value = false;
      emit('loading', false);
    }
  }
});
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
      <div v-if="endpoint.parameters?.length" class="space-y-6">
        <h3 class="text-sm font-medium text-gray-700">Request Parameters</h3>
        <div class="space-y-4">
          <UFormField
            v-for="param in endpoint.parameters"
            :key="param.name"
            :label="param.name"
            :required="param.required"
          >
            <template #description>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>{{ param.description }}</span>
                <UBadge
                  :label="param.param_in"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                />
              </div>
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
      </div>
    </div>
  </div>
</template>