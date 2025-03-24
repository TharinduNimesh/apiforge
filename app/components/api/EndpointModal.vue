<script setup lang="ts">
import type { ApiEndpoint } from '~/types/api';
import { useToast } from '#imports';

interface Props {
  endpoint?: ApiEndpoint;
}

const props = withDefaults(defineProps<Props>(), {
  endpoint: undefined
});

const emit = defineEmits<{
  (e: 'save', value: ApiEndpoint): void;
}>();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Create a function to get initial form state
const getInitialFormState = (): ApiEndpoint => ({
  id: crypto.randomUUID(),
  name: '',
  method: 'GET',
  path: '',
  description: '',
  parameters: [],
  responses: []
});

const state = reactive<ApiEndpoint>(props.endpoint ? { ...props.endpoint } : getInitialFormState());
const toast = useToast();
const errors = reactive<Record<string, string>>({});
const open = ref(false);

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
  console.log('Form submission started', { state: JSON.stringify(state) });

  if (!validateForm()) {
    console.log('Validation errors:', errors);
    toast.add({
      title: 'Validation Error',
      description: Object.values(errors)[0],
      color: 'error'
    });
    return;
  }

  try {
    const endpoint: ApiEndpoint = {
      id: state.id,
      name: state.name,
      method: state.method,
      path: state.path,
      description: state.description || '',
      parameters: state.parameters?.map(param => ({
        ...param,
        description: param.description || ''
      })) || [],
      responses: state.responses || []
    };
    
    console.log('Emitting save event with endpoint:', endpoint);
    emit('save', endpoint);

    // Reset form
    Object.assign(state, getInitialFormState());
    errors.name = '';
    errors.path = '';
    
    toast.add({
      title: 'Success',
      description: 'Endpoint saved successfully',
      color: 'success'
    });

    // Close modal
    open.value = false;
  } catch (error) {
    console.error('Error saving endpoint:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to save endpoint',
      color: 'error'
    });
  }
};

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const parameterTypes = ['string', 'number', 'boolean', 'object', 'array'];
const parameterLocations = ['query', 'path', 'body', 'header'];

const parameterTypeOptions = parameterTypes.map(type => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
  icon: type === 'file' ? 'i-heroicons-document' :
        type === 'array' ? 'i-heroicons-squares-2x2' :
        type === 'object' ? 'i-heroicons-cube' :
        type === 'boolean' ? 'i-heroicons-check-circle' :
        type === 'number' ? 'i-heroicons-hashtag' :
        'i-heroicons-document-text'
}));

const parameterLocationOptions = parameterLocations.map(location => ({
  label: location.charAt(0).toUpperCase() + location.slice(1),
  value: location,
  icon: location === 'query' ? 'i-heroicons-question-mark-circle' :
        location === 'path' ? 'i-heroicons-arrow-right' :
        location === 'header' ? 'i-heroicons-code-bracket' :
        'i-heroicons-document'
}));

const addParameter = () => {
  console.log('Adding new parameter');
  if (!state.parameters) state.parameters = [];
  state.parameters.push({
    name: '',
    in: 'query',
    type: 'string',
    required: true,
    description: ''
  });
  console.log('Parameters after add:', state.parameters);
};

const removeParameter = (index: number) => {
  if (state.parameters) {
    state.parameters.splice(index, 1);
  }
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
                v-model="state.method"
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
                      />
                    </UFormField>

                    <UFormField 
                      label="Location" 
                      :name="`parameters.${index}.in`"
                    >
                      <USelectMenu
                        v-model="param.in"
                        :items="parameterLocationOptions"
                        option-value="value"
                        value-key="value"
                        :ui="{ base: 'w-full' }"
                      />
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
              </UCard>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
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
</template>