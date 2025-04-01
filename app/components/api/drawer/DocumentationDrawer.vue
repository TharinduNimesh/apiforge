<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '#ui/types';
import type { ApiEndpoint, ApiParameter } from '~/types/api';
import ShikiHighlight from "~/components/ShikiHighlight.vue";

const UBadge = resolveComponent('UBadge');

const props = defineProps<{
    endpoint: ApiEndpoint;
}>();

// Add missing ref
const selectedExampleType = ref<'curl' | 'fetch'>('curl');

const baseUrl = useRuntimeConfig().public.appUrl;
const endpointUrl = computed(() => `${baseUrl}/api/call-endpoint/${props.endpoint.id}`);

const getDefaultValue = (param: ApiParameter): string => {
    switch (param.type) {
        case 'string':
            return `"example-${param.name}"`;
        case 'number':
            return '123';
        case 'boolean':
            return 'true';
        case 'array':
            return '["item1", "item2"]';
        case 'object':
            return '{"key": "value"}';
        case 'file':
            return '@/path/to/file.jpg';
        default:
            return `"${param.name}"`;
    }
};

const exampleRequestUrl = computed(() => {
    return endpointUrl.value;
});

const copyEndpointUrl = async () => {
    try {
        await copyToClipboard(endpointUrl.value);
        useToast().add({
            title: 'Success',
            description: 'URL copied to clipboard',
            color: 'success',
            icon: 'i-heroicons-clipboard-document-check'
        });
    } catch (error) {
        useToast().add({
            title: 'Error',
            description: 'Failed to copy URL',
            color: 'error'
        });
    }
};

// Fix parametersByLocation type safety
const parametersByLocation = computed(() => {
    const grouped = {
        path: [] as ApiParameter[],
        query: [] as ApiParameter[],
        header: [] as ApiParameter[],
        body: [] as ApiParameter[],
        formData: [] as ApiParameter[]
    };
    
    props.endpoint.parameters?.forEach(param => {
        if (param.param_in) {
            const key = param.param_in as keyof typeof grouped;
            if (key in grouped) {
                grouped[key].push(param);
            }
        }
    });
    
    return grouped;
});

const transformParameters = (parameters: ApiParameter[] = []) => {
    return parameters.map(param => ({
        name: param.name,
        type: param.type,
        description: param.description,
        required: param.required
    }));
};

const pathParameters = computed(() => transformParameters(parametersByLocation.value.path));
const queryParameters = computed(() => transformParameters(parametersByLocation.value.query));
const bodyParameters = computed(() => transformParameters(parametersByLocation.value.body));
const headerParameters = computed(() => transformParameters(parametersByLocation.value.header));
const formDataParameters = computed(() => transformParameters(parametersByLocation.value.formData));

const columns: TableColumn<ReturnType<typeof transformParameters>[0]>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-2' }, [
                h('span', { class: 'font-medium' }, row.getValue('name')),
                row.original.required && h(UBadge, {
                    color: 'error',
                    variant: 'subtle',
                    size: 'sm',
                    class: 'uppercase text-[11px] font-medium'
                }, () => 'Required')
            ])
        }
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => h(UBadge, {
            color: 'neutral',
            variant: 'subtle',
            size: 'sm',
            class: 'font-mono uppercase text-[11px] font-medium'
        }, () => row.getValue('type'))
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => h('div', { class: 'text-sm text-gray-600' }, row.getValue('description'))
    }
];

// Type-safe clipboard operations with success notification
const copyToClipboard = async (text: string) => {
    try {
        await window.navigator.clipboard.writeText(text);
        // Show success notification
        useToast().add({
            title: 'Copied to clipboard',
            color: 'success',
            icon: 'i-heroicons-clipboard-document-check',
            duration: 2000
        });
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        useToast().add({
            title: 'Failed to copy',
            description: 'Could not access clipboard',
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle',
            duration: 3000
        });
    }
};

