`<script setup lang="ts">
definePageMeta({
  layout: 'console'
});

import { ref, computed, onMounted } from 'vue';
import type { TableColumn } from '#ui/types';
import type { DropdownMenuItem } from '#ui/types';
import { usePocketBase } from '~/lib/pocketbase';
import CreateApiKeyModal from '~/components/user/CreateApiKeyModal.vue';

interface ApiKey {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  expires: string;
  key: string;
  last_used: string;
  name: string;
  updated: string;
  user_id: string;
}

interface TableApiKey {
  id: string;
  name: string;
  created: string;
  last_used: string;
  expires: string;
  key: string;
  isExpired: boolean;
}

const pb = usePocketBase();
const toast = useToast();

const userData = computed(() => ({
  name: pb.authStore.record?.name || '',
  email: pb.authStore.record?.email || '',
}));

const form = ref({
  name: userData.value.name,
  email: userData.value.email
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const apiKeys = ref<TableApiKey[]>([]);
const loading = ref({
  profile: false,
  password: false,
  apiKeys: true
});
const isDeleteModalOpen = ref(false);

const hasProfileChanges = computed(() => {
  return form.value.name !== userData.value.name || 
         form.value.email !== userData.value.email;
});

const handleProfileUpdate = async () => {
  if (loading.value.profile) return;
  if (!hasProfileChanges.value) return;

  if (!pb.authStore.record) return;

  try {
    loading.value.profile = true;
    const tasks = [];

    // Update name if changed
    if (form.value.name !== userData.value.name) {
      tasks.push(
        pb.collection('users').update(pb.authStore.record?.id, {
          name: form.value.name,
        })
      );
    }

    // Request email change if changed
    if (form.value.email !== userData.value.email) {
      tasks.push(
        pb.collection('users').requestEmailChange(form.value.email)
      );
    }

    await Promise.all(tasks);

    if (form.value.email !== userData.value.email) {
      toast.add({
        title: 'Email Verification Required',
        description: 'A verification link has been sent to your new email address',
        color: 'info',
        icon: 'i-heroicons-envelope'
      });
    } else {
      toast.add({
        title: 'Success',
        description: 'Profile updated successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      });
    }

    await pb.collection("users").authRefresh();
  } catch (error: any) {
    console.error('Error updating profile:', error);
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to update profile',
      color: 'error'
    });
    // Reset form on error
    form.value.name = userData.value.name;
    form.value.email = userData.value.email;
  } finally {
    loading.value.profile = false;
  }
};

const handlePasswordUpdate = async () => {
  if (loading.value.password) return;
  if (!pb.authStore.record) return;
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({
      title: 'Error',
      description: 'New passwords do not match',
      color: 'error'
    });
    return;
  }

  try {
    loading.value.password = true;
    await pb.collection('users').update(pb.authStore.record?.id, {
      oldPassword: passwordForm.value.currentPassword,
      password: passwordForm.value.newPassword,
      passwordConfirm: passwordForm.value.confirmPassword
    });

    toast.add({
      title: 'Success',
      description: 'Password updated successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });

    // Reset password form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to update password',
      color: 'error'
    });
  } finally {
    loading.value.password = false;
  }
};

const columns: TableColumn<TableApiKey>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'created',
    header: 'Created',
  },
  {
    accessorKey: 'last_used',
    header: 'Last Used'
  },
  {
    accessorKey: 'expires',
    header: 'Expires'
  },
  {
    id: 'actions',
    header: ''
  }
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const refreshApiKeys = async () => {
  if (!pb.authStore.record?.id) return;

  try {
    loading.value.apiKeys = true;
    const records = await pb.collection('api_keys').getFullList({
      filter: pb.filter('user_id = {:id}', { id: pb.authStore.record.id }),
      sort: '-created'
    });
    
    apiKeys.value = records.map(record => ({
      id: record.id,
      name: record.name,
      created: formatDate(record.created),
      last_used: record.last_used ? formatDate(record.last_used) : 'Never',
      expires: formatDate(record.expires),
      key: record.key,
      isExpired: new Date(record.expires) < new Date()
    }));
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to load API keys',
      color: 'error'
    });
  } finally {
    loading.value.apiKeys = false;
  }
};

const handleApiKeyCreate = async () => {
  // Refresh the list after creation
  await refreshApiKeys();
};

const handleApiKeyDelete = async (keyId: string) => {
  try {
    await pb.collection('api_keys').delete(keyId);
    await refreshApiKeys();
    
    toast.add({
      title: 'Success',
      description: 'API Key deleted successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to delete API key',
      color: 'error'
    });
  }
};

const handleAccountDelete = async () => {
  if (!pb.authStore.record) return;
  
  try {
    await pb.collection('users').delete(pb.authStore.record?.id);
    pb.authStore.clear();
    await navigateTo('/auth/sign-in');
    
    toast.add({
      title: 'Success',
      description: 'Account deleted successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to delete account',
      color: 'error'
    });
  }
};

const copyApiKey = async (key: string) => {
  try {
    await navigator.clipboard.writeText(key);
    toast.add({
      title: 'Success',
      description: 'API Key copied to clipboard',
      color: 'success',
      icon: 'i-heroicons-clipboard-document-check'
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to copy API key',
      color: 'error'
    });
  }
};

const handleDeleteModalClose = () => {
  isDeleteModalOpen.value = false;
};

onMounted(() => {
  refreshApiKeys();
});
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

          <UForm :state="form" class="space-y-4" @submit="handleProfileUpdate">
            <!-- Name Input -->
            <UFormField label="Name">
              <UInput v-model="form.name" placeholder="Enter your name" />
            </UFormField>
            
            <!-- Email Input -->
            <UFormField label="Email">
              <UInput 
                v-model="form.email" 
                type="email" 
                placeholder="Enter your email"
              />
              <template #help>
                <span v-if="form.email !== userData.email" class="text-sm text-gray-500">
                  Changing your email will require verification of the new address
                </span>
              </template>
            </UFormField>

            <div class="flex justify-end">
              <UButton 
                type="submit" 
                color="primary" 
                :loading="loading.profile"
                :disabled="!hasProfileChanges || loading.profile"
              >
                {{ loading.profile ? 'Updating...' : 'Update Profile' }}
              </UButton>
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

          <!-- Loading State -->
          <div v-if="loading.apiKeys">
            <div class="space-y-4">
              <div v-for="n in 3" :key="n" class="flex items-center gap-4">
                <USkeleton class="h-8 w-48" />
                <USkeleton class="h-8 w-32" />
                <USkeleton class="h-8 w-32" />
                <USkeleton class="h-8 w-8" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="apiKeys.length === 0" class="text-center py-12">
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

          <!-- API Keys Table -->
          <UTable 
            v-else
            :data="apiKeys"
            :columns="columns"
            hover
          >
            <template #name-cell="{ row }">
              <div class="font-medium">{{ row.getValue('name') }}</div>
            </template>

            <template #expires-cell="{ row }">
              <div class="flex items-center gap-2">
                <span>{{ row.getValue('expires') }}</span>
                <UBadge
                  v-if="row.original.isExpired"
                  color="error"
                  variant="subtle"
                  label="Expired"
                />
              </div>
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu 
                :items="[
                  [
                    {
                      label: 'Delete API Key',
                      icon: 'i-heroicons-trash',
                      color: 'error',
                      onSelect: () => handleApiKeyDelete(row.original.id)
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

          <UForm :state="passwordForm" class="space-y-4" @submit="handlePasswordUpdate">
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
              <UButton :loading="loading.password" type="submit" color="primary" label="Update Password" />
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

            <UModal v-model:open="isDeleteModalOpen">
              <UButton color="error" variant="soft" label="Delete Account" />

              <template #content>
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h2 class="text-xl font-semibold">Delete Account</h2>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-x-mark"
                        class="-my-1"
                        @click="handleDeleteModalClose"
                      />
                    </div>
                  </template>

                  <div class="space-y-4">
                    <p class="text-gray-600">
                      Are you sure you want to delete your account? This action cannot be undone and will immediately:
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-600">
                      <li>Delete all your personal information</li>
                      <li>Remove all your API keys</li>
                      <li>Cancel all your API subscriptions</li>
                    </ul>
                    <div class="flex justify-end gap-2 pt-4 border-t">
                      <UButton 
                        color="neutral"
                        variant="soft" 
                        label="Cancel" 
                        @click="handleDeleteModalClose"
                      />
                      <UButton 
                        color="error" 
                        label="Yes, Delete My Account" 
                        @click="handleAccountDelete"
                      />
                    </div>
                  </div>
                </UCard>
              </template>
            </UModal>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>`
