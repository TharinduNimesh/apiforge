import PocketBase from 'pocketbase'
import { useRuntimeConfig } from '#imports'

let pb: PocketBase

export function usePocketBase() {
    if (!pb) {
        const config = useRuntimeConfig()
        pb = new PocketBase('https://pocketbase.eversoft.lk')
        
        // Authenticate with super admin token
        if (config.PB_SUPER_ADMIN_KEY) {
            pb.authStore.save(config.PB_SUPER_ADMIN_KEY, null)
        }
    }

    return pb
}