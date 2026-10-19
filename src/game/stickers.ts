import type { PixelIconKind } from "./PixelIcon";

export type StickerDefinition = {
  id: string;
  name: string;
  icon: PixelIconKind;
  world: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  hint: string;
};

export const stickerCatalog: StickerDefinition[] = [
  { id: "sticker-1-1", name: "Manzana feliz", icon: "apple", world: 1, hint: "Busca sobre las ramas altas." },
  { id: "sticker-1-2", name: "Abeja del prado", icon: "bee", world: 1, hint: "Sube hacia el cielo naranja." },
  { id: "sticker-1-3", name: "Rey de las raíces", icon: "tree", world: 1, hint: "Explora el camino hacia la fortaleza." },
  { id: "sticker-2-1", name: "Huella brillante", icon: "paw", world: 2, hint: "Confía en una plataforma de niebla." },
  { id: "sticker-2-2", name: "Luna violeta", icon: "moon", world: 2, hint: "Mira por encima del sendero nocturno." },
  { id: "sticker-2-3", name: "Bigotes mágicos", icon: "cat", world: 2, hint: "La niebla esconde un camino elevado." },
  { id: "sticker-a-1", name: "Concha de Perla", icon: "gem", world: 8, hint: "Sumérgete bajo la última isla de la laguna." },
  { id: "sticker-a-2", name: "Pez aventurero", icon: "sparkle", world: 8, hint: "Busca por debajo de la segunda pared del arrecife." },
  { id: "sticker-a-3", name: "Corona de las mareas", icon: "crown", world: 8, hint: "Nada bajo el último arco antes del palacio." },
  { id: "sticker-3-1", name: "Pino valiente", icon: "pine", world: 3, hint: "Salta por encima de las huellas." },
  { id: "sticker-3-2", name: "Lobo amigo", icon: "wolf", world: 3, hint: "Escucha el aullido y busca arriba." },
  { id: "sticker-3-3", name: "Corona del bosque", icon: "crown", world: 3, hint: "Está en la ruta más alta de la guarida." },
  { id: "sticker-4-1", name: "Bellota dorada", icon: "acorn", world: 4, hint: "Busca entre las primeras copas altas." },
  { id: "sticker-4-2", name: "Colmillo valiente", icon: "tooth", world: 4, hint: "Cruza el gran vacío sin bajar al suelo." },
  { id: "sticker-4-3", name: "Rey de las bellotas", icon: "crown", world: 4, hint: "Está antes del último duelo, casi en las nubes." },
  { id: "sticker-5-1", name: "Timón sonriente", icon: "wheel", world: 5, hint: "Busca en la plataforma más alta entre los barcos." },
  { id: "sticker-5-2", name: "Loro aventurero", icon: "parrot", world: 5, hint: "Sigue a los loros por encima de las velas." },
  { id: "sticker-5-3", name: "Tesoro del cielo", icon: "gem", world: 5, hint: "Está entre los últimos cañones, antes del capitán." },
  { id: "sticker-6-1", name: "Llave de plata", icon: "gem", world: 6, hint: "Busca entre las almenas del primer pasillo." },
  { id: "sticker-6-2", name: "Fantasma amigo", icon: "sparkle", world: 6, hint: "Sigue los destellos por el laberinto." },
  { id: "sticker-6-3", name: "Corona nocturna", icon: "crown", world: 6, hint: "Está cerca de la sala del conde." },
  { id: "sticker-9-1", name: "Huella fósil", icon: "paw", world: 9, hint: "Busca sobre el primer risco de la isla." },
  { id: "sticker-9-2", name: "Ala tropical", icon: "parrot", world: 9, hint: "Sigue a los terodáctilos por las repisas altas." },
  { id: "sticker-9-3", name: "Corona de Tricera", icon: "crown", world: 9, hint: "Está cerca del nido de la guardiana." },
  { id: "sticker-s-1", name: "Pluma celeste", icon: "sparkle", world: 7, hint: "Vuela por la primera nube alta." },
  { id: "sticker-s-2", name: "Herradura arcoíris", icon: "crown", world: 7, hint: "Busca entre los unicornios de las nubes." },
  { id: "sticker-s-3", name: "Estrella secreta", icon: "gem", world: 7, hint: "Está muy cerca del palacio del cielo." },
];

export type StickerSprite = { src: string; column: 0 | 1 | 2 };

const stickerSprites = new Map<string, StickerSprite>(
  stickerCatalog.map((sticker) => [
    sticker.id,
    {
      src: `./assets/stickers/world-${sticker.world}-v1.png`,
      column: (Number(sticker.id.at(-1)) - 1) as StickerSprite["column"],
    },
  ]),
);

export const getStickerSprite = (id: string) => stickerSprites.get(id);
