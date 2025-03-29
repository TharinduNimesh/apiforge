`<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed } from 'vue';
import { usePocketBase } from '~/lib/pocketbase';
import CreateApiKeyModal from '~/components/user/CreateApiKeyModal.vue';

const user = {
  name: 'John Doe',
  email: 'john@example.com'
}

const form = ref({
  name: user.name,
  email: user.email
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const apiKeys = ref([
  { id: 1, name: 'Development API Key', created: '2025-03-01', expires: '2025-03-31' },
  { id: 2, name: 'Testing API Key', created: '2025-03-15', expires: '2025-04-15' }
]);

const columns = [
  {
    id: 'name',
    key: 'name',
    label: 'Name'
  },
  {
    id: 'created',
    key: 'created',
    label: 'Created'
  },
  {
    id: 'expires',
    key: 'expires',
    label: 'Expires'
  },
  {
    id: 'actions',
    key: 'actions',
    label: ''
  }
];

const handleApiKeyCreate = async (formData: { name: string, expiresIn: string }) => {
  // TODO: Implement API key creation
  const toast = useToast();
  toast.add({
    title: 'Success',
    description: 'API Key created successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  });
};

const handleApiKeyDelete = async (keyId: number) => {
  // TODO: Implement API key deletion
  const toast = useToast();
  toast.add({
    title: 'Success',
    description: 'API Key deleted successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  });
};
</script>

<template>
  <div class="py-7">
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-gray-800">
          Profile Settings
        </h2>
      </div>

      <div class="space-y-6">
        <!-- Personal Information Section -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user-circle" class="text-lg" />
              <h2 class="text-lg font-semibold">Personal Information</h2>
            </div>
          </template>

          <UForm :state="form" class="space-y-4">
            <UFormField label="Name" name="name">
              <UInput v-model="form.name" placeholder="Enter your name" />
            </UFormField>
            
            <UFormField label="Email" name="email">
              <UInput v-model="form.email" type="email" placeholder="Enter your email" />
            </UFormField>

            <div class="flex justify-end">
              <UButton color="primary" label="Save Changes" />
            </div>
          </UForm>
        </UCard>

        <!-- API Keys Section -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-key" class="text-lg" />
                <h2 class="text-lg font-semibold">API Keys</h2>
              </div>
              
              <CreateApiKeyModal @submit="handleApiKeyCreate" />
            </div>
          </template>

          <div v-if="apiKeys.length === 0" class="text-center py-12">
            <div class="space-y-6">
              <div class="flex justify-center">
                <UIcon name="i-heroicons-key" class="text-4xl text-gray-400" />
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-medium text-gray-900">No API Keys Available</h3>
                <p class="text-gray-500 max-w-sm mx-auto">
                  Create your first API key to start accessing the APIs.
                </p>
              </div>
              <CreateApiKeyModal @submit="handleApiKeyCreate" />
            </div>
          </div>

          <UTable 
            v-else
            :rows="apiKeys"
            :columns="columns"
            hover
          >
            <template #name-cell="{ row }">
              <div class="flex flex-col gap-1">
                <div class="font-medium">{{ row.name }}</div>
              </div>
            </template>

            <template #created-cell="{ row }">
              {{ new Date(row.created).toLocaleDateString() }}
            </template>

            <template #expires-cell="{ row }">
              {{ new Date(row.expires).toLocaleDateString() }}
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu 
                :items="[
                  [
                    {
                      label: 'Copy API Key',
                      icon: 'i-heroicons-clipboard',
                      click: () => {}
                    }
                  ],
                  [
                    {
                      label: 'Delete API Key',
                      icon: 'i-heroicons-trash',
                      color: 'error',
                      click: () => handleApiKeyDelete(row.id)
                    }
                  ]
                ]"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal"
                />
              </UDropdownMenu>
            </template>
          </UTable>
        </UCard>

        <!-- Password Update Section -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-lock-closed" class="text-lg" />
              <h2 class="text-lg font-semibold">Update Password</h2>
            </div>
          </template>

          <UForm :state="passwordForm" class="space-y-4">
            <UFormField label="Current Password" name="currentPassword">
              <UInput v-model="passwordForm.currentPassword" type="password" placeholder="Enter current password" />
            </UFormField>

            <UFormField label="New Password" name="newPassword">
              <UInput v-model="passwordForm.newPassword" type="password" placeholder="Enter new password" />
            </UFormField>

            <UFormField label="Confirm New Password" name="confirmPassword">
              <UInput v-model="passwordForm.confirmPassword" type="password" placeholder="Confirm new password" />
            </UFormField>

            <div class="flex justify-end">
              <UButton color="primary" label="Update Password" />
            </div>
          </UForm>
        </UCard>

        <!-- Danger Zone Section -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-lg text-red-500" />
              <h2 class="text-lg font-semibold text-red-500">Danger Zone</h2>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <UModal>
              <UButton color="error" variant="soft" label="Delete Account" />

              <template #content>
                <div class="p-4">
                  <h3 class="text-lg font-semibold mb-4">Delete Account</h3>
                  <p class="text-gray-600 mb-4">
                    Are you sure you want to delete your account? This action cannot be undone.
                  </p>
                  <div class="flex justify-end gap-2">
                    <UButton color="gray" variant="soft" label="Cancel" />
                    <UButton color="error" label="Yes, Delete My Account" />
                  </div>
                </div>
              </template>
            </UModal>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>`
