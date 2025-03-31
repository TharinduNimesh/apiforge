<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ApiEndpoint, ApiParameter } from '~/types/api';
import { usePocketBase } from '~/lib/pocketbase';
import FilePicker from '~/components/ui/FilePicker.vue';

const pb = usePocketBase();
const toast = useToast();

interface ExtendedParameter extends ApiParameter {
  fileConfig?: {
    multiple: boolean;
    maxSize: number;
    accept: string[] | string;
  };
}

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
    props.endpoint.parameters.forEach((param: ExtendedParameter) => {
      if (param.type === 'file') {
        // Handle file parameters with proper configuration
        const fileConfig = param.fileConfig || {
          multiple: false,
          maxSize: 2 * 1024 * 1024, // 2MB default
          accept: ['*/*']
        };
        requestData.value[param.name] = fileConfig.multiple ? [] : null;
      } else if (param.type === 'number') {
        requestData.value[param.name] = null;
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

const handleFilePickerError = (message: string) => {
  toast.add({
    title: 'File Upload Error',
    description: message,
    color: 'error'
  });
};

const submitRequest = async () => {
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

    // Create FormData if there are file uploads
    const hasFileUploads = props.endpoint.parameters?.some(param => param.type === 'file');
    const formData = hasFileUploads ? new FormData() : null;
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(requestData.value)) {
      const param = props.endpoint.parameters?.find(p => p.name === key);
      
      if (param?.type === 'file' && formData) {
        if (param.fileConfig?.multiple && Array.isArray(value)) {
          // Handle multiple files
          value.forEach((file: File) => {
            formData.append(`${key}[]`, file);
          });
        } else if (value instanceof File) {
          // Handle single file
          formData.append(key, value);
        }
      } else if (param?.type === 'json' && typeof value === 'string') {
        try {
          processedData[key] = JSON.parse(value);
        } catch (e) {
          throw new Error(`Invalid JSON in parameter ${key}`);
        }
      } else {
        processedData[key] = value;
      }
    }

    // If using FormData, add other parameters to it
    if (formData) {
      Object.entries(processedData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response = await $fetch(`/api/call-endpoint/${props.endpoint.id}`, {
      method: 'POST',
      body: formData || processedData,
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });

    emit('response', response);
  } catch (error: any) {
    emit('error', error.message || 'Failed to make request');
  } finally {
    loading.value = false;
    emit('loading', false);
  }
};

// Expose submit function to parent
defineExpose({
  submitRequest
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
              <template v-if="param.type === 'file'">
                <FilePicker
                  v-model="requestData[param.name]"
                  :multiple="param.fileConfig?.multiple"
                  :accept="Array.isArray(param.fileConfig?.accept) ? param.fileConfig.accept : [param.fileConfig?.accept || '*/*']"
                  :max-size="param.fileConfig?.maxSize || 2097152"
                  :max-files="param.fileConfig?.multiple ? 10 : 1"
                  @error="handleFilePickerError"
                />
              </template>
              <template v-else-if="param.type === 'json'">
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