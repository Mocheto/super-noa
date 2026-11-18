/**
 * Archivos que todavía tienen texto visible escrito en el código y esperan su pieza de migración al catálogo
 * (mapa «Textos centralizados»). La lista solo puede encoger: cada pieza quita aquí los archivos que migra,
 * y `textoSuelto.test.ts` falla si un archivo migrado vuelve a tener texto suelto o si uno de esta lista ya no lo tiene.
 */
export const archivosPendientes: readonly string[] = [
  "src/App.tsx",
  "src/game/AvionetaGame.tsx",
  "src/game/SecretShop.tsx",
  "src/game/ranking.ts",
  "src/game/secretShopProgress.ts",
];
