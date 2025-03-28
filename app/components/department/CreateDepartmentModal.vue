<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ApiOption } from "~/types/api";
import type { TableColumn } from "#ui/types";
import { usePocketBase } from "~/lib/pocketbase";

interface ApiAssignment {
  apiId: string;
  rateLimit: number;
}

interface AssignedApi extends ApiAssignment {
  name: string;
  type: "FREE" | "PAID";
  endpoint?: string;
  description?: string;
}

interface DepartmentForm {
  name: string;
  description: string;
  apiAssignments: ApiAssignment[];
}

const props = defineProps<{
  apis: ApiOption[];
}>();

const emit = defineEmits<{
  (e: "submit", form: DepartmentForm): void;
  (e: "close"): void;
}>();

const form = ref<DepartmentForm>({
  name: "",
  description: "",
  apiAssignments: [],
});

// For the new API selection
const selectedApiId = ref<string>("");
const rateLimit = ref<number>(100);

const apis = ref<ApiOption[]>([]);
const loading = ref(true);
const pb = usePocketBase();
const isLoading = ref(false);

// Add fetch function that runs only on client side
const fetchApis = async () => {
  try {
    loading.value = true;
    const records = await pb.collection("api_details").getFullList({
      sort: "-createdAt",
    });

    // Transform records to match ApiOption interface
    apis.value = records.map((record) => ({
      id: record.id,
      name: record.name as string,
      description: record.description as string,
      type: record.type as "FREE" | "PAID",
      status: record.status ? "ACTIVE" : "INACTIVE",
      endpoint: record.endpoint as string,
      rateLimit: record.rateLimit as number,
    }));
  } catch (error: any) {
    console.error("Error fetching APIs:", error);
    useToast().add({
      title: "Error",
      description: "Failed to load APIs. Please try again later.",
      color: "error",
    });
    apis.value = []; // Reset APIs on error
  } finally {
    loading.value = false;
  }
};

// Only fetch APIs on client side to avoid hydration mismatches
onMounted(() => {
  fetchApis();
});

const availableApis = computed(() => {
  return apis.value.filter(
    (api) =>
      !form.value.apiAssignments.some(
        (assignment) => assignment.apiId === api.id
      ) && api.status === "ACTIVE"
  );
});

const selectedApiDetails = computed(() => {
  return apis.value.find((api) => api.id === selectedApiId.value);
});

const assignedApis = computed<AssignedApi[]>(() => {
  return form.value.apiAssignments.map((assignment) => {
    const apiDetails = apis.value.find((api) => api.id === assignment.apiId);
    return {
      ...assignment,
      name: apiDetails?.name || "Unknown API",
      type: apiDetails?.type || "FREE",
      endpoint: apiDetails?.endpoint || "",
      description: apiDetails?.description || "",
    };
  });
});

const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    apiAssignments: [],
  };
  selectedApiId.value = "";
  rateLimit.value = 100;
};

const addApiAssignment = () => {
  if (!selectedApiDetails.value) return;

  form.value.apiAssignments.push({
    apiId: selectedApiDetails.value.id,
    rateLimit: rateLimit.value,
  });

  selectedApiId.value = "";
  rateLimit.value = 100;
};

const removeApiAssignment = (index: number) => {
  form.value.apiAssignments.splice(index, 1);
};

