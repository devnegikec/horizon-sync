/**
 * useKeyboardShortcut Hook Unit Tests
 * Tests for keyboard shortcut registration and handling
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from '../../../../../app/features/search/../../../../app/features/search/hooks/useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on document event listeners
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register keydown event listener on mount', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should trigger callback when Ctrl+K is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    // Get the registered event handler
    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Ctrl+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should trigger callback when Cmd+K (Meta+K) is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { meta: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Cmd+K keypress (Mac)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should trigger callback when Escape is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('Escape', {}, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Escape keypress
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not trigger callback when wrong key is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Ctrl+J keypress (wrong key)
    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    handler(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not trigger callback when modifier is missing', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate K keypress without Ctrl
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    handler(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not trigger callback when extra modifier is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Ctrl+Shift+K keypress (extra modifier)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    });

    handler(event);

    // Should not trigger because shift is pressed but not specified
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle multiple modifiers correctly', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true, shift: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Ctrl+Shift+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should be case-insensitive for key matching', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('K', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Ctrl+k keypress (lowercase)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clean up event listener on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    // Get the registered handler
    const handler = addEventListenerSpy.mock.calls[0][1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', handler);
  });

  it('should update handler when callback changes', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(
      ({ cb }) => useKeyboardShortcut('k', { ctrl: true }, cb),
      { initialProps: { cb: callback1 } }
    );

    // Get the first handler
    const handler1 = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate keypress with first callback
    const event1 = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event1, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler1(event1);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    // Rerender with new callback
    rerender({ cb: callback2 });

    // After rerender, the hook should have:
    // - Called removeEventListener (index 0)
    // - Called addEventListener again (index 1)
    // So the new handler is at index 1 of addEventListener calls
    const callCount = addEventListenerSpy.mock.calls.length;
    const handler2 = addEventListenerSpy.mock.calls[callCount - 1][1] as EventListener;

    // Simulate keypress with second callback
    const event2 = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    Object.defineProperty(event2, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler2(event2);
    expect(callback1).toHaveBeenCalledTimes(1); // Still 1
    expect(callback2).toHaveBeenCalledTimes(1); // Now called
  });

  it('should handle Alt modifier correctly', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { alt: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    // Simulate Alt+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: true,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
      writable: true,
    });

    handler(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should prevent default behavior when shortcut matches', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    const preventDefaultSpy = jest.fn();
    Object.defineProperty(event, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true,
    });

    handler(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not prevent default when shortcut does not match', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut('k', { ctrl: true }, callback));

    const handler = addEventListenerSpy.mock.calls[0][1] as EventListener;

    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    const preventDefaultSpy = jest.fn();
    Object.defineProperty(event, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true,
    });

    handler(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});
