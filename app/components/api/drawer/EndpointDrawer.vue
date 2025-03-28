<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ApiEndpoint } from '~/types/api';
import EndpointDrawerHeader from './EndpointDrawerHeader.vue';
import EndpointDrawerResponse from './EndpointDrawerResponse.vue';
import EndpointDrawerRequest from './EndpointDrawerRequest.vue';

interface ModalState {
    modalState: {
        close: () => void;
    };
}

const props = defineProps<{
    endpoint: ApiEndpoint;
    api: any;
    isDraft?: boolean;
}>();

const requestRef = ref();
const requestData = ref({});
const response = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const currentTab = ref('request'); // Set request as default tab

// Reset state when drawer opens
watch(() => requestData.value, (newValue) => {
    response.value = null;
    error.value = null;
    currentTab.value = 'request';
}, { deep: true });

const sendRequest = async () => {
    loading.value = true;
    error.value = null;
    response.value = null;

    try {
        // Mock response based on endpoint method and request data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (props.endpoint.method === 'GET') {
            response.value = {
                status: 200,
                data: {
                    success: true,
                    data: requestData.value,
                    timestamp: new Date().toISOString()
                }
            };
        } else if (props.endpoint.method === 'POST') {
            response.value = {
                status: 201,
                data: {
                    id: Math.floor(Math.random() * 1000),
                    ...requestData.value,
                    createdAt: new Date().toISOString()
                }
            };
        } else if (props.endpoint.method === 'PUT') {
            response.value = {
                status: 200,
                data: {
                    ...requestData.value,
                    updatedAt: new Date().toISOString()
                }
            };
        } else if (props.endpoint.method === 'DELETE') {
            response.value = {
                status: 204,
                data: null
            };
        }
        
        currentTab.value = 'response';
    } catch (err: any) {
        error.value = err.message || 'An error occurred';
    } finally {
        loading.value = false;
    }
};

const handleResponse = (data: any) => {
    response.value = data;
    if (data && !error.value) {
        currentTab.value = 'response';
    }
};

const handleError = (err: string | null) => {
    error.value = err;
};

const handleLoading = (isLoading: boolean) => {
    loading.value = isLoading;
};

const handleSendRequest = async () => {
    if (loading.value) return;
    
    // Reset state
    response.value = null;
    error.value = null;
    
    if (requestRef.value) {
        await requestRef.value.submitRequest();
    }
};
</script>

<template>
    <UDrawer direction="right">
        <!-- Drawer trigger button -->
        <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-code-bracket"
            size="sm"
        />

        <template #content>
            <div class="!w-full md:!w-[700px] lg:!w-[900px] flex flex-col h-full">
                <!-- Header -->
                <EndpointDrawerHeader :endpoint="endpoint" :loading="loading" @send="handleSendRequest" />

                <!-- Main Content -->
                <div class="flex-1 min-h-0 border-y border-gray-100">
                    <UTabs
                        v-model="currentTab"
                        :items="[
                            { label: 'Request', slot: 'request', value: 'request' },
                            { label: 'Response', slot: 'response', value: 'response' }
                        ]"
                        class="h-full flex flex-col"
                        :ui="{
                            list: 'bg-gray-100 px-2 py-2 w-full h-auto flex-none',
                            root: 'flex-1 min-h-0',
                           
                            content: 'h-full'
                        }"
                    >
                        <template #request>
                            <EndpointDrawerRequest
                                ref="requestRef"
                                :endpoint="endpoint"
                                @update:data="requestData = $event"
                                @response="handleResponse"
                                @error="handleError"
                                @loading="handleLoading"
                            />
                        </template>
                        <template #response>
                            <EndpointDrawerResponse
                                :response="response"
                                :error="error"
                                :loading="loading"
                            />
                        </template>
                    </UTabs>
                </div>

                <!-- Footer -->
                <div class="border-t border-gray-100 bg-white/80 backdrop-blur-sm shrink-0 px-6 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                        <UIcon name="i-heroicons-clock" />
                        <span>HTTP API</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <UButton
                            color="primary"
                            label="Send Request"
                            icon="i-heroicons-paper-airplane"
                            :loading="loading"
                            @click="handleSendRequest"
                        />
                    </div>
                </div>
            </div>
        </template>
    </UDrawer>
</template>