const handleClose = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;

    // Create department first
    const departmentData = {
      name: form.value.name,
      description: form.value.description,
      is_active: true,
    };

    const department = await pb
      .collection("departments")
      .create(departmentData);

    // Create API assignments for the department one by one to avoid cancellation
    for (const assignment of form.value.apiAssignments) {
      const assignmentData = {
        department_id: department.id,
        api_id: assignment.apiId,
        rate_limit: assignment.rateLimit,
      };
      await pb.collection("department_apis").create(assignmentData);
    }

    useToast().add({
      title: "Success",
      description: "Department created successfully",
      color: "success",
    });

    emit("submit", form.value);
    resetForm();
    emit("close");
  } catch (error: any) {
    console.error("Error creating department:", error);
    useToast().add({
      title: "Error",
      description: error?.message || "Failed to create department",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const isSubmitDisabled = computed(() => {
  return (
    form.value.name.trim() === "" ||
    form.value.apiAssignments.length === 0 ||
    isLoading.value
  );
});

const getApiTypeBadge = (type: "FREE" | "PAID") => {
  const color = type === "PAID" ? "warning" : "success";
  return {
    label: type === "PAID" ? "Premium" : "Free",
    color: color as "warning" | "success",
  };
};
</script>

<template>
  <UModal :ui="{ content: 'min-w-[600px]' }">
    <UButton
      icon="i-heroicons-plus"
      label="Create Department"
      color="primary"
    />

    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Create New Department</h2>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="handleClose"
            />
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Department Name -->
          <UFormField label="Department Name" required>
            <UInput
              v-model="form.name"
              placeholder="Enter department name"
              size="lg"
              required
            />
          </UFormField>

          <!-- Description -->
          <UFormField label="Description" required>
            <UTextarea
              v-model="form.description"
              placeholder="Enter department description"
              :rows="3"
              required
            />
          </UFormField>

          <!-- API Assignments Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-link" class="text-lg" />
              <h3 class="font-semibold">API Assignments</h3>
            </div>

            <!-- API Selection Form -->
            <div class="space-y-4">
              <UFormField label="Select API">
                <div v-if="loading" class="w-full">
                  <USkeleton class="h-10 w-full" />
                </div>
                <USelectMenu
                  v-else
                  v-model="selectedApiId"
                  :items="availableApis"
                  value-key="id"
                  label-key="name"
                  placeholder="Choose an API to assign"
                  class="w-full"
                >
                  <template #item="{ item }">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="getApiTypeBadge(item.type).color"
                        :label="getApiTypeBadge(item.type).label"
                        variant="subtle"
                        size="sm"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium">{{ item.name }}</div>
                        <div class="text-xs text-gray-500 truncate">
                          {{ item.description }}
                        </div>
                      </div>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <div class="flex gap-2 items-end">
                <div class="flex-1">
                  <UFormField label="Rate Limit">
                    <UButtonGroup class="w-full">
                      <UInput
                        v-model="rateLimit"
                        :min="1"
                        placeholder="100"
                        color="neutral"
                        variant="outline"
                      >
                        <template #trailing>/hour</template>
                      </UInput>
                      <UButton
                        color="primary"
                        :disabled="!selectedApiId"
                        @click="addApiAssignment"
                        icon="i-heroicons-plus"
                      />
                    </UButtonGroup>
                  </UFormField>
                </div>
              </div>
            </div>

            <!-- Assigned APIs Table -->
            <div class="mt-4">
              <UAlert
                v-if="availableApis.length === 0"
                color="info"
                title="All available APIs have been assigned."
                icon="i-heroicons-information-circle"
              />

              <div
                v-if="assignedApis.length === 0"
                class="text-center py-8 border border-gray-100 border-dashed rounded-lg"
              >
                <UIcon
                  name="i-heroicons-link-slash"
                  class="mx-auto mb-2 h-8 w-8 text-gray-400"
                />
                <div class="text-gray-500">No APIs assigned yet</div>
                <div class="text-sm text-gray-400">
                  Select an API and specify rate limit to assign it
                </div>
              </div>

              <div
                v-else
                class="border border-gray-100 rounded-lg divide-y divide-gray-100"
              >
                <div
                  v-for="(api, index) in assignedApis"
                  :key="api.apiId"
                  class="p-4"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2 min-w-0">
                      <UBadge
                        :color="getApiTypeBadge(api.type).color"
                        :label="getApiTypeBadge(api.type).label"
                        variant="subtle"
                        size="sm"
                      />
                      <div class="min-w-0">
                        <div class="font-medium truncate">{{ api.name }}</div>
                        <div class="text-sm text-gray-500 truncate">
                          {{ api.description }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="w-32">
                        <UInput v-model="api.rateLimit">
                          <template #trailing>/hour</template>
                        </UInput>
                      </div>

                      <UButton
                        color="error"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="sm"
                        @click="removeApiAssignment(index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="handleClose"
            />
            <UButton
              type="submit"
              color="primary"
              label="Create Department"
              :disabled="isSubmitDisabled"
            />
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
