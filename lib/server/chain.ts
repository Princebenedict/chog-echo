import { createPublicClient, http, parseAbi } from "viem";
import { activeChain } from "../chains";

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(process.env.MONAD_RPC_URL || activeChain.rpcUrls.default.http[0]),
});

export const erc721Abi = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]);
