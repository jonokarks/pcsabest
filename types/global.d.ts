export {};

declare global {
  interface Window {
    confirmStripePayment: (() => Promise<{
      id: string;
      status: string;
      client_secret?: string;
    }>) | undefined;
  }
}
