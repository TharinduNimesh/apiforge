<script setup lang="ts">
type LogoSize = 'sm' | 'md' | 'lg';

defineProps({
  size: {
    type: String as () => LogoSize,
    default: 'md',
    validator: (value: string): value is LogoSize => ['sm', 'md', 'lg'].includes(value)
  },
  to: {
    type: String,
    default: '/'
  }
})

const sizeClasses: Record<LogoSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
}

const textSizeClasses: Record<LogoSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl'
}
</script>

<template>
  <NuxtLink :to="to" class="flex items-center space-x-2">
      <img src="/logo.png" alt="APIForge Logo" :class="sizeClasses[size]" />
      <span :class="[textSizeClasses[size], 'font-bold text-gray-800']">
        <span class="text-orange-400">API</span>Forge
      </span>
  </NuxtLink>
</template>