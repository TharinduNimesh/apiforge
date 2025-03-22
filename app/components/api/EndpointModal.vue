<script setup lang="ts">
import { ref } from 'vue';
import type { ApiEndpoint, ApiParameter } from '~/types/api';

interface Props {
  trigger?: {
    icon?: string;
    label?: string;
    color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
    variant?: "solid" | "outline" | "soft" | "ghost" | "link" | "subtle";
  };
}

interface SelectOption {
  label: string;
  value: string;
  icon: string;
}

const props = withDefaults(defineProps<Props>(), {
  trigger: () => ({
    icon: 'i-heroicons-plus',
    label: 'Add Endpoint',
    color: 'neutral',
    variant: 'solid'
  })
});

const emit = defineEmits<{
  (e: 'save', value: ApiEndpoint): void;
}>();

const endpoint = ref<ApiEndpoint>({
  id: crypto.randomUUID(),
  name: '',
  method: 'GET',
  path: '',
  description: '',
  parameters: [],
  responses: []
});

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const parameterTypes = ['string', 'number', 'boolean', 'object', 'array'];
const parameterLocations = ['query', 'path', 'body', 'header'];

const parameterTypeOptions: SelectOption[] = parameterTypes.map(type => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
  icon: type === 'file' ? 'i-heroicons-document' :
        type === 'array' ? 'i-heroicons-squares-2x2' :
        type === 'object' ? 'i-heroicons-cube' :
        type === 'boolean' ? 'i-heroicons-check-circle' :
        type === 'number' ? 'i-heroicons-hashtag' :
        'i-heroicons-document-text'
}));

const parameterLocationOptions: SelectOption[] = parameterLocations.map(location => ({
  label: location.charAt(0).toUpperCase() + location.slice(1),
  value: location,
  icon: location === 'query' ? 'i-heroicons-question-mark-circle' :
        location === 'path' ? 'i-heroicons-arrow-right' :
        location === 'header' ? 'i-heroicons-code-bracket' :
        'i-heroicons-document'
}));

// Validation rules
const rules = {
  name: (value: string) => !!value || 'Endpoint name is required',
  path: (value: string) => !!value || 'Path is required',
  paramName: (value: string) => !!value || 'Parameter name is required'
};

const addParameter = () => {
  endpoint.value.parameters.push({
    name: '',
    in: 'query',
    type: 'string',
    required: true,
    description: ''
  });
};

const removeParameter = (index: number) => {
  endpoint.value.parameters.splice(index, 1);
};

const handleSave = () => {
  emit('save', endpoint.value);
};

// Method badge color mapping
const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'success';
    case 'POST': return 'info';
    case 'PUT': return 'warning';
    case 'DELETE': return 'error';
    default: return 'neutral';
  }
};
</script>

<template>
  <UModal :ui="{ content: 'min-w-[800px]' }">
    <UButton
      :icon="trigger.icon"
      :label="trigger.label"
      :color="trigger.color"
      :variant="trigger.variant"
    />

    <template #content>
      <UCard>
        <template #header>
          <div class="text-lg font-medium">Add Endpoint</div>
        </template>

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
                v-model="endpoint.name"
                placeholder="e.g., Get User Details"
              />
            </UFormField>

            <UFormField label="HTTP Method" name="method">
              <USelectMenu
                v-model="endpoint.method"
                :items="httpMethods"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField 
            label="Path" 
            name="path" 
            :validate="rules.path"
            required
            help="Use {paramName} for path parameters"
          >
            <UInput
              v-model="endpoint.path"
              placeholder="/users/{id}"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="endpoint.description"
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

            <div v-if="endpoint.parameters.length === 0" class="text-center py-8">
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
                v-for="(param, index) in endpoint.parameters"
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
                      <USelectMenu
                        v-model="(param.type as unknown as SelectOption)"
                        :items="parameterTypeOptions"
                        option-value="value"
                        :ui="{ 
                          base: 'w-full'
                        }"
                      />
                    </UFormField>

                    <UFormField label="Location" :name="`param-${index}-location`">
                      <USelectMenu
                        v-model="(param.in as unknown as SelectOption)"
                        :items="parameterLocationOptions"
                        option-value="value"
                        :ui="{ 
                          base: 'w-full'
                        }"
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
              @click="handleSave"
              label="Save Endpoint"
            />
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>