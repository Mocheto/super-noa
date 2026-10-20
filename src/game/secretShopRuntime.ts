import type { Rect, SecretShop } from "./types";

export { shopRewardSeconds as secretShopRewardSeconds } from "./secretShopGame.ts";

export function canEnterSecretShop(shop: SecretShop | undefined, player: Rect & { grounded: boolean }, used: boolean): boolean {
  if (!shop || used || !player.grounded) return false;
  const center = player.x + player.width / 2;
  return center >= shop.x - 8 && center <= shop.x + shop.width + 8
    && Math.abs(player.y + player.height - shop.y - shop.height) <= 6;
}
