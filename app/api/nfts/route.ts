import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { listOwnedChogs, NftError } from "@/lib/server/nft-source";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "A valid wallet address is required.", code: "BAD_ADDRESS" }, { status: 400 });
  }

  try {
    const tokens = await listOwnedChogs(address);
    return NextResponse.json({ tokens });
  } catch (e) {
    if (e instanceof NftError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    return NextResponse.json({ error: "Could not load Chogs for this wallet.", code: "UNKNOWN" }, { status: 500 });
  }
}
