import type { ReactNode } from "react";
import { t, type ClaveTexto, type Variables } from "../textos";
import { Boton, BotonControl } from "../textos/Texto";
import { Ventana } from "./Ventana";

type PantallaPreviaProps = {
  id: string;
  /** Nombre del juego, de una a tres palabras (`minijuegos.<juego>.previa.nombre.rotulo`). */
  nombre: ClaveTexto;
  nombreVariables?: Variables;
  /** Dibujo del guardián que propone el juego. */
  guardian: ReactNode;
  /** Regla del juego, para leer juntos. */
  regla: string;
  /** Ayuda de teclado y mando, y aviso sin sonido: texto para adultos. */
  ayudaAdultos?: string[];
  /** La primera vez se recomienda practicar: PRACTICA va en verde y JUEGA en crema. */
  practicaPrimero: boolean;
  /** Sin práctica (duelos por turnos), solo sale ¡A JUGAR! */
  onPracticar?: () => void;
  onJugar: () => void;
  onSalir: () => void;
};

/**
 * Pantalla previa común de los minijuegos y duelos (decisión «La guía en los minijuegos y duelos»): cinta con el nombre
 * del juego, el dibujo del guardián, la regla para leer juntos, PRACTICA y ¡A JUGAR!, y la ayuda para adultos al final.
 */
export function PantallaPrevia({ id, nombre, nombreVariables, guardian, regla, ayudaAdultos = [], practicaPrimero, onPracticar, onJugar, onSalir }: PantallaPreviaProps) {
  const practica = Boolean(onPracticar) && practicaPrimero;
  return <Ventana id={id} titulo={nombre} tituloVariables={nombreVariables} className="pantalla-previa" onClose={onSalir}
    botones={<>
      {onPracticar && <Boton tipo={practica ? "seguir" : "secundario"} clave="minijuegos.comun.previa.practica.rotulo" data-gamepad-default={practica || undefined} onClick={onPracticar} />}
      <Boton tipo={practica ? "secundario" : "jugar"} clave="minijuegos.comun.previa.jugar.rotulo" data-gamepad-default={!practica || undefined} onClick={onJugar} />
    </>}>
    <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="minijuegos.comun.salir.mapa.oculto" data-gamepad-back onClick={onSalir} />
    <div className="ventana-dibujo previa-guardian">{guardian}</div>
    <p className="juntos">{regla}</p>
    {ayudaAdultos.map((ayuda) => <p className="texto-adultos" key={ayuda}>{ayuda}</p>)}
  </Ventana>;
}

type ResultadoMinijuegoProps = {
  id: string;
  /** ¡PERFECTO!, ¡MUY BIEN! o ¡CASI! */
  titulo: ClaveTexto;
  tituloVariables?: Variables;
  /** Dibujo central de cada juego (tarro con raya dorada, cesta, arcoíris…). */
  dibujo: ReactNode;
  /** Lo que regala el guardián o qué faltó, para leer juntos. */
  frase: string;
  botones: ReactNode;
  gano: boolean;
  onSalir: () => void;
};

/** Pantalla de resultado común de los minijuegos: la misma ventana que ¡MUY BIEN! y ¡CASI! de la partida. */
export function ResultadoMinijuego({ id, titulo, tituloVariables, dibujo, frase, botones, gano, onSalir }: ResultadoMinijuegoProps) {
  return <Ventana id={id} titulo={titulo} tituloVariables={tituloVariables} celebracion={gano} esperaMs={500} onClose={onSalir} botones={botones}>
    <div className="ventana-dibujo">{dibujo}</div>
    <p className="juntos">{frase}</p>
  </Ventana>;
}

/** Texto oculto común para el botón de salir cuando el juego se abre desde la colección. */
export const salirMinijuego = (amistoso: boolean) => t(amistoso ? "minijuegos.comun.salir.amigos.oculto" : "minijuegos.comun.salir.mapa.oculto");
