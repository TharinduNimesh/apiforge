<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDropZone } from '@vueuse/core'

interface Props {
  modelValue: File | File[] | null
  multiple?: boolean
  accept?: string[]
  maxSize?: number // in bytes
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  accept: () => ['*/*'],
  maxSize: 1024 * 1024 * 2, // 2MB default
  maxFiles: 10
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | File[] | null): void
  (e: 'error', message: string): void
}>()

const dropZoneRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files: File[] | null) => {
    if (files) handleFiles(files)
  },
  onEnter: () => isDragging.value = true,
  onLeave: () => isDragging.value = false
})

const files = computed<File[]>(() => {
  if (!props.modelValue) return []
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

const handleFiles = (newFiles: File[]) => {
  isDragging.value = false
  
  // Filter files by accepted types
  const validFiles = newFiles.filter(file => {
    // Check file type
    const fileType = file.type || ''
    const isValidType = props.accept.includes('*/*') || 
      props.accept.some(type => {
        if (type.includes('/*')) {
          // Handle wildcard MIME types (e.g., image/*)
          const [category] = type.split('/')
          const [fileCategory] = fileType.split('/')
          return category === fileCategory
        }
        // Exact MIME type match
        return type === fileType
      })
    
    if (!isValidType) {
      emit('error', `File type "${fileType || file.name}" is not accepted. Allowed types: ${props.accept.join(', ')}`)
      return false
    }
    
    // Check file size
    if (file.size > props.maxSize) {
      emit('error', `File ${file.name} exceeds maximum size of ${formatBytes(props.maxSize)}`)
      return false
    }
    
    return true
  })

  if (props.multiple) {
    const currentFiles = [...files.value]
    
    // Check max files limit
    if (currentFiles.length + validFiles.length > props.maxFiles) {
      emit('error', `Maximum ${props.maxFiles} files allowed`)
      return
    }
    
    emit('update:modelValue', [...currentFiles, ...validFiles])
  } else {
    emit('update:modelValue', validFiles[0] || null)
  }
}

const removeFile = (index: number) => {
  if (props.multiple) {
    const newFiles = [...files.value]
    newFiles.splice(index, 1)
    emit('update:modelValue', newFiles.length ? newFiles : null)
  } else {
    emit('update:modelValue', null)
  }
}

const openFilePicker = () => {
  fileInput.value?.click()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return 'i-heroicons-photo'
  if (file.type.includes('pdf')) return 'i-heroicons-document-text'
  if (file.type.includes('word')) return 'i-heroicons-document'
  if (file.type.includes('excel')) return 'i-heroicons-table-cells'
  return 'i-heroicons-document'
}

const getFilePreview = (file: File) => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file)
  }
  return undefined
}

// Handle file input change with proper type checking
const handleFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input?.files) {
    handleFiles(Array.from(input.files))
  }
}
</script>

<template>
  <div>
    <div
      ref="dropZoneRef"
      class="relative border-2 border-dashed rounded-lg p-6 transition-colors"
      :class="[
        isDragging || isOverDropZone 
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-500'
      ]"
    >
      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="accept.join(',')"
        :multiple="multiple"
        @change="handleFileInputChange"
      >
      
      <!-- Dropzone Content -->
      <div class="text-center">
        <UIcon
          :name="isDragging ? 'i-heroicons-arrow-down-tray' : 'i-heroicons-cloud-arrow-up'"
          class="mx-auto h-12 w-12"
          :class="isDragging ? 'text-primary-500' : 'text-gray-400'"
        />
        <div class="mt-4 flex flex-col items-center text-sm">
          <span class="font-medium text-gray-900">
            {{ isDragging ? 'Drop files here' : 'Drop files or' }}
          </span>
          <button
            type="button"
            class="mt-1 font-medium text-primary-600 hover:text-primary-500"
            @click="openFilePicker"
          >
            {{ multiple ? 'select multiple files' : 'select a file' }}
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          {{ multiple ? `Up to ${maxFiles} files, ` : '' }}max {{ formatBytes(maxSize) }} per file
        </p>
      </div>
    </div>

    <!-- File List -->
    <div v-if="files.length" class="mt-4 space-y-3">
      <TransitionGroup name="list">
        <div
          v-for="(file, index) in files"
          :key="file.name"
          class="relative flex items-center gap-4 p-4 bg-gray-50 rounded-lg group"
        >
          <!-- Preview/Icon -->
          <div class="shrink-0 w-10 h-10 rounded overflow-hidden bg-white border flex items-center justify-center">
            <img
              v-if="getFilePreview(file)"
              :src="getFilePreview(file)"
              :alt="file.name"
              class="w-full h-full object-cover"
            >
            <UIcon
              v-else
              :name="getFileIcon(file)"
              class="w-6 h-6 text-gray-400"
            />
          </div>

          <!-- File Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ file.name }}
              </p>
              <UBadge
                color="neutral"
                variant="subtle"
                size="xs"
                :label="formatBytes(file.size)"
              />
            </div>
            <p class="text-xs text-gray-500">
              {{ file.type || 'Unknown type' }}
            </p>
          </div>

          <!-- Remove Button -->
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="xs"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeFile(index)"
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>