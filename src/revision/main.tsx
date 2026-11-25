import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RevisionAlias } from "./PaginaRevision";
import "./revision.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RevisionAlias />
  </StrictMode>,
);
