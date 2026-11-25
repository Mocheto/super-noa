/**
 * Página de revisión de alias del tablón (`revision.html`), solo para la persona adulta que lo administra. No se enlaza
 * desde el juego. Redacción normal, con tildes y minúsculas. Zona diferida `adultos.revision`: viaja solo con esa página.
 */
export const revision = {
  titulo: "Revisión de alias del tablón",
  explicacion: "Los alias nuevos no salen en el tablón hasta que los apruebas. Mientras tanto, los demás ven el alias aprobado anterior o un nombre provisional.",
  clave: {
    etiqueta: "Clave de administración",
    ayuda: "Se guarda solo en este navegador. No va en la dirección de la página ni se envía a otro sitio que no sea el servidor del tablón.",
    entrar: "Entrar",
    olvidar: "Olvidar la clave",
  },
  pestanas: {
    pending: "Pendientes",
    approved: "Aprobados",
    rejected: "Rechazados",
    hidden: "Ocultos",
  },
  ficha: {
    enviado: "Enviado el {fecha}",
    antes: "Aprobado antes: {alias}",
    seVe: "En el tablón se ve: {alias}",
  },
  acciones: {
    aprobar: "Aprobar",
    rechazar: "Rechazar",
    ocultar: "Ocultar",
    aprobarTodos: "Aprobar todos los pendientes",
    actualizar: "Actualizar",
  },
  confirmar: {
    aprobarTodos: { one: "¿Aprobar el alias pendiente?", other: "¿Aprobar los {n} alias pendientes?" },
    ocultar: "¿Ocultar «{alias}»? En el tablón pasará a verse un nombre provisional hasta que ese dispositivo elija otro alias y lo apruebes.",
  },
  cargando: "Cargando…",
  vacio: "No hay ninguno.",
  hecho: { one: "{n} alias actualizado.", other: "{n} alias actualizados." },
  errores: {
    clave: "Esa clave no vale. Revísala y vuelve a pegarla.",
    sinRevision: "El servidor no tiene la revisión activada: falta poner RANKING_ADMIN_TOKEN en el contenedor y reiniciar el supervisor.",
    espera: "Hay demasiadas peticiones seguidas. Espera {segundos} s y vuelve a intentarlo.",
    conexion: "No hay conexión con el servidor del tablón.",
    fallo: "El servidor ha respondido con un error ({estado}). Vuelve a intentarlo.",
  },
} as const;
