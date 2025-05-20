interface Workbox {
  addEventListener: (type: string, callback: (event: any) => void) => void;
  messageSkipWaiting: () => void;
}

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export {}; 