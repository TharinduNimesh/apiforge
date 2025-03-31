<script setup lang="ts">
import type { ApiEndpoint, ApiParameter } from '~/types/api';
import { useToast } from '#imports';
import { usePocketBase } from '~/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

// Extend ApiEndpoint type to include api property
interface ExtendedApiEndpoint extends ApiEndpoint {
  api?: string;
  isNew?: boolean; // Add this to track new endpoints
}

// Add file configuration interface
interface FileParameterConfig {
  multiple: boolean;
  maxSize: number; // in bytes
  accept: string[] | string;
}

// Common MIME type options
interface MimeTypeOption {
  label: string;
  value: string;
}

const mimeTypeOptions: MimeTypeOption[] = [
  { label: 'Images (All)', value: 'image/*' },
  { label: 'PNG Image', value: 'image/png' },
  { label: 'JPEG Image', value: 'image/jpeg' },
  { label: 'GIF Image', value: 'image/gif' },
  { label: 'PDF Document', value: 'application/pdf' },
  { label: 'Word Document', value: 'application/msword' },
  { label: 'Excel Spreadsheet', value: 'application/vnd.ms-excel' },
  { label: 'Text File', value: 'text/plain' },
  { label: 'JSON', value: 'application/json' },
  { label: 'ZIP Archive', value: 'application/zip' },
  { label: 'All Files', value: '*/*' }
];

// Extend ApiParameter to include file configuration
interface ExtendedApiParameter extends ApiParameter {
  fileConfig?: FileParameterConfig;
}

interface Props {
  endpoint?: ExtendedApiEndpoint;
}

const props = withDefaults(defineProps<Props>(), {
  endpoint: undefined
});

const emit = defineEmits<{
  (e: 'save', value: ApiEndpoint): void;
  (e: 'update:open', value: boolean): void;
}>();

const httpMethods = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
];
const parameterTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' },
  { label: 'File', value: 'file' }
];
const parameterLocationOptions = [
  { label: 'Query', value: 'query' },
  { label: 'Path', value: 'path' },
  { label: 'Body', value: 'body' },
  { label: 'Header', value: 'header' },
  { label: 'Form Data', value: 'formData' }
];

// Create a function to get initial form state
const getInitialFormState = (): ExtendedApiEndpoint => ({
  id: crypto.randomUUID(),
  name: '',
  method: 'GET',
  path: '',
  description: '',
  parameters: [],
  responses: [],
  api: '',
  isNew: true // Mark new endpoints
});

const state = reactive<ExtendedApiEndpoint>(props.endpoint ? { ...props.endpoint } : getInitialFormState());
const selectedMethod = ref(httpMethods.find(m => m.value === state.method));

// Add watcher for selectedMethod with proper type assertion
watch(selectedMethod, (newMethod) => {
  if (newMethod) {
    state.method = newMethod.value as ApiEndpoint['method'];
  }
}, { immediate: true });

const toast = useToast();
const errors = reactive<Record<string, string>>({});
const open = ref(false);
const pb = usePocketBase();
const confirmModalOpen = ref(false);
const loading = ref(false);

// Add functions to handle parameter type changes
const handleParameterTypeChange = (param: ApiParameter, index: number) => {
  if (param.type === 'file') {
    console.log('Parameter type changed to file:', { paramName: param.name, index });
    // Auto-set location to formData for file uploads
    param.param_in = 'formData';
    
    // Initialize file config if not exists
    if (!param.fileConfig) {
      console.log('Initializing file config for parameter:', param.name);
      param.fileConfig = {
        multiple: false,
        maxSize: 2 * 1024 * 1024, // 2MB default
        accept: ['*/*'] // Initialize with an array containing the default accept all value
      };
    }
  }
};

// Watch parameter type changes
watch(() => state.parameters, (parameters) => {
  if (parameters) {
    parameters.forEach(param => {
      if (param.type === 'file' && param.param_in !== 'formData') {
        console.log('Auto-correcting param_in to formData for file parameter:', param.name);
        param.param_in = 'formData';
      }
    });
  }
}, { deep: true });

