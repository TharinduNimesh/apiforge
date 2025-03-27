<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  response: any;
  error: string | null;
  loading: boolean;
}>();

const isExpanded = ref(false);
const copySuccess = ref(false);

const responseData = computed(() => {
  if (!props.response) return null;
  return props.response.data || null;
});

const copyToClipboard = async () => {
  if (props.response) {
    await navigator.clipboard.writeText(JSON.stringify(responseData.value, null, 2));
    copySuccess.value = true;
    setTimeout(() => copySuccess.value = false, 2000);
  }
};

// Status tag properties
const statusTag = computed(() => {
  if (!props.response?.statusCode) return { label: 'Unknown', color: 'neutral' };
  
  const status = props.response.statusCode;
  if (status >= 200 && status < 300) {
    return { label: 'Success', color: 'success' };
  } else if (status >= 400 && status < 500) {
    return { label: 'Client Error', color: 'warning' };
  } else if (status >= 500) {
    return { label: 'Server Error', color: 'error' };
  }
  return { label: 'Unknown', color: 'neutral' };
});

// Error handling
const errorDetails = computed(() => {
  if (!props.error && !props.response) return null;

  const status = props.response?.status;
  let type = 'error';
  let message = props.error;
  let color = 'error';

  if (status) {
    if (status === 429) {
      type = 'Rate Limit';
      message = 'Too many requests. Please try again later.';
      color = 'warning';
    } else if (status === 403) {
      type = 'Forbidden';
      message = 'You do not have permission to access this API.';
      color = 'warning';
    } else if (status === 401) {
      type = 'Unauthorized';
      message = 'Please authenticate to access this API.';
      color = 'warning';
    } else if (status >= 500) {
      type = 'Server Error';
      message = 'An internal server error occurred.';
      color = 'error';
    } else if (status >= 400) {
      type = 'Client Error';
      message = props.response?.data?.message || 'Invalid request parameters.';
      color = 'warning';
    }
  }

  return { type, message, color };
});
</script>

<template>
  <div class="h-full overflow-auto">
    <div class="p-6 space-y-6">
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
          :description="errorDetails.message || undefined"
          :color="(errorDetails.color as any) || undefined"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
        />

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
          <UCard>
            <div
              :class="{ 'max-h-[300px] overflow-hidden': !isExpanded }"
              class="relative"
            >
              <pre><code class="text-sm text-gray-700 font-mono whitespace-pre-wrap">{{ JSON.stringify(responseData, null, 2) }}</code></pre>
              
              <!-- Fade Overlay -->
              <div
                v-if="!isExpanded && !loading"
                class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"
              />
            </div>

            <!-- Expand Button -->
            <div v-if="!loading" class="absolute bottom-4 left-0 right-0 flex justify-center">
              <UButton
                :label="isExpanded ? 'Show Less' : 'Show More'"
                :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                color="neutral"
                variant="ghost"
                @click="isExpanded = !isExpanded"
              />
            </div>
          </UCard>
        </div>
      </template>
    </div>
  </div>
</template>