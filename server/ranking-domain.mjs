import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export const maxAliasLength = 16;
export const maxTotalApples = Number.MAX_SAFE_INTEGER;
const aliasPattern = /^[\p{L}\p{N} _-]{3,16}$/u;

export function normalizeAlias(value) {
  if (typeof value !== "string") return null;
  const alias = value.trim().replace(/\s+/g, " ");
  return aliasPattern.test(alias) ? alias : null;
}

function boundedInteger(value, maximum) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum
    ? value
    : null;
}

export function validateProgress(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const world = boundedInteger(value.world, 17);
  const completedLevels = boundedInteger(value.completedLevels, 45);
  const stickers = boundedInteger(value.stickers, 51);
  const bossChallenges = boundedInteger(value.bossChallenges, 17);
  if ([world, completedLevels, stickers, bossChallenges].some((item) => item === null)) return null;
  const campaignWorld = campaignWorldFromLegacyWorld(world);
  if (value.campaignWorld !== undefined && value.campaignWorld !== campaignWorld) return null;
  const progress = { world, campaignWorld, completedLevels, stickers, bossChallenges };
  if (Object.hasOwn(value, "totalApples")) {
    const totalApples = boundedInteger(value.totalApples, maxTotalApples);
    if (totalApples === null) return null;
    progress.totalApples = totalApples;
  }
  if (Object.hasOwn(value, "achievedAt")) {
    const achievedAt = value.achievedAt === null ? null : normalizeAchievementDate(value.achievedAt);
    if (achievedAt === null && value.achievedAt !== null) return null;
    progress.achievedAt = achievedAt;
  }
  return progress;
}

function normalizeAchievementDate(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, zone] = match;
  const days = [31, Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (Number(year) < 1 || Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days[Number(month) - 1]
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
    || (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const normalized = new Date(timestamp).toISOString();
  return /^\d{4}-/.test(normalized) && !normalized.startsWith("0000-") ? normalized : null;
}

export function campaignWorldFromLegacyWorld(world) {
  return world === 7 || world === 8 ? null : world > 8 ? world - 2 : world;
}

export function validateDeviceCredentials(value) {
  return value !== null && typeof value === "object"
    && typeof value.deviceId === "string" && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value.deviceId)
    && typeof value.deviceToken === "string" && /^[\w-]{32,128}$/.test(value.deviceToken)
    ? { id: value.deviceId.toLowerCase(), token: value.deviceToken }
    : null;
}

export function createDeviceCredentials(pepper) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  return { id, token, tokenHash: hashDeviceToken(pepper, token) };
}

