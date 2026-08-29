import { supabaseAdmin } from "../components/supabaseClient.js";

const TABLA_POR_ROL = {
  alumno: "alumnos",
  docente: "profesores",
  psicologo: "psicologos",
  admin: "admins",
};

// Sube la foto al bucket "avatars" (solo admin, por RLS) y actualiza foto_url
// en la tabla del rol correspondiente. Devuelve la nueva URL pública.
export async function subirAvatar(file, rol, id) {
  const tabla = TABLA_POR_ROL[rol];
  if (!tabla) throw new Error(`Rol desconocido: ${rol}`);

  const ext = file.name.split(".").pop();
  const path = `${rol}/${id}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  const fotoUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabaseAdmin.from(tabla).update({ foto_url: fotoUrl }).eq("id", id);
  if (updateError) throw updateError;

  return fotoUrl;
}

// Elimina la foto del bucket "avatars" y limpia foto_url en la tabla del rol correspondiente.
export async function eliminarAvatar(rol, id) {
  const tabla = TABLA_POR_ROL[rol];
  if (!tabla) throw new Error(`Rol desconocido: ${rol}`);

  const { data: archivos, error: listError } = await supabaseAdmin.storage
    .from("avatars")
    .list(rol, { search: `${id}.` });

  if (listError) throw listError;

  const propios = (archivos || []).filter((f) => f.name.startsWith(`${id}.`));

  if (propios.length > 0) {
    const { error: removeError } = await supabaseAdmin.storage
      .from("avatars")
      .remove(propios.map((f) => `${rol}/${f.name}`));

    if (removeError) throw removeError;
  }

  const { error: updateError } = await supabaseAdmin.from(tabla).update({ foto_url: null }).eq("id", id);
  if (updateError) throw updateError;
}
