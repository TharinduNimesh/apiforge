<script setup lang="ts">
import { ref, computed } from "vue";
import ShikiHighlight from "~/components/ShikiHighlight.vue";

const props = defineProps<{
  response: any;
  error: string | null;
  loading: boolean;
}>();

const isExpanded = ref(false);
const copySuccess = ref(false);
const maxHeight = ref(300);

const responseData = computed(() => {
  if (!props.response) return null;
  return props.response.data || null;
});

const formattedResponse = computed(() => {
  if (!responseData.value) return "";
  return JSON.stringify(responseData.value, null, 2);
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const copyToClipboard = async () => {
  if (props.response) {
    await navigator.clipboard.writeText(formattedResponse.value);
    copySuccess.value = true;
    setTimeout(() => (copySuccess.value = false), 2000);
  }
};

// Status tag properties
const statusTag = computed(() => {
  if (!props.response?.statusCode)
    return { label: "Unknown", color: "neutral" };

  const status = props.response.statusCode;
  if (status >= 200 && status < 300) {
    return { label: "Success", color: "success" };
  } else if (status >= 400 && status < 500) {
    return { label: "Client Error", color: "warning" };
  } else if (status >= 500) {
    return { label: "Server Error", color: "error" };
  }
  return { label: "Unknown", color: "neutral" };
});

// Error handling
const errorDetails = computed(() => {
  if (!props.error && !props.response) return null;
  if (!props.error && props.response?.statusCode >= 200 && props.response?.statusCode < 300) return null;

  const status = props.response?.statusCode;
  let type = props.response?.data?.error || 'Error';
  let message = props.response?.data?.message || props.error;
  let details = props.response?.data?.details;
  let color: 'warning' | 'error' = 'error';

  if (status) {
    if (status === 429) {
      color = 'warning';
    } else if (status === 403) {
      color = 'warning';
    } else if (status === 401) {
      color = 'warning';
    } else if (status >= 500) {
      color = 'error';
    } else if (status >= 400) {
      color = 'warning';
    }
  }

  return message ? { type, message, details, color } : null;
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 p-6 space-y-6 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-gray-300 mb-4 animate-spin" />
        <p class="text-gray-500">Processing request...</p>
      </div>

      <!-- Initial State -->
      <div v-else-if="!response && !error" class="text-center py-12">
        <UIcon name="i-heroicons-paper-airplane" class="w-12 h-12 text-gray-300 mb-4" />
        <p class="text-gray-500">Send a request to see the response</p>
      </div>

      <template v-else>
        <!-- Error Alert -->
        <UAlert
          v-if="errorDetails"
          :title="errorDetails.type"
          :color="(errorDetails.color as any) || undefined"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
        >
          <template #description>
            <p>{{ errorDetails.message }}</p>
            <p v-if="errorDetails.details" class="mt-2 text-sm opacity-75">
              {{ errorDetails.details }}
            </p>
          </template>
        </UAlert>

        <!-- Response Section -->
        <div v-if="responseData" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge
                :color="(statusTag.color as any)"
                :label="statusTag.label"
                variant="subtle"
              />
              <span v-if="response.statusCode" class="text-sm text-gray-600">
                Status: {{ response.statusCode }}
              </span>
            </div>
            <UButton
              icon="i-heroicons-clipboard"
              color="neutral"
              variant="ghost"
              class="rounded-full"
              :class="{ '!text-success-500': copySuccess }"
              @click="copyToClipboard"
            />
          </div>

          <!-- Response Body -->
          <div class="relative bg-gray-50 rounded-lg overflow-hidden">
            <div
              class="relative"
              :style="{
                maxHeight: isExpanded ? 'none' : '300px',
                overflow: isExpanded ? 'visible' : 'hidden'
              }"
            >
              <div class="overflow-auto">
                <ClientOnly>
                  <ShikiHighlight
                    lang="json"
                    class="text-sm font-mono"
                    :code="formattedResponse"
                  />
                </ClientOnly>
              </div>
              
              <!-- Fade Overlay -->
              <div
                v-if="!isExpanded && formattedResponse.length > 500"
                class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"
              />
            </div>

            <!-- Expand Button -->
            <div
              v-if="formattedResponse.length > 500"
              class="flex justify-center py-4 bg-gray-50 border-t border-gray-100"
            >
              <UButton
                :label="isExpanded ? 'Show Less' : 'Show More'"
                :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                color="primary"
                variant="soft"
                @click="toggleExpand"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style>
.shiki-highlight {
  background-color: rgb(249 250 251 / 0.5);
  backdrop-filter: blur(4px);
}

.shiki {
  background: transparent !important;
}
</style>
