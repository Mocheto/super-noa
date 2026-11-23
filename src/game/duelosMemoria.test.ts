import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { bossCatalog } from "./bosses.ts";
import { guardianGames, isGuardianGameId } from "./guardianGames.ts";

const read = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");

test("el duelo de Aurora Celeste es «El vuelo de Aurora» y el de la Reina Tricera, «El nido de la Reina»", () => {
  const app = read("../App.tsx");
  assert.match(app, /activeLevel\.boss === "aurora-celeste" \? <VueloAuroraGame/);
  assert.match(app, /activeLevel\.boss === "triceratops-queen" \? <NidoReinaGame/);
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
