/**
 * El arte de los regalos (docs/art/casa-regalo-v1.md), como variables CSS de la página: lo usan la casa, la ventana de
 * pantalla completada y el botón CASA del mapa. La dirección se resuelve contra la del juego, también bajo una subruta.
 */
import { cssAssetUrl } from "./assets";

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--regalo", cssAssetUrl("./assets/sprites/casa-regalo-v1.webp"));
  document.documentElement.style.setProperty("--lazo", cssAssetUrl("./assets/sprites/casa-lazo-v1.webp"));
}
