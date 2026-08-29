import { createClient } from "@supabase/supabase-js";

/* ============================= */
/* VARIABLES ENV */
/* ============================= */

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

/* ============================= */
/* CLIENTE NORMAL (LOGIN / CRUD) */
/* ============================= */

export const supabase =
  createClient(
    supabaseUrl,
    anonKey
  );

/* ============================================================ */
/* CLIENTE ADMIN (AUTH ADMIN) — DESHABILITADO EN LA VERSIÓN WEB  */
/* ============================================================ */
/*
 * A diferencia de bridge-admin (Tauri, escritorio), esta versión web
 * NO trae la Supabase Service Role Key en el bundle: si se incluyera
 * aquí, Vite la incrustaría tal cual en el JS que se manda al navegador
 * y cualquier visitante podría extraerla y obtener acceso total a la
 * base de datos, saltándose RLS.
 *
 * Las operaciones que antes usaban `supabaseAdmin` (crear/editar/borrar
 * usuarios vía Auth Admin, escrituras que necesitan saltarse RLS, subir
 * fotos de perfil) se están migrando a Edge Functions de Supabase, que
 * guardan la service role key solo del lado del servidor. Ver el plan,
 * fase 2.
 *
 * Mientras esa migración no esté lista para cada pantalla, cualquier
 * llamada a `supabaseAdmin` falla aquí con un error claro en vez de
 * romper toda la app al cargar (que es lo que pasaría si se intentara
 * crear el cliente con una key vacía).
 */
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `supabaseAdmin.${String(prop)} no está disponible en bridge-admin-web todavía: ` +
          "esta operación necesita migrarse a una Edge Function (ver plan, fase 2) antes de usarse aquí."
      );
    },
  }
);
