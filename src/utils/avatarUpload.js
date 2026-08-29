import { uploadAvatar, removeAvatar } from "../components/adminApi";

const ROLES_VALIDOS = new Set(["alumno", "docente", "psicologo", "admin"]);

// Sube la foto al bucket "avatars" (solo admin, vía Edge Function admin-api) y
// actualiza foto_url en la tabla del rol correspondiente. Devuelve la nueva URL pública.
export async function subirAvatar(file, rol, id) {
  if (!ROLES_VALIDOS.has(rol)) throw new Error(`Rol desconocido: ${rol}`);
  return uploadAvatar(file, rol, id);
}

// Elimina la foto del bucket "avatars" y limpia foto_url en la tabla del rol correspondiente.
export async function eliminarAvatar(rol, id) {
  if (!ROLES_VALIDOS.has(rol)) throw new Error(`Rol desconocido: ${rol}`);
  return removeAvatar(rol, id);
}
