/**
 * Motor común de los duelos de memoria con movimiento (mapa «Mejorar los duelos de memoria», issue 357; reglas en #351):
 * la guardiana **enseña** un **recorrido** por tres **sitios** y Noa lo **repite**. Un único recorrido con semilla crece un
 * sitio por ronda (de 1 a 5), nunca repite sitio dos veces seguidas, y no se pierde: al fallar sale «CASI» y se vuelve a
 * enseñar. Con dos fallos seguidos en la ronda, el sitio que toca brilla (ayuda). «MIRA» vuelve a enseñar sin contar como
 * fallo. Una estrella por ronda ganada y la corona si no hubo ningún fallo.
 *
 * Solo lógica: cada juego (el vuelo de Aurora, el nido de la Reina) pone sus sitios, el movimiento, la escena, el arte, las
 * notas y la canción, y llama a estas funciones.
 */

export type Sitio = 0 | 1 | 2;
export const SITIOS: readonly Sitio[] = [0, 1, 2];
export const RONDAS = 5;
/** Pulsos por minuto del compás suave; la guardiana enseña un sitio cada dos pulsos (uno de camino y otro cantando). */
export const PULSOS_POR_MINUTO = 90;
export const PULSOS_POR_SITIO = 2;
export const MS_POR_PULSO = 60_000 / PULSOS_POR_MINUTO;
/** Fallos seguidos en la misma ronda a partir de los que se enciende la ayuda. */
export const FALLOS_PARA_AYUDA = 2;

export type FaseMemoria = "ensena" | "repite" | "casi" | "rondaGanada" | "final";

export type EstadoMemoria = {
  /** El recorrido entero; en cada ronda se usan sus primeros `largo` sitios. */
  recorrido: Sitio[];
  /** Ronda en curso, desde 1. */
  ronda: number;
  rondas: number;
  /** Sitios del recorrido en la primera ronda (1 en el duelo, 2 en la ronda guiada de la práctica). */
  largoInicial: number;
  fase: FaseMemoria;
  /** Cuántos sitios lleva bien Noa en esta ronda. */
  paso: number;
  /** Fallos en toda la partida (sin ninguno, corona). */
  fallos: number;
  /** Fallos seguidos en la ronda en curso. */
  fallosSeguidos: number;
  /** La ayuda: el sitio que toca brilla. Se enciende con dos fallos seguidos y se apaga al ganar la ronda. */
  ayuda: boolean;
  /** Ayuda encendida desde el principio (ronda guiada de la práctica). */
  ayudaSiempre: boolean;
  estrellas: number;
};

export type EventoMemoria = "ignorado" | "acierto" | "rondaGanada" | "final" | "casi";

