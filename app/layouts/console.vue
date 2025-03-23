<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue';
import BlobBackground from '~/components/background/BlobBackground.vue';
</script>

<template>
  <div>
    <div class="min-h-screen bg-gray-100 relative">
      <BlobBackground />
      <div class="relative z-10">
        <AppHeader />
        <!-- Page Content -->
        <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-7">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>