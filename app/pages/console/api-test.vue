<script setup lang="ts">
import { usePocketBase } from '~/lib/pocketbase';

const pb = usePocketBase();
const result = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const apiId = ref('');
const singleApiLoading = ref(false);
const singleApiError = ref<string | null>(null);
const singleApiResult = ref<any>(null);

async function fetchApis() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('/api/', {
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    result.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function fetchSingleApi() {
  if (!apiId.value) {
    singleApiError.value = 'Please enter an API ID';
    return;
  }

  singleApiLoading.value = true;
  singleApiError.value = null;
  try {
    const response = await fetch(`/api/${apiId.value}`, {
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    singleApiResult.value = await response.json();
  } catch (e: any) {
    singleApiError.value = e.message;
  } finally {
    singleApiLoading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto py-10">
    <UContainer>
      <div class="space-y-8">
        <!-- List APIs Test -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Test List APIs Endpoint</h2>
          <div>
            <UButton 
              label="Fetch APIs" 
              :loading="loading"
              @click="fetchApis" 
            />

            <div class="mt-4">
              <div v-if="error" class="text-red-500">
                {{ error }}
              </div>
              
              <div v-else-if="loading" class="text-gray-500">
                Loading...
              </div>
              
              <pre v-else-if="result" class="mt-4 p-4 bg-gray-100 rounded overflow-auto">
                {{ JSON.stringify(result, null, 2) }}
              </pre>
            </div>
          </div>
        </div>

        <!-- Single API Test -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Test Single API Endpoint</h2>
          <div class="space-y-4">
            <UFormField label="API ID">
              <UInput v-model="apiId" placeholder="Enter API ID" />
            </UFormField>

            <div>
              <UButton 
                label="Fetch Single API" 
                :loading="singleApiLoading"
                @click="fetchSingleApi"
                :disabled="!apiId" 
              />
            </div>

            <div>
              <div v-if="singleApiError" class="text-red-500">
                {{ singleApiError }}
              </div>
              
              <div v-else-if="singleApiLoading" class="text-gray-500">
                Loading...
              </div>
              
              <pre v-else-if="singleApiResult" class="mt-4 p-4 bg-gray-100 rounded overflow-auto">
                {{ JSON.stringify(singleApiResult, null, 2) }}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>