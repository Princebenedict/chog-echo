"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { DEMO_TOKENS } from "@/lib/demo";
import type { ChogToken } from "@/lib/types";

export function useChogs() {
  const { address, isConnected } = useAccount();
  const [preferDemo, setPreferDemo] = useState(false);

  const query = useQuery({
    queryKey: ["chogs", address],
    enabled: isConnected && !!address,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/nfts?address=${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load your Chogs.");
      return json.tokens as ChogToken[];
    },
  });

  const owned = query.data ?? [];
  const showingDemo = !isConnected || preferDemo;
  const live = isConnected && !preferDemo;

  return {
    isConnected,
    owned,
    tokens: showingDemo ? DEMO_TOKENS : owned,
    showingDemo,
    preferDemo,
    setPreferDemo,
    loading: live && query.isLoading,
    error: live && query.error ? (query.error as Error).message : null,
    emptyOwned: live && query.isSuccess && owned.length === 0,
    refetch: query.refetch,
  };
}
