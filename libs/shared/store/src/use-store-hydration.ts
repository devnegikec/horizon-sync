import { useSyncExternalStore } from 'react';

import { useUserStore } from './user-store';

/**
 * Subscribe function for useSyncExternalStore.
 * Subscribes to the persist hydration finish event.
 */
function subscribe(onStoreChange: () => void): () => void {
  // If persist API is available, subscribe to hydration finish
  if (useUserStore.persist?.onFinishHydration) {
    return useUserStore.persist.onFinishHydration(onStoreChange);
  }
  // If persist API is not available (shouldn't happen), call immediately
  onStoreChange();
   
  return () => { /* noop unsubscribe */ };
}

/**
 * Snapshot function for useSyncExternalStore.
 * Returns the current hydration status.
 */
function getSnapshot(): boolean {
  if (useUserStore.persist?.hasHydrated) {
    return useUserStore.persist.hasHydrated();
  }
  // If persist API is not available, assume hydrated
  return true;
}

/**
 * Server snapshot — always true (no hydration needed on server).
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Hook that returns true once the Zustand persist middleware has finished
 * rehydrating the user store from localStorage.
 *
 * Use this to gate rendering of auth-dependent components so they don't
 * flash or redirect before the persisted refreshToken is available.
 */
export function useStoreHydration(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
