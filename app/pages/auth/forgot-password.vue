<script setup lang="ts">
const form = reactive({
    email: '',
});

const schema = {
    email: {
        type: 'string',
        required: true,
        email: true
    }
};

const state = ref(form);
const status = ref<string | null>(null);

async function submit(event: any) {
    // TODO: Implement password reset logic
    console.log(event);
    // Simulate success status for now
    status.value = 'We have emailed your password reset link.';
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

        <UAlert
            v-if="status"
            type="success"
            :title="status"
            class="mb-6"
        />

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
                    type="email"
                    placeholder="Enter your email"
                    icon="i-heroicons-envelope"
                    autocomplete="username"
                />
            </UFormField>

            <UButton
                type="submit"
                block
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