import { supabase } from "./supabaseClient.js";

/*
 * Cliente para la Edge Function `admin-api` de Supabase: reemplaza el uso
 * directo de `supabaseAdmin` (Service Role Key) desde el navegador.
 *
 * Cada función manda la sesión del admin logueado (su access_token, no la
 * service role key) a la función, que valida que sea admin de verdad y
 * ejecuta la operación del lado del servidor. Ver bridge-admin-web/README.md
 * y la Edge Function `admin-api` en el proyecto de Supabase.
 *
 * Las formas de respuesta ({ data, error }) se mantienen lo más parecidas
 * posible a las de supabase-js para que el código que ya existía en
 * bridge-admin necesite el mínimo cambio posible al migrarse aquí.
 */

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function call(action, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    return { data: null, error: { message: "No hay sesión activa" } };
  }

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
    });
  } catch (networkErr) {
    return { data: null, error: { message: networkErr.message || "Error de red" } };
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
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
