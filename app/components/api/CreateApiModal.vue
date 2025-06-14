<template>
  <UModal>
    <!-- Trigger button slot -->
    <UButton
      label="Create New API"
      icon="i-heroicons-plus"
      color="neutral"
    />

    <!-- Modal content slot -->
    <template #content>
      <UCard>
        <template #header>
          <div class="text-xl font-semibold">
            Create New API
          </div>
        </template>

        <div class="space-y-4">
          <!-- Options Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Manual Creation Option -->
            <NuxtLink to="/console/apis/create" 
              class="group border border-gray-200 hover:border-primary-500 rounded-lg p-6 transition-all duration-200 hover:shadow-md bg-white"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <UIcon name="i-heroicons-pencil" class="text-xl text-primary-700" />
                </div>
                <UIcon name="i-heroicons-arrow-right" class="text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                Create a new API by filling out the form with detailed configuration options.
              </p>
            </NuxtLink>

            <!-- JSON Import Option -->
            <div 
              :class="[
                'group border rounded-lg p-6 transition-all duration-200 cursor-pointer',
                showFileUpload 
                  ? 'bg-gray-800 border-gray-700 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-orange-500 hover:shadow-md'
              ]"
              @click="showFileUpload = true"
            >
              <div class="flex items-center justify-between mb-4">
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  showFileUpload 
                    ? 'bg-gray-700' 
                    : 'bg-orange-100 group-hover:bg-orange-200'
                ]">
                  <UIcon name="i-heroicons-arrow-up-tray" class="text-xl" :class="showFileUpload ? 'text-orange-300' : 'text-orange-700'" />
                </div>
              </div>
              <h3 class="text-lg font-semibold mb-2" :class="showFileUpload ? 'text-white' : 'text-gray-900'">
                Import APIs
              </h3>
              <p class="text-sm leading-relaxed" :class="showFileUpload ? 'text-gray-300' : 'text-gray-500'">
                Import APIs from OpenAPI 3.0 or Swagger 2.0 specification JSON file.
              </p>
            </div>
          </div>

          <!-- File Upload Section -->
          <div v-if="showFileUpload" 
            class="border border-gray-200 rounded-lg p-6 bg-white mt-4"
          >
            <div class="flex items-center gap-3 mb-4">
              <UIcon name="i-heroicons-arrow-up-tray" class="text-xl text-orange-600" />
              <h3 class="text-lg font-semibold text-gray-900">Import APIs from OpenAPI/Swagger JSON</h3>
            </div>
            
            <UFormField name="file">
              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <UIcon name="i-heroicons-arrow-up-tray" class="w-8 h-8 mb-4 text-gray-500" />
                    <p class="mb-2 text-sm text-gray-500">
                      <span class="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p class="text-xs text-gray-500">JSON file (max. 1MB)</p>
                  </div>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept="application/json"
                    @change="handleFileUpload"
                  />
                </label>
              </div>
            </UFormField>
            
            <!-- Validation Messages -->
            <div v-if="validationStatus === 'valid'" class="mt-4">
              <UAlert
                title="Valid API specification"
                description="You can proceed with the import."
                color="success"
                variant="soft"
                icon="i-heroicons-check-circle"
              />
            </div>
            
            <div v-if="validationStatus === 'invalid'" class="mt-4">
              <UAlert
                :title="validationError"
                color="error"
                variant="soft"
                icon="i-heroicons-x-circle"
              >
                <template #description>
                  <div class="space-y-2">
                    <span>Download our sample files to see the required structure:</span>
                    <div class="flex items-center gap-2">
                      <UButton
                        label="OpenAPI Sample"
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-arrow-down-tray"
                        size="xs"
                        @click="openSampleOpenApi"
                      />
                      <UButton
                        label="Swagger Sample"
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-arrow-down-tray"
                        size="xs"
                        @click="openSampleSwagger"
                      />
                    </div>
                  </div>
                </template>
              </UAlert>
            </div>
            
            <div class="flex justify-end mt-4">
              <UButton
                label="Import API"
                icon="i-heroicons-check"
                :loading="isSubmitting"
                :disabled="!isValidFile"
                @click="submitImport"
              />
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePocketBase } from '~/lib/pocketbase'; 

