"use client";

const USER_ID_KEY = "tippmate_user_id";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, id);
}

export function clearStoredUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_ID_KEY);
}
