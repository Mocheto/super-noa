import type { PixelIconKind } from "./PixelIcon";
import { conTextos } from "../textos/index.ts";

type StickerDatos = {
  id: string;
  icon: PixelIconKind;
  world: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
};
export type StickerDefinition = StickerDatos & { name: string; hint: string };

/** Pegatinas tal como se declaran: sin textos. Nombre y pista salen del catálogo (`pegatinas.<id>.nombre.rotulo`, `.pista.juntos`). */
const datosPegatinas: StickerDatos[] = [
  { id: "sticker-1-1", icon: "apple", world: 1 },
  { id: "sticker-1-2", icon: "bee", world: 1 },
  { id: "sticker-1-3", icon: "tree", world: 1 },
  { id: "sticker-2-1", icon: "paw", world: 2 },
  { id: "sticker-2-2", icon: "moon", world: 2 },
  { id: "sticker-2-3", icon: "cat", world: 2 },
  { id: "sticker-a-1", icon: "gem", world: 8 },
  { id: "sticker-a-2", icon: "sparkle", world: 8 },
  { id: "sticker-a-3", icon: "crown", world: 8 },
  { id: "sticker-3-1", icon: "pine", world: 3 },
  { id: "sticker-3-2", icon: "wolf", world: 3 },
  { id: "sticker-3-3", icon: "crown", world: 3 },
  { id: "sticker-4-1", icon: "acorn", world: 4 },
  { id: "sticker-4-2", icon: "tooth", world: 4 },
  { id: "sticker-4-3", icon: "crown", world: 4 },
  { id: "sticker-5-1", icon: "wheel", world: 5 },
  { id: "sticker-5-2", icon: "parrot", world: 5 },
  { id: "sticker-5-3", icon: "gem", world: 5 },
  { id: "sticker-6-1", icon: "gem", world: 6 },
  { id: "sticker-6-2", icon: "sparkle", world: 6 },
  { id: "sticker-6-3", icon: "crown", world: 6 },
  { id: "sticker-9-1", icon: "paw", world: 9 },
  { id: "sticker-9-2", icon: "parrot", world: 9 },
  { id: "sticker-9-3", icon: "crown", world: 9 },
  { id: "sticker-10-1", icon: "gem", world: 10 },
  { id: "sticker-10-2", icon: "sparkle", world: 10 },
  { id: "sticker-10-3", icon: "crown", world: 10 },
  { id: "sticker-11-1", icon: "gem", world: 11 },
  { id: "sticker-11-2", icon: "sparkle", world: 11 },
  { id: "sticker-11-3", icon: "crown", world: 11 },
  { id: "sticker-12-1", icon: "sparkle", world: 12 },
  { id: "sticker-12-2", icon: "paw", world: 12 },
  { id: "sticker-12-3", icon: "crown", world: 12 },
  { id: "sticker-13-1", icon: "sparkle", world: 13 },
  { id: "sticker-13-2", icon: "cat", world: 13 },
  { id: "sticker-13-3", icon: "crown", world: 13 },
  { id: "sticker-14-1", icon: "sparkle", world: 14 },
  { id: "sticker-14-2", icon: "gem", world: 14 },
  { id: "sticker-14-3", icon: "crown", world: 14 },
  { id: "sticker-15-1", icon: "sparkle", world: 15 },
  { id: "sticker-15-2", icon: "gem", world: 15 },
  { id: "sticker-15-3", icon: "crown", world: 15 },
  { id: "sticker-16-1", icon: "sparkle", world: 16 },
  { id: "sticker-16-2", icon: "gem", world: 16 },
  { id: "sticker-16-3", icon: "crown", world: 16 },
  { id: "sticker-17-1", icon: "sparkle", world: 17 },
  { id: "sticker-17-2", icon: "moon", world: 17 },
  { id: "sticker-17-3", icon: "crown", world: 17 },
  { id: "sticker-s-1", icon: "sparkle", world: 7 },
  { id: "sticker-s-2", icon: "crown", world: 7 },
  { id: "sticker-s-3", icon: "gem", world: 7 },
];

export const stickerCatalog: StickerDefinition[] = datosPegatinas.map((pegatina) => conTextos(pegatina, {
  name: `pegatinas.${pegatina.id}.nombre.rotulo`, hint: `pegatinas.${pegatina.id}.pista.juntos`,
}) as StickerDefinition);

export type StickerSprite = { src: string; column: 0 | 1 | 2 };

const stickerSprites = new Map<string, StickerSprite>(
  stickerCatalog.map((sticker) => [
    sticker.id,
    {
      src: `./assets/stickers/world-${sticker.world}-v1.webp`,
      column: (Number(sticker.id.at(-1)) - 1) as StickerSprite["column"],
    },
  ]),
);

export const getStickerSprite = (id: string) => stickerSprites.get(id);
