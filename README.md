# bridge-admin-web

Versión web del portal de administración de Bridge.

Copia de `bridge-admin` (la versión de escritorio empaquetada con Tauri) adaptada para
desplegarse como sitio web normal. No modifica ni depende de `bridge-admin` — es un
proyecto independiente con su propio `.env` y su propio despliegue.

## Diferencias respecto a `bridge-admin`

- Sin Tauri: no incluye `src-tauri/`, ni las dependencias `@tauri-apps/*`, ni el
  auto-actualizador (no aplica en web — el navegador siempre carga la última versión).
- Sin Service Role Key de Supabase en el `.env`: a diferencia de la versión de
  escritorio, esta versión nunca debe incluir `VITE_SUPABASE_SERVICE_ROLE_KEY`, porque
  Vite la incrustaría en el JS público. Las operaciones que la necesitan (alta de
  usuarios, edición de cuentas, etc.) se sirven desde Edge Functions de Supabase — ver
  el plan de fases del proyecto.
- Incluye `public/_redirects` para que el ruteo de `react-router-dom` funcione en Netlify.

## Desarrollo

```
npm install
npm run dev
```

Corre en el puerto 5176 (los demás portales usan 5173–5175 y 1420).
