<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  to: {
    type: String,
    default: '/'
  }
})

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
}

const textSizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl'
}
</script>

<template>
  <NuxtLink :to="to" class="flex items-center gap-2">
    <img src="/logo.png" alt="APIForge Logo" :class="sizeClasses[size]" />
    <span :class="[textSizeClasses[size], 'font-bold text-gray-800']">
      <span class="text-orange-400">API</span>Forge
    </span>
  </NuxtLink>
</template>