const emit = defineEmits<{
  'refresh': []
}>()

const pb = usePocketBase()

const showFileUpload = ref(false)
const uploadedFile = ref<File | null>(null)
const fileContent = ref('')
const validationError = ref('')
const validationStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const isValidFile = computed(() => uploadedFile.value !== null && validationStatus.value === 'valid')
const isSubmitting = ref(false)

interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    description?: string
    version: string
  }
  servers?: { url: string }[]
  paths: Record<string, Record<string, {
    summary?: string
    description?: string
    parameters?: {
      name: string
      in: string
      description?: string
      required?: boolean
      schema?: {
        type: string
      }
    }[]
  }>>
}

interface SwaggerSpec {
  swagger: string
  info: {
    title: string
    description?: string
    version: string
  }
  host?: string
  basePath?: string
  schemes?: string[]
  paths: Record<string, Record<string, {
    summary?: string
    description?: string
    tags?: string[]
    parameters?: {
      name: string
      in: string
      description?: string
      required?: boolean
      type?: string
      format?: string
      schema?: {
        type: string
      }
    }[]
  }>>
}

type ApiSpec = OpenAPISpec | SwaggerSpec

const resetState = () => {
  showFileUpload.value = false
  uploadedFile.value = null
  fileContent.value = ''
  validationError.value = ''
  validationStatus.value = 'idle'
  isSubmitting.value = false
}

const detectApiSpecType = (jsonData: any): 'openapi' | 'swagger' | 'unknown' => {
  if (jsonData.openapi && typeof jsonData.openapi === 'string') {
    return 'openapi'
  }
  if (jsonData.swagger && typeof jsonData.swagger === 'string') {
    return 'swagger'
  }
  return 'unknown'
}

const validateOpenAPIStructure = (jsonData: any): boolean => {
  try {
    const specType = detectApiSpecType(jsonData)
    
    if (specType === 'openapi') {
      const isValid = 
        typeof jsonData === 'object' &&
        jsonData.openapi && 
        jsonData.info && 
        jsonData.info.title &&
        jsonData.info.version &&
        jsonData.paths &&
        Object.keys(jsonData.paths).length > 0

      if (!isValid) {
        validationError.value = 'Invalid OpenAPI format. The file must be a valid OpenAPI 3.0 specification.'
        validationStatus.value = 'invalid'
      } else {
        validationError.value = ''
        validationStatus.value = 'valid'
      }
      
      return isValid
    } else if (specType === 'swagger') {
      const isValid = 
        typeof jsonData === 'object' &&
        jsonData.swagger && 
        jsonData.info && 
        jsonData.info.title &&
        jsonData.paths &&
        Object.keys(jsonData.paths).length > 0

      if (!isValid) {
        validationError.value = 'Invalid Swagger format. The file must be a valid Swagger 2.0 specification.'
        validationStatus.value = 'invalid'
      } else {
        validationError.value = ''
        validationStatus.value = 'valid'
      }
      
      return isValid
    } else {
      validationError.value = 'Unsupported format. The file must be either a valid OpenAPI 3.0 or Swagger 2.0 specification.'
      validationStatus.value = 'invalid'
      return false
    }
  } catch (error) {
    validationError.value = 'Error validating API specification structure'
    validationStatus.value = 'invalid'
    return false
  }
}

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) {
    validationError.value = 'No file selected'
    validationStatus.value = 'invalid'
    return
  }

  uploadedFile.value = file

  try {
    const content = await file.text()
    fileContent.value = content
    const jsonData = JSON.parse(content)
    validateOpenAPIStructure(jsonData)
  } catch (error) {
    validationError.value = `Error parsing JSON file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`
    validationStatus.value = 'invalid'
  }
}

const openSampleOpenApi = () => {
  window.open('/sample-openapi.json', '_blank')
}

const openSampleSwagger = () => {
  window.open('/sample-postgres-swagger-doc.json', '_blank')
}

