import PocketBase from 'pocketbase';

let pb: PocketBase;

export function usePocketBase() {
    if (!pb) {
        // Initialize PocketBase if not already initialized
        pb = new PocketBase('https://pocketbase.eversoft.lk');
    }

    return pb;
}