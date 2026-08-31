# admin-api (Edge Function)

Código fuente versionado de la Edge Function `admin-api`, desplegada en el
proyecto Supabase real de Bridge (`xpoyubsdnqhdlptkybgp`). Antes del
31-ago-2026 esta función se editaba y desplegaba directo desde el dashboard
de Supabase, sin quedar en ningún git — este archivo es la primera copia
versionada, recuperada del proyecto real vía MCP para que coincida
exactamente con lo desplegado en ese momento (`index.ts`, versión 2).

**A partir de ahora, cualquier cambio a esta función debe hacerse editando
este archivo y desplegando desde aquí — no editando directo en el
dashboard**, para no volver a perder el historial.

## Historial

- **v2** (recuperada del dashboard, sin CORS): primera copia versionada.
- **v3** (31-ago-2026): al probar en producción (Netlify) apareció un error
  de CORS al llamar la función desde el navegador — el preflight `OPTIONS`
  se rechazaba con 401 antes de llegar al código, porque la función tenía
  `verify_jwt=true` a nivel de plataforma y el navegador nunca manda
  `Authorization` en el preflight; esa respuesta de rechazo tampoco traía
  headers de CORS. Se agregó manejo explícito de `OPTIONS` +
  `Access-Control-Allow-*` en toda respuesta, y se redesplegó con
  `verify_jwt=false` (la función ya valida el JWT y el rol admin por su
  cuenta en el código — ver `authGetUserById`/`app_metadata.rol`, así que
  apagar el gate de la plataforma no baja la seguridad real).

## Desplegar

Requiere el [CLI de Supabase](https://supabase.com/docs/guides/cli) y estar
logueado (`supabase login`):

```
supabase functions deploy admin-api --project-ref xpoyubsdnqhdlptkybgp
```

## Qué hace

Reemplaza el uso directo de `supabaseAdmin` (Service Role Key) desde el
navegador. Valida que quien llama sea admin (`app_metadata.rol === "admin"`
del JWT de la sesión) y solo entonces ejecuta la operación con la service
role key, que nunca sale del servidor. Ver comentarios en `index.ts` para el
detalle de cada acción y la allowlist fija de tablas permitidas.

Consumida desde `src/components/adminApi.js`.
