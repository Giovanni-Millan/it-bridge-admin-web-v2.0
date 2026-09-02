// Capa fina sobre adminApi.js con nombres en español (subirAvatar/
// eliminarAvatar) y validación de rol — así las pantallas que suben fotos
// (EditarUsuario, ModificarInfoAlumno, InscribirAlumnos, etc.) no llaman
// directo a uploadAvatar/removeAvatar de adminApi.js, sino a estas dos
// funciones. El trabajo real (llamar la Edge Function admin-api) vive en
// adminApi.js; este archivo solo valida el rol antes de reenviar la llamada.
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
