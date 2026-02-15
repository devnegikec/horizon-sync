/**
 * useKeyboardShortcut Hook
 * Registers global keyboard shortcuts for triggering actions
 */

import { useEffect } from 'react';

/**
 * Modifier keys for keyboard shortcuts
 */
export interface KeyboardModifiers {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

/**
 * Registers a global keyboard shortcut that triggers a callback
 * @param key - The key to listen for (e.g., 'k', 'Escape')
 * @param modifiers - Modifier keys that must be pressed (ctrl, meta, shift, alt)
 * @param callback - Function to call when the shortcut is triggered
 *
 * @example
 * ```tsx
 * // Register Ctrl+K / Cmd+K to open search
 * useKeyboardShortcut('k', { ctrl: true, meta: true }, () => {
 *   setSearchOpen(true);
 * });
 *
 * // Register Escape to close modal
 * useKeyboardShortcut('Escape', {}, () => {
 *   setModalOpen(false);
 * });
 * ```
 */
export function useKeyboardShortcut(
  key: string,
  modifiers: KeyboardModifiers,
  callback: () => void
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches
      if (event.key?.toLowerCase() !== key?.toLowerCase()) {
        return;
      }

      // Check if all required modifiers match
      // If a modifier is undefined, it means it should NOT be pressed (false)
      const ctrlMatch = modifiers.ctrl === undefined ? !event.ctrlKey : event.ctrlKey === modifiers.ctrl;
      const metaMatch = modifiers.meta === undefined ? !event.metaKey : event.metaKey === modifiers.meta;
      const shiftMatch = modifiers.shift === undefined ? !event.shiftKey : event.shiftKey === modifiers.shift;
      const altMatch = modifiers.alt === undefined ? !event.altKey : event.altKey === modifiers.alt;

      // If all modifiers match, trigger the callback
      if (ctrlMatch && metaMatch && shiftMatch && altMatch) {
        // Prevent default browser behavior
        event.preventDefault();
        callback();
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, modifiers, callback]);
}
