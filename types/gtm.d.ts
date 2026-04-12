interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataLayer?: Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gtag?: (...args: any[]) => void;
}
