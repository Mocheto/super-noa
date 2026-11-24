/**
 * Dos pestañas con el mismo progreso (issue «Que dos pestañas no se pisen el progreso»): la fusión, la adopción y el
 * ciclo «guardar → la otra lo adopta → guardar» que hace `App.tsx`, con un almacenamiento falso.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { avanzar, cuidar } from "./casa.ts";
import { asegurarGatitos, casaVacia } from "./casaProgreso.ts";
import { adoptarProgreso, emptyProgress, fusionarProgreso, parseProgress, resetCampaignProgress, serializeProgress, textoNormalizado, type Progress } from "./progress.ts";

const conPantalla = (progress: Progress, id: string, bestApples: number, flawless = false): Progress =>
  ({ ...progress, unlocked: Math.max(progress.unlocked, 1), levelStats: { ...progress.levelStats, [id]: { completed: true, bestApples, ...(flawless ? { flawless } : {}) } } });
const lunes = new Date("2026-11-23T10:00:00Z");
const martes = new Date("2026-11-24T10:00:00Z");
const conCasa = (progress: Progress, ahora: Date): Progress => ({ ...progress, casa: asegurarGatitos(casaVacia(ahora), [1], ahora) });

test("la fusión nunca hace retroceder la campaña", () => {
  const a = { ...conPantalla(conPantalla(emptyProgress, "1-1", 3), "1-2", 2), stickers: ["sticker-1-1"], bossChallenges: { "bramble-king": true } };
  const b = { ...conPantalla(conPantalla(emptyProgress, "1-1", 5, true), "1-3", 1), stickers: ["sticker-1-3"], secretUnlocked: true, friends: { wolf: { hearts: 2 } } };
  const fusion = fusionarProgreso(a, b);
  assert.deepEqual(fusion.levelStats["1-1"], { completed: true, bestApples: 5, flawless: true });
  assert.equal(fusion.levelStats["1-2"].completed, true);
  assert.equal(fusion.levelStats["1-3"].completed, true);
  assert.deepEqual([...fusion.stickers].sort(), ["sticker-1-1", "sticker-1-3"]);
  assert.equal(fusion.bossChallenges["bramble-king"], true);
  assert.equal(fusion.secretUnlocked, true);
  assert.equal(fusion.friends?.wolf?.hearts, 2);
  assert.equal(fusion.totalApples, Math.max(a.totalApples ?? 0, b.totalApples ?? 0, fusion.totalApples ?? 0));
  // Igual en los dos sentidos, y estable al guardar y volver a leer.
  assert.deepEqual(fusionarProgreso(b, a).levelStats, fusion.levelStats);
  assert.equal(serializeProgress(parseProgress(serializeProgress(fusion))), serializeProgress(fusion));
});

test("la fusión se queda con la casa de cálculo más reciente y la fecha de logro más reciente", () => {
  const vieja = { ...conCasa(emptyProgress, lunes), achievedAt: "2026-11-23T10:00:00.000Z" };
  const nueva = { ...conCasa(emptyProgress, martes), achievedAt: "2026-11-24T09:00:00.000Z" };
  assert.equal(fusionarProgreso(vieja, nueva).casa?.calculadoEn, martes.toISOString());
  assert.equal(fusionarProgreso(nueva, vieja).casa?.calculadoEn, martes.toISOString());
  assert.equal(fusionarProgreso(vieja, nueva).achievedAt, "2026-11-24T09:00:00.000Z");
  assert.equal(fusionarProgreso(emptyProgress, nueva).casa?.calculadoEn, martes.toISOString());
  assert.equal(fusionarProgreso(vieja, emptyProgress).casa?.calculadoEn, lunes.toISOString());
});

test("sin cambios propios sin guardar se adopta lo de la otra pestaña tal cual, también un borrado", () => {
  const mio = conPantalla(emptyProgress, "1-1", 3);
  const guardado = serializeProgress(mio);
  const borrado = resetCampaignProgress(mio);
  const adoptado = adoptarProgreso(mio, serializeProgress(borrado), guardado);
  assert.deepEqual(adoptado.levelStats, {}, "«Borrar progreso» en otra pestaña también borra aquí");
  assert.deepEqual(adoptarProgreso(mio, null, guardado).levelStats, {});
});

test("con cambios propios sin guardar, se fusionan con los de la otra pestaña", () => {
  const guardado = serializeProgress(conPantalla(emptyProgress, "1-1", 3));
  const mioSinGuardar = conPantalla(parseProgress(guardado), "1-2", 4);
  const otra = serializeProgress(conPantalla(parseProgress(guardado), "1-3", 2));
  const adoptado = adoptarProgreso(mioSinGuardar, otra, guardado);
  assert.deepEqual(Object.keys(adoptado.levelStats).sort(), ["1-1", "1-2", "1-3"]);
});

/** Una pestaña como la hace `App.tsx`: guarda si su cadena cambia y adopta lo que guarda la otra. */
function pestana(almacen: { valor: string | null; escrituras: number; oyentes: ((nuevo: string | null) => void)[] }) {
  const yo = { progress: parseProgress(almacen.valor), guardado: textoNormalizado(almacen.valor) };
  const escribir = () => {
    const texto = serializeProgress(yo.progress);
    if (texto === yo.guardado) return;
    almacen.valor = texto;
    almacen.escrituras += 1;
    yo.guardado = texto;
    // El evento `storage` llega a las demás pestañas, no a la que escribe.
    almacen.oyentes.filter((oyente) => oyente !== adoptar).forEach((oyente) => oyente(texto));
  };
  const adoptar = (remoto: string | null) => {
    const normal = textoNormalizado(remoto);
    if (normal === yo.guardado) return;
    const conocida = yo.guardado;
    yo.guardado = normal;
    yo.progress = adoptarProgreso(yo.progress, remoto, conocida);
    escribir();
  };
  almacen.oyentes.push(adoptar);
  return {
    get progress() { return yo.progress; },
    cambiar(cambio: (progress: Progress) => Progress) { yo.progress = cambio(yo.progress); escribir(); },
  };
}

