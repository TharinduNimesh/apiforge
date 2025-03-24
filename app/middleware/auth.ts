import { usePocketBase } from '~/lib/pocketbase'

export default defineNuxtRouteMiddleware((to) => {
    if (import.meta.server) return;

    const pb = usePocketBase()

    // Check if user is authenticated
    const isAuthenticated = pb.authStore.record

    // If trying to access protected route without auth
    if (!isAuthenticated) {
        return navigateTo('/auth/sign-in')
    }

    // If authenticated user tries to access auth pages
    if (to.path.startsWith('/auth') && isAuthenticated) {
        return navigateTo('/console')
    }

    return;
});