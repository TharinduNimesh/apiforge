<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { pb } from '~/lib/pocketbase';

const schema = z.object({
    email: z.string().email('Invalid email address'),
});

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: '',
});

const loading = ref(false);
const toast = useToast()

async function submit(event: FormSubmitEvent<Schema>) {
    loading.value = true;
    try {
        await pb.collection('users').requestPasswordReset(event.data.email);
        toast.add({
            title: 'Success',
            description: 'We have emailed your password reset link.',
            color: 'success'
        });
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to send password reset link. Please try again.',
            color: 'error'
        });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <NuxtLayout name="guest">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-semibold text-gray-800">Forgot Password</h1>
            <p class="text-gray-600 mt-2">
                Forgot your password? No problem. Just let us know your email
                address and we will email you a password reset link that will allow
                you to choose a new one.
            </p>
        </div>

        <UForm
            :schema="schema"
            :state="state"
            class="space-y-6"
            @submit="submit"
        >
            <UFormField
                label="Email"
                name="email"
            >
                <UInput
                    v-model="state.email"
                    type="email"
                    placeholder="Enter your email"
                    icon="i-heroicons-envelope"
                    autocomplete="username"
                />
            </UFormField>

            <UButton
                type="submit"
                block
                :loading="loading"
                color="primary"
                class="mt-4"
            >
                Email Password Reset Link
            </UButton>

            <div class="text-center">
                <NuxtLink
                    to="/auth/sign-in"
                    class="text-sm text-gray-600"
                >
                    Remember your password? <span class="text-orange-600">Sign in</span>
                </NuxtLink>
            </div>
        </UForm>
    </NuxtLayout>
</template>