# Versiones — Bridge Admin

Convención de numeración: `MAYOR.FUNCIÓN.CAMBIO`

- **MAYOR** (1er número): se incrementa solo en hitos grandes, a criterio manual.
- **FUNCIÓN** (2do número): se incrementa al implementar una función nueva. Al subir este número, **CAMBIO se reinicia a 0**.
- **CAMBIO** (3er número): se incrementa con cada corrección/ajuste dentro de la función actual (bugs, retoques, mejoras menores).

Cada versión se documenta aquí con lo que trae, de la más reciente a la más antigua.

**Nota:** el número de versión se sincroniza entre los 4 portales web (admin, docente, alumno, psicólogo) cuando el cambio toca a todos por igual — cada repo mantiene su propio `versiones.md`.

---

## 1.3.0 — 2026-09-30

Pie de página del sistema, con la autoría, en los 4 portales web (admin, docente, alumno, psicólogo).

- Texto: "Sistema Bridge · Creado por Ing. Giovanni Millán Guevara · Todos los derechos reservados © {año}".
- Fondo morado de marca (`bg-purple-950`, el mismo tono del Navbar), aparece al final del contenido de cada página (no fijo/flotante).
- Se monta en `RutaProtegida.jsx`, justo después del `<Outlet/>` — por diseño **nunca aparece en el Login**, solo una vez que hay sesión válida y se renderizan las rutas protegidas.
- Componente nuevo `components/Footer.jsx`, igual en los 4 repos.

## 1.2.1 — 2026-09-30

Alta de "capturar y editar calificaciones" para el admin en **Calificaciones de la Materia** (`/Grupos/Detalle/:id_grupo/Calificaciones/:materia`).

- Antes el admin solo podía ver, bloquear/desbloquear y exportar — no existía ningún input para capturar nota.
- Ahora cada calificación ya capturada tiene un ícono de editar (lápiz) que abre un diálogo para cambiar el valor, **sin importar si está bloqueada** (el candado solo restringe al Portal del Docente, nunca a este panel de admin).
- Cada fila "Sin capturar" tiene un botón "+ Capturar" para darla de alta desde cero.
- Aplica a los dos esquemas que maneja la pantalla: Universidad/Autoplaneado (`calificaciones`, una sola nota) y Bachillerato/Secundaria (`calificaciones_parciales`, 3 parciales — requiere que la materia ya tenga profesor asignado en el grupo, porque esa tabla exige `id_profesor`).
- Usa la Edge Function `admin-api` ya existente (mismo camino que "Bloquear/Desbloquear todas"), que ya valida sede y rol de admin — no se tocó el backend.
