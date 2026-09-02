// Cliente(s) de Supabase para bridge-admin-web. Este archivo define DOS
// exports: `supabase` (el cliente real, con la clave pública anon) y
// `supabaseAdmin` (un cliente falso/trampa — ver comentario abajo).
//
// A diferencia de `bridge-admin` (la versión de escritorio con Tauri), esta
// versión web NO trae ni debe traer nunca la Supabase Service Role Key en
// el bundle: si se pusiera aquí, Vite la incrustaría tal cual en el JS que
// se manda al navegador, y cualquier visitante podría extraerla desde las
// devtools y obtener acceso total a la base de datos saltándose RLS.
//
// Las operaciones que sí necesitan esa key (crear/editar/banear usuarios
// vía Auth Admin, escrituras que necesitan saltarse RLS, subir/borrar fotos
// de perfil) pasan por la Edge Function `admin-api` (ver adminApi.js en
// esta misma carpeta) — la key vive ahí, solo del lado del servidor, nunca
// en el navegador.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente normal: login, y cualquier lectura/escritura protegida por RLS
// (la mayoría de las pantallas lo usan directo para SELECT/INSERT/UPDATE
// sencillos que la política de la tabla ya permite al rol admin).
export const supabase = createClient(supabaseUrl, anonKey);

// `supabaseAdmin` NO es un cliente real — es un Proxy que lanza error en
// cualquier acceso (`supabaseAdmin.auth...`, `supabaseAdmin.storage...`,
// lo que sea). Existe a propósito, como red de seguridad: si algún código
// nuevo (o copiado sin querer de bridge-admin, donde este nombre SÍ es un
// cliente real con la service role key) intenta usar `supabaseAdmin` aquí,
// falla de inmediato con un mensaje claro en vez de:
//   (a) romper toda la app al cargar si se intentara crear el cliente
//       con una key vacía, o
//   (b) fallar en silencio más adelante de forma confusa.
// La forma correcta de hacer esa misma operación en este proyecto es
// `adminApi.js` (createUser, updateRows, uploadAvatar, etc.).
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `supabaseAdmin.${String(prop)} no existe en bridge-admin-web: ` +
          "usa las funciones de adminApi.js (createUser, insertRows, updateRows, uploadAvatar, ...) en su lugar."
      );
    },
  }
);