export function hashDeviceToken(pepper, token) {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

// ── Revisión de alias (issue 314) ─────────────────────────────────────────────────────────────────────────────────
// Vive aquí porque el supervisor solo descarga `ranking-server.mjs` y este archivo.

export const aliasStatuses = ["pending", "approved", "rejected", "hidden"];

/** Letras de otros alfabetos que se parecen a las latinas y números o signos que las imitan. */
const lookalikes = new Map(Object.entries({
  0: "o", 1: "i", 2: "z", 3: "e", 4: "a", 5: "s", 6: "g", 7: "t", 8: "b", 9: "g", "@": "a", $: "s", "!": "i", "|": "i", "€": "e",
  // Cirílico
  а: "a", в: "b", е: "e", ё: "e", з: "3", и: "u", к: "k", м: "m", н: "h", о: "o", п: "n", р: "p", с: "c", т: "t", у: "y", х: "x",
  ш: "w", ь: "b", ї: "i", і: "i", ј: "j", ѕ: "s", ԁ: "d", ԛ: "q", ԝ: "w",
  // Griego
  α: "a", β: "b", γ: "y", δ: "d", ε: "e", ζ: "z", η: "n", ι: "i", κ: "k", μ: "u", ν: "v", ο: "o", π: "n", ρ: "p", σ: "o", ς: "c",
  τ: "t", υ: "u", φ: "o", χ: "x", ω: "w",
}));

/** Forma para comparar: minúsculas, sin tildes, con las letras que imitan otras ya cambiadas y sin letras repetidas. */
export function aliasForFilter(value) {
  const plain = value.normalize("NFKC").toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
  return [...plain].map((char) => lookalikes.get(char) ?? char).join("").replace(/3/g, "e").replace(/(.)\1+/g, "$1");
}

// Palabras que no pueden aparecer en ninguna parte del alias (raíces largas, sin falsos positivos habituales).
const blockedRoots = [
  "mierd", "cabron", "gilipol", "hijoputa", "hdp", "folar", "folad", "chingad", "pendej", "maricon", "zora", "putita", "puton",
  "polla", "verga", "carajo", "joder", "jodid", "mamon", "pezon", "porno", "porn", "sexo", "violad", "nazi", "hitler", "subnormal",
  "retrasad", "negrat", "sudaca", "puñet", "capul", "imbecil", "idiot", "estupid", "muerte", "droga", "cocain",
  "fuck", "fuk", "shit", "bitch", "cunt", "pusy", "whore", "slut", "niga", "rapist", "penis", "vagin", "asshole", "wank", "bastard",
].map((word) => aliasForFilter(word));

// Palabras cortas o que aparecen dentro de otras («computadora», «Cumbre», «Conocer»): solo cuentan como palabra entera
// o como el alias entero.
const blockedWords = ["puta", "puto", "culo", "caca", "pis", "pedo", "tonto", "tonta", "sex", "ass", "tit", "tits", "teta", "tetas", "gay",
  "pene", "nalga", "mear", "orto", "coño", "cono", "marica", "maricas", "cum", "arse", "fag", "dick", "cock", "kill", "matar", "niger",
  "rape", "kk", "jiz", "mongol", "facha"]
  .map((word) => aliasForFilter(word));

/** ¿Pasa el filtro automático? (Lo que pasa, aún queda pendiente de revisión.) */
export function aliasAllowed(alias) {
  const words = alias.split(/[\s_-]+/).filter(Boolean).map(aliasForFilter);
  const joined = aliasForFilter(alias.replace(/[\s_-]+/g, ""));
  if (blockedRoots.some((root) => joined.includes(root))) return false;
  return !blockedWords.some((word) => joined === word || words.includes(word));
}

const provisionalAnimals = ["Zorro", "Lobo", "Jabalí", "Erizo", "Búho", "Ardilla", "Pingüino", "Loro", "Abeja", "Unicornio", "Tortuga", "Delfín",
  "Panda", "Oso", "Conejo", "Ciervo", "Mariquita", "Pato", "Koala", "Foca"];

/** El nombre que ven los demás mientras el alias no está aprobado: animal del juego y número, fijo para cada tarjeta. */
export function provisionalName(deviceId) {
  const digest = createHash("sha256").update(String(deviceId).toLowerCase()).digest();
  return `${provisionalAnimals[digest.readUInt16BE(0) % provisionalAnimals.length]} ${1 + digest.readUInt16BE(2) % 99}`;
}

/** Lo que ven los demás: el alias aprobado, el aprobado anterior mientras se revisa un cambio, o el nombre provisional. */
export function publicAlias({ id, alias, aliasStatus, approvedAlias }) {
  if (aliasStatus === "approved") return alias;
  if (aliasStatus !== "hidden" && approvedAlias) return approvedAlias;
  return provisionalName(id);
}

/** Compara la clave de administración en tiempo constante (también si las longitudes no coinciden). */
export function adminTokenMatches(expected, supplied) {
  if (typeof expected !== "string" || expected.length < 16 || typeof supplied !== "string") return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(a, b);
}

// ── Límite de peticiones (issue 311) ──────────────────────────────────────────────────────────────────────────────
// Vive aquí por lo mismo: el supervisor solo descarga `ranking-server.mjs` y este archivo.

/**
 * Cuánto se deja hacer a cada IP y a cada dispositivo, por tipo de petición. Es una cubeta de fichas: `max` es lo que se puede
 * gastar de golpe y se recupera una ficha cada `windowMs / max`. Una IP puede ser una casa o un cole con varias tarjetas,
 * así que su tope es bastante más holgado que el del dispositivo.
 *  - registro: crear la tarjeta (`POST /v1/devices`) o cambiar el alias (`POST /v1/alias`).
 *  - progreso: enviar el avance (`POST /v1/progress`); el cliente lo manda con cada cambio, pero no más de unas pocas veces por minuto.
 *  - consulta: todo lo demás (tablón, tarjeta, salud, revisión de alias).
 */
export const rateLimits = {
  registro: { ip: { max: 10, windowMs: 3_600_000 }, device: { max: 5, windowMs: 3_600_000 } },
  progreso: { ip: { max: 120, windowMs: 60_000 }, device: { max: 12, windowMs: 60_000 } },
  consulta: { ip: { max: 120, windowMs: 60_000 }, device: { max: 60, windowMs: 60_000 } },
};

/** A qué tipo de petición pertenece una ruta (`null` para el preflight de CORS, que no cuenta). */
export function rateLimitGroup(method, pathname) {
  if (method === "OPTIONS") return null;
  if (method === "POST" && (pathname === "/v1/devices" || pathname === "/v1/alias")) return "registro";
  if (method === "POST" && pathname === "/v1/progress") return "progreso";
  return "consulta";
}

/** Cubetas de fichas en memoria, una por clave. Se reinician con el proceso, que es aceptable: es una defensa contra abuso, no una cuota. */
export function createRateLimiter({ now = Date.now, maxKeys = 50_000 } = {}) {
  const buckets = new Map();
  function prune(at) {
    for (const [key, bucket] of buckets) if (at - bucket.updated >= bucket.windowMs) buckets.delete(key);
    // Si aun así hay demasiadas claves (un ataque con claves nuevas sin parar), se olvidan las más antiguas.
    for (const key of buckets.keys()) {
      if (buckets.size <= maxKeys / 2) break;
      buckets.delete(key);
    }
  }
  return {
    /** Gasta una ficha de `key`. Devuelve `{ ok: true }` o `{ ok: false, retryAfter }` con los segundos (enteros, mínimo 1) hasta la próxima. */
    take(key, { max, windowMs }) {
      const at = now();
      const bucket = buckets.get(key);
      const tokens = bucket ? Math.min(max, bucket.tokens + (at - bucket.updated) * max / windowMs) : max;
      if (tokens >= 1) {
        if (!bucket && buckets.size >= maxKeys) prune(at);
        buckets.set(key, { tokens: tokens - 1, updated: at, windowMs });
        return { ok: true };
      }
      buckets.set(key, { tokens, updated: at, windowMs });
      return { ok: false, retryAfter: Math.max(1, Math.ceil((1 - tokens) * windowMs / max / 1000)) };
    },
    get size() { return buckets.size; },
  };
}

/**
 * La IP del cliente. Detrás de un proxy inverso, el socket es el del proxy, así que se lee `X-Forwarded-For` contando desde la
 * derecha tantos saltos de confianza como `trustedProxies` (lo que añadió nuestro proxy; lo que escribió el cliente va más a la
 * izquierda y no cuenta). Con 0 se ignora la cabecera.
 */
export function clientIp(request, trustedProxies = 1) {
  const socket = request.socket?.remoteAddress ?? "desconocida";
  if (!(trustedProxies > 0)) return socket;
  const hops = String(request.headers["x-forwarded-for"] ?? "").split(",").map((hop) => hop.trim()).filter(Boolean);
  return hops[Math.max(0, hops.length - trustedProxies)] ?? socket;
}
