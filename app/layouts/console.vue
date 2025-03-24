<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue';
import BlobBackground from '~/components/background/BlobBackground.vue';
import { usePocketBase } from '~/lib/pocketbase';
import { useRouter } from 'vue-router';

const pb = usePocketBase();
const toast = useToast();
const resendingEmail = ref(false);
const emailSent = ref(false);
const router = useRouter();

const handleSignOut = async () => {
  pb.authStore.clear();
  await router.push('/auth/sign-in');
};

const resendVerificationEmail = async () => {
  resendingEmail.value = true;
  try {
    await pb.collection('users').requestVerification(pb.authStore.record?.email);
    emailSent.value = true;
    toast.add({
      title: 'Verification email sent',
      description: 'After verifying, please sign out and sign in again to update your status',
      color: 'info',
      icon: 'i-heroicons-envelope',
    });
  } catch (error) {
    toast.add({
      title: 'Failed to send verification email',
      description: 'Please try again later',
      color: 'info',
      icon: 'i-heroicons-x-circle',
    });
  } finally {
    resendingEmail.value = false;
  }
};
</script>

<template>
  <div>
    <div class="min-h-screen bg-gray-100 relative">
      <BlobBackground />
      <div class="relative z-10">
        <!-- Page Content -->
        <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-7">
          <AppHeader />

          <div class="flex justify-center">
            <UAlert v-if="!pb.authStore.record?.verified" icon="i-heroicons-exclamation-triangle" color="error"
              variant="subtle" title="Email Verification Required" class="mb-4 max-w-6xl">
              <template #description>
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <p class="text-sm" v-if="emailSent">
                      We've sent you a verification email. Please check your inbox and verify your email address to start using the APIs. 
                      After verifying, you'll need to sign out and sign in again to update your status.
                    </p>
                    <p class="text-sm" v-else>
                      Please verify your email address to start using the APIs.
                    </p>
                    <p class="text-sm text-gray-500">{{ emailSent ? "Haven't received the email?" : "Didn't receive the verification email?" }}</p>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <UButton size="sm" color="error" :label="emailSent ? 'Resend Verification Email' : 'Send Verification Email'" 
                      icon="i-heroicons-envelope" :loading="resendingEmail" @click="resendVerificationEmail" />
                    <UButton v-if="emailSent && !pb.authStore.record?.verified" size="sm" color="info" label="Sign Out" 
                      icon="i-heroicons-arrow-right-on-rectangle" @click="handleSignOut" />
                  </div>
                </div>
              </template>
            </UAlert>
          </div>
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>