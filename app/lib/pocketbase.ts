import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://pocketbase.eversoft.lk');

export function usePocketBase() {
    return pb;
}