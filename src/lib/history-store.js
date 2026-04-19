"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "clm_history";
const listeners = new Set();
const EMPTY_HISTORY = [];

let cache = [];
let initialized = false;
let storageListenerAttached = false;

function readFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === "undefined") {
    return;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    cache = readFromStorage();
    listeners.forEach((listener) => listener());
  });

  storageListenerAttached = true;
}

function getSnapshot() {
  if (!initialized) {
    cache = readFromStorage();
    initialized = true;
  }

  attachStorageListener();
  return cache;
}

function getServerSnapshot() {
  return EMPTY_HISTORY;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function save(nextValue) {
  cache = nextValue;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  }

  listeners.forEach((listener) => listener());
}

export function useHistory() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addResult(result) {
  const current = [...getSnapshot()];
  current.unshift({
    ...result,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  });
  save(current);
}
