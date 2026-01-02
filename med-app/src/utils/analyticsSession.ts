export function getSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const STORAGE_KEY = "sht-session-id";
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}
