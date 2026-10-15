"use client";

import { useEffect, useState } from "react";
import type { FeedItem } from "./types";

const KEY = "chog-echo-feed-v1";
const EVENT = "chog-echo-feed";
const MAX_ITEMS = 60;

export function readFeed(): FeedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FeedItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: FeedItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // storage full or blocked: the feed is best effort
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addFeedItem(item: FeedItem) {
  write([item, ...readFeed()]);
}

export function updateFeedItem(id: string, patch: Partial<FeedItem>) {
  write(readFeed().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export function clearFeed() {
  write([]);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readFeed());
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { items, ready };
}
