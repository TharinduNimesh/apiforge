<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { usePocketBase } from "~/lib/pocketbase";
import type { ApiEndpoint, ApiParameter } from "~/types/api";
import EndpointModal from "~/components/api/EndpointModal.vue";
import DeleteEndpointModal from "~/components/api/DeleteEndpointModal.vue";

definePageMeta({
  layout: "console",
  middleware: ["admin"],
});

const route = useRoute();
const apiId = route.params.id as string;
const pb = usePocketBase();
const loading = ref(true);
const toast = useToast();

const schema = z.object({
  name: z
    .string()
    .min(2, "API name must be at least 2 characters")
    .max(100, "API name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  type: z.enum(["FREE", "PAID"], {
    errorMap: () => ({ message: "Please select a valid API type" }),
  }),
  baseUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Base URL is required"),
  rateLimit: z
    .number()
    .int("Rate limit must be a whole number")
    .min(1, "Rate limit must be at least 1")
    .max(1000, "Rate limit must be less than 1000"),
  isActive: z.boolean(),
  endpoints: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
      path: z.string(),
      description: z.string().default(""),
      parameters: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          param_in: z.enum([
            "body",
            "header",
            "path",
            "query",
            "formData",
          ] as const),
          required: z.boolean(),
          description: z.string().default(""),
        })
      ),
      responses: z.array(z.any()).default([]),
      isNew: z.boolean().default(false).optional(),
    })
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: "",
  description: "",
  type: "FREE",
  baseUrl: "",
  rateLimit: 60,
  isActive: true,
  endpoints: [],
});

const typeItems = [
  { label: "FREE", value: "FREE" },
  { label: "PAID", value: "PAID" },
];

interface ApiData {
  name: string;
  description: string;
  baseUrl: string;
  isActive: boolean;
  type: "FREE" | "PAID";
  rateLimit: string;
  endpoints: Array<{
    id: string;
    name: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      param_in: "body" | "header" | "path" | "query" | "formData";
      required: boolean;
      description: string;
    }>;
  }>;
}

// Load API data using the API endpoint
onMounted(async () => {
  try {
    loading.value = true;

    // Fetch API details using the API endpoint
    const { data: apiData, error } = await useFetch<ApiData>(`/api/${apiId}`, {
      headers: {
        Authorization: `Bearer ${pb.authStore.token}`,
      },
    });

    if (error.value) {
      throw new Error(error.value.message);
    }

    if (!apiData.value) {
      throw new Error("Failed to load API details");
    }

    // Update state with API details
    state.name = apiData.value.name;
    state.description = apiData.value.description;
    state.baseUrl = apiData.value.baseUrl;
    state.isActive = apiData.value.isActive;
    state.type = apiData.value.type;
    state.rateLimit = parseInt(apiData.value.rateLimit);

    // Map endpoints with their parameters
    state.endpoints = apiData.value.endpoints.map((endpoint) => ({
      id: endpoint.id,
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      description: endpoint.description || "",
      parameters: endpoint.parameters.map((param) => ({
        name: param.name,
        type: param.type,
        param_in: param.param_in,
        required: param.required,
        description: param.description || "",
      })),
      responses: [],
    }));
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to load API details",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
});

const handleSaveEndpoint = (endpoint: ApiEndpoint) => {
  const index = state.endpoints?.findIndex((e) => e.id === endpoint.id);
  const endpointWithDefault = {
    ...endpoint,
    description: endpoint.description || "",
  };

  if (index !== undefined && index !== -1) {
    if (state.endpoints) state.endpoints[index] = endpointWithDefault;
  } else {
    if (!state.endpoints) state.endpoints = [];
    state.endpoints.push(endpointWithDefault);
  }
};

const handleDeleteEndpoint = (endpointId: string) => {
  if (state.endpoints) {
    state.endpoints = state.endpoints.filter((e) => e.id !== endpointId);
  }
};

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  showSaveConfirmation.value = true;
};

const showSaveConfirmation = ref(false);
const savingChanges = ref(false);

const getNewEndpointsCount = () => {
  return state.endpoints?.filter((e) => e.isNew).length || 0;
};

