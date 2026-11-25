import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { t } from "../textos";
import type { Progress } from "./progress";
import { changeRankingAlias, loadRanking, rankingConnectionMessage, rankingProgress, readOwnRanking, readRankingDevice, registerRankingDevice, syncRanking, type RankingDevice, type RankingOwn, type RankingPlayer } from "./ranking";
import { isEnrolled, pideOtroAlias, TABLON_ACTIVO_KEY, tablonActivo } from "./rankingOnboarding";
import { readStorage, writeStorage } from "./storage";
import type { VentanaId } from "./useVentanas";

export function rankingErrorMessage(error: unknown, fallback: string) {
  return error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")
    ? rankingConnectionMessage
    : error instanceof Error ? error.message : fallback;
}

type Opciones = {
  progress: Progress;
  progressRef: RefObject<Progress>;
  /** Pantalla actual: la ventana de «elige otro alias» solo sale en el inicio o el mapa. */
  pantalla: string;
  algunaVentana: boolean;
  abrir: (ventana: VentanaId) => void;
  cerrar: (ventana: VentanaId) => void;
};

/**
 * El tablón mundial opcional: si está encendido, la tarjeta de este dispositivo, su alias y su revisión, el envío de logros
 * y la lista. Apagado (lo normal), no se habla con el servidor.
 */
