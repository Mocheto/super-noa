import { Pictograma } from "../textos/Texto";
import { emblemaMundo, type WorldId } from "./worldMapData";

/** Distintivo del mundo (número o pictograma) para el marco caramelo y el marcador del mapa. */
export function Emblema({ world }: { world: WorldId }) {
  const emblema = emblemaMundo(world);
  return typeof emblema === "string" ? <>{emblema}</> : <Pictograma nombre={emblema.pictograma} />;
}
