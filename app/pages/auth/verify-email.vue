<script setup lang="ts">
import { computed } from 'vue';

const status = ref<string | null>(null);
const form = reactive({});

const verificationLinkSent = computed(
    () => status.value === 'verification-link-sent'
);

async function submit() {
    // TODO: Implement verification email sending logic
    status.value = 'verification-link-sent';
}

async function handleLogout() {
    // TODO: Implement logout logic and redirect to login
    console.log('Logging out...');
}
</script>

<template>
    <NuxtLayout name="guest">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-semibold text-gray-800">Verify Your Email</h1>
            <p class="text-gray-600 mt-2">One more step to get started</p>
        </div>

        <p class="text-gray-600 mb-6 text-base leading-relaxed">
            Thanks for signing up! Before getting started, could you verify your
            email address by clicking on the link we just emailed to you? If you
            didn't receive the email, we will gladly send you another.
        </p>

        <UAlert
            v-if="verificationLinkSent"
            type="success"
            title="A new verification link has been sent to your email address."
            icon="i-heroicons-check-circle"
            class="mb-6"
        />

        <div class="space-y-4">
            <UButton
                type="button"
                block
                icon="i-heroicons-envelope"
                :loading="false"
                @click="submit"
            >
                Resend Verification Email
            </UButton>

            <UButton
                type="button"
                block
                variant="ghost"
                icon="i-heroicons-arrow-left-on-rectangle"
                @click="handleLogout"
                class="text-gray-600 hover:text-orange-500"
            >
                Log Out
            </UButton>
        </div>
    </NuxtLayout>
</template>