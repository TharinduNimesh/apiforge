import isAdmin from '~/utils/is-admin'

// List of paths that should only be accessible by admins
const adminOnlyPaths = [
  '/console/users',
  '/console/apis/create',
  '/console/departments'
]

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Check if the current path or its parent path is admin-only
  const isAdminRoute = adminOnlyPaths.some(path => to.path.startsWith(path))
  
  if (isAdminRoute && !isAdmin()) {
    // If user is not an admin and tries to access admin route, redirect to console
    return navigateTo('/console')
  }
})