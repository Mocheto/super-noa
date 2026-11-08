import { MAP_HEIGHT, MAP_WIDTH } from "./worldMapData.ts";

export type MapPoint = { x: number; y: number };
export type MapSize = { width: number; height: number };
export type MapZoom = "near" | "all" | number;

const ratio = MAP_WIDTH / MAP_HEIGHT;
const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function mapZoomLimits(viewport: MapSize) {
  const fit = Math.min(viewport.width, viewport.height * ratio);
  // Keep full-size labels, shop badges and adjacent detours separate even on a narrow screen.
  const near = Math.max(fit, 1700);
  return { fit, near, max: Math.max(near, 2200) };
}

export function mapFrame(viewport: MapSize, center: MapPoint, zoom: MapZoom) {
  const { fit, near, max } = mapZoomLimits(viewport);
  const width = zoom === "all" ? fit : zoom === "near" ? near : clamp(zoom, fit, max);
  const height = width / ratio;
  const offset = (at: number, stage: number, window: number) => stage <= window
    ? (window - stage) / 2
    : clamp(window / 2 - stage * at / 100, window - stage, 0);
  return { width, height, x: offset(center.x, width, viewport.width), y: offset(center.y, height, viewport.height) };
}

export function mapPointAt(frame: ReturnType<typeof mapFrame>, point: MapPoint): MapPoint {
  return { x: (point.x - frame.x) / frame.width * 100, y: (point.y - frame.y) / frame.height * 100 };
}

export function mapCenterAt(viewport: MapSize, frame: ReturnType<typeof mapFrame>, anchor: MapPoint, point: MapPoint): MapPoint {
  const center = {
    x: anchor.x + (viewport.width / 2 - point.x) / frame.width * 100,
    y: anchor.y + (viewport.height / 2 - point.y) / frame.height * 100,
  };
  const placed = mapFrame(viewport, center, frame.width);
  return mapPointAt(placed, { x: viewport.width / 2, y: viewport.height / 2 });
}

export function mapPointIsVisible(viewport: MapSize, frame: ReturnType<typeof mapFrame>, point: MapPoint, margin = 74) {
  const x = frame.x + frame.width * point.x / 100;
  const y = frame.y + frame.height * point.y / 100;
  return x >= margin && x <= viewport.width - margin && y >= margin && y <= viewport.height - margin;
}
