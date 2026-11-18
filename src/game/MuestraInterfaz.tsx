import { t } from "../textos";
import { Boton, BotonControl, Texto } from "../textos/Texto";
import { Medalla, Ventana } from "./Ventana";
import { PantallaPrevia } from "./minijuegoComun";

/** Solo en desarrollo (`?prueba=interfaz`): muestra los cimientos de la interfaz para revisarlos en escritorio y móvil. */
export function MuestraInterfaz() {
  // `?prueba=interfaz&ventana=resultado` abre además la pantalla de resultado común; `&ventana=previa`, la pantalla previa de los minijuegos.
  const ventana = new URLSearchParams(window.location.search).get("ventana");
  const nada = () => undefined;
  return <main className="muestra-interfaz">
    {ventana === "previa" && <PantallaPrevia id="muestra-previa" nombre="minijuegos.abeja.la-abeja-ninja.rotulo"
      guardian={<img src="./assets/sprites/boss-gran-jabali-0.png" alt="" />} regla={t("minijuegos.abeja.melisa-lanza-flores-cortalas.juntos")}
      ayudaAdultos={[t("minijuegos.abeja.teclado-espacio-mando-boton.juntos")]} practicaPrimero onPracticar={nada} onJugar={nada} onSalir={nada} />}
    {ventana === "resultado" && <Ventana id="muestra-resultado" titulo="ventanas.completada.titulo.rotulo" celebracion
      botones={<><Boton tipo="seguir" clave="ventanas.completada.siguiente.rotulo" /><Boton clave="ventanas.completada.mapa.rotulo" /></>}>
      <div className="ventana-dibujo"><img className="completion-cat" src="./assets/sprites/world-cat-1-v1.png" alt={t("ventanas.completada.gatito.oculto")} /></div>
      <div className="medallas"><Medalla clave="ventanas.completada.meta.rotulo" conseguida /><Medalla clave="ventanas.completada.pegatina.rotulo" conseguida /><Medalla clave="ventanas.completada.sinCaer.rotulo" conseguida={false} /></div>
      <div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="ventanas.completada.insignia.rotulo" /></p><p className="juntos">{t("ventanas.completada.insignia.juntos", { n: 1 })}</p></div>
      <p className="juntos">{t("ventanas.completada.manzanas.juntos", { n: 4 })} {t("ventanas.completada.siguienteAventura.juntos")}</p>
    </Ventana>}
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