const handleSaveConfirmed = async () => {
  try {
    savingChanges.value = true;

    // Update API details
    await pb.collection("apis").update(apiId, {
      name: state.name,
      description: state.description,
      baseUrl: state.baseUrl,
      isActive: state.isActive,
      type: state.type,
      rateLimit: state.rateLimit.toString(),
    });

    // Handle endpoints
    for (const endpoint of state.endpoints) {
      // Create new endpoints
      if (endpoint.isNew) {
        const endpointData = {
          name: endpoint.name,
          description: endpoint.description,
          path: endpoint.path,
          method: endpoint.method,
          api: apiId,
        };

        const newEndpoint = await pb
          .collection("endpoints")
          .create(endpointData);

        // Create parameters for new endpoint
        for (const param of endpoint.parameters) {
          await pb.collection("parameters").create({
            name: param.name,
            description: param.description,
            type: param.type,
            param_in: param.param_in,
            required: param.required,
            endpoint: newEndpoint.id,
          });
        }
      }
      // Update existing endpoints
      else {
        await pb.collection("endpoints").update(endpoint.id, {
          name: endpoint.name,
          description: endpoint.description,
          path: endpoint.path,
          method: endpoint.method,
        });

        // Handle parameters updates if needed
        // Note: For simplicity, we're not handling parameter updates here
      }
    }

    toast.add({
      title: "Success",
      description: "API updated successfully",
      color: "success",
    });

    // Navigate back to API details page
    navigateTo(`/console/apis/${apiId}`);
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to update API",
      color: "error",
    });
  } finally {
    savingChanges.value = false;
    showSaveConfirmation.value = false;
  }
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center gap-4">
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-left"
          color="neutral"
          :to="`/console/apis/${route.params.id}`"
          class="rounded-full"
        />
        <h1 class="text-2xl font-semibold text-gray-900">Edit API</h1>
      </div>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="text-lg font-medium">Basic Information</div>
            </template>
            <div class="space-y-4">
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-1/2" />
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-10 w-1/3" />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="text-lg font-medium">Endpoints</div>
                <USkeleton class="h-9 w-24" />
              </div>
            </template>
            <div class="space-y-4">
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-32 w-full" />
            </div>
          </UCard>
        </div>
      </template>

      <!-- Actual form content -->
      <UForm
        v-else
        @submit="handleSubmit($event)"
        :validation-schema="schema"
        :state="state"
        class="space-y-6"
      >
        <!-- Basic Info Card -->
        <UCard>
          <template #header>
            <div class="text-lg font-medium">Basic Information</div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="API Name" name="name" required>
              <UInput v-model="state.name" placeholder="Enter API name" />
            </UFormField>

            <UFormField label="Type" name="type">
              <UTabs
                :content="false"
                :items="typeItems"
                v-model="state.type"
                color="neutral"
              />
            </UFormField>
          </div>

          <UFormField label="Base URL" name="baseUrl" required class="mt-4">
            <UInput
              v-model="state.baseUrl"
              placeholder="https://api.example.com"
            />
          </UFormField>

          <UFormField
            label="Description"
            name="description"
            required
            class="mt-4"
          >
            <UTextarea
              v-model="state.description"
              :rows="4"
              placeholder="Describe your API..."
            />
          </UFormField>

          <UFormField
            label="Rate Limit (requests per hour)"
            name="rateLimit"
            class="mt-4"
          >
            <UInput
              v-model="state.rateLimit"
              type="number"
              :min="1"
              :max="1000"
            />
          </UFormField>
        </UCard>

        <!-- Endpoints Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="text-lg font-medium">Endpoints</div>
              <EndpointModal @save="handleSaveEndpoint" />
            </div>
          </template>

          <div v-if="state.endpoints?.length === 0" class="text-center py-12">
            <UIcon
              name="i-heroicons-square-3-stack-3d"
              class="mx-auto h-12 w-12 text-gray-400"
            />
            <h3 class="mt-2 text-sm font-semibold text-gray-900">
              No endpoints
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              Start by adding an endpoint to your API
            </p>
            <div class="mt-6" v-if="state.endpoints?.length === 0">
              <EndpointModal @save="handleSaveEndpoint" />
            </div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="endpoint in state.endpoints"
              :key="endpoint.id"
              class="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-all duration-200"
            >
              <div class="p-4">
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="
                          endpoint.method === 'GET'
                            ? 'success'
                            : endpoint.method === 'POST'
                            ? 'info'
                            : endpoint.method === 'PUT'
                            ? 'warning'
                            : endpoint.method === 'DELETE'
                            ? 'error'
                            : 'neutral'
                        "
                        :label="endpoint.method"
                        variant="subtle"
                        class="font-mono"
                      />
                      <span class="font-medium text-gray-900">{{
                        endpoint.name
                      }}</span>
                      <UBadge
                        v-if="endpoint.isNew"
                        color="warning"
                        variant="subtle"
                        label="Not Saved"
                        size="sm"
                      />
                    </div>
                    <code class="text-sm text-primary-600 font-mono block">{{
                      endpoint.path
                    }}</code>
                    <p
                      v-if="endpoint.description"
                      class="text-sm text-gray-500 mt-1"
                    >
                      {{ endpoint.description }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2">
                    <EndpointModal
                      :endpoint="endpoint"
                      @save="handleSaveEndpoint"
                    />
                    <DeleteEndpointModal
                      v-if="!endpoint.isNew"
                      :endpoint="endpoint"
                      @delete="handleDeleteEndpoint"
                    />
                    <UButton
                      v-else
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      @click="handleDeleteEndpoint(endpoint.id!)"
                    />
                  </div>
                </div>

                <!-- Parameters -->
                <div
                  v-if="endpoint.parameters?.length"
                  class="mt-4 pt-4 border-t border-gray-100"
                >
                  <h4 class="text-xs font-medium text-gray-500 uppercase mb-3">
                    Parameters
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="param in endpoint.parameters"
                      :key="param.name"
                      class="flex items-center gap-4 py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm">{{
                            param.name
                          }}</span>
                          <UBadge
                            :color="param.required ? 'error' : 'neutral'"
                            :label="param.required ? 'Required' : 'Optional'"
                            variant="subtle"
                            size="xs"
                          />
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                          <UBadge
                            color="neutral"
                            :label="param.type"
                            variant="subtle"
                            size="xs"
                          />
                          <UBadge
                            color="neutral"
                            :label="param.param_in"
                            variant="subtle"
                            size="xs"
                          />
                        </div>
                      </div>
                      <p
                        v-if="param.description"
                        class="text-sm text-gray-500 flex-1"
                      >
                        {{ param.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-3">
          <UButton to="/console" color="neutral" variant="ghost">
            Cancel
          </UButton>
            <UModal v-model:open="showSaveConfirmation" :ui="{ content: 'min-w-[400px]' }">
              <UButton 
                type="submit" 
                label="Save Changes"
                color="primary"
              />

              <template #content>
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg font-medium">Confirm API Update</h3>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-x-mark"
                        class="-my-1"
                        @click="showSaveConfirmation = false"
                      />
                    </div>
                  </template>

                  <div class="space-y-4">
                    <!-- Warning Message -->
                    <div class="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                      <UIcon
                        name="i-heroicons-exclamation-triangle"
                        class="h-5 w-5 text-warning-500 flex-shrink-0"
                      />
                      <p class="text-sm text-warning-700">
                        This action cannot be undone. Please review the changes carefully.
                      </p>
                    </div>

                    <!-- API Details Summary -->
                    <div class="space-y-4">
                      <!-- Basic Details -->
                      <div class="rounded-lg border border-gray-100 p-4">
                        <h4 class="mb-3 text-sm font-medium text-gray-700">API Details</h4>
                        <dl class="space-y-2">
                          <div class="flex items-center justify-between">
                            <dt class="text-sm text-gray-600">Name</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ state.name }}</dd>
                          </div>
                          <div class="flex items-center justify-between">
                            <dt class="text-sm text-gray-600">Type</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ state.type }}</dd>
                          </div>
                          <div class="flex items-center justify-between">
                            <dt class="text-sm text-gray-600">Base URL</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ state.baseUrl }}</dd>
                          </div>
                        </dl>
                      </div>

                      <!-- New Endpoints Notice -->
                      <div v-if="getNewEndpointsCount() > 0" 
                        class="flex items-center gap-2 rounded-lg bg-primary-50 p-3">
                        <UIcon name="i-heroicons-information-circle" 
                          class="h-5 w-5 text-primary-500" />
                        <span class="text-sm text-primary-700">
                          {{ getNewEndpointsCount() }} new endpoint{{ getNewEndpointsCount() > 1 ? 's' : '' }} 
                          will be added
                        </span>
                      </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <UButton
                        label="Cancel"
                        color="neutral"
                        variant="ghost"
                        @click="showSaveConfirmation = false"
                        :disabled="savingChanges"
                      />
                      <UButton
                        label="Confirm & Save"
                        color="primary"
                        @click="handleSaveConfirmed"
                        :loading="savingChanges"
                        :disabled="savingChanges"
                      />
                    </div>
                  </div>
                </UCard>
              </template>
            </UModal>
        </div>
      </UForm>
    </div>
  </div>
</template>
