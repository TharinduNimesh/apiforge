<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { usePocketBase } from '~/lib/pocketbase';

const isLoading = ref(true);

interface Props {
  apiId: string;
  refreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 30
});

interface StatsRecord {
  success_rate: number;
  avg_response_time: number;
  total_requests: number;
  hour: string;
}

const stats = ref({
  overall: {
    successRate: 0,
    avgResponseTime: 0,
    totalRequests: 0,
    previousSuccessRate: 0,
    previousAvgResponseTime: 0,
    lastUpdateTime: '',
  }
});

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
};

const fetchStats = async () => {
  try {
    isLoading.value = true;
    const pb = usePocketBase();
    
    // Fetch the latest hourly stats for this API
    const hourlyStats = await pb.collection('api_stats_hourly').getList(1, 1, {
      filter: `api_id = "${props.apiId}"`,
      sort: '-hour'
    });

    if (hourlyStats.items.length > 0) {
      const latestStats = hourlyStats.items[0] as StatsRecord;
      
      // Update the stats with real data
      stats.value.overall.previousSuccessRate = stats.value.overall.successRate;
      stats.value.overall.previousAvgResponseTime = stats.value.overall.avgResponseTime;
      stats.value.overall.lastUpdateTime = latestStats.hour;
      
      stats.value.overall = {
        ...stats.value.overall,
        successRate: latestStats.success_rate,
        avgResponseTime: latestStats.avg_response_time,
        totalRequests: latestStats.total_requests,
        lastUpdateTime: latestStats.hour
      };
    }
  } catch (error) {
    console.error('Failed to fetch API stats:', error);
  } finally {
    isLoading.value = false;
  }
};

const getSuccessRateTrend = () => {
  if (!stats.value.overall.previousSuccessRate) return 0;
  return ((stats.value.overall.successRate - stats.value.overall.previousSuccessRate) / stats.value.overall.previousSuccessRate) * 100;
};

const getResponseTimeTrend = () => {
  if (!stats.value.overall.previousAvgResponseTime) return 0;
  return stats.value.overall.avgResponseTime - stats.value.overall.previousAvgResponseTime;
};

const getTrendColor = (trend: number, isResponseTime = false) => {
  if (isResponseTime) {
    return trend <= 0 ? 'text-success-200' : 'text-error-200';
  }
  return trend >= 0 ? 'text-success-200' : 'text-error-200';
};

const getTrendArrow = (trend: number, isResponseTime = false) => {
  if (isResponseTime) {
    return trend <= 0 ? '↓' : '↑';
  }
  return trend >= 0 ? '↑' : '↓';
};

let refreshTimer: ReturnType<typeof setInterval>;

onMounted(() => {
  fetchStats();
  if (props.refreshInterval > 0) {
    refreshTimer = setInterval(fetchStats, props.refreshInterval * 1000);
  }
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-chart-bar" class="text-primary-500" />
        <span class="text-lg font-medium">API Performance</span>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Overall Stats Grid -->
      <div class="grid grid-cols-1 gap-4">
        <!-- Success Rate Card -->
        <div class="relative bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-xl text-white overflow-hidden shadow-lg transform hover:scale-[1.02] transition-all duration-200">
          <div class="absolute top-0 left-0 w-3 h-3 bg-primary-300 rounded-full opacity-50"></div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-primary-800 rounded-full opacity-50"></div>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-heroicons-check-circle" class="text-2xl text-primary-100" />
            <h4 class="text-sm font-medium text-primary-50">Success Rate</h4>
          </div>
          <p class="mt-2 text-3xl font-bold flex items-baseline">
            {{ stats.overall.successRate.toFixed(1) }}%
            <span v-if="getSuccessRateTrend() !== 0" 
                  :class="['text-sm ml-2', getTrendColor(getSuccessRateTrend())]">
              {{ getTrendArrow(getSuccessRateTrend()) }} 
              {{ Math.abs(getSuccessRateTrend()).toFixed(1) }}%
            </span>
          </p>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-400/20 rounded-full blur-xl"></div>
        </div>

        <!-- Average Response Time Card -->
        <div class="relative bg-gradient-to-br from-success-500 to-success-600 p-6 rounded-xl text-white overflow-hidden shadow-lg transform hover:scale-[1.02] transition-all duration-200">
          <div class="absolute top-0 left-0 w-3 h-3 bg-success-300 rounded-full opacity-50"></div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-success-800 rounded-full opacity-50"></div>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-heroicons-clock" class="text-2xl text-success-100" />
            <h4 class="text-sm font-medium text-success-50">Avg Response Time</h4>
          </div>
          <p class="mt-2 text-3xl font-bold flex items-baseline">
            {{ Math.round(stats.overall.avgResponseTime) }}ms
            <span v-if="getResponseTimeTrend() !== 0" 
                  :class="['text-sm ml-2', getTrendColor(getResponseTimeTrend(), true)]">
              {{ getTrendArrow(getResponseTimeTrend(), true) }} 
              {{ Math.abs(getResponseTimeTrend()).toFixed(1) }}ms
            </span>
          </p>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-success-400/20 rounded-full blur-xl"></div>
        </div>

        <!-- Total Requests Card -->
        <div class="relative bg-gradient-to-br from-warning-500 to-warning-600 p-6 rounded-xl text-white overflow-hidden shadow-lg transform hover:scale-[1.02] transition-all duration-200">
          <div class="absolute top-0 left-0 w-3 h-3 bg-warning-300 rounded-full opacity-50"></div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-warning-800 rounded-full opacity-50"></div>
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-heroicons-arrow-path" class="text-2xl text-warning-100" />
            <h4 class="text-sm font-medium text-warning-50">Total Requests</h4>
          </div>
          <p class="mt-2 text-3xl font-bold flex items-baseline">
            {{ stats.overall.totalRequests.toLocaleString() }}
            <span class="text-sm ml-2 text-warning-200">{{ stats.overall.lastUpdateTime ? getTimeAgo(stats.overall.lastUpdateTime) : 'No data' }}</span>
          </p>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-warning-400/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </div>
  </UCard>
</template>