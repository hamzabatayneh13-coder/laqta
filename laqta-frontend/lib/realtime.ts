export const AUCTION_CHANNEL = "laqta-auctions";

export type AuctionMessage =
  | { type: "BID_PLACED"; auctionId: string; ts: number };

export function postBidPlaced(auctionId: string) {
  if (typeof window === "undefined") return;
  const bc = new BroadcastChannel(AUCTION_CHANNEL);
  bc.postMessage({ type: "BID_PLACED", auctionId, ts: Date.now() } satisfies AuctionMessage);
  bc.close();
}
