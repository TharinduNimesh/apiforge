<script setup lang="ts">
const form = reactive({
    email: '',
    password: '',
    remember: false,
});

const schema = {
    email: {
        type: 'string',
        required: true,
        email: true
    },
    password: {
        type: 'string',
        required: true,
        minLength: 8
    },
    remember: {
        type: 'boolean'
    }
};

const state = ref(form);

async function submit(event: any) {
    // TODO: Implement sign in logic
    console.log(event);
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
                <UInput type="email" placeholder="Enter your email" icon="i-heroicons-envelope" />
            </UFormField>

            <UFormField label="Password" name="password">
                <UInput type="password" placeholder="Enter your password" icon="i-heroicons-lock-closed" />
            </UFormField>

            <div class="flex items-center justify-between">
                <UFormField name="remember" class="!mb-0">
                    <UCheckbox label="Remember me" />
                </UFormField>
                <NuxtLink to="/auth/forgot-password" class="text-sm text-orange-600 hover:text-orange-500">
                    Forgot password?
                </NuxtLink>
            </div>

            <UButton class="mt-4" type="submit" block>
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