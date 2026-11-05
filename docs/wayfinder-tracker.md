# Tracker: GitHub Issues

Tracker canónico: https://github.com/Mocheto/super-noa/issues.

## Mapas

- [Un mapa de Super Noa con espacio para todos los mundos](https://github.com/Mocheto/super-noa/issues/2).

## Wayfinding operations

- El mapa es una issue con la etiqueta `wayfinder:map`; su cuerpo sigue la plantilla de la skill wayfinder.
- Cada decisión es una sub-issue nativa del mapa, con una única etiqueta de tipo: `wayfinder:grilling`, `wayfinder:prototype`, `wayfinder:research` o `wayfinder:task`. No añadir etiquetas de triaje.
- Usa relaciones nativas de dependencia de GitHub, además de sub-issues. No sustituyas las relaciones por listas de tareas o referencias en el cuerpo.
- Si el conector no expone estas operaciones, usa `gh api` contra `repos/Mocheto/super-noa`. Para crear una sub-issue: `POST issues/{parent_number}/sub_issues` con `sub_issue_id` (ID numérico de la issue, no su número). Para declarar un bloqueo: `POST issues/{blocked_number}/dependencies/blocked_by` con `issue_id` (ID numérico del bloqueante).
- Para consultar las hijas: `GET issues/{parent_number}/sub_issues`. Para cada hija abierta y sin asignar consulta `GET issues/{number}/dependencies/blocked_by`: está en la frontera si todos sus bloqueantes están cerrados. Ordena la frontera por número de issue ascendente.
- Reclama una decisión antes de trabajar: asígnala a la persona que conduce el mapa (la cuenta autenticada de GitHub, si corresponde). Crear el mapa no implica reclamar ni resolver sus decisiones.
- La resolución se publica como comentario en la decisión; después se cierra y se añade al mapa un enlace por título con una síntesis de una línea. Las decisiones pendientes no se enumeran en el cuerpo del mapa: se consultan como hijas abiertas.
- Usa títulos enlazados al referirte a mapas y decisiones. Guarda las propuestas como propuestas hasta recibir las respuestas humanas requeridas por la skill.
- Antes de crear un mapa, consulta las issues existentes para evitar duplicados. Crea primero las issues y después sus relaciones y referencias con los IDs reales.
