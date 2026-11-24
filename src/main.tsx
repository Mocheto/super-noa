import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { clavesSinHojaEnSilencio } from "./textos";
import "./styles.css";
import "./interfaz.css";

/** Solo en desarrollo: `?prueba=interfaz` muestra los cimientos de la interfaz en lugar del juego. */
const MuestraInterfaz = import.meta.env.DEV && new URLSearchParams(window.location.search).get("prueba") === "interfaz"
  ? lazy(() => import("./game/MuestraInterfaz").then((modulo) => ({ default: modulo.MuestraInterfaz })))
  : null;

// En producción, una clave sin hoja (por ejemplo, de una zona diferida que no se importó) deja un hueco en lugar de romper la pantalla.
if (import.meta.env.PROD) clavesSinHojaEnSilencio();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {MuestraInterfaz ? <Suspense><MuestraInterfaz /></Suspense> : <App />}
  </StrictMode>,
);