// Update examplePath to handle undefined safely
const examplePath = computed(() => {
    let path = props.endpoint.path;
    
    // Replace path parameters with example values
    parametersByLocation.value.path?.forEach(param => {
        const placeholder = `{${param.name}}`;
        if (path.includes(placeholder)) {
            path = path.replace(placeholder, getDefaultValue(param).replace(/"/g, ''));
        }
    });
    
    return path;
});

// Update queryString to handle undefined safely
const queryString = computed(() => {
    const queryParams = parametersByLocation.value.query;
    if (!queryParams?.length) return '';
    
    const params = queryParams
        .map(param => `${param.name}=${encodeURIComponent(getDefaultValue(param).replace(/"/g, ''))}`)
        .join('&');
    
    return `?${params}`;
});

// Update exampleRequestBody to only include parameters that actually exist for this endpoint
const exampleRequestBody = computed(() => {
    const bodyObj: Record<string, any> = {};
    let hasParameters = false;
    
    // Add path parameters if they exist
    if (parametersByLocation.value.path?.length) {
        parametersByLocation.value.path.forEach(param => {
            bodyObj[param.name] = generateExampleValue(param);
            hasParameters = true;
        });
    }
    
    // Add query parameters if they exist
    if (parametersByLocation.value.query?.length) {
        parametersByLocation.value.query.forEach(param => {
            bodyObj[param.name] = generateExampleValue(param);
            hasParameters = true;
        });
    }
    
    // Add header parameters if they exist
    if (parametersByLocation.value.header?.length) {
        parametersByLocation.value.header.forEach(param => {
            bodyObj[param.name] = generateExampleValue(param);
            hasParameters = true;
        });
    }
    
    // Add body parameters if they exist
    if (parametersByLocation.value.body?.length) {
        parametersByLocation.value.body.forEach(param => {
            bodyObj[param.name] = generateExampleValue(param);
            hasParameters = true;
        });
    }
    
    // Add form data parameters (non-file) if they exist
    if (parametersByLocation.value.formData?.length) {
        parametersByLocation.value.formData.forEach(param => {
            if (param.type !== 'file') {
                bodyObj[param.name] = generateExampleValue(param);
                hasParameters = true;
            } else {
                // For file parameters, we show a placeholder
                bodyObj[param.name] = `[File content for ${param.name}]`;
                hasParameters = true;
            }
        });
    }
    
    return hasParameters ? bodyObj : null;
});

// Helper function to generate example values based on parameter type
const generateExampleValue = (param: ApiParameter): any => {
    switch (param.type) {
        case 'string':
            return `example-${param.name}`;
        case 'number':
            return 123;
        case 'boolean':
            return true;
        case 'array':
            return ['item1', 'item2'];
        case 'object':
            return { key: 'value' };
        default:
            return `example-${param.name}`;
    }
};

// Update exampleFormData to handle undefined safely
const exampleFormData = computed(() => {
    const formDataParams = parametersByLocation.value.formData;
    if (!formDataParams?.length) return null;
    
    return formDataParams.map(param => {
        if (param.type === 'file') {
            return `-F "${param.name}=@file.${param.fileConfig?.accept?.[0]?.split('/')[1] || 'jpg'}"`;
        }
        return `-F "${param.name}=${getDefaultValue(param)}"`;
    }).join(' \\\n');
});

// Update contentTypeHeader to handle undefined safely and always provide content type for JSON
const contentTypeHeader = computed(() => {
    if (parametersByLocation.value.formData?.length) {
        return 'multipart/form-data';
    } else if (parametersByLocation.value.body?.length) {
        return 'application/json';
    }
    // Always return application/json as default for proper API functionality
    return 'application/json';
});

// Update curlExample to be cleaner and only include body when parameters exist
const curlExample = computed(() => {
    let command = `curl --request POST`;
    command += ` \\\n  --url "${exampleRequestUrl.value}"`;
    
    // Always include authentication header
    command += ' \\\n  --header "Authorization: Bearer YOUR_API_KEY"';
    
    // Only include Content-Type when we have parameters
    const hasParameters = exampleRequestBody.value || exampleFormData.value;
    if (hasParameters) {
        command += ` \\\n  --header "Content-Type: ${contentTypeHeader.value}"`;
    }
    
    // For form data
    if (exampleFormData.value) {
        command += ` \\\n  ${exampleFormData.value}`;
    } 
    // For JSON body - only include if we have parameters
    else if (exampleRequestBody.value) {
        command += ` \\\n  --data '${JSON.stringify(exampleRequestBody.value, null, 2)}'`;
    }
    
    return command;
});

// Update fetchExample to be cleaner and only include data when needed
const fetchExample = computed(() => {
    let code = 'const response = await fetch';
    code += `(\n  "${exampleRequestUrl.value}",\n  {\n`;
    code += '    method: "POST",\n';
    code += '    headers: {\n';
    code += '      "Authorization": "Bearer YOUR_API_KEY"';
    
    // Only include Content-Type when we have parameters
    const hasParameters = exampleRequestBody.value || (parametersByLocation.value.formData?.length > 0);
    if (hasParameters) {
        code += `,\n      "Content-Type": "${contentTypeHeader.value}"`;
    }
    
    code += '\n    }';

    // Handle form data
    if (parametersByLocation.value.formData?.length) {
        code += ',\n    body: (() => {\n';
        code += '      const formData = new FormData();\n';
        
        // Add form data parameters
        parametersByLocation.value.formData.forEach(param => {
            if (param.type === 'file') {
                code += `      // Add your file to formData\n`;
                code += `      formData.append("${param.name}", fileInput.files[0]);\n`;
            } else {
                code += `      formData.append("${param.name}", ${JSON.stringify(generateExampleValue(param))});\n`;
            }
        });
        
        // Add other parameters
        const otherParams = [
            ...(parametersByLocation.value.path || []),
            ...(parametersByLocation.value.query || []),
            ...(parametersByLocation.value.header || []),
            ...(parametersByLocation.value.body || [])
        ];
        
        if (otherParams.length > 0) {
            code += '\n      // Add additional parameters\n';
            otherParams.forEach(param => {
                code += `      formData.append("${param.name}", ${JSON.stringify(generateExampleValue(param))});\n`;
            });
        }
        
        code += '      return formData;\n';
        code += '    })()';
    }
    // Handle JSON body
    else if (exampleRequestBody.value) {
        code += ',\n    body: JSON.stringify(';
        code += JSON.stringify(exampleRequestBody.value, null, 6);
        code += ')';
    }
    
    code += '\n  }\n);\n\n';
    code += 'const data = await response.json();';
    
    return code;
});

</script>

<template>
    <UDrawer direction="right">
        <!-- Drawer trigger button -->
        <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-document-text"
            size="sm"
        />

        <template #content>
            <div class="!w-full md:!w-[700px] lg:!w-[900px] flex flex-col h-full">
                <!-- Header -->
                <div class="border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6 py-4">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="text-primary-500" />
                        <span class="text-lg font-medium">API Documentation</span>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="flex-1 min-h-0 p-6 space-y-8 overflow-y-auto">
                    <!-- Endpoint Overview -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <h3 class="text-xl font-semibold">{{ endpoint.name }}</h3>
                            <UBadge
                                :color="endpoint.method === 'GET' ? 'success' : 
                                       endpoint.method === 'POST' ? 'info' : 
                                       endpoint.method === 'PUT' ? 'warning' : 
                                       endpoint.method === 'DELETE' ? 'error' : 'neutral'"
                                variant="subtle"
                                size="md"
                                class="uppercase font-mono font-medium"
                            >
                                {{ endpoint.method }}
                            </UBadge>
                        </div>
                        <p class="text-gray-600 text-base">{{ endpoint.description }}</p>
                    </div>

                    <!-- Base URL Section -->
                    <div class="space-y-3">
                        <h3 class="text-base font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-link" class="text-primary-500" />
                            Endpoint URL
                        </h3>
                        <div class="flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
                            <UInput
                                :model-value="endpointUrl"
                                readonly
                                class="font-mono text-sm bg-white"
                                :ui="{
                                    root: 'relative flex-1',
                                    base: 'relative block w-full rounded-lg ps-3 pe-3 shadow-sm bg-white'
                                }"
                            />
                            <UButton
                                color="primary"
                                variant="soft"
                                icon="i-heroicons-clipboard"
                                @click="copyEndpointUrl"
                            />
                        </div>
                    </div>

                    <!-- Authentication Section -->
                    <div class="space-y-4">
                        <h3 class="text-base font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-key" class="text-primary-500" />
                            Authentication
                        </h3>
                        <div class="prose prose-sm max-w-none">
                            <p class="text-gray-600 text-base">This endpoint requires authentication using a Bearer token.</p>
                            
                            <div class="bg-gray-50 p-4 rounded-lg mt-3 font-mono text-sm border border-gray-200">
                                <p class="text-gray-700">Authorization: Bearer YOUR_API_KEY</p>
                            </div>

                            <div class="bg-primary-50 border border-primary-100 rounded-lg p-4 mt-4">
                                <div class="flex items-start gap-3">
                                    <UIcon name="i-heroicons-information-circle" class="text-primary-500 flex-shrink-0 mt-1" />
                                    <div class="space-y-2">
                                        <p class="text-gray-600 text-sm">
                                            <strong>Important:</strong> All API calls must be made using POST method to the /api/call-endpoint/{id} endpoint, regardless of the endpoint's defined HTTP method.
                                        </p>
                                        <p class="text-gray-600 text-sm">
                                            You can generate API keys from your 
                                            <NuxtLink 
                                                to="/console/profile" 
                                                class="text-primary-600 hover:text-primary-500 font-medium"
                                            >
                                                profile settings
                                            </NuxtLink>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Parameters Section -->
                    <div v-if="endpoint.parameters?.length" class="space-y-4">
                        <h3 class="text-base font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-adjustments-horizontal" class="text-primary-500" />
                            Parameters
                        </h3>
                        
                        <!-- Path Parameters -->
                        <div v-if="pathParameters.length" class="space-y-3">
                            <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UBadge color="info" size="sm" variant="subtle">Path</UBadge>
                                Path Parameters
                            </h4>
                            <UCard class="border-gray-200">
                                <UTable :columns="columns" :data="pathParameters" hover class="flex-1" />
                            </UCard>
                        </div>

                        <!-- Query Parameters -->
                        <div v-if="queryParameters.length" class="space-y-3">
                            <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UBadge color="info" size="sm" variant="subtle">Query</UBadge>
                                Query Parameters
                            </h4>
                            <UCard class="border-gray-200">
                                <UTable :columns="columns" :data="queryParameters" hover class="flex-1" />
                            </UCard>
                        </div>

                        <!-- Body Parameters -->
                        <div v-if="bodyParameters.length" class="space-y-3">
                            <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UBadge color="info" size="sm" variant="subtle">Body</UBadge>
                                Body Parameters
                            </h4>
                            <UCard class="border-gray-200">
                                <UTable :columns="columns" :data="bodyParameters" hover class="flex-1" />
                            </UCard>
                        </div>

                        <!-- Header Parameters -->
                        <div v-if="headerParameters.length" class="space-y-3">
                            <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UBadge color="info" size="sm" variant="subtle">Header</UBadge>
                                Header Parameters
                            </h4>
                            <UCard class="border-gray-200">
                                <UTable :columns="columns" :data="headerParameters" hover class="flex-1" />
                            </UCard>
                        </div>

                        <!-- Form Data Parameters -->
                        <div v-if="formDataParameters.length" class="space-y-3">
                            <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UBadge color="info" size="sm" variant="subtle">Form Data</UBadge>
                                Form Data Parameters
                            </h4>
                            <UCard class="border-gray-200">
                                <UTable :columns="columns" :data="formDataParameters" hover class="flex-1" />
                            </UCard>
                        </div>
                    </div>

                    <!-- Example Request Section -->
                    <div class="space-y-3">
                        <h3 class="text-base font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-code-bracket" class="text-primary-500" />
                            Example Request
                        </h3>
                        
                        <!-- Example selector tabs -->
                        <div class="flex space-x-1 mb-2">
                            <UButton
                                size="sm"
                                :color="selectedExampleType === 'curl' ? 'primary' : 'neutral'"
                                :variant="selectedExampleType === 'curl' ? 'solid' : 'ghost'"
                                @click="selectedExampleType = 'curl'"
                            >
                                cURL
                            </UButton>
                            <UButton
                                size="sm"
                                :color="selectedExampleType === 'fetch' ? 'primary' : 'neutral'"
                                :variant="selectedExampleType === 'fetch' ? 'solid' : 'ghost'"
                                @click="selectedExampleType = 'fetch'"
                            >
                                JavaScript (fetch)
                            </UButton>
                        </div>
                        
                        <!-- cURL example -->
                        <UCard v-if="selectedExampleType === 'curl'" class="bg-gray-50 border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-500 font-medium">cURL</span>
                                <UButton
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    icon="i-heroicons-clipboard"
                                    @click="() => copyToClipboard(curlExample)"
                                />
                            </div>
                            <ClientOnly>
                                <ShikiHighlight
                                    lang="bash"
                                    :code="curlExample"
                                />
                            </ClientOnly>
                        </UCard>
                        
                        <!-- JavaScript fetch example -->
                        <UCard v-else-if="selectedExampleType === 'fetch'" class="bg-gray-50 border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-500 font-medium">JavaScript (fetch)</span>
                                <UButton
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    icon="i-heroicons-clipboard"
                                    @click="() => copyToClipboard(fetchExample)"
                                />
                            </div>
                            <ClientOnly>
                                <ShikiHighlight
                                    lang="javascript"
                                    :code="fetchExample"
                                />
                            </ClientOnly>
                        </UCard>
                    </div>
                </div>
            </div>
        </template>
    </UDrawer>
</template>