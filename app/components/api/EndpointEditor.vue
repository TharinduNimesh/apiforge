<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApiEndpoint, ApiParameter } from '~/types/api';

const props = defineProps<{
  modelValue: ApiEndpoint;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ApiEndpoint): void;
  (e: 'save', value: ApiEndpoint): void;
}>();

const currentEndpoint = ref<ApiEndpoint>({ ...props.modelValue });

// Available options for dropdowns
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const parameterTypes = ['string', 'number', 'boolean', 'object', 'array', 'file'];
const parameterLocations = ['query', 'path', 'body', 'header'];

// Validation rules
const rules = {
  name: (value: string) => !!value || 'Endpoint name is required',
  path: (value: string) => !!value || 'Path is required',
  paramName: (value: string) => !!value || 'Parameter name is required'
};

const addParameter = () => {
  currentEndpoint.value.parameters.push({
    name: '',
    param_in: 'query',
    type: 'string',
    required: true,
    description: ''
  });
};

const removeParameter = (index: number) => {
  currentEndpoint.value.parameters.splice(index, 1);
};

const handleSave = () => {
  emit('save', currentEndpoint.value);
};

// Watch for type changes to handle file parameter specifics
const handleParameterTypeChange = (param: ApiParameter) => {
  if (param.type === 'file') {
    param.param_in = 'formData';
  }
};

const isValid = computed(() => {
  return !!(currentEndpoint.value.name && currentEndpoint.value.path);
});
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Basic Endpoint Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UFormField 
        label="Endpoint Name" 
        name="name" 
        :validate="rules.name"
        required
      >
        <UInput
          v-model="currentEndpoint.name"
          placeholder="Get User Details"
        />
      </UFormField>

      <UFormField label="HTTP Method" name="method">
        <USelect
          v-model="currentEndpoint.method"
          :options="httpMethods"
          option-attribute="value"
        />
      </UFormField>
    </div>

    <UFormField 
      label="Path" 
      name="path" 
      :validate="rules.path"
      required
    >
      <UInput
        v-model="currentEndpoint.path"
        placeholder="/users/{id}"
      />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea
        v-model="currentEndpoint.description"
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

      <div v-if="currentEndpoint.parameters.length === 0" class="text-center py-8">
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
          v-for="(param, index) in currentEndpoint.parameters"
          :key="index"
          class="bg-gray-50"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UFormField 
                label="Name" 
                :name="`param-${index}-name`"
                :validate="rules.paramName"
                required
              >
                <UInput
                  v-model="param.name"
                  placeholder="Parameter name"
                />
              </UFormField>

              <UFormField label="Type" :name="`param-${index}-type`">
                <USelect
                  v-model="param.type"
                  :options="parameterTypes"
                  option-attribute="value"
                  @update:modelValue="() => handleParameterTypeChange(param)"
                />
              </UFormField>

              <UFormField label="Location" :name="`param-${index}-location`">
                <USelect
                  v-model="param.param_in"
                  :options="parameterLocations"
                  option-attribute="value"
                  :disabled="param.type === 'file'"
                />
              </UFormField>
            </div>

            <UFormField label="Description" :name="`param-${index}-description`">
              <UInput
                v-model="param.description"
                placeholder="Parameter description"
              />
            </UFormField>

            <div class="flex items-center gap-4">
              <UCheckbox
                v-model="param.required"
                label="Required"
              />

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

    <!-- Footer Actions -->
    <div class="flex justify-end gap-3">
      <UButton
        color="primary"
        :disabled="!isValid"
        @click="handleSave"
        label="Save Endpoint"
      />
    </div>
  </div>
</template>