const mapOpenAPITypeToPocketBase = (openAPIType: string): string => {
  // Map OpenAPI/Swagger types to PocketBase supported types
  switch (openAPIType) {
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return 'array'
    case 'object':
      return 'object'
    default:
      return 'string'
  }
}

const createApiFromOpenAPI = async (jsonData: OpenAPISpec) => {
  try {
    // Create API record
    const apiData = {
      name: jsonData.info.title,
      description: jsonData.info.description || jsonData.info.title,
      baseUrl: jsonData.servers?.[0]?.url || '',
      isActive: true,
      type: 'FREE',
      createdBy: pb.authStore.model?.id,
      rateLimit: '100' // Default rate limit
    }

    const apiRecord = await pb.collection('apis').create(apiData)

    // Create endpoints and parameters
    for (const [path, methods] of Object.entries(jsonData.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        // Create endpoint
        const endpointData = {
          name: details.summary || `${method.toUpperCase()} ${path}`,
          description: details.description || '',
          path: path,
          method: method.toUpperCase(),
          api: apiRecord.id
        }

        const endpointRecord = await pb.collection('endpoints').create(endpointData)

        // Create parameters if any
        if (details.parameters) {
          for (const param of details.parameters) {
            const parameterData = {
              name: param.name,
              description: param.description || '',
              type: mapOpenAPITypeToPocketBase(param.schema?.type || 'string'),
              param_in: param.in,
              required: param.required || false,
              endpoint: endpointRecord.id
            }

            await pb.collection('parameters').create(parameterData)
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error creating API from OpenAPI:', error)
    throw error
  }
}

const createApiFromSwagger = async (jsonData: SwaggerSpec) => {
  try {
    // Build base URL from Swagger spec
    let baseUrl = ''
    if (jsonData.host) {
      const scheme = jsonData.schemes?.[0] || 'http'
      baseUrl = `${scheme}://${jsonData.host}`
      if (jsonData.basePath) {
        baseUrl += jsonData.basePath
      }
    }

    // Create API record
    const apiData = {
      name: jsonData.info.title,
      description: jsonData.info.description || jsonData.info.title,
      baseUrl: baseUrl,
      isActive: true,
      type: 'FREE',
      createdBy: pb.authStore.model?.id,
      rateLimit: '100' // Default rate limit
    }

    const apiRecord = await pb.collection('apis').create(apiData)

    // Create endpoints and parameters
    for (const [path, methods] of Object.entries(jsonData.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        // Create endpoint
        const endpointData = {
          name: details.summary || `${method.toUpperCase()} ${path}`,
          description: details.description || '',
          path: path,
          method: method.toUpperCase(),
          api: apiRecord.id
        }

        const endpointRecord = await pb.collection('endpoints').create(endpointData)

        // Create parameters if any
        if (details.parameters) {
          for (const param of details.parameters) {
            // Handle different parameter types in Swagger
            const paramType = param.type || param.schema?.type || 'string'
            
            const parameterData = {
              name: param.name,
              description: param.description || '',
              type: mapOpenAPITypeToPocketBase(paramType),
              param_in: param.in,
              required: param.required || false,
              endpoint: endpointRecord.id
            }

            await pb.collection('parameters').create(parameterData)
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error creating API from Swagger:', error)
    throw error
  }
}

const submitImport = async () => {
  if (!isValidFile.value || isSubmitting.value) return
  
  isSubmitting.value = true

  try {
    const jsonData = JSON.parse(fileContent.value) as ApiSpec
    const specType = detectApiSpecType(jsonData)
    
    if (specType === 'openapi') {
      await createApiFromOpenAPI(jsonData as OpenAPISpec)
    } else if (specType === 'swagger') {
      await createApiFromSwagger(jsonData as SwaggerSpec)
    } else {
      throw new Error('Unsupported API specification format')
    }
    
    useToast().add({
      title: 'Success',
      description: `Successfully imported API from ${specType === 'openapi' ? 'OpenAPI' : 'Swagger'} specification`,
      color: 'success'
    })

    emit('refresh')
    resetState()
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import API'
    validationError.value = message
    validationStatus.value = 'invalid'
    
    useToast().add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>