const validateForm = () => {
  errors.name = '';
  errors.path = '';
  let isValid = true;

  // Validate name
  if (!state.name?.trim()) {
    errors.name = 'Endpoint name is required';
    isValid = false;
  }

  // Validate path
  if (!state.path?.trim()) {
    errors.path = 'Path is required';
    isValid = false;
  } else if (!state.path.startsWith('/')) {
    errors.path = 'Path must start with /';
    isValid = false;
  } else if (!/^[a-zA-Z0-9\-_\/{}]+$/.test(state.path)) {
    errors.path = 'Path can only contain letters, numbers, hyphens, underscores, and curly braces';
    isValid = false;
  }

  // Validate parameters if any exist
  if (state.parameters?.length) {
    state.parameters.forEach((param, index) => {
      if (!param.name?.trim()) {
        errors[`param${index}`] = 'Parameter name is required';
        isValid = false;
      }
    });
  }

  return isValid;
};

const handleSave = async (event: Event) => {
  event.preventDefault();

  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: Object.values(errors)[0],
      color: 'error'
    });
    return;
  }

  // If this is an existing endpoint, show confirmation modal
  if (props.endpoint && !props.endpoint.isNew) {
    confirmModalOpen.value = true;
    return;
  }

  // For new endpoints, just emit the save event
  const endpoint: ExtendedApiEndpoint = {
    id: state.id,
    name: state.name,
    method: state.method,
    path: state.path,
    description: state.description || '',
    parameters: state.parameters?.map(param => ({
      ...param,
      description: param.description || ''
    })) || [],
    responses: state.responses || [],
    isNew: true
  };

  emit('save', endpoint);
  toast.add({
    title: 'Success',
    description: 'Endpoint added to list',
    color: 'success'
  });

  // Reset form and close modal
  Object.assign(state, getInitialFormState());
  open.value = false;
};

const addParameter = () => {
  if (!state.parameters) state.parameters = [];
  state.parameters.push({
    name: '',
    type: 'string',
    param_in: 'query',
    description: '',
    required: false
  });
};

const removeParameter = (index: number) => {
  state.parameters?.splice(index, 1);
};

const handleCancel = () => {
  open.value = false;
  emit('update:open', false);
};

