import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

test("solo audio.ts crea un AudioContext: el resto cuelga sus buses del compartido", () => {
  const pendientes = ["src"];
  const fuera: string[] = [];
  while (pendientes.length) {
    const carpeta = pendientes.pop()!;
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = `${carpeta}/${entrada.name}`;
      if (entrada.isDirectory()) pendientes.push(ruta);
      else if (/\.tsx?$/.test(entrada.name) && !entrada.name.endsWith(".test.ts") && ruta !== "src/game/audio.ts") {
        const codigo = readFileSync(ruta, "utf8");
        if (/new (window\.)?AudioContext\(|webkitAudioContext|\b(audio|context|contexto)\??\.close\(\)/.test(codigo)) fuera.push(ruta);
      }
    }
  }
  assert.deepEqual(fuera, []);
});

test("al ocultar la pestaña se suspende el audio y al volver se reanuda, solo si lo suspendió ese aviso", async () => {
  const oyentes = new Map<string, () => void>();
  const llamadas: string[] = [];
  const contexto = {
    state: "running",
    suspend: async () => { llamadas.push("suspend"); contexto.state = "suspended"; },
    resume: async () => { llamadas.push("resume"); contexto.state = "running"; },
    createGain: () => ({}),
  };
  const documento = { visibilityState: "visible", addEventListener: (tipo: string, oyente: () => void) => oyentes.set(tipo, oyente) };
  const ventana = {
    AudioContext: function AudioContext() { return contexto; },
    addEventListener: () => {},
    setTimeout: (fn: () => void) => { fn(); return 0; },
  };
  Object.assign(globalThis, { window: ventana, document: documento });
  try {
    const { contextoAudio, vigilarAudio } = await import("./audio.ts");
    assert.equal(contextoAudio(), contexto);
    vigilarAudio();
    const cambio = oyentes.get("visibilitychange")!;
    documento.visibilityState = "hidden"; cambio();
    documento.visibilityState = "visible"; cambio();
    assert.deepEqual(llamadas, ["suspend", "resume"]);

    // Un minijuego en pausa ya lo había suspendido: al volver a la pestaña sigue en pausa.
    llamadas.length = 0;
    contexto.state = "suspended";
    documento.visibilityState = "hidden"; cambio();
    documento.visibilityState = "visible"; cambio();
    assert.deepEqual(llamadas, []);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  }
});
