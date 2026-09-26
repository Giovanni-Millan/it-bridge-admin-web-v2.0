import { supabase } from "./supabaseClient.js";

/*
 * Sesión del admin logueado: sede propia y si es super admin (ve todas las
 * sedes). No hay un AuthContext en este repo (cada pantalla consulta Supabase
 * por su cuenta), así que esto es el punto único donde se carga una vez —
 * en Login.jsx justo tras validar rol==="admin" — y se guarda en
 * localStorage para que el resto de pantallas lo lean sin otro round-trip.
 *
 * Guardar aquí NO es la capa de seguridad real (eso lo hacen RLS y la Edge
 * Function admin-api, que siempre leen la sede desde la BD, nunca de esto).
 * Esto es solo para que la UI sepa qué mostrar/filtrar.
 */

const STORAGE_KEY = "bridge_admin_sesion";

export async function cargarAdminSesion() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("admins")
    .select("id_sede, es_super_admin, sedes(nombre)")
    .eq("id", uid)
    .single();
  if (error || !data) return null;

  const sesion = {
    idSede: data.id_sede,
    sedeNombre: data.sedes?.nombre ?? null,
    esSuperAdmin: data.es_super_admin === true,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    // localStorage puede fallar (modo privado, storage bloqueado) — no es
    // crítico, las pantallas que la necesiten volverán a llamar cargarAdminSesion.
  }
  return sesion;
}

// Lectura síncrona desde el caché local. Devuelve null si todavía no se ha
// cargado (ej. sesión vieja de antes de esta feature, o storage bloqueado) —
// en ese caso, quien la use debe llamar cargarAdminSesion() como respaldo.
export function getAdminSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function limpiarAdminSesion() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no crítico
  }
}
