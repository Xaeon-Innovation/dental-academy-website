export {};

declare global {
  interface Window {
    /** Meta Pixel (fbevents.js) queue function */
    fbq?: (...args: unknown[]) => void;
  }
}