// Modified save function to properly handle types
const handleConfirmSave = async () => {
  loading.value = true;
  try {
    console.log('Starting endpoint save process...');
    const endpointData: Record<string, any> = {
      name: state.name,
      description: state.description || '',
      path: state.path,
      method: state.method,
    };

    let savedEndpoint: RecordModel;
    if (props.endpoint) {
      console.log('Updating existing endpoint:', props.endpoint.id);
      savedEndpoint = await pb.collection('endpoints').update(props.endpoint.id, endpointData);
    } else {
      console.log('Creating new endpoint');
      endpointData.api = state.api || '';
      savedEndpoint = await pb.collection('endpoints').create(endpointData);
    }

    // Create a map of existing parameters by their name for easy lookup
    const existingParameters = new Map();
    if (props.endpoint) {
      const existingParamsList = await pb.collection('parameters').getFullList({
        filter: `endpoint = "${props.endpoint.id}"`
      });
      console.log('Found existing parameters:', existingParamsList.length);
      existingParamsList.forEach(param => {
        existingParameters.set(param.name, param);
      });
    }

    // Handle parameters
    if (state.parameters?.length) {
      const updatedParameterNames = new Set();

      for (const param of state.parameters) {
        // Prepare file options for file type parameters
        const fileOptions = param.type === 'file' && param.fileConfig ? {
          multiple: param.fileConfig.multiple || false,
          maxSize: param.fileConfig.maxSize || 2 * 1024 * 1024,
          accept: Array.isArray(param.fileConfig.accept) ? param.fileConfig.accept : [param.fileConfig.accept || '*/*']
        } : null;

        if (param.type === 'file') {
          console.log('Processing file parameter:', {
            paramName: param.name,
            fileConfig: param.fileConfig,
            processedFileOptions: fileOptions
          });
        }

        const paramData = {
          name: param.name,
          description: param.description || '',
          type: param.type,
          param_in: param.param_in,
          required: param.required,
          endpoint: savedEndpoint.id,
          file_options: fileOptions ? (typeof fileOptions === 'string' ? fileOptions : JSON.stringify(fileOptions)) : null
        };

        // Check if this parameter already exists
        const existingParam = existingParameters.get(param.name);

        if (existingParam) {
          console.log('Updating existing parameter:', {
            paramName: param.name,
            type: param.type,
            isFile: param.type === 'file',
            fileOptions: fileOptions
          });
          await pb.collection('parameters').update(existingParam.id, paramData);
        } else {
          console.log('Creating new parameter:', {
            paramName: param.name,
            type: param.type,
            isFile: param.type === 'file',
            fileOptions: fileOptions
          });
          await pb.collection('parameters').create(paramData);
        }

        updatedParameterNames.add(param.name);
      }

      // Delete parameters that were removed
      for (const [name, param] of existingParameters) {
        if (!updatedParameterNames.has(name)) {
          console.log('Deleting removed parameter:', name);
          await pb.collection('parameters').delete(param.id);
        }
      }
    } else if (props.endpoint) {
      // Delete all parameters if the endpoint exists but no parameters are specified
      const existingParamsList = await pb.collection('parameters').getFullList({
        filter: `endpoint = "${props.endpoint.id}"`
      });
      console.log('Deleting all parameters as none specified:', existingParamsList.length);
      for (const param of existingParamsList) {
        await pb.collection('parameters').delete(param.id);
      }
    }

    // Convert the PocketBase record to ApiEndpoint type
    const convertedEndpoint: ExtendedApiEndpoint = {
      id: savedEndpoint.id,
      name: savedEndpoint.name,
      description: savedEndpoint.description,
      path: savedEndpoint.path,
      method: savedEndpoint.method as ApiEndpoint['method'],
      parameters: state.parameters || [],
      responses: state.responses || [],
      api: savedEndpoint.api
    };

    toast.add({
      title: 'Success',
      description: `Endpoint ${props.endpoint ? 'updated' : 'created'} successfully`,
      color: 'success'
    });

    emit('save', convertedEndpoint);
    confirmModalOpen.value = false;
    open.value = false;
  } catch (error: any) {
    console.error('Error saving endpoint:', error);
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save endpoint',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const handleCancelSave = () => {
  confirmModalOpen.value = false;
};
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-3xl' }">
    <UButton
      :color="endpoint ? 'warning' : 'neutral'"
      :icon="endpoint ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'"
      :label="endpoint ? 'Edit' : 'Add Endpoint'"
      :variant="endpoint ? 'ghost' : 'solid'"
    />

    <template #content>
      <div class="p-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ endpoint ? 'Edit Endpoint' : 'Add New Endpoint' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ endpoint ? 'Update the details of this endpoint.' : 'Define a new API endpoint.' }}
          </p>
        </div>

        <UForm 
          :state="state" 
          class="space-y-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField 
              label="Endpoint Name" 
              name="name" 
              required
              :error="errors.name"
            >
              <UInput
                v-model="state.name"
                placeholder="e.g., Get User Details"
              />
            </UFormField>

            <UFormField label="HTTP Method" name="method">
              <USelectMenu
                v-model="selectedMethod"
                :items="httpMethods"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField 
            label="Path" 
            name="path" 
            required
            help="Use {paramName} for path parameters"
            :error="errors.path"
          >
            <UInput
              v-model="state.path"
              placeholder="/users/{id}"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="state.description"
              :rows="3"
              placeholder="Describe what this endpoint does..."
            />
          </UFormField>

          <!-- Parameters Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-medium text-gray-900">Parameters</h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                @click="addParameter"
                label="Add Parameter"
              />
            </div>

            <div v-if="!state.parameters?.length" class="text-center py-8">
              <UIcon
                name="i-heroicons-variable"
                class="mx-auto h-12 w-12 text-gray-400"
              />
              <h3 class="mt-2 text-sm font-semibold text-gray-900">No parameters</h3>
              <p class="mt-1 text-sm text-gray-500">
                Add parameters to define the input for this endpoint
              </p>
            </div>

            <div v-else class="space-y-4">
              <UCard
                v-for="(param, index) in state.parameters"
                :key="index"
                class="bg-gray-50"
              >
                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField 
                      label="Name" 
                      :name="`parameters.${index}.name`"
                      required
                      :error="errors[`param${index}`]"
                    >
                      <UInput
                        v-model="param.name"
                        placeholder="Parameter name"
                      />
                    </UFormField>

                    <UFormField 
                      label="Type" 
                      :name="`parameters.${index}.type`"
                    >
                      <USelectMenu
                        v-model="param.type"
                        :items="parameterTypeOptions"
                        option-value="value"
                        value-key="value"
                        :ui="{ base: 'w-full' }"
                        @change="handleParameterTypeChange(param, index)"
                      />
                    </UFormField>

                    <UFormField 
                      label="Location" 
                      :name="`parameters.${index}.in`"
                    >
                      <USelectMenu
                        v-model="param.param_in"
                        :items="parameterLocationOptions"
                        option-value="value"
                        value-key="value"
                        :ui="{ base: 'w-full' }"
                        :disabled="param.type === 'file'"
                        @change="param.type === 'file' ? param.param_in = 'formData' : null"
                      />
                      <template v-if="param.type === 'file'" #help>
                        <span class="text-xs text-gray-500">File parameters must use Form Data location</span>
                      </template>
                    </UFormField>
                  </div>

                  <UFormField 
                    label="Description" 
                    :name="`parameters.${index}.description`"
                  >
                    <UInput
                      v-model="param.description"
                      placeholder="Parameter description"
                    />
                  </UFormField>

                  <div class="flex items-center gap-4">
                    <UFormField 
                      :name="`parameters.${index}.required`" 
                      class="!mb-0"
                    >
                      <UCheckbox
                        v-model="param.required"
                        label="Required"
                      />
                    </UFormField>

                    <div class="flex-grow"></div>

                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      @click="removeParameter(index)"
                      size="sm"
                    />
                  </div>
                </div>

                <!-- File Upload Options -->
                <div v-if="param.type === 'file'" class="border-t border-gray-200 mt-4 pt-4">
                  <div class="flex items-center gap-2 mb-4">
                    <UIcon name="i-heroicons-document-arrow-up" class="w-5 h-5 text-primary-500" />
                    <h4 class="text-base font-medium text-gray-900">File Upload Options</h4>
                  </div>
                  
                  <div class="space-y-4">
                    <!-- Multiple Files Option -->
                    <UFormField label="Allow Multiple Files">
                      <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <UCheckbox
                          :model-value="param.fileConfig?.multiple || false"
                          @update:model-value="
                            (val: boolean | 'indeterminate') => {
                              if (!param.fileConfig) {
                                param.fileConfig = {
                                  multiple: false,
                                  maxSize: 2 * 1024 * 1024,
                                  accept: ['*/*']
                                };
                              }
                              param.fileConfig.multiple = val === true;
                            }
                          "
                        />
                        <div>
                          <span class="text-sm font-medium text-gray-900">Allow users to upload multiple files</span>
                          <p class="text-xs text-gray-500">Enable selection of multiple files in a single upload</p>
                        </div>
                      </div>
                    </UFormField>

                    <!-- File Size Limit -->
                    <UFormField label="Size Limit" help="Maximum allowed file size">
                      <div class="flex items-center gap-2">
                        <UInput
                          :model-value="param.fileConfig?.maxSize || 2097152"
                          type="number"
                          :min="0"
                          :step="1024"
                          class="flex-1"
                          @update:model-value="
                            (val: string | number) => {
                              if (!param.fileConfig) {
                                param.fileConfig = {
                                  multiple: false,
                                  maxSize: 2 * 1024 * 1024,
                                  accept: ['*/*']
                                };
                              }
                              param.fileConfig.maxSize = typeof val === 'string' ? parseInt(val) : val;
                            }
                          "
                        >
                          <template #trailing>
                            <span class="text-sm text-gray-500">bytes</span>
                          </template>
                        </UInput>
                        <UBadge
                          color="neutral"
                          variant="subtle"
                          class="text-xs"
                          :label="((param.fileConfig?.maxSize || 0) / (1024 * 1024)).toFixed(2) + ' MB'"
                        />
                      </div>
                    </UFormField>

                    <!-- Accepted MIME Types -->
                    <UFormField label="Accepted File Types" help="Select one or more file types that will be accepted">
                      <USelectMenu
                        :model-value="(Array.isArray(param.fileConfig?.accept) 
                          ? mimeTypeOptions.filter(opt => param.fileConfig?.accept && (param.fileConfig.accept as string[]).includes(opt.value))
                          : param.fileConfig?.accept 
                            ? [mimeTypeOptions.find(opt => opt.value === param.fileConfig?.accept)].filter(Boolean)
                            : [mimeTypeOptions[0]]
                        ) as MimeTypeOption[]"
                        :items="mimeTypeOptions"
                        multiple
                        placeholder="Select accepted file types"
                        class="w-full"
                        @update:model-value="
                          (val: MimeTypeOption[]) => {
                            if (!param.fileConfig) {
                              param.fileConfig = {
                                multiple: false,
                                maxSize: 2 * 1024 * 1024,
                                accept: []
                              };
                            }
                            param.fileConfig.accept = val.map(v => v.value);
                          }
                        "
                      >
                        <template #item="{ item }">
                          <div v-if="item" class="flex items-center gap-2 py-1">
                            <UIcon 
                              :name="item.value.startsWith('image/') ? 'i-heroicons-photo' : 
                                    item.value.includes('pdf') ? 'i-heroicons-document' :
                                    item.value.includes('word') ? 'i-heroicons-document-text' :
                                    item.value === '*/*' ? 'i-heroicons-document-duplicate' :
                                    'i-heroicons-document'"
                              class="flex-shrink-0 w-4 h-4 text-gray-500"
                            />
                            <span class="text-sm">{{ item.label }}</span>
                            <UBadge
                              v-if="item.value !== '*/*'"
                              color="neutral"
                              variant="subtle"
                              size="xs"
                              class="ml-auto text-[10px] font-mono"
                              :label="item.value"
                            />
                          </div>
                        </template>
                      </USelectMenu>
                    </UFormField>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="handleCancel"
            />
            <UButton
              type="submit"
              color="primary"
              label="Save Endpoint"
              @click="handleSave"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>

  <!-- Save Confirmation Modal - Only show for existing endpoints -->
  <UModal v-if="endpoint && !endpoint.isNew" v-model:open="confirmModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Save Changes</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="handleCancelSave"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-full bg-info-50">
              <UIcon
                name="i-heroicons-information-circle"
                class="h-6 w-6 text-info-500"
              />
            </div>
            <div class="space-y-1">
              <h4 class="font-medium">{{ state.name }}</h4>
              <p class="text-sm text-gray-500">
                Are you sure you want to {{ props.endpoint ? 'update' : 'create' }} this endpoint? 
                This will {{ props.endpoint ? 'modify' : 'add' }} the endpoint and its parameters.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="handleCancelSave"
            />
            <UButton
              :label="props.endpoint ? 'Update' : 'Create'"
              color="primary"
              :loading="loading"
              @click="handleConfirmSave"
            />
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>