<template>
  <div class="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 relative">
    <BlobBackground />
    
    <div class="relative z-10">
      <NuxtLink to="/" class="flex items-center gap-3">
        <ApplicationLogo />

      </NuxtLink>
    </div>

    <div class="w-full sm:max-w-md mt-6 px-6 py-4 bg-white/70 backdrop-blur-xl shadow-md overflow-hidden sm:rounded-lg relative z-10">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import ApplicationLogo from '~/components/ApplicationLogo.vue';
import BlobBackground from '~/components/background/BlobBackground.vue';
</script>