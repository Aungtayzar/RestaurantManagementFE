// Polyfills for jsdom, which does not implement browser APIs used by Headless UI.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = window.ResizeObserver ?? ResizeObserverStub
