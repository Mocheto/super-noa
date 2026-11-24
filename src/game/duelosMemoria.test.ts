import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { bossCatalog } from "./bosses.ts";
import { guardianGames, isGuardianGameId } from "./guardianGames.ts";

const read = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");

test("el duelo de Aurora Celeste es «El vuelo de Aurora» y el de la Reina Tricera, «El nido de la Reina»", () => {
  const app = read("../App.tsx");
  const duelo = read("./DueloDelGuardian.tsx");
  assert.match(duelo, /level\.boss === "aurora-celeste" \? <VueloAuroraGame/);
  assert.match(duelo, /level\.boss === "triceratops-queen" \? <NidoReinaGame/);
  assert.match(app, /memoriaDuel = screen === "boss" && \(activeLevel\.boss === "aurora-celeste" \|\| activeLevel\.boss === "triceratops-queen"\)/, "la música del mundo se calla: cada uno tiene su canción");
  assert.match(app, /!memoriaDuel/);
  for (const id of ["aurora-celeste", "triceratops-queen"] as const) {
    assert.equal(isGuardianGameId(id), false, id);
    assert.equal(id in guardianGames, false, id);
    assert.equal(bossCatalog[id].challenge.id, "perfect-game", `${id}: la corona es ganar sin fallos`);
  }
});

test("«SALVA EL HUEVO» y «UNE LAS ESTRELLAS» se retiran; quedan el tipo secuencia y los iconos del atlas", () => {
  assert.doesNotMatch(read("./guardianGames.ts"), /laneOptions|starOptions|SALVA EL HUEVO|UNE LAS ESTRELLAS/);
  assert.doesNotMatch(read("../textos/es/juegos.ts"), /SALVA EL HUEVO|UNE LAS ESTRELLAS/);
  assert.equal(guardianGames["rainbow-queen"].kind, "sequence", "la Reina Arcoíris sigue con su secuencia");
  assert.ok(existsSync(new URL("../../public/assets/sprites/guardian-game-icons-v1.webp", import.meta.url)), "se conserva el atlas de iconos");
});

test("el arte de los duelos de memoria está publicado como WebP, en hojas de casillas cuadradas", async () => {
  const { readRgbaImage } = await import("./imagenTestUtils.ts");
  const hojas: Record<string, number> = { "vuelo-aurora-v1": 7, "vuelo-nubecita-v1": 4, "vuelo-nubecita-cuerpo-v1": 4, "nido-reina-v1": 7, "nido-cria-v1": 6 };
  for (const [nombre, casillas] of Object.entries(hojas)) {
    const { width, height } = readRgbaImage(`./assets/sprites/${nombre}.webp`);
    assert.equal(width, height * casillas, `${nombre}: ${casillas} casillas cuadradas`);
  }
  for (const nombre of ["vuelo-nube-v1", "vuelo-luna-v1", "nido-arbusto-v1", "nido-arbusto-flores-v1", "nido-nido-v1"]) {
    assert.ok(existsSync(new URL(`../../public/assets/sprites/${nombre}.webp`, import.meta.url)), nombre);
  }
  const arbusto = readRgbaImage("./assets/sprites/nido-arbusto-v1.webp");
  const flores = readRgbaImage("./assets/sprites/nido-arbusto-flores-v1.webp");
  assert.deepEqual([flores.width, flores.height], [arbusto.width, arbusto.height], "la máscara de las flores encaja con el arbusto");
});
