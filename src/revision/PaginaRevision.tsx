import "../textos/zonas/adultos.revision";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { RANKING_URL } from "../game/rankingServidor";
import { t } from "../textos";
import { accionesDe, clienteRevision, ErrorRevision, estadosAlias, guardarClave, leerClave, type AccionAlias, type AliasEnRevision, type EstadoAlias, type FalloRevision } from "./revisionAlias";

const almacen = (() => { try { return window.localStorage; } catch { return null; } })();
const fecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

type Aviso = { tipo: "error"; texto: string } | { tipo: "hecho"; texto: string };

function textoDeFallo(fallo: FalloRevision): string {
  switch (fallo.tipo) {
    case "clave": return t("adultos.revision.errores.clave");
    case "sinRevision": return t("adultos.revision.errores.sinRevision");
    case "espera": return t("adultos.revision.errores.espera", { segundos: fallo.segundos });
    case "conexion": return t("adultos.revision.errores.conexion");
    case "fallo": return t("adultos.revision.errores.fallo", { estado: fallo.estado });
  }
}

const etiquetaAccion: Record<AccionAlias, Parameters<typeof t>[0]> = {
  approve: "adultos.revision.acciones.aprobar",
  reject: "adultos.revision.acciones.rechazar",
  hide: "adultos.revision.acciones.ocultar",
};

export function RevisionAlias() {
  const [clave, setClave] = useState(() => leerClave(almacen));
  const [entrada, setEntrada] = useState("");
  const [estado, setEstado] = useState<EstadoAlias>("pending");
  const [lista, setLista] = useState<AliasEnRevision[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const cliente = useMemo(() => clave ? clienteRevision(RANKING_URL, clave) : null, [clave]);

  const fallar = useCallback((error: unknown) => {
    const fallo: FalloRevision = error instanceof ErrorRevision ? error.fallo : { tipo: "conexion" };
    setAviso({ tipo: "error", texto: textoDeFallo(fallo) });
    // Con una clave mala no se sigue intentando: se vuelve a pedir.
    if (fallo.tipo === "clave") {
      setClave(guardarClave(almacen, null));
      setLista(null);
    }
  }, []);

  const cargar = useCallback(async () => {
    if (!cliente) return;
    setOcupado(true);
    try {
      setLista(await cliente.listar(estado));
    } catch (error) {
      fallar(error);
    } finally {
      setOcupado(false);
    }
  }, [cliente, estado, fallar]);

  useEffect(() => {
    // Al entrar o cambiar de pestaña se lee la lista del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const hacer = async (trabajo: () => Promise<number>) => {
    setOcupado(true);
    setAviso(null);
    try {
      const n = await trabajo();
      setAviso({ tipo: "hecho", texto: t("adultos.revision.hecho", { n }) });
      setLista(await cliente!.listar(estado));
    } catch (error) {
      fallar(error);
    } finally {
      setOcupado(false);
    }
  };

  const actuar = (accion: AccionAlias, fila: AliasEnRevision) => {
    if (accion === "hide" && !window.confirm(t("adultos.revision.confirmar.ocultar", { alias: fila.alias }))) return;
    void hacer(() => cliente!.actuar(accion, [fila.id]));
  };

  const aprobarTodos = () => {
    const pendientes = estado === "pending" ? lista?.length ?? 0 : 0;
    if (!window.confirm(t("adultos.revision.confirmar.aprobarTodos", { n: pendientes }))) return;
    void hacer(() => cliente!.aprobarTodos());
  };

  const entrar = (event: FormEvent) => {
    event.preventDefault();
    const guardada = guardarClave(almacen, entrada);
    setEntrada("");
    setAviso(null);
    setClave(guardada);
  };

  const olvidar = () => {
    setClave(guardarClave(almacen, null));
    setLista(null);
    setAviso(null);
  };

  return (
    <main className="revision">
      <h1>{t("adultos.revision.titulo")}</h1>
      <p className="revision-explicacion">{t("adultos.revision.explicacion")}</p>
      {aviso && <p className={`revision-aviso revision-aviso-${aviso.tipo}`} role={aviso.tipo === "error" ? "alert" : "status"}>{aviso.texto}</p>}
      {!clave ? (
        <form className="revision-clave" onSubmit={entrar}>
          <label htmlFor="revision-clave">{t("adultos.revision.clave.etiqueta")}</label>
          <input id="revision-clave" type="password" autoComplete="off" autoCapitalize="off" spellCheck={false} value={entrada} onChange={(event) => setEntrada(event.target.value)} required minLength={16} />
          <p className="revision-ayuda">{t("adultos.revision.clave.ayuda")}</p>
          <button type="submit" className="revision-boton revision-boton-principal" disabled={!entrada.trim()}>{t("adultos.revision.clave.entrar")}</button>
        </form>
      ) : (
        <>
          <nav className="revision-pestanas" aria-label={t("adultos.revision.titulo")}>
            {estadosAlias.map((cual) => (
              <button key={cual} type="button" className="revision-pestana" aria-pressed={cual === estado} onClick={() => { setEstado(cual); setAviso(null); }}>
                {t(`adultos.revision.pestanas.${cual}`)}
              </button>
            ))}
          </nav>
          <div className="revision-barra">
            <button type="button" className="revision-boton" onClick={() => void cargar()} disabled={ocupado}>{t("adultos.revision.acciones.actualizar")}</button>
            {estado === "pending" && (lista?.length ?? 0) > 0 && (
              <button type="button" className="revision-boton revision-boton-principal" onClick={aprobarTodos} disabled={ocupado}>{t("adultos.revision.acciones.aprobarTodos")}</button>
            )}
          </div>
          {lista === null ? ocupado && <p>{t("adultos.revision.cargando")}</p> : lista.length === 0 ? <p>{t("adultos.revision.vacio")}</p> : (
            <ul className="revision-lista" aria-busy={ocupado}>
              {lista.map((fila) => (
                <li key={fila.id} className="revision-ficha">
                  <strong className="revision-alias">{fila.alias}</strong>
                  {fila.submittedAt && <span>{t("adultos.revision.ficha.enviado", { fecha: fecha.format(new Date(fila.submittedAt)) })}</span>}
                  {fila.approvedAlias && fila.approvedAlias !== fila.alias && <span>{t("adultos.revision.ficha.antes", { alias: fila.approvedAlias })}</span>}
                  <span>{t("adultos.revision.ficha.seVe", { alias: fila.publicAlias })}</span>
                  <div className="revision-acciones">
                    {accionesDe[fila.aliasStatus].map((accion) => (
                      <button key={accion} type="button" className={`revision-boton revision-boton-${accion}`} onClick={() => actuar(accion, fila)} disabled={ocupado}>
                        {t(etiquetaAccion[accion])}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="revision-boton revision-olvidar" onClick={olvidar}>{t("adultos.revision.clave.olvidar")}</button>
        </>
      )}
    </main>
  );
}
