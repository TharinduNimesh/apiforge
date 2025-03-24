<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { usePocketBase } from '~/lib/pocketbase'

const pb = usePocketBase();
const router = useRouter();

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(8, 'Password must be at least 8 characters'),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"]
});

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  terms: false,
});

const toast = useToast()

async function submit(event: FormSubmitEvent<Schema>) {
  try {
    const data = {
      email: event.data.email,
      password: event.data.password,
      passwordConfirm: event.data.password_confirmation,
      name: event.data.name,
      emailVisibility: true,
      role: 'user'
    };

    await pb.collection('users').create(data);
    
    // Send email verification
    await pb.collection('users').requestVerification(event.data.email);
    
    toast.add({
      title: 'Success',
      description: 'Your account has been created. Please check your email to verify your account.',
      color: 'success'
    });

    // Redirect to sign in page
    router.push('/auth/sign-in');
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Something went wrong. Please try again.',
      color: 'error'
    })
  }
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
          v-model="state.name"
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
          v-model="state.email"
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
          v-model="state.password"
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
          v-model="state.password_confirmation"
          type="password"
          placeholder="Confirm your password"
          icon="i-heroicons-lock-closed"
        />
      </UFormField>

      <UFormField
        name="terms"
        class="!mt-0"
      >
        <UCheckbox 
          v-model="state.terms"
          label="I agree to the Terms of Service and Privacy Policy" 
        />
      </UFormField>

      <UButton
        class="mt-4"
        type="submit"
        block
        color="primary"
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