import { TextDecoder, TextEncoder } from 'util';

/* eslint-disable @typescript-eslint/no-empty-function -- jsdom polyfill stubs are intentionally empty */
// Polyfill ResizeObserver for jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill TextEncoder/TextDecoder (not provided by jsdom, used by fetch/encoding libs)
Object.assign(globalThis, { TextEncoder, TextDecoder });

// Polyfill pointer-capture + scrollIntoView APIs used by Radix UI (jsdom lacks them)
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}
