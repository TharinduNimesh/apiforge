import PocketBase from 'pocketbase';
import { useRuntimeConfig } from '#imports';

// Use the public URL for client-side requests
const config = useRuntimeConfig();
export const pb = new PocketBase(config.public.pocketbaseUrl);

export function usePocketBase() {
    return pb;
}