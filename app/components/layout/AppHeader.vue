<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { usePocketBase } from '~/lib/pocketbase';

const pb = usePocketBase();
const router = useRouter();

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

// Create a named function for the event listener
const handleScroll = () => {
    isScrolled.value = window.scrollY > 20;
};

const navigationItems = computed(() => [
    {
        label: "Dashboard",
        icon: "i-heroicons-home",
        to: "/console",
    },
    {
        label: "Users",
        icon: "i-heroicons-users",
        to: "/console/users",
    },
    {
        label: "Departments",
        icon: "i-heroicons-building-office",
        to: "/console/departments",
    },
]);

// Replace mock user with actual auth store user
const user = computed(() => ({
    name: pb.authStore.record?.name || 'Unknown User',
    email: pb.authStore.record?.email || '',
    role: pb.authStore.record?.role || 'user'
}));

// Update dropdown items to use computed user
const dropdownItems = computed(() => [
    {
        label: user.value.name,
        avatar: {
            text: getUserInitials(user.value.name)
        },
        disabled: true
    },
    {
        label: "Profile Settings",
        icon: "i-heroicons-user",
        onSelect: () => router.push('/console/profile')
    },
    {
        label: "Logout",
        class: "text-red-500 hover:!text-red-500",
        onSelect: () => {
            pb.authStore.clear();
            router.push('/auth/sign-in');
        },
        slot: "logout"
    }
]);

// Mobile sidebar menu items
interface MenuItem {
    header?: string;
    label?: string;
    icon?: string;
    class?: string;
    to?: string;
    click?: () => void;
}

const sidebarMenuItems = computed<MenuItem[]>(() => [
    {
        header: "Account Settings",
        class: "text-gray-500 text-xs uppercase font-semibold mb-2",
    },
    {
        label: "Profile Settings",
        icon: "i-heroicons-user",
        to: "/console/profile",
    },
    {
        label: "Logout",
        class: "text-red-500",
        icon: "i-heroicons-power-20-solid",
        click: () => {
            pb.authStore.clear();
            router.push('/auth/sign-in');
        },
    },
]);

const getUserInitials = (name: string) => {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
};

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
    if (isMobileMenuOpen.value) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
};

// Close mobile menu on route change
router.afterEach(() => {
    isMobileMenuOpen.value = false;
});

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
    document.body.style.overflow = '';
});
</script>

<template>
    <div class="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 py-4">
        <nav class="mx-auto max-w-6xl transition-all duration-300"
            :class="[isScrolled ? 'mt-2 rounded-xl shadow-lg' : 'mt-4 rounded-2xl']">
            <div class="relative overflow-hidden rounded-xl">
                <div class="absolute inset-0 backdrop-blur-xl bg-white/75" :class="{ 'bg-white/85': isScrolled }"></div>
                <div class="relative px-3 sm:px-6 lg:px-8">
                    <div class="flex h-14 justify-between items-center">
                        <div class="flex items-center">
                            <div class="flex items-center gap-2 sm:gap-3">
                                <ApplicationLogo size="sm" to="/console" />
                            </div>
                        </div>

                        <div v-if="isAdmin()" class="hidden md:flex flex-grow mx-8">
                            <ul class="flex items-center gap-2">
                                <li v-for="item in navigationItems" :key="item.to">
                                    <NuxtLink :to="item.to" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate"
                                            class="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors relative"
                                            :class="{
                                                'text-orange-500 bg-orange-50': isActive,
                                            }">
                                            <UIcon :name="item.icon" class="mr-2" />
                                            {{ item.label }}
                                            <div v-if="isActive"
                                                class="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400 rounded-full">
                                            </div>
                                        </a>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </div>

                        <div class="flex items-center gap-4">
                            <UButton v-if="user.role === 'admin'" color="neutral" variant="ghost" 
                                icon="i-heroicons-bars-3"
                                class="md:hidden" 
                                @click="toggleMobileMenu" />

                            <div class="hidden md:flex items-center">
                                <UDropdownMenu :items="dropdownItems"  arrow>
                                    <UButton color="neutral" variant="ghost" class="rounded-full">
                                        <UAvatar :alt="user.name" :text="getUserInitials(user.name)" />
                                    </UButton>

                                    <template #logout-leading>
                                        <UIcon name="i-heroicons-power-20-solid" class="!text-red-500 hover:bg-red-50 hover:text-red-500" />
                                    </template>
                                </UDropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <Transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isMobileMenuOpen" class="fixed inset-0 backdrop-blur-sm bg-white/50 z-40 md:hidden"
                @click="toggleMobileMenu">
                <Transition enter-active-class="transition ease-out duration-300 transform"
                    enter-from-class="translate-x-full" enter-to-class="translate-x-0"
                    leave-active-class="transition ease-in duration-200 transform" leave-from-class="translate-x-0"
                    leave-to-class="translate-x-full">
                    <div v-if="isMobileMenuOpen"
                        class="absolute right-0 top-0 h-full w-72 bg-white/95 backdrop-blur-xl shadow-xl" @click.stop>
                        <div class="p-6 bg-orange-50 border-b border-orange-100">
                            <div class="flex items-center gap-3">
                                <UAvatar :alt="user.name" size="lg" :text="getUserInitials(user.name)" />
                                <div class="min-w-0">
                                    <h3 class="font-semibold text-gray-800 truncate">
                                        {{ user.name }}
                                    </h3>
                                    <p class="text-sm text-gray-500 truncate" :title="user.email">
                                        {{ user.email }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="absolute top-4 right-4"
                            @click="toggleMobileMenu" />

                        <div class="p-4" v-if="isAdmin()">
                            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">
                                Navigation
                            </h4>
                            <ul class="space-y-2">
                                <li v-for="item in navigationItems" :key="item.to">
                                    <NuxtLink :to="item.to" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate"
                                            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                            :class="{
                                                'text-orange-500 bg-orange-50': isActive,
                                            }">
                                            <UIcon :name="item.icon" class="mr-3" />
                                            {{ item.label }}
                                        </a>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </div>

                        <div class="p-4 border-t">
                            <template v-for="(item, index) in sidebarMenuItems" :key="index">
                                <h4 v-if="item.header" :class="item.class">
                                    {{ item.header }}
                                </h4>
                                <template v-else-if="item.to">
                                    <NuxtLink :to="item.to" custom v-slot="{ href, navigate }">
                                        <a :href="href" @click="navigate"
                                            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                            :class="item.class">
                                            <UIcon :name="`${item.icon}`" class="mr-3" />
                                            {{ item.label }}
                                        </a>
                                    </NuxtLink>
                                </template>
                                <button v-else-if="item.click" @click="item.click"
                                    class="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                    :class="item.class">
                                    <UIcon :name="`${item.icon}`" class="mr-3" />
                                    {{ item.label }}
                                </button>
                            </template>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>

    <div class="h-24"></div>
</template>