/** Generador pequeño con semilla (mulberry32), para sortear siempre el mismo recorrido con la misma semilla. */
export function azarConSemilla(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Recorrido de `largo` sitios sin el mismo sitio dos veces seguidas. */
export function recorridoConSemilla(semilla: number, largo = RONDAS): Sitio[] {
  const azar = azarConSemilla(semilla);
  const recorrido: Sitio[] = [];
  for (let i = 0; i < largo; i++) {
    const posibles = SITIOS.filter((sitio) => sitio !== recorrido[i - 1]);
    recorrido.push(posibles[Math.floor(azar() * posibles.length)]);
  }
  return recorrido;
}

export type OpcionesMemoria = { rondas?: number; largoInicial?: number; ayudaSiempre?: boolean };

export function crearMemoria(semilla: number, opciones: OpcionesMemoria = {}): EstadoMemoria {
  const rondas = opciones.rondas ?? RONDAS;
  const largoInicial = opciones.largoInicial ?? 1;
  const ayudaSiempre = opciones.ayudaSiempre ?? false;
  return {
    recorrido: recorridoConSemilla(semilla, largoInicial + rondas - 1), ronda: 1, rondas, largoInicial,
    fase: "ensena", paso: 0, fallos: 0, fallosSeguidos: 0, ayuda: ayudaSiempre, ayudaSiempre, estrellas: 0,
  };
}

/** Sitios del recorrido en la ronda en curso. */
export const largoDeRonda = (estado: EstadoMemoria) => estado.largoInicial + estado.ronda - 1;
export const recorridoDeRonda = (estado: EstadoMemoria): Sitio[] => estado.recorrido.slice(0, largoDeRonda(estado));

/** Lo que dura la enseñanza de la ronda en curso, en ms. */
export const duracionEnsenanza = (estado: EstadoMemoria) => largoDeRonda(estado) * PULSOS_POR_SITIO * MS_POR_PULSO;

export type MomentoEnsenanza =
  | { terminada: false; indice: number; sitio: Sitio; /** De camino al sitio (primer pulso) o cantando en él (segundo). */ cantando: boolean; /** 0–1 dentro del pulso. */ avance: number }
  | { terminada: true };

/** Qué hace la guardiana a los `ms` de empezar a enseñar: a qué sitio va o en cuál canta. */
export function momentoEnsenanza(estado: EstadoMemoria, ms: number): MomentoEnsenanza {
  const pulso = Math.max(0, ms) / MS_POR_PULSO;
  const indice = Math.floor(pulso / PULSOS_POR_SITIO);
  const recorrido = recorridoDeRonda(estado);
  if (indice >= recorrido.length) return { terminada: true };
  const dentro = pulso - indice * PULSOS_POR_SITIO;
  return { terminada: false, indice, sitio: recorrido[indice], cantando: dentro >= 1, avance: dentro % 1 };
}

/** Acaba de enseñar: le toca a Noa repetir desde el principio. */
export const empiezaARepetir = (estado: EstadoMemoria): EstadoMemoria =>
  estado.fase === "ensena" ? { ...estado, fase: "repite", paso: 0 } : estado;

/** Vuelve a enseñar el recorrido de la ronda: tras «CASI», tras ganar una ronda (la siguiente) o al volver de la pausa. */
export function vuelveAEnsenar(estado: EstadoMemoria): EstadoMemoria {
  if (estado.fase === "final") return estado;
  if (estado.fase === "rondaGanada") return { ...estado, ronda: estado.ronda + 1, fase: "ensena", paso: 0 };
  return { ...estado, fase: "ensena", paso: 0 };
}

/** «MIRA»: la guardiana enseña otra vez el recorrido. No cuenta como fallo ni quita la corona. */
export const mira = (estado: EstadoMemoria): EstadoMemoria =>
  estado.fase === "repite" ? { ...estado, fase: "ensena", paso: 0 } : estado;

/** Noa toca un sitio. Lo que se toca mientras la guardiana enseña (o en cualquier otra fase) se ignora. */
export function tocar(estado: EstadoMemoria, sitio: Sitio): { estado: EstadoMemoria; evento: EventoMemoria } {
  if (estado.fase !== "repite") return { estado, evento: "ignorado" };
  const recorrido = recorridoDeRonda(estado);
  if (recorrido[estado.paso] !== sitio) {
    const fallosSeguidos = estado.fallosSeguidos + 1;
    return {
      estado: { ...estado, fase: "casi", paso: 0, fallos: estado.fallos + 1, fallosSeguidos, ayuda: estado.ayudaSiempre || fallosSeguidos >= FALLOS_PARA_AYUDA },
      evento: "casi",
    };
  }
  const paso = estado.paso + 1;
  if (paso < recorrido.length) return { estado: { ...estado, paso }, evento: "acierto" };
  const ganada = { ...estado, paso, estrellas: estado.estrellas + 1, fallosSeguidos: 0, ayuda: estado.ayudaSiempre };
  if (estado.ronda >= estado.rondas) return { estado: { ...ganada, fase: "final" }, evento: "final" };
  return { estado: { ...ganada, fase: "rondaGanada" }, evento: "rondaGanada" };
}

/** El sitio que brilla con la ayuda encendida (el que toca repetir), o `null`. */
export const sitioQueBrilla = (estado: EstadoMemoria): Sitio | null =>
  estado.ayuda && estado.fase === "repite" ? recorridoDeRonda(estado)[estado.paso] ?? null : null;

/** La corona (reto `perfect-game`): terminar sin ningún fallo. */
export const conCorona = (estado: EstadoMemoria) => estado.fase === "final" && estado.fallos === 0;

/**
 * Práctica: la guardiana visita los tres sitios y se para en cada uno (con su rótulo y su nota) hasta que se toca SIGUE;
 * las paradas van en pulsos para `createPracticaConPausas`. Después, una ronda guiada de dos sitios con la ayuda encendida.
 */
export const PARADAS_PRACTICA = SITIOS.map((sitio) => ({ pulso: sitio * PULSOS_POR_SITIO + 1, pieza: `sitio-${sitio}` }));
export const crearRondaGuiada = (semilla: number) => crearMemoria(semilla, { rondas: 1, largoInicial: 2, ayudaSiempre: true });