test("campaña en una pestaña y casa en otra: no se pierde nada y no se reescribe lo mismo", () => {
  const almacen = { valor: serializeProgress(conCasa(conPantalla(emptyProgress, "1-1", 3), lunes)), escrituras: 0, oyentes: [] };
  const campana = pestana(almacen);
  const casa = pestana(almacen);
  campana.cambiar((progress) => conPantalla(progress, "1-2", 4));
  campana.cambiar((progress) => conPantalla(progress, "1-3", 5));
  // La casa pasa el tiempo y cuida a un gatito, sobre lo último que ha adoptado.
  casa.cambiar((progress) => ({ ...progress, casa: cuidar(avanzar(progress.casa!, martes), 1, "pelota", martes).casa }));
  campana.cambiar((progress) => conPantalla(progress, "2-1", 1));
  const final = parseProgress(almacen.valor);
  assert.deepEqual(Object.keys(final.levelStats).sort(), ["1-1", "1-2", "1-3", "2-1"]);
  assert.equal(final.casa?.calculadoEn, martes.toISOString());
  const guardado = (progress: Progress) => textoNormalizado(serializeProgress(progress));
  assert.equal(guardado(campana.progress), guardado(casa.progress), "las dos pestañas acaban con lo mismo");
  assert.equal(almacen.escrituras, 4, "una escritura por cambio: adoptar no vuelve a escribir");
});

test("la casa olvidada ya no borra la campaña: si escribe, parte de lo que adoptó", () => {
  const almacen = { valor: serializeProgress(conCasa(emptyProgress, lunes)), escrituras: 0, oyentes: [] };
  const casa = pestana(almacen);
  const campana = pestana(almacen);
  for (const id of ["1-1", "1-2", "1-3", "2-1", "2-2"]) campana.cambiar((progress) => conPantalla(progress, id, 2));
  casa.cambiar((progress) => ({ ...progress, casa: avanzar(progress.casa!, martes) }));
  assert.equal(Object.keys(parseProgress(almacen.valor).levelStats).length, 5);
});
