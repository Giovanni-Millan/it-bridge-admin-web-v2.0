import Swal from "sweetalert2";
import { supabase } from "./supabaseClient.js";

/*
 * Cliente para la Edge Function `admin-api` de Supabase: reemplaza el uso
 * directo de `supabaseAdmin` (Service Role Key) desde el navegador.
 *
 * Cada función manda la sesión del admin logueado (su access_token, no la
 * service role key) a la función, que valida que sea admin de verdad y
 * ejecuta la operación del lado del servidor. Ver bridge-admin-web/README.md
 * y la Edge Function `admin-api` en el proyecto de Supabase (versionada en
 * bridge-admin-web/supabase/functions/admin-api/index.ts).
 *
 * Las formas de respuesta ({ data, error }) se mantienen lo más parecidas
 * posible a las de supabase-js para que el código que ya existía en
 * bridge-admin necesite el mínimo cambio posible al migrarse aquí.
 */

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

// A los cuántos ms de espera avisamos "esto está tardando más de lo normal"
// (cold start típico de una Edge Function) sin cancelar la petición todavía.
const SLOW_WARNING_MS = 8000;

// A los cuántos ms cancelamos la petición si sigue sin responder.
const TIMEOUT_MS = 20000;

let toastVisible = false;

function avisarLento() {
  if (toastVisible) return;
  toastVisible = true;
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: "Esto está tardando más de lo normal…",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didClose: () => {
      toastVisible = false;
    },
  });
}

async function call(action, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    return { data: null, error: { message: "No hay sesión activa" } };
  }

  const controller = new AbortController();
  const slowTimer = setTimeout(avisarLento, SLOW_WARNING_MS);
  const timeoutTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
  } catch (networkErr) {
    // Nota: este error se devuelve tal cual (no se traduce aquí) porque
    // todas las páginas que consumen adminApi.js y muestran error.message
    // al usuario ya pasan el resultado por traducirError/mostrarError
    // (ver src/utils/errorTraductor.js). Traducirlo aquí también causaría
    // doble traducción: el texto ya en español no matchea el diccionario
    // en la segunda pasada y termina cayendo al mensaje genérico, perdiendo
    // el mensaje específico. Las 2 excepciones (sin sesión y timeout,
    // arriba/abajo) ya están en español desde aquí porque son casos que
    // ningún archivo necesita re-traducir (no vienen de Supabase/Postgres).
    const timedOut = networkErr.name === "AbortError";
    return {
      data: null,
      error: {
        message: timedOut
          ? "La operación tardó demasiado y se canceló. Intenta de nuevo."
          : networkErr.message || "Error de red",
      },
    };
  } finally {
    clearTimeout(slowTimer);
    clearTimeout(timeoutTimer);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Igual que en el catch de red: no traducir aquí, se deja tal cual
    // para que la página que llama lo traduzca una sola vez (ver nota arriba).
    return { data: null, error: { message: body.error || `Error ${res.status}` } };
  }

  return { data: body, error: null };
}

/* ============================= */
/* AUTH ADMIN */
/* ============================= */

// rol: "alumno" | "docente" | "psicologo"
export async function createUser({ email, password, rol }) {
  const { data, error } = await call("authCreateUser", { email, password, rol });
  return { data: data ? { user: data.user } : null, error };
}

export async function getUserById(id) {
  const { data, error } = await call("authGetUserById", { id });
  return { data: data ? { user: data.user } : null, error };
}

// attrs puede traer: email, password, ban_duration
export async function updateUserById(id, attrs) {
  const { data, error } = await call("authUpdateUserById", { id, ...attrs });
  return { data: data ? { user: data.user } : null, error };
}

export async function listUsers() {
  const { data, error } = await call("authListUsers", {});
  return { data: data ? { users: data.users } : null, error };
}

/* ============================= */
/* TABLAS */
/* ============================= */

// values: objeto o arreglo de objetos a insertar. Devuelve las filas insertadas.
export async function insertRows(table, values) {
  const { data, error } = await call("dbInsert", { table, values });
  return { data: data?.data ?? null, error };
}

// Actualiza las filas de `table` donde `column` = `value`.
export async function updateRows(table, column, value, values) {
  return updateRowsWhere(table, [{ column, value }], values);
}

// Igual que updateRows, pero con varias condiciones AND (`matches`) y, opcionalmente,
// un filtro .in() (`inFilter: { column, values }`) — para los "bloquear/desbloquear todas".
export async function updateRowsWhere(table, matches, values, inFilter) {
  const { data, error } = await call("dbUpdate", { table, matches, inFilter, values });
  return { data: data?.data ?? null, error };
}

// Borra las filas de `table` donde `column` = `value`.
export async function deleteRows(table, column, value) {
  const { error } = await call("dbDelete", { table, column, value });
  return { error };
}

/* ============================= */
/* AVATARES */
/* ============================= */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:<mime>;base64,AAAA..." — solo nos interesa la parte base64
      const base64 = String(reader.result).split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatar(file, rol, id) {
  const fileBase64 = await fileToBase64(file);
  const { data, error } = await call("avatarUpload", {
    rol,
    id,
    fileBase64,
    fileName: file.name,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return data.fotoUrl;
}

export async function removeAvatar(rol, id) {
  const { error } = await call("avatarRemove", { rol, id });
  if (error) throw new Error(error.message);
}
