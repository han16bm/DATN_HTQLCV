let accessToken: string | null = null;
let refreshHandler: (() => Promise<void>) | null = null;
let refreshFlight: Promise<void> | null = null;
export const token = {
  get: () => accessToken,
  set: (value: string | null) => {
    accessToken = value;
  },
};
export function registerRefresh(handler: (() => Promise<void>) | null) {
  refreshHandler = handler;
}
export function canRefresh() {
  return refreshHandler !== null;
}
export function refreshSingleFlight() {
  if (!refreshFlight) {
    const handler = refreshHandler;
    if (!handler) return Promise.reject(new Error("Chưa thiết lập phiên."));
    refreshFlight = handler().finally(() => {
      refreshFlight = null;
    });
  }
  return refreshFlight;
}
