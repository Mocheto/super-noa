type GameAssetIconKind = "apple" | "heart";

type GameAssetIconProps = {
  kind: GameAssetIconKind;
  className?: string;
};

export function GameAssetIcon({ kind, className = "" }: GameAssetIconProps) {
  const src = kind === "apple" ? "./assets/atlases/collectibles-v1.webp" : "./assets/sprites/ui-heart-v1.webp";
  return <span className={`game-asset-icon game-asset-${kind} ${className}`.trim()} aria-hidden="true"><img src={src} alt="" /></span>;
}
