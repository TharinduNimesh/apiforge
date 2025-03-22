<template>
  <UModal>
    <!-- Trigger button slot -->
    <UButton
      label="Create New API"
      icon="i-heroicons-plus"
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
                Import APIs from OpenAPI specification JSON file.
              </p>
            </div>
          </div>

          <!-- File Upload Section -->
          <div v-if="showFileUpload" 
            class="border border-gray-200 rounded-lg p-6 bg-white mt-4"
          >
            <div class="flex items-center gap-3 mb-4">
              <UIcon name="i-heroicons-arrow-up-tray" class="text-xl text-orange-600" />
              <h3 class="text-lg font-semibold text-gray-900">Import APIs from OpenAPI JSON</h3>
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
                title="Valid OpenAPI specification"
                description="You can proceed with the import."
                color="green"
                variant="solid"
                icon="i-heroicons-check-circle"
              />
            </div>
            
            <div v-if="validationStatus === 'invalid'" class="mt-4">
              <UAlert
                :title="validationError"
                color="red"
                variant="solid"
                icon="i-heroicons-x-circle"
              >
                <template #description>
                  <div class="flex items-center justify-between">
                    <span>Download our sample OpenAPI specification to see the required structure.</span>
                    <UButton
                      color="white"
                      variant="ghost"
                      icon="i-heroicons-arrow-down-tray"
                      :ui="{ rounded: 'rounded-full' }"
                      @click="() => window.open('/sample-openapi.json', '_blank')"
                    />
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

const emit = defineEmits<{
  'refresh': []
}>()

const showFileUpload = ref(false)
const uploadedFile = ref<File | null>(null)
const fileContent = ref('')
const validationError = ref('')
const validationStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const isValidFile = computed(() => uploadedFile.value !== null && validationStatus.value === 'valid')
const isSubmitting = ref(false)

const resetState = () => {
  showFileUpload.value = false
  uploadedFile.value = null
  fileContent.value = ''
  validationError.value = ''
  validationStatus.value = 'idle'
  isSubmitting.value = false
}

const validateOpenAPIStructure = (jsonData: any): boolean => {
  try {
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
  } catch (error) {
    validationError.value = 'Error validating OpenAPI structure'
    validationStatus.value = 'invalid'
    return false
  }
}

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
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

const submitImport = async () => {
  if (!isValidFile.value || isSubmitting.value) return
  
  isSubmitting.value = true
  const formData = new FormData()
  formData.append('file', uploadedFile.value as File)

  try {
    // TODO: Replace with your API endpoint
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    useToast().add({
      title: 'Success',
      description: 'Successfully imported API',
      color: 'green'
    })

    emit('refresh')
    resetState()
    
  } catch (error) {
    const message = 'Failed to import API'
    validationError.value = message
    validationStatus.value = 'invalid'
    
    useToast().add({
      title: 'Error',
      description: message,
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>