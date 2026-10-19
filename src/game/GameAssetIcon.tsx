type GameAssetIconKind = "apple" | "heart";

type GameAssetIconProps = {
  kind: GameAssetIconKind;
  className?: string;
};

export function GameAssetIcon({ kind, className = "" }: GameAssetIconProps) {
  const src = kind === "apple" ? "./assets/atlases/collectibles-v1.png" : "./assets/sprites/ui-heart-v1.png";
  return <span className={`game-asset-icon game-asset-${kind} ${className}`.trim()} aria-hidden="true"><img src={optimizedAssetSource(src)} alt="" /></span>;
}
import { optimizedAssetSource } from "./assets";
