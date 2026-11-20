# Recursos de `public/assets`: sin uso y PNG pesados

Investigación de [Inventariar recursos sin usar y PNG pesados de public](https://github.com/Mocheto/super-noa/issues/288), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Hecha sobre `main` en `3255271`. No se ha cambiado ni borrado nada de `public/` ni de `src/`, ni se han subido imágenes convertidas.

## Resumen

`public/assets` tiene 352 archivos y 178 MB. Si se aplica todo lo que sigue, bajaría a unos **119 MB, unos 59 MB menos (un 33 %)**, sin perder transparencia ni cambiar ningún píxel:

| Paso | Archivos | Ahorro |
|---|---:|---:|
| Borrar los recursos que no carga nada (lista segura) | 10 | 12,3 MB |
| Borrar los PNG gemelos de `optimizedImages`, que el juego nunca pide | 16 | 14,5 MB |
| Pasar a WebP sin pérdida los PNG que sí se cargan | 158 | 32,5 MB (de 107,9 a 75,5 MB) |
| **Total** | | **≈ 59 MB** |

Con WebP «casi sin pérdida» (`-near_lossless 60`) los 158 PNG bajarían a 51,8 MB (56 MB menos en vez de 32,5), pero eso cambia ligeramente los valores de color y rompería las pruebas que leen píxeles exactos; se deja como opción, no como recomendación.

Ojo: esto mide lo que se publica en Pages. Lo que descarga cada jugadora depende de lo que se pida (`getLevelAssets` ya carga por mundo); la conversión a WebP sí reduce también esa descarga.

## Método

1. Se listaron los 352 archivos de `public/assets`.
2. Se buscó cada ruta relativa (`sprites/x.png`) y cada nombre de archivo, de forma literal, en `src/` (sin las pruebas) e `index.html`. Por separado, en pruebas, `scripts/`, `prototypes/`, `docs/` y documentos raíz.
3. Los 151 archivos sin coincidencia literal se resolvieron a mano contra las plantillas de nombres:
   - `assets.ts`: `world-${id}-v1.webp` (pegatinas), `world-${world}${world <= 5 ? "-hd-v1" : ""}.webp` (fondos, también en `worldMapData.ts`), los atlas `worldCharacters` y `worldTerrain` de los mundos 10 a 17 (incluidos `winter-village`, `toy-factory` y `gift-warehouse` según `level.theme`), y los nombres sin extensión de `optimizedImages`.
   - `bosses.ts` `assetPrefix` + `-${frame}.png` en `BossBattle.tsx`, `GuardianMiniGame.tsx`, `GameCanvas.tsx`, `App.tsx` y `MeriendaJabatosGame.tsx`: poses 0 a 4.
   - `BossBattle.tsx`: `noa-rps-${frame}${armorSuffix}.png` con `armorSuffix` vacío o `-gold-armor-v1`, y `noa-sprite-sheet${armorSuffix}.png`.
   - `santaBattleRendering.ts`: `boss-siroco-sheet-v1.png` y `boss-don-silbato-sheet-v1.png`.
   - `exploreRendering.ts`: `world-cat-${kitten.cat}-v1.png`.
   - `catParty.ts` y `beeNinja.ts`: `./assets/audio/<juego>/${id}.wav` con las listas `SAMPLE_IDS` (todos los `.wav` están en ellas).
   - `catPartyArt.ts` y `CatPartyGame.tsx`: `${sprites}/…webp`.
4. `optimizedAssetSource` (en `assets.ts`) cambia `.png` por `.webp` solo para las 17 rutas de `optimizedImages`, y lo usan `getImage`, `GameAssetIcon`, `WorldMap`, `BossBattle` y `App.tsx`. Se revisó cada referencia a esos 17 PNG para ver si alguna los pide sin pasar por esa función.
5. Los PNG que sí se cargan se convirtieron, en una carpeta temporal fuera del repositorio, con `cwebp -lossless -z 9` (sin pérdida, conserva el alfa) y con `cwebp -lossless -near_lossless 60 -z 9`.

Límite: una coincidencia literal en `src/` se ha tomado como uso, sin comprobar si ese código llega a ejecutarse (por ejemplo, pantallas de `?prueba=`).

## Archivos sin uso seguro

Nada del juego, ni pruebas, ni scripts los pide. 10 archivos, 12,3 MB.

| Archivo | KB | Por qué |
|---|---:|---|
| `worlds/noa-adventure-map-v1.webp` | 2.804 | El mapa usa `noa-adventure-map-v2.webp` (`mapLandscape` en `worldMapData.ts`). Solo lo nombran `CREDITS.md`, `MAP_ART.md` y `README.md`. |
| `atlases/boss-don-aleta-v1.png` | 2.031 | Don Aleta usa las poses sueltas `sprites/boss-don-aleta-0…4.png` (`assetPrefix`). Solo lo nombra `WATER_WORLD.md`. |
| `sprites/boss-reina-arcoiris-sheet-v1.png` | 1.804 | La Reina Arcoíris usa `boss-reina-arcoiris-v2-0…4.png`. |
| `sprites/boss-papa-noel-sheet-v1.png` | 1.300 | Se usa `boss-papa-noel-sheet-v2.png` (`bosses.ts`, `santaBattleAssets.ts`). |
| `alternatives/noa-armor-v1.png` | 1.143 | Coraza alternativa guardada «pero no está activa» según `README.md`. Habría que quitar esa frase del README. |
| `sprites/noa-cat-run-gold-armor-v1.png` | 693 | Noa con gatito y coraza: `GameCanvas.tsx` siempre pide las versiones sin coraza (`noa-cat-*-v1/v2`), con o sin manzana. |
| `sprites/noa-cat-throw-gold-armor-v1.png` | 685 | Igual. |
| `sprites/noa-cat-yarn-gold-armor-v1.png` | 663 | Igual. |
| `sprites/noa-cat-jump-gold-armor-v1.png` | 601 | Igual. |
| `sprites/boss-don-aleta-5.png` | 335 | Los duelos solo piden las poses 0 a 4 (`frame` va de 0 a 4 en `BossBattle`, `GuardianMiniGame`, `MeriendaJabatosGame`). |

Antes de borrar los cuatro `noa-cat-*-gold-armor-v1.png` conviene decidir si se quería que Noa con gatito llevara coraza: entonces el arreglo sería usarlos, no borrarlos.

## PNG gemelos que el juego nunca pide

Estos 16 PNG tienen su `.webp` al lado y están en `optimizedImages`: todas sus referencias pasan por `getImage` u `optimizedAssetSource`, así que el navegador solo pide el WebP. 14,5 MB. El comentario de `assets.ts` dice que los PNG «quedan para otras pantallas», pero ninguna pantalla los pide.

| Archivo | KB | Lo nombran fuera del juego |
|---|---:|---|
| `home-adventure-v3.png` | 2.611 | `assets.test.ts` (compara PNG y WebP) |
| `atlases/platform-tiles-v1.png` | 1.946 | — |
| `sprites/noa-sprite-sheet-gold-armor-v1.png` | 1.753 | — |
| `sprites/noa-sprite-sheet.png` | 1.652 | `assets.test.ts`; lo leen `prototypes/tools/abeja-ninja-sprites.py` y `tambor-armonia-arte.py`; `formatos-pantalla-prototipo.html` |
| `sprites/goal-rescue-v1.png` | 853 | — |
| `sprites/noa-jump-gold-armor-v1.png` | 706 | — |
| `sprites/noa-jump-v2.png` | 640 | prototipos HTML |
| `sprites/noa-cat-run-v2.png` | 633 | — |
| `sprites/noa-cat-yarn-v2.png` | 611 | prototipos HTML |
| `sprites/noa-cat-throw-v1.png` | 568 | — |
| `sprites/noa-cat-jump-v2.png` | 536 | — |
| `atlases/world-1-tiles-v1.png` | 483 | prototipo HTML |
| `atlases/enemies-v1.png` | 392 | — |
| `atlases/collectibles-v1.png` | 332 | `assets.test.ts`; prototipos HTML |
| `sprites/goal-flag-v1.png` | 235 | — |
| `sprites/checkpoint-v1.png` | 221 | — |

`sprites/yarn-ball-v1.png` es la excepción: también está en `optimizedImages`, pero `App.tsx` (línea 1004, `<img className="party-yarn">`) lo pide directo, sin `optimizedAssetSource`. Se cuenta como PNG cargado; basta con envolver esa ruta para dejar de pedirlo.

## Archivos dudosos

No los carga el juego, pero algo del repositorio los nombra o parecen arte preparado para más adelante. 0,45 MB en total, así que el ahorro es pequeño.

| Archivo | KB | Por qué es dudoso |
|---|---:|---|
| `sprites/noa-abeja-v0.png` | 406 | Sustituido por `noa-abeja-v1.webp`, pero lo usan `prototypes/abeja-ninja-*.html` y lo escribe `prototypes/tools/abeja-ninja-sprites.py`. |
| `sprites/tarro-miel-v0.png` | 1 | Igual, sustituido por `tarro-miel-v1.webp`. |
| `sprites/rama-bellotas-llena-v1.webp` | 15 | Recortado para la merienda (`docs/art/merienda-jabatos-v1.md`), pero el juego solo usa `rama-bellotas-vacia-v1.webp`. |
| `sprites/bocadillo-v1.webp` | 6 | Recortado por `variedad-recorte.py` (`docs/art/variedad-v1.md`); no se usa. |
| `sprites/bellota-brillo-v1.webp` | 4 | Premio de la merienda documentado en su arte; no se usa. |
| `sprites/secret-shop-kittens-v1.png` | 7 | No se usa (la tienda usa `shop-world-cats-*-v1.png`), pero `scripts/build-secret-shop-art.mjs` lo vuelve a escribir: habría que quitarlo también del script. |

También son dudosos, por el límite del método, los recursos que solo se piden desde pantallas de desarrollo (`MuestraInterfaz.tsx`, `testScreens.ts`); se han contado como usados.

## PNG que se cargan en la partida

158 PNG, 107,9 MB. Ninguno sale más grande en WebP sin pérdida.

| Carpeta | PNG | Tamaño | WebP sin pérdida | WebP casi sin pérdida |
|---|---:|---:|---:|---:|
| `atlases/` | 37 | 44,9 MB | 32,0 MB | 20,6 MB |
| `sprites/` | 119 | 63,0 MB | 43,5 MB | 31,2 MB |
| `worlds/` | 2 | 0,01 MB | 0,00 MB | 0,00 MB |
| **Total** | **158** | **107,9 MB** | **75,5 MB (−32,5)** | **51,8 MB (−56,2)** |

Tabla completa, de mayor a menor (KB; «se pide en» es el archivo de `src/` que nombra la ruta, o la plantilla que la construye):

| Archivo | PNG (KB) | WebP sin pérdida (KB) | WebP casi sin pérdida (KB) | Se pide en |
|---|---:|---:|---:|---|
| `atlases/water-terrain-v1.png` | 2.470 | 1.591 | 990 | assets.ts |
| `atlases/adventure-precipices-v1.png` | 2.174 | 1.612 | 1.012 | assets.ts |
| `atlases/dinosaur-island-v1.png` | 2.097 | 1.670 | 1.064 | assets.ts |
| `sprites/sea-reef-wall-v2.png` | 1.864 | 1.444 | 866 | assets.ts |
| `sprites/boss-papa-noel-sheet-v2.png` | 1.825 | 884 | 598 | bosses.ts, santaBattleAssets.ts |
| `sprites/noa-swim-v1.png` | 1.825 | 999 | 706 | assets.ts |
| `sprites/boss-gate-v1.png` | 1.762 | 1.422 | 923 | assets.ts |
| `atlases/giant-valley-terrain-v1.png` | 1.736 | 1.327 | 773 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/sky-lift-v1.png` | 1.684 | 773 | 492 | assets.ts |
| `atlases/volcano-characters-v1.png` | 1.668 | 1.342 | 901 | bosses.ts |
| `atlases/desert-enemies-v1.png` | 1.664 | 1.162 | 695 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/music-terrain-v1.png` | 1.656 | 793 | 541 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/castle-v1.png` | 1.581 | 1.238 | 790 | assets.ts |
| `atlases/train-enemies-v1.png` | 1.572 | 1.087 | 640 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/train-terrain-v1.png` | 1.520 | 1.064 | 632 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/ice-mountain-characters-v1.png` | 1.465 | 1.122 | 789 | bosses.ts |
| `atlases/giant-valley-characters-v1.png` | 1.460 | 1.182 | 796 | MuestraInterfaz.tsx, bosses.ts |
| `atlases/toy-factory-enemies-v1.png` | 1.458 | 1.050 | 654 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/boss-condesa-niebla-3.png` | 1.413 | 1.103 | 855 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/world-cat-9-v1.png` | 1.395 | 1.050 | 782 | worldMapData.ts |
| `atlases/winter-village-enemies-v1.png` | 1.383 | 975 | 595 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/boss-siroco-sheet-v1.png` | 1.363 | 1.006 | 646 | bosses.ts |
| `atlases/music-characters-v1.png` | 1.361 | 995 | 685 | bosses.ts |
| `sprites/boss-reina-arcoiris-v2-3.png` | 1.359 | 1.101 | 767 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-don-silbato-sheet-v1.png` | 1.342 | 949 | 643 | bosses.ts |
| `sprites/boss-reina-arcoiris-v2-2.png` | 1.284 | 1.004 | 718 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/secret-vine-transition-v1.png` | 1.279 | 442 | 306 | App.tsx |
| `atlases/ice-mountain-terrain-v1.png` | 1.256 | 967 | 645 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/enemy-jumping-fish-v1.png` | 1.245 | 487 | 389 | assets.ts |
| `sprites/world-cat-6-v1.png` | 1.238 | 893 | 679 | App.tsx, worldMapData.ts |
| `atlases/gift-warehouse-enemies-v1.png` | 1.233 | 918 | 639 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/spring-large-v1.png` | 1.228 | 978 | 625 | assets.ts |
| `sprites/boss-reina-arcoiris-v2-1.png` | 1.190 | 939 | 657 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `atlases/sky-kingdom-characters-v1.png` | 1.183 | 783 | 518 | bosses.ts |
| `atlases/gift-warehouse-terrain-v1.png` | 1.178 | 882 | 517 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/world-cat-7-v1.png` | 1.169 | 871 | 670 | worldMapData.ts |
| `sprites/boss-reina-arcoiris-v2-4.png` | 1.122 | 880 | 623 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/world-cat-14-v1.png` | 1.104 | 831 | 539 | worldMapData.ts |
| `atlases/desert-terrain-v1.png` | 1.101 | 813 | 490 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/toy-factory-terrain-v1.png` | 1.084 | 800 | 453 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/world-cat-15-v1.png` | 1.080 | 790 | 604 | worldMapData.ts |
| `sprites/boss-reina-arcoiris-v2-0.png` | 1.074 | 840 | 595 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `atlases/volcano-terrain-v1.png` | 1.066 | 830 | 569 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `sprites/world-cat-2-v1.png` | 1.046 | 745 | 562 | App.tsx, detourRendering.ts, worldMapData.ts |
| `sprites/world-cat-10-v1.png` | 1.041 | 766 | 579 | worldMapData.ts |
| `sprites/guardian-game-icons-v1.png` | 1.040 | 816 | 578 | GuardianMiniGame.tsx |
| `sprites/world-cat-11-v1.png` | 991 | 677 | 547 | worldMapData.ts |
| `atlases/castle-enemies-v1.png` | 990 | 745 | 567 | assets.ts |
| `sprites/world-cat-13-v1.png` | 985 | 721 | 547 | worldMapData.ts |
| `sprites/world-cat-4-v1.png` | 980 | 709 | 539 | worldMapData.ts |
| `sprites/world-cat-3-v1.png` | 977 | 698 | 549 | worldMapData.ts |
| `sprites/world-cat-16-v1.png` | 951 | 673 | 534 | worldMapData.ts |
| `sprites/noa-rps-1-gold-armor-v1.png` | 919 | 630 | 474 | plantilla en BossBattle.tsx |
| `sprites/world-cat-8-v1.png` | 914 | 666 | 528 | assets.ts, worldMapData.ts |
| `sprites/world-cat-5-v1.png` | 903 | 662 | 488 | worldMapData.ts |
| `sprites/noa-rps-3-gold-armor-v1.png` | 902 | 633 | 474 | plantilla en BossBattle.tsx |
| `sprites/noa-rps-2-gold-armor-v1.png` | 889 | 608 | 455 | plantilla en BossBattle.tsx |
| `sprites/world-cat-1-v1.png` | 887 | 663 | 497 | App.tsx, MuestraInterfaz.tsx, worldMapData.ts |
| `sprites/noa-rps-0-gold-armor-v1.png` | 877 | 591 | 450 | plantilla en BossBattle.tsx |
| `atlases/dinosaur-enemies-v1.png` | 876 | 668 | 522 | assets.ts |
| `atlases/secret-sky-v1.png` | 873 | 661 | 500 | AvionetaGame.tsx, assets.ts |
| `atlases/santa-boss-terrain-v1.png` | 871 | 602 | 354 | santaBattleAssets.ts |
| `sprites/dew-trampoline-v1.png` | 868 | 502 | 414 | assets.ts |
| `sprites/world-cat-12-v1.png` | 860 | 604 | 478 | worldMapData.ts |
| `atlases/winter-village-terrain-v1.png` | 777 | 531 | 322 | plantilla en assets.ts (`worldCharacters`/`worldTerrain`) |
| `atlases/water-enemies-v1.png` | 726 | 524 | 390 | assets.ts |
| `sprites/rps-icons-v1.png` | 659 | 396 | 332 | BossBattle.tsx |
| `atlases/world-2-tiles-v1.png` | 626 | 451 | 284 | assets.ts |
| `atlases/world-4-tiles-v1.png` | 598 | 416 | 243 | assets.ts |
| `sprites/noa-tambor-v0.png` | 515 | 338 | 219 | ArmoniaDrumGame.tsx |
| `atlases/world-3-tiles-v1.png` | 513 | 351 | 214 | assets.ts |
| `sprites/ui-heart-v1.png` | 506 | 312 | 295 | CasaGatitos.tsx, GameAssetIcon.tsx, chaseRendering.ts |
| `atlases/sky-kingdom-terrain-v1.png` | 505 | 307 | 217 | assets.ts |
| `atlases/world-5-tiles-v1.png` | 504 | 348 | 231 | assets.ts |
| `atlases/secret-detours-v2.png` | 470 | 337 | 211 | detours.ts |
| `sprites/boss-reina-tricera-0.png` | 440 | 297 | 194 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-reina-tricera-2.png` | 440 | 297 | 194 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-condesa-niebla-0.png` | 419 | 293 | 201 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-condesa-niebla-2.png` | 410 | 285 | 196 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-reina-tricera-3.png` | 404 | 274 | 178 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/enemy-boar-v2.png` | 402 | 258 | 219 | assets.ts |
| `sprites/boss-condesa-niebla-1.png` | 396 | 276 | 189 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-reina-tricera-1.png` | 380 | 256 | 168 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-capitan-celeste-1.png` | 377 | 254 | 184 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-reina-tricera-4.png` | 370 | 250 | 164 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-capitan-celeste-2.png` | 366 | 245 | 178 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-rey-zarzal-3.png` | 366 | 249 | 155 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-rey-zarzal-2.png` | 357 | 243 | 149 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-capitan-celeste-3.png` | 357 | 240 | 175 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-capitan-celeste-0.png` | 356 | 242 | 175 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-rey-zarzal-0.png` | 354 | 241 | 149 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-rey-zarzal-1.png` | 354 | 240 | 151 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/noa-rps-3.png` | 344 | 217 | 161 | plantilla en BossBattle.tsx |
| `sprites/boss-gran-jabali-0.png` | 340 | 225 | 137 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `atlases/cave-v1.png` | 339 | 226 | 143 | assets.ts |
| `sprites/boss-don-aleta-3.png` | 338 | 197 | 144 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-don-aleta-2.png` | 336 | 192 | 141 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/noa-rps-2.png` | 334 | 208 | 155 | plantilla en BossBattle.tsx |
| `sprites/boss-gran-jabali-1.png` | 334 | 220 | 138 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-don-aleta-1.png` | 334 | 188 | 137 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/noa-rps-0.png` | 334 | 207 | 154 | plantilla en BossBattle.tsx |
| `sprites/boss-gran-lobo-0.png` | 333 | 223 | 145 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/noa-rps-1.png` | 333 | 208 | 155 | plantilla en BossBattle.tsx |
| `sprites/boss-capitan-celeste-4.png` | 333 | 223 | 162 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-gran-jabali-2.png` | 331 | 218 | 138 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/yarn-ball-v1.png` | 330 | 214 | 173 | App.tsx, GameCanvas.tsx, chaseRendering.ts |
| `sprites/boss-gran-lobo-2.png` | 329 | 220 | 145 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-gran-jabali-3.png` | 326 | 215 | 135 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-don-aleta-0.png` | 325 | 180 | 131 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-gran-lobo-3.png` | 321 | 214 | 142 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-gran-lobo-1.png` | 321 | 215 | 140 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/cannon-v1.png` | 318 | 238 | 157 | assets.ts |
| `sprites/boss-gran-jabali-4.png` | 310 | 208 | 134 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-rey-zarzal-4.png` | 306 | 212 | 139 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-don-aleta-4.png` | 301 | 148 | 107 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/enemy-bird-v2.png` | 300 | 191 | 159 | AvionetaGame.tsx, assets.ts |
| `sprites/boss-condesa-niebla-4.png` | 299 | 236 | 160 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/world-cat-17-v1.png` | 297 | 181 | 121 | worldMapData.ts |
| `sprites/boss-conde-vampiro-0.png` | 278 | 216 | 147 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-conde-vampiro-2.png` | 274 | 212 | 146 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-gran-lobo-4.png` | 272 | 183 | 121 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-conde-vampiro-1.png` | 271 | 209 | 143 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-conde-vampiro-3.png` | 267 | 207 | 141 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/boss-conde-vampiro-4.png` | 202 | 155 | 106 | plantilla `assetPrefix` de bosses.ts (BossBattle, GuardianMiniGame, GameCanvas, MeriendaJabatos) |
| `sprites/completion-trophy-v1.png` | 137 | 92 | 59 | App.tsx |
| `atlases/detour-switches-v2.png` | 115 | 85 | 55 | detours.ts |
| `sprites/cannonball-v1.png` | 76 | 54 | 43 | assets.ts |
| `sprites/pictogramas-v1.png` | 47 | 32 | 45 | textos/pictogramas.ts |
| `sprites/completion-cat-v1.png` | 45 | 30 | 21 | App.tsx |
| `sprites/enemy-flying-dragon-v1.png` | 33 | 28 | 21 | mechanicSprites.ts |
| `sprites/shop-world-cats-10-v1.png` | 22 | 18 | 16 | secretShopCats.ts |
| `sprites/shop-world-cats-12-v1.png` | 20 | 17 | 15 | secretShopCats.ts |
| `sprites/shop-world-cats-6-v1.png` | 20 | 16 | 14 | secretShopCats.ts |
| `sprites/shop-world-cats-1-v1.png` | 18 | 14 | 13 | secretShopCats.ts |
| `sprites/shop-world-cats-3-v1.png` | 17 | 14 | 13 | secretShopCats.ts |
| `worlds/secret-shop-room-v1.png` | 9 | 3 | 3 | SecretShop.tsx |
| `sprites/castle-hound-v1.png` | 5 | 3 | 3 | mechanicSprites.ts |
| `worlds/teatro-armonia-v0.png` | 4 | 1 | 1 | ArmoniaDrumGame.tsx |
| `sprites/flying-ship-v1.png` | 4 | 2 | 2 | mechanicSprites.ts |
| `sprites/bloom-flower-v1.png` | 3 | 2 | 2 | FriendsTab.tsx, mechanicSprites.ts |
| `sprites/pictogramas-controles-v1.png` | 2 | 1 | 1 | textos/pictogramas.ts |
| `sprites/lava-jet-v1.png` | 2 | 1 | 1 | mechanicSprites.ts |
| `sprites/water-entrance-v1.png` | 2 | 1 | 1 | mechanicSprites.ts |
| `sprites/mechanic-wolf-v1.png` | 2 | 1 | 1 | mechanicSprites.ts |
| `sprites/water-surface-v1.png` | 1 | 1 | 1 | mechanicSprites.ts |
| `sprites/secret-shop-door-v1.png` | 1 | 1 | 1 | LevelSelectCard.tsx, WorldMap.tsx, mechanicSprites.ts |
| `sprites/secret-star-aura-v1.png` | 1 | 1 | 1 | AvionetaGame.tsx, mechanicSprites.ts |
| `sprites/tambor-noa-v0.png` | 1 | 0 | 0 | ArmoniaDrumGame.tsx |
| `sprites/tambor-armonia-v0.png` | 1 | 0 | 0 | ArmoniaDrumGame.tsx |
| `sprites/lava-surface-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/atril-armonia-v0.png` | 1 | 0 | 0 | ArmoniaDrumGame.tsx |
| `sprites/updraft-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/wind-gust-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/castle-chain-post-v1.png` | 1 | 0 | 1 | mechanicSprites.ts |
| `sprites/mist-platform-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/air-plank-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/bloom-bridge-v1.png` | 1 | 0 | 0 | mechanicSprites.ts |
| `sprites/castle-chain-link-v1.png` | 0 | 0 | 0 | mechanicSprites.ts |

## Qué partes del código cambiarían

**Borrar los sin uso y los gemelos**

- `README.md`: quitar la frase de la coraza alternativa. `CREDITS.md`, `MAP_ART.md` y `WATER_WORLD.md` nombran `noa-adventure-map-v1.webp` y `boss-don-aleta-v1.png`: actualizar a lo que se usa, conservando la atribución.
- `src/game/assets.ts`: `optimizedImages` dejaría de hacer falta si todo pasa a WebP (o se queda solo mientras dure la transición); corregir el comentario «original PNG URLs remain available».
- `src/game/assets.test.ts`: la prueba «la interfaz y el motor comparten una fuente optimizada» lee `home-adventure-v3.png`, `noa-sprite-sheet.png` y `collectibles-v1.png` para comparar tamaños; habría que reescribirla para comprobar solo el WebP.
- `src/App.tsx` línea 1004: envolver `yarn-ball-v1.png` en `optimizedAssetSource` (o pasarlo a `.webp`).
- `prototypes/tools/abeja-ninja-sprites.py` y `tambor-armonia-arte.py` leen `noa-sprite-sheet.png` como fuente: o leen el WebP, o la fuente PNG pasa a una carpeta que no se publique.

**Pasar los PNG cargados a WebP**

- Rutas: unas 135 líneas de `src/` nombran un `.png` de `public/assets`. Los que más: `assets.ts` (36), `mechanicSprites.ts` (18), `worldMapData.ts` (17), `GameCanvas.tsx` (9), `bosses.ts` (8), `App.tsx` (8), `ArmoniaDrumGame.tsx` (6), `secretShopCats.ts` (5), `BossBattle.tsx` y `AvionetaGame.tsx` (4); y 1 o 2 en `santaBattleRendering.ts`, `santaBattleAssets.ts`, `detours.ts`, `detourRendering.ts`, `chaseRendering.ts`, `WorldMap.tsx`, `MuestraInterfaz.tsx`, `GuardianMiniGame.tsx`, `exploreRendering.ts`, `SecretShop.tsx`, `LevelSelectCard.tsx`, `GameAssetIcon.tsx`, `FriendsTab.tsx`, `CasaGatitos.tsx` y `src/textos/pictogramas.ts`. Las plantillas `-${frame}.png` de los guardianes (`BossBattle`, `GuardianMiniGame`, `GameCanvas`, `App`, `MeriendaJabatos`) y `noa-rps-…png` cambian solo la extensión.
- Alternativa con menos cambios: ampliar `optimizedImages` a todos los PNG y que todo pase por `optimizedAssetSource` (también los `<img src>` y `url()` directos). Es más fácil de revisar, pero mantiene una lista a mano; cambiar la extensión en cada ruta es más limpio.
- Pruebas que leen píxeles del PNG con `readRgbaPng` (`src/game/pngTestUtils.ts`, que solo decodifica PNG RGBA): `assets.test.ts` (`sky-lift-v1.png`), `adventureTerrain.test.ts`, `christmasLayout.test.ts`, `worldEnemySprites.test.ts`, `mechanicSprites.test.ts`, `santaBattleVisuals.test.ts` y `pictogramasAtlas.test.ts`. Opciones: (a) dejar esos PNG fuente fuera de `public/` (por ejemplo `art/fuente/`) y que las pruebas lean de allí, comprobando además que el WebP publicado tiene las mismas medidas; (b) dejar esos atlas en PNG. Con WebP sin pérdida los píxeles visibles son idénticos, así que (a) prueba lo mismo; con «casi sin pérdida», no.
- `scripts/build-secret-shop-art.mjs` escribe PNG en `public/` (`secret-shop-door-v1`, `secret-star-aura-v1`, `secret-shop-room-v1`, `secret-shop-kittens-v1`) y valida sus bytes PNG: habría que añadirle la salida WebP o dejar esos (son pequeños, 19 KB entre los cuatro).
- `prototypes/tools/pictogramas-recorte.py` y `caminos-recorte.py` escriben PNG en `public/assets` (`pictogramas-v1.png`, `pictogramas-controles-v1.png`, `detour-switches-v2.png`, `secret-detours-v2.png`); los demás recortes ya escriben WebP.
- La herramienta: `cwebp -lossless -z 9` (Homebrew `webp`), sin `-exact`, porque no hace falta guardar el color de los píxeles transparentes. Tardó unos 10 minutos para los 158 en este Mac.

## Cómo se repite

Los scripts de esta investigación (inventario, clasificación y conversión) no se han subido; basta con: listar `public/assets`, buscar cada ruta y nombre en `src/` e `index.html` excluyendo `*.test.ts`, resolver a mano las plantillas de la sección «Método» y convertir con `cwebp` en una carpeta fuera del repositorio.
