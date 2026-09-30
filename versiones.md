# Versiones — Bridge Admin

Convención de numeración: `MAYOR.FUNCIÓN.CAMBIO`

- **MAYOR** (1er número): se incrementa solo en hitos grandes, a criterio manual.
- **FUNCIÓN** (2do número): se incrementa al implementar una función nueva. Al subir este número, **CAMBIO se reinicia a 0**.
- **CAMBIO** (3er número): se incrementa con cada corrección/ajuste dentro de la función actual (bugs, retoques, mejoras menores).

Cada versión se documenta aquí con lo que trae, de la más reciente a la más antigua.

---

## 1.2.1 — 2026-09-30

Alta de "capturar y editar calificaciones" para el admin en **Calificaciones de la Materia** (`/Grupos/Detalle/:id_grupo/Calificaciones/:materia`).

- Antes el admin solo podía ver, bloquear/desbloquear y exportar — no existía ningún input para capturar nota.
- Ahora cada calificación ya capturada tiene un ícono de editar (lápiz) que abre un diálogo para cambiar el valor, **sin importar si está bloqueada** (el candado solo restringe al Portal del Docente, nunca a este panel de admin).
- Cada fila "Sin capturar" tiene un botón "+ Capturar" para darla de alta desde cero.
- Aplica a los dos esquemas que maneja la pantalla: Universidad/Autoplaneado (`calificaciones`, una sola nota) y Bachillerato/Secundaria (`calificaciones_parciales`, 3 parciales — requiere que la materia ya tenga profesor asignado en el grupo, porque esa tabla exige `id_profesor`).
- Usa la Edge Function `admin-api` ya existente (mismo camino que "Bloquear/Desbloquear todas"), que ya valida sede y rol de admin — no se tocó el backend.
