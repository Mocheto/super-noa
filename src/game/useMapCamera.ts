import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { mapCenterAt, mapFrame, mapPointAt, mapPointIsVisible, mapZoomLimits, type MapPoint, type MapSize, type MapZoom } from "./mapCamera";

const midpoint = (a: MapPoint, b: MapPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export function useMapCamera(viewportRef: RefObject<HTMLDivElement | null>, initialCenter: MapPoint, onExplore: () => void) {
  const [viewport, setViewport] = useState<MapSize>({ width: 0, height: 0 });
  const [camera, setCamera] = useState<{ center: MapPoint; zoom: MapZoom }>({ center: initialCenter, zoom: "near" });
  const contacts = useRef(new Map<number, MapPoint>());
  const gesture = useRef({ dragged: false, start: { x: 0, y: 0 } });
  const frame = mapFrame(viewport, camera.center, camera.zoom);
  const { fit, near, max } = mapZoomLimits(viewport);
  const overview = frame.width < near;
  const centerOn = useCallback((center: MapPoint) => setCamera((current) => ({ ...current, center })), []);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element;
      if (width && height) setViewport({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewportRef]);

  const showAll = () => { onExplore(); setCamera({ center: { x: 50, y: 50 }, zoom: "all" }); };
  const showNear = (center: MapPoint) => { onExplore(); setCamera({ center, zoom: "near" }); };
  const ensureVisible = (point: MapPoint) => {
    if (contacts.current.size) return;
    if (overview) showNear(point);
    else if (!mapPointIsVisible(viewport, frame, point)) centerOn(point);
  };
  const zoomBy = (direction: -1 | 1) => {
    onExplore();
    setCamera((current) => {
      const original = mapFrame(viewport, current.center, current.zoom);
      const pivot = { x: viewport.width / 2, y: viewport.height / 2 };
      const zoom = direction > 0 && original.width < near ? "near" : original.width * (direction > 0 ? 1.25 : 0.8);
      return { center: mapPointAt(original, pivot), zoom };
    });
  };

  const local = (event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left - event.currentTarget.clientLeft, y: event.clientY - rect.top - event.currentTarget.clientTop };
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || contacts.current.size >= 2) return;
    const point = local(event);
    if (contacts.current.size === 0) gesture.current = { dragged: false, start: point };
    contacts.current.set(event.pointerId, point);
    if (contacts.current.size === 2) {
      // A two-finger gesture belongs to the map, even before either finger
      // moves. Capture both contacts so lifting them cannot select a marker.
      gesture.current.dragged = true;
      onExplore();
      for (const id of contacts.current.keys()) event.currentTarget.setPointerCapture(id);
      event.preventDefault();
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = contacts.current.get(event.pointerId);
    if (!previous) return;
    const point = local(event);
    const other = [...contacts.current].find(([id]) => id !== event.pointerId)?.[1];
    if (!other && !gesture.current.dragged && distance(gesture.current.start, point) < 6) return;
    contacts.current.set(event.pointerId, point);
    gesture.current.dragged = true;
    event.preventDefault();
    onExplore();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    const origin = other ? midpoint(other, previous) : previous;
    const destination = other ? midpoint(other, point) : point;
    const factor = other ? distance(other, point) / Math.max(1, distance(other, previous)) : 1;
    setCamera((current) => {
      const original = mapFrame(viewport, current.center, current.zoom);
      const anchor = mapPointAt(original, origin);
      const next = mapFrame(viewport, current.center, original.width * factor);
      return { center: mapCenterAt(viewport, next, anchor, destination), zoom: next.width };
    });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    contacts.current.delete(event.pointerId);
  };
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && !event.currentTarget.hasPointerCapture(event.pointerId)) onPointerUp(event);
  };
  const onLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
    // Touch starts with implicit capture on the image or marker. Transferring
    // capture to the viewport emits a bubbling loss from that child; it must
    // not end the gesture we have just captured on the viewport.
    if (event.target === event.currentTarget) onPointerUp(event);
  };
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!gesture.current.dragged || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!overview || event.target instanceof Element && event.target.closest("button, [role='button']")) return;
    const point = mapPointAt(frame, local(event));
    if (point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100) showNear(point);
  };
  return {
    frame, overview, showAll, showNear, centerOn, ensureVisible, zoomBy,
    atMin: frame.width <= fit + 1, atMax: frame.width >= max - 1,
    viewportEvents: { onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onPointerCancel: onPointerUp, onLostPointerCapture, onClick, onClickCapture },
  };
}
