import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./interfaz.css";

/** Solo en desarrollo: `?prueba=interfaz` muestra los cimientos de la interfaz en lugar del juego. */
const MuestraInterfaz = import.meta.env.DEV && new URLSearchParams(window.location.search).get("prueba") === "interfaz"
  ? lazy(() => import("./game/MuestraInterfaz").then((modulo) => ({ default: modulo.MuestraInterfaz })))
  : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {MuestraInterfaz ? <Suspense><MuestraInterfaz /></Suspense> : <App />}
  </StrictMode>,
);
