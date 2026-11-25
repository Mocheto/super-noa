/**
 * Dirección del servidor del tablón. Aparte de `ranking.ts` para que la página de revisión no cargue el juego. En
 * desarrollo, `?servidor=http://localhost:8088` prueba el juego o la revisión contra un servidor local.
 */
const local = import.meta.env?.DEV ? new URLSearchParams(globalThis.location?.search).get("servidor") : null;
export const RANKING_URL = local || "https://rankings.moche-home.es";
