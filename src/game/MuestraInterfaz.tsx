import { t } from "../textos";
import { Boton, BotonControl, Texto } from "../textos/Texto";

/** Solo en desarrollo (`?prueba=interfaz`): muestra los cimientos de la interfaz para revisarlos en escritorio y móvil. */
export function MuestraInterfaz() {
  return <main className="muestra-interfaz">
    <section className="muestra-papel">
      <h1 className="texto-noa titulo pictograma-doble"><Texto clave="partida.pausa.titulo.rotulo" /></h1>
      <p className="juntos">{t("ventanas.completada.reina.juntos")}</p>
      <p className="texto-noa pictograma-doble"><Texto clave="ventanas.completada.insignia.rotulo" /></p>
      <p className="texto-noa pequeno"><Texto clave="ventanas.completada.sinCaer.rotulo" /></p>
      <div className="muestra-fila">
        <Boton tipo="jugar" clave="inicio.jugar.rotulo" />
        <Boton tipo="seguir" clave="ventanas.completada.siguiente.rotulo" />
        <Boton clave="partida.pausa.otraVez.rotulo" />
        <Boton clave="partida.pausa.mapa.rotulo" />
      </div>
      <div className="muestra-fila">
        <BotonControl pictograma="sonido" etiqueta="partida.hud.sonido.oculto" />
        <BotonControl pictograma="pantalla-grande" etiqueta="partida.hud.pantallaGrande.oculto" />
        <BotonControl pictograma="pausa" etiqueta="partida.hud.pausa.oculto" />
        <BotonControl pictograma="cerrar" etiqueta="coleccion.cerrar.oculto" />
      </div>
    </section>
  </main>;
}
