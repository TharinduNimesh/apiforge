import PocketBase from 'pocketbase'

let adminPb: PocketBase
let userPb: PocketBase

export function getAdminPocketBase() {
    console.log('[PocketBase] Getting admin PocketBase instance')
    if (!adminPb) {
        console.log('[PocketBase] Creating new admin PocketBase instance')
        const config = useRuntimeConfig()
        adminPb = new PocketBase(config.pocketbaseUrl) // Use internal URL for server-side
        console.log('[PocketBase] Using PocketBase URL:', config.pocketbaseUrl)
        
        // Authenticate with super admin token
        if (config.PB_SUPER_ADMIN_KEY) {
            console.log('[PocketBase] Authenticating admin instance with super admin token')
            adminPb.authStore.save(config.PB_SUPER_ADMIN_KEY, null)
        } else {
            console.warn('[PocketBase] No super admin token provided')
        }
    }
    return adminPb
}

export async function getUserPocketBase(token?: string) {
    console.log('[PocketBase] Getting user PocketBase instance')
    const config = useRuntimeConfig()
    userPb = new PocketBase(config.pocketbaseUrl) // Use internal URL for server-side
    console.log('[PocketBase] Using PocketBase URL:', config.pocketbaseUrl)
    
    if (token) {
        console.log('[PocketBase] Authenticating user instance with provided token')
        userPb.authStore.save(token, null);
        try {
            await userPb.collection("users").authRefresh();
            console.log('[PocketBase] Successfully refreshed user authentication')
        } catch (error) {
            console.error('[PocketBase] Failed to refresh user authentication:', error)
            throw error
        }
    } else {
        console.warn('[PocketBase] No user token provided')
    }
    
    return userPb
}