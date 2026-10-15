import { defineChain } from "viem";

export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monadscan", url: "https://monadscan.com" } },
});

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monad Testnet Explorer", url: "https://testnet.monadexplorer.com" } },
  testnet: true,
});

export const NETWORK: "mainnet" | "testnet" =
  process.env.NEXT_PUBLIC_NETWORK === "testnet" ? "testnet" : "mainnet";

export const activeChain = NETWORK === "testnet" ? monadTestnet : monad;
