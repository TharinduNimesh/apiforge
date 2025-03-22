<script setup lang="ts">
import ApplicationLogo from '~/components/ApplicationLogo.vue'
</script>

<template>
  <div class="bg-gray-50 min-h-screen relative overflow-hidden">
    <!-- Background Blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Blob 1 -->
      <div
        class="absolute -top-[20%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-orange-200/30 to-orange-500/30 blur-[80px] animate-blob"
      ></div>
      <!-- Blob 2 -->
      <div
        class="absolute top-[30%] -right-[15%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-orange-300/20 to-pink-500/20 blur-[90px] animate-blob animation-delay-2000"
      ></div>
      <!-- Blob 3 -->
      <div
        class="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-200/20 to-orange-300/20 blur-[70px] animate-blob animation-delay-4000"
      ></div>
    </div>

    <!-- Navigation -->
    <nav class="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center gap-3">
            <ApplicationLogo to="/" />
          </div>

          <!-- Navigation Links -->
          <div class="flex items-center gap-4">
            <UButton
              to="/auth/sign-in"
              variant="ghost"
              class="text-gray-600 hover:text-gray-900"
              label="Log in"
            />
            <UButton 
              to="/auth/sign-up" 
              label="Get Started" 
            />
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative pt-20 pb-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center relative z-10">
          <div class="mb-8 flex justify-center">
            <UBadge color="neutral" variant="soft" class="px-3 py-1 text-sm leading-6 rounded-3xl">
              <template #default>
                <span class="font-semibold text-orange-600">New</span> Access powerful APIs for your applications
              </template>
            </UBadge>
          </div>
          <h1
            class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-8"
          >
            Access Powerful APIs
            <span class="relative">
              <span
                class="relative bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
                >Made Simple</span
              >
              <span
                class="absolute -bottom-1.5 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-sm opacity-70"
              ></span>
            </span>
          </h1>
          <p
            class="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
          >
            Discover and integrate APIs for your applications. Find everything you need to build powerful, connected experiences.
          </p>
          <div class="mt-10 flex justify-center gap-x-6">
            <UButton 
              to="/auth/sign-up"
              size="xl" 
              label="Get Started" 
              class="shadow-xl shadow-orange-500/20" 
            />
            <UButton 
              to="/apis"
              variant="ghost" 
              size="xl" 
              label="Browse APIs" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="bg-white/80 backdrop-blur-sm py-24 relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900">
            Everything you need to manage your APIs
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Comprehensive tools for API management and monitoring
          </p>
        </div>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature cards -->
          <UCard class="hover:shadow-xl transition duration-300">
            <template #header>
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mb-4">
                <UIcon name="i-heroicons-shield-check" class="text-xl" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Rate Limiting</h3>
            </template>
            <p class="text-gray-500">
              Protect your APIs with advanced rate limiting and usage monitoring.
            </p>
          </UCard>

          <UCard class="hover:shadow-xl transition duration-300">
            <template #header>
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mb-4">
                <UIcon name="i-heroicons-users" class="text-xl" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
            </template>
            <p class="text-gray-500">
              Manage access levels and permissions with role-based authentication.
            </p>
          </UCard>

          <UCard class="hover:shadow-xl transition duration-300">
            <template #header>
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mb-4">
                <UIcon name="i-heroicons-chart-bar" class="text-xl" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Analytics</h3>
            </template>
            <p class="text-gray-500">
              Track API usage and performance with real-time analytics.
            </p>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-gray-500 text-sm">
          © {{ new Date().getFullYear() }} APIForge. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
</style>