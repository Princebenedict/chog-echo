import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monad, monadTestnet, NETWORK } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Chog Echo",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "missing-walletconnect-project-id",
  chains: NETWORK === "testnet" ? [monadTestnet, monad] : [monad, monadTestnet],
  ssr: true,
});
