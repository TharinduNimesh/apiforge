import PocketBase from 'pocketbase'
import { useRuntimeConfig } from '#imports'

let adminPb: PocketBase
let userPb: PocketBase

export function getAdminPocketBase() {
    if (!adminPb) {
        const config = useRuntimeConfig()
        adminPb = new PocketBase('https://pocketbase.eversoft.lk')
        
        // Authenticate with super admin token
        if (config.PB_SUPER_ADMIN_KEY) {
            adminPb.authStore.save(config.PB_SUPER_ADMIN_KEY, null)
        }
    }
    return adminPb
}

export async function getUserPocketBase(token?: string) {
    // Create new instance for each user request to avoid token mixing
    userPb = new PocketBase('https://pocketbase.eversoft.lk')
    
    if (token) {
        userPb.authStore.save(token, null);
        console.log(userPb.authStore.isValid);
        await userPb.collection("users").authRefresh();
    }
    
    return userPb
}