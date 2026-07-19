const STORAGE_KEY = "meldsync:poc-state:v1";
const ACCESS_MODE_KEY = "meldsync:access-mode:v1";

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function loadAccessMode() {
  try {
    const mode = window.sessionStorage.getItem(ACCESS_MODE_KEY);
    return mode === "owner" ? "owner" : "public";
  } catch {
    return "public";
  }
}

export function saveAccessMode(mode) {
  try {
    window.sessionStorage.setItem(ACCESS_MODE_KEY, mode === "owner" ? "owner" : "public");
  } catch {
    // Access mode can safely fall back to the default public view.
  }
}