export function useTablon({ progress, progressRef, pantalla, algunaVentana, abrir, cerrar }: Opciones) {
  const [device, setDevice] = useState<RankingDevice | null>(readRankingDevice);
  const [activo, setActivo] = useState(() => tablonActivo(readStorage(TABLON_ACTIVO_KEY), readRankingDevice()));
  const [alias, setAlias] = useState("");
  const [aliasNuevo, setAliasNuevo] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [own, setOwn] = useState<RankingOwn | null>(null);
  const [pedirOtro, setPedirOtro] = useState(false);
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "saved" | "pending">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const joiningRef = useRef(false);
  const aliasRef = useRef<HTMLInputElement | null>(null);
  /** El rechazo se avisa una vez por visita, aunque se cierre con «Más tarde». */
  const otroAvisadoRef = useRef(false);

  // El tablón solo recibe lo que le importa: cuidar la casa o mirar fotos no lo vuelve a enviar.
  const clave = useMemo(() => JSON.stringify(rankingProgress(progress)), [progress]);

  useEffect(() => {
    if (!activo || !device) return;
    let cancelled = false;
    let attempt = 0;
    const publish = async () => {
      const currentAttempt = ++attempt;
      setSyncState("syncing");
      try {
        // Una tarjeta pendiente de confirmar se registra primero, con el mismo alias.
        await syncRanking(device, progressRef.current);
        if (!cancelled && currentAttempt === attempt) {
          const confirmed = readRankingDevice();
          if (confirmed?.id === device.id && confirmed.token === device.token
            && (confirmed.alias !== device.alias || Boolean(confirmed.registrationPending) !== Boolean(device.registrationPending))) {
            setDevice(confirmed);
          }
          setSyncState("saved");
          setSyncMessage("");
        }
      } catch (error) {
        if (!cancelled && currentAttempt === attempt) {
          // Si el registro pendiente no valía (alias ocupado o que no pasa el filtro), la tarjeta se ha borrado: se vuelve a elegir alias.
          if (!readRankingDevice()) { setDevice(null); setSyncState("idle"); return; }
          setSyncState("pending");
          setSyncMessage(rankingErrorMessage(error, t("adultos.app.no-pude-enviar-tus")));
        }
      }
    };
    const retryOnline = () => { void publish(); };
    const timeout = window.setTimeout(() => void publish(), 250);
    window.addEventListener("online", retryOnline);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("online", retryOnline);
    };
  }, [activo, clave, device, progressRef, retry]);

  const leerPropia = useCallback(async (tarjeta: RankingDevice) => {
    try {
      const propia = await readOwnRanking(tarjeta);
      setOwn(propia);
      return propia;
    } catch {
      // Sin conexión no se sabe el estado: se queda el último conocido.
      return null;
    }
  }, []);

  // Al abrir el juego (o al apuntarse) se mira cómo está el alias; si se rechazó, se pide otro una vez.
  const enrolledDevice = activo && isEnrolled(device) ? device : null;
  useEffect(() => {
    if (!enrolledDevice) return;
    let cancelled = false;
    readOwnRanking(enrolledDevice).then((propia) => {
      if (cancelled) return;
      setOwn(propia);
      if (!pideOtroAlias(propia) || otroAvisadoRef.current) return;
      otroAvisadoRef.current = true;
      setPedirOtro(true);
    }, () => { /* Sin conexión no se sabe el estado: se mira la próxima vez. */ });
    return () => { cancelled = true; };
  }, [enrolledDevice]);

  // La ventana de «elige otro alias» espera a un menú tranquilo (inicio o mapa, sin otra ventana delante).
  useEffect(() => {
    if (!pedirOtro || algunaVentana || (pantalla !== "home" && pantalla !== "map")) return;
    abrir("tablon");
  }, [abrir, algunaVentana, pantalla, pedirOtro]);

  const refresh = async () => {
    setMessage("");
    setLoading(true);
    try {
      if (device) setRetry((current) => current + 1);
      if (isEnrolled(device)) void leerPropia(device!);
      setPlayers(await loadRanking());
    } catch (error) {
      setMessage(rankingErrorMessage(error, t("adultos.app.no-pude-actualizar-el")));
    } finally {
      setLoading(false);
    }
  };

  const abrirTablon = () => {
    abrir("tablon");
    void refresh();
  };

  const unirse = async () => {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    setMessage("");
    try {
      const pending = readRankingDevice();
      const registered = await registerRankingDevice(pending?.registrationPending ? pending.alias : alias);
      setDevice(registered);
      setMessage(t("adultos.app.hola-alias-tu-tarjeta", { alias: registered.alias }));
      void refresh();
    } catch (error) {
      setDevice(readRankingDevice());
      setMessage(rankingErrorMessage(error, t("adultos.app.no-pude-guardar-ese")));
    } finally {
      joiningRef.current = false;
      setJoining(false);
      window.requestAnimationFrame(() => aliasRef.current?.focus());
    }
  };

  const cambiarAlias = async () => {
    if (!device || joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    setMessage("");
    try {
      const propia = await changeRankingAlias(device, aliasNuevo);
      setOwn(propia);
      setDevice(readRankingDevice());
      setCambiando(false);
      setPedirOtro(false);
      setAliasNuevo("");
      setMessage(t("adultos.tablon.alias-enviado"));
    } catch (error) {
      setMessage(rankingErrorMessage(error, t("adultos.app.no-pude-guardar-ese")));
    } finally {
      joiningRef.current = false;
      setJoining(false);
      window.requestAnimationFrame(() => aliasRef.current?.focus());
    }
  };

  /** El interruptor de Ajustes. Encenderlo sin tarjeta abre el tablón para elegir alias; apagarlo deja de enviar. */
  const activar = (encendido: boolean) => {
    writeStorage(TABLON_ACTIVO_KEY, encendido ? "1" : "0");
    setActivo(encendido);
    if (!encendido) {
      cerrar("tablon");
      setPedirOtro(false);
      setSyncState("idle");
      return;
    }
    abrirTablon();
  };

  const cerrarTablon = () => {
    cerrar("tablon");
    setPedirOtro(false);
    setCambiando(false);
    setMessage("");
  };

  return {
    activo, device, alias, setAlias, aliasNuevo, setAliasNuevo, aliasRef, cambiando, setCambiando, own, pedirOtro,
    players, message, loading, joining, syncState, syncMessage,
    abrirTablon, refresh, unirse, cambiarAlias, activar, cerrarTablon,
    reintentarEnvio: () => setRetry((current) => current + 1),
  };
}

export type Tablon = ReturnType<typeof useTablon>;
