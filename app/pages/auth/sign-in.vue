<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { usePocketBase } from '~/lib/pocketbase'

const pb = usePocketBase();
const router = useRouter();

const schema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    remember: z.boolean().optional()
});

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: '',
    password: '',
    remember: false
});

const isLoading = ref(false);
const toast = useToast()

async function submit(event: FormSubmitEvent<Schema>) {
    isLoading.value = true;
    try {
        await pb.collection('users').authWithPassword(
            event.data.email,
            event.data.password
        );

        if (pb.authStore.isValid) {
            toast.add({
                title: 'Success',
                description: 'Successfully signed in',
                color: 'success'
            });

            // Redirect to console page after successful login
            router.push('/console');
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: 'Invalid email or password',
            color: 'error'
        });
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <NuxtLayout name="guest">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-semibold text-gray-800">Welcome Back</h1>
            <p class="text-gray-600 mt-2">Sign in to continue to APIForge</p>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-6" @submit="submit">
            <UFormField label="Email" name="email">
                <UInput 
                    v-model="state.email"
                    type="email" 
                    placeholder="Enter your email" 
                    icon="i-heroicons-envelope" 
                />
            </UFormField>

            <UFormField label="Password" name="password">
                <UInput 
                    v-model="state.password"
                    type="password" 
                    placeholder="Enter your password" 
                    icon="i-heroicons-lock-closed" 
                />
            </UFormField>

            <div class="flex items-center justify-between">
                <UFormField name="remember" class="!mb-0">
                    <UCheckbox 
                        v-model="state.remember"
                        label="Remember me" 
                    />
                </UFormField>
                <NuxtLink to="/auth/forgot-password" class="text-sm text-orange-600 hover:text-orange-500">
                    Forgot password?
                </NuxtLink>
            </div>

            <UButton class="mt-4" type="submit" block color="primary" :loading="isLoading">
                Sign In
            </UButton>

            <div class="text-center">
                <NuxtLink to="/auth/sign-up" class="text-sm text-gray-600 ">
                    Don't have an account? <span class="text-orange-600">Sign up</span>
                </NuxtLink>
            </div>
        </UForm>
    </NuxtLayout>
</template>