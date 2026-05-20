export const welcomeDismissedStorageKey = "playlistly:welcome-dismissed";

export function hasWelcomeBeenDismissed() {
  try {
    return window.localStorage.getItem(welcomeDismissedStorageKey) === "true";
  } catch {
    return false;
  }
}

export function markWelcomeDismissed() {
  try {
    window.localStorage.setItem(welcomeDismissedStorageKey, "true");
  } catch {
    // storage can be full or disabled
  }
}
