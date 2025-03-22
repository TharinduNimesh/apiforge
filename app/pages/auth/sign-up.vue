<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  terms: false
});

const schema = {
  name: {
    type: 'string',
    required: true,
    minLength: 2
  },
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
  password_confirmation: {
    type: 'string',
    required: true,
    minLength: 8
  },
  terms: {
    type: 'boolean',
    required: true
  }
};

const state = ref(form);

async function submit(event: any) {
  // TODO: Implement sign up logic
  console.log(event);
}
</script>

<template>
  <NuxtLayout name="guest">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">Create Account</h1>
      <p class="text-gray-600 mt-2">Get started with APIForge</p>
    </div>

    <UForm 
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="submit"
    >
      <UFormField
        label="Name"
        name="name"
      >
        <UInput
          type="text"
          placeholder="Enter your name"
          icon="i-heroicons-user"
        />
      </UFormField>

      <UFormField
        label="Email"
        name="email"
      >
        <UInput
          type="email"
          placeholder="Enter your email"
          icon="i-heroicons-envelope"
        />
      </UFormField>

      <UFormField
        label="Password"
        name="password"
      >
        <UInput
          type="password"
          placeholder="Create a password"
          icon="i-heroicons-lock-closed"
        />
      </UFormField>

      <UFormField
        label="Confirm Password"
        name="password_confirmation"
      >
        <UInput
          type="password"
          placeholder="Confirm your password"
          icon="i-heroicons-lock-closed"
        />
      </UFormField>

      <UFormField
        name="terms"
        class="!mt-0 "
      >
        <UCheckbox label="I agree to the Terms of Service and Privacy Policy" />
      </UFormField>

      <UButton
        class="mt-4"
        type="submit"
        block
      >
        Create Account
      </UButton>

      <div class="text-center">
        <NuxtLink
          to="/auth/sign-in"
          class="text-sm text-gray-600"
        >
          Already have an account? <span class="text-orange-600">Sign in</span>
        </NuxtLink>
      </div>
    </UForm>
  </NuxtLayout>
</template>