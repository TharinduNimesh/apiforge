<script setup lang="ts">
interface ApiProps {
  name: string;
  description: string;
  type: "FREE" | "PAID";
  status: "ACTIVE" | "INACTIVE";
  endpointCount: number;
  createdAt: string;
  id: string;
  onActivate?: (id: string) => void;
}

const props = defineProps<ApiProps>();
const isAdmin = ref(true); // TODO: Replace with actual auth check

const truncateText = (text: string, length: number = 120) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const displayStatus = computed(() => 
  props.status === 'INACTIVE' ? 'INACTIVE' : props.type
);

const cardClass = computed(() => ({
  'opacity-75': props.status === 'INACTIVE',
  'border-red-200 hover:border-red-300': props.status === 'INACTIVE',
  'border-emerald-100 hover:border-emerald-300': props.status === 'ACTIVE' && props.type === 'FREE',
  'border-amber-100 hover:border-amber-300': props.status === 'ACTIVE' && props.type === 'PAID',
}));

const handleActivate = (e: Event) => {
  e.preventDefault();
  if (props.onActivate) {
    props.onActivate(props.id);
  }
};

const getIconColorClass = (iconType: string) => {
  if (props.status === 'INACTIVE') {
    return 'text-gray-400';
  }
  
  const colorMap: Record<string, string> = {
    link: props.type === 'FREE' ? 'text-emerald-500' : 'text-amber-500',
    calendar: 'text-indigo-400',
    info: 'text-blue-500',
    code: 'text-violet-500'
  };
  
  return colorMap[iconType] || 'text-gray-400';
};

const formattedDate = computed(() => {
  return new Date(props.createdAt).toLocaleDateString();
});
</script>

<template>
  <ClientOnly>
    <NuxtLink 
      :to="`/console/apis/${props.id}`"
      class="relative flex flex-col min-h-[320px] bg-white border rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      :class="cardClass"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-50">
        <h3 class="text-xl font-semibold text-gray-900 truncate pr-3 flex-1">
          {{ name }}
        </h3>
        <UBadge 
          :color="status === 'INACTIVE' ? 'neutral' : type === 'PAID' ? 'primary' : 'success'"
          variant="soft"
          size="lg"
          class="rounded-lg"
        >
          {{ displayStatus }}
        </UBadge>
      </div>

      <!-- Content -->
      <div class="flex-1 p-6">
        <p class="text-gray-600 leading-relaxed mb-4">
          {{ truncateText(description) }}
        </p>

        <div class="flex justify-between items-center text-sm text-gray-500">
          <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
            <UIcon name="i-heroicons-link" :class="getIconColorClass('link')" />
            <span class="font-medium">{{ endpointCount }} Endpoints</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar" :class="getIconColorClass('calendar')" />
            <span>{{ formattedDate }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-auto p-6 pt-4 border-t border-gray-50">
        <div class="flex items-center justify-end">
          <!-- Action buttons -->
          <div class="flex gap-2">
            <template v-if="status === 'INACTIVE' && isAdmin()">
              <UButton 
                icon="i-heroicons-check"
                label="Activate"
                color="success"
                @click="handleActivate"
                size="md"
              />
            </template>
            <template v-else>
              <UButton
                :to="`/console/apis/${id}`"
                color="primary"
                trailing-icon="i-heroicons-arrow-right"
                size="md"
              >
                Use API
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </NuxtLink>
  </ClientOnly>
</template>