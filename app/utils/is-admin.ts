import { usePocketBase } from "~/lib/pocketbase"

export default function(): boolean {
    if (import.meta.server)return false;

    const pb = usePocketBase()
    const user = pb.authStore.record;

    // Check if the user is authenticated and has the 'admin' role
    if (user && user?.role === 'admin') {
        return true
    } 
    
    return false
}