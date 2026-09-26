// Edge Function: admin-api
//
// Reemplaza el uso directo de `supabaseAdmin` (Service Role Key) desde el
// navegador en bridge-admin-web. La key admin nunca sale de este servidor:
// SUPABASE_URL y SUPABASE_SECRET_KEYS se las inyecta automáticamente la
// plataforma de Supabase a toda Edge Function, no hace falta configurarlas
// a mano. Se usa la secret key nueva (`sb_secret_...`, bajo el nombre
// "default") en vez de la legacy SUPABASE_SERVICE_ROLE_KEY (JWT) — mismo
// alcance total (bypass RLS), pero rotable de forma independiente sin tocar
// el JWT secret del proyecto (9-sep-2026, tras la filtración de la key vieja
// embebida en bridge-admin/Tauri).
//
// Verifica en cada request que quien llama sea un admin real
// (app_metadata.rol === "admin", el mismo criterio que usa Login.jsx),
// y solo entonces ejecuta la operación pedida con el cliente admin.
//
// Las operaciones están en una lista fija (no es un proxy genérico a
// cualquier tabla/columna): mismo alcance que ya tiene hoy el admin en
// bridge-admin (Tauri), ni más ni menos.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const SERVICE_ROLE_KEY = SUPABASE_SECRET_KEYS["default"];

// CORS: bridge-admin-web corre en el navegador (Netlify), así que toda
// respuesta —incluida la de error— necesita estos headers, y el preflight
// OPTIONS que manda el navegador antes de cada POST debe responderse aparte,
// sin pasar por la validación de admin de abajo (el navegador nunca manda
// Authorization en el preflight). La autenticación real la hace esta misma
// función más abajo (auth.getUser + app_metadata.rol === "admin"), por eso
// esta función se despliega con verify_jwt=false: si se dejara el gate de
// JWT de la plataforma encendido, el propio preflight OPTIONS (sin
// Authorization) se rechazaría con 401 antes de llegar a este código, y esa
// respuesta de la plataforma tampoco trae headers de CORS — eso es
// exactamente el error de CORS que se vio en producción.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tablas que esta función tiene permitido tocar. Cualquier otra —incluidas
// las backup_20260819_* o cualquier tabla nueva que se agregue después— se
// rechaza aunque el request esté autenticado como admin.
const ALLOWED_TABLES = new Set([
  "alumnos",
  "profesores",
  "psicologos",
  "admins",
  "grupos",
  "grupo_alumnos",
  "grupo_profesores",
  "materias",
  "calificaciones",
  "calificaciones_parciales",
  "configuracion_sistema",
]);

// Rol -> tabla de perfil, para altas de usuario y para fotos de perfil.
const TABLA_POR_ROL: Record<string, string> = {
  alumno: "alumnos",
  docente: "profesores",
  psicologo: "psicologos",
  admin: "admins",
};

// Roles que esta función puede dar de alta en Auth. "admin" queda fuera a
// propósito: hoy no existe ninguna pantalla en bridge-admin-web que cree
// administradores, así que no le damos esa capacidad a la función.
const ROLES_CREABLES = new Set(["alumno", "docente", "psicologo"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Falta el token de autorización" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // El token es el access_token de la sesión del propio usuario que llama
  // (no la service role key). Lo validamos y leemos su rol real desde Auth,
  // nunca desde algo que mande el cliente en el body.
  const { data: callerData, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !callerData?.user) {
    return json({ error: "Token inválido o expirado" }, 401);
  }
  if (callerData.user.app_metadata?.rol !== "admin") {
    return json({ error: "Solo administradores pueden usar esta función" }, 403);
  }

  // Sede del admin que llama (agregado al pasar el sistema a multi-sede).
  // El cliente aquí es el de service role: NO pasa por RLS, así que esta es
  // la única capa real que impide que un admin de una sede toque datos de
  // otra desde dbInsert/dbUpdate/dbDelete. Nunca confiar en lo que mande el
  // frontend para esto — siempre se lee de la fila real de `admins`.
  const { data: callerAdminRow, error: callerAdminError } = await admin
    .from("admins")
    .select("id_sede, es_super_admin")
    .eq("id", callerData.user.id)
    .single();
  if (callerAdminError || !callerAdminRow) {
    return json({ error: "No se encontró el perfil de administrador" }, 403);
  }
  const callerSede = callerAdminRow.id_sede as number;
  const esSuperAdmin = callerAdminRow.es_super_admin === true;

  // Tablas donde la sede vive directo en la fila (columna `id_sede`).
  const TABLAS_SEDE_DIRECTA = new Set(["alumnos", "grupos", "admins"]);
  // Tablas donde la sede se resuelve vía `id_grupo` -> `grupos.id_sede`.
  const TABLAS_SEDE_POR_GRUPO = new Set([
    "grupo_alumnos",
    "grupo_profesores",
    "calificaciones",
    "calificaciones_parciales",
  ]);

  async function sedeDeGrupo(idGrupo: unknown): Promise<number | null> {
    if (idGrupo === undefined || idGrupo === null) return null;
    const { data } = await admin.from("grupos").select("id_sede").eq("id_grupo", idGrupo).maybeSingle();
    return (data?.id_sede as number | undefined) ?? null;
  }

  // Sedes "adicionales" de un profesor vía sus grupos asignados (puede dar
  // clase en más de una). Se combina con su `profesores.id_sede` (sede de
  // origen/registro) en verificarSedeFila — un profesor es visible/editable
  // por un admin si CUALQUIERA de las dos coincide con la sede del admin.
  async function sedesDeProfesor(idProfesor: unknown): Promise<number[]> {
    if (!idProfesor) return [];
    const { data } = await admin
      .from("grupo_profesores")
      .select("id_grupo")
      .eq("id_profesor", idProfesor);
    const idsGrupo = (data ?? []).map((r) => r.id_grupo);
    if (idsGrupo.length === 0) return [];
    const { data: grupos } = await admin.from("grupos").select("id_sede").in("id_grupo", idsGrupo);
    return [...new Set((grupos ?? []).map((g) => g.id_sede as number))];
  }

  // Verifica que una fila (ya existente, o la que se va a insertar) de
  // `table` pertenezca a la sede del admin que llama. `null`/`undefined` en
  // `sedeError` significa "permitido"; si no, es la respuesta 403 a devolver.
  function sedeError(sedeFila: number | null): Response | null {
    if (esSuperAdmin) return null;
    if (sedeFila === null || sedeFila === callerSede) return null;
    return json({ error: "No tienes permiso sobre esa sede" }, 403);
  }

  async function verificarSedeFila(table: string, row: Record<string, unknown>): Promise<Response | null> {
    if (esSuperAdmin) return null;
    if (TABLAS_SEDE_DIRECTA.has(table)) {
      const sedeFila = (row.id_sede as number | undefined) ?? null;
      return sedeError(sedeFila);
    }
    if (TABLAS_SEDE_POR_GRUPO.has(table)) {
      const sedeFila = await sedeDeGrupo(row.id_grupo);
      return sedeError(sedeFila);
    }
    if (table === "profesores") {
      const sedeOrigen = (row.id_sede as number | undefined) ?? null;
      if (sedeOrigen === callerSede) return null;
      const sedes = row.id ? await sedesDeProfesor(row.id) : [];
      if (sedeOrigen === null && sedes.length === 0) return null; // indeterminado, se deja pasar
      if (sedes.includes(callerSede)) return null;
      return json({ error: "No tienes permiso sobre ese docente" }, 403);
    }
    return null;
  }

  // Verifica las filas EXISTENTES que un dbUpdate/dbDelete va a tocar,
  // consultándolas primero con los mismos filtros que se van a aplicar.
  async function verificarSedeExistente(
    table: string,
    matches: { column: string; value: unknown }[] | null | undefined,
    columnaValor: { column: string; value: unknown } | null,
    inFilter: { column: string; values: unknown[] } | null | undefined,
  ): Promise<Response | null> {
    if (esSuperAdmin) return null;
    if (!TABLAS_SEDE_DIRECTA.has(table) && !TABLAS_SEDE_POR_GRUPO.has(table) && table !== "profesores") {
      return null;
    }
    const selectCol = table === "profesores" ? "id, id_sede" : TABLAS_SEDE_DIRECTA.has(table) ? "id_sede" : "id_grupo";
    let query = admin.from(table).select(selectCol);
    if (matches) for (const m of matches) query = query.eq(m.column, m.value);
    if (columnaValor) query = query.eq(columnaValor.column, columnaValor.value);
    if (inFilter?.column && Array.isArray(inFilter.values)) query = query.in(inFilter.column, inFilter.values);
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 400);

    for (const row of data ?? []) {
      const err = await verificarSedeFila(table, row as Record<string, unknown>);
      if (err) return err;
    }
    return null;
  }

  let body: { action?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { action, payload = {} } = body;

  try {
    switch (action) {
      /* ============================= */
      /* AUTH ADMIN */
      /* ============================= */

      case "authCreateUser": {
        const { email, password, rol } = payload as {
          email?: string;
          password?: string;
          rol?: string;
        };
        if (!rol || !ROLES_CREABLES.has(rol)) {
          return json({ error: `rol no permitido para alta: ${rol}` }, 400);
        }
        if (!email || !password) return json({ error: "Falta email o password" }, 400);

        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { rol },
        });
        if (error) return json({ error: error.message }, 400);
        return json({ user: data.user });
      }

      case "authGetUserById": {
        const { id } = payload as { id?: string };
        if (!id) return json({ error: "Falta id" }, 400);
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) return json({ error: error.message }, 400);
        return json({ user: data.user });
      }

      case "authUpdateUserById": {
        const { id, email, password, ban_duration } = payload as {
          id?: string;
          email?: string;
          password?: string;
          ban_duration?: string;
        };
        if (!id) return json({ error: "Falta id" }, 400);

        if (!esSuperAdmin) {
          const { data: targetUser } = await admin.auth.admin.getUserById(id);
          const targetRol = targetUser?.user?.app_metadata?.rol as string | undefined;
          const targetTabla = targetRol ? TABLA_POR_ROL[targetRol] : undefined;
          if (targetTabla) {
            const errSede = await verificarSedeExistente(targetTabla, null, { column: "id", value: id }, null);
            if (errSede) return errSede;
          }
        }

        const attrs: Record<string, string> = {};
        if (email !== undefined) attrs.email = email;
        if (password !== undefined) attrs.password = password;
        if (ban_duration !== undefined) attrs.ban_duration = ban_duration;

        const { data, error } = await admin.auth.admin.updateUserById(id, attrs);
        if (error) return json({ error: error.message }, 400);
        return json({ user: data.user });
      }

      case "authListUsers": {
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) return json({ error: error.message }, 400);
        return json({ users: data.users });
      }

      /* ============================= */
      /* TABLAS (allowlist fija arriba) */
      /* ============================= */

      case "dbInsert": {
        const { table, values } = payload as { table?: string; values?: unknown };
        if (!table || !ALLOWED_TABLES.has(table)) {
          return json({ error: `tabla no permitida: ${table}` }, 400);
        }

        const filas = Array.isArray(values) ? values : [values];
        const filasFinales = filas.map((f) => {
          const fila = { ...(f as Record<string, unknown>) };
          // Un admin normal no puede insertar (ni elegir) sede: siempre la suya.
          // El super admin sí puede especificarla; si no la manda, cae en la propia.
          // `profesores` se incluye aquí también (columna `id_sede` = sede de
          // origen/registro) aunque no esté en TABLAS_SEDE_DIRECTA, porque esa
          // tabla además admite grupos en otras sedes (ver verificarSedeFila).
          if (TABLAS_SEDE_DIRECTA.has(table) || table === "profesores") {
            if (!esSuperAdmin) fila.id_sede = callerSede;
            else if (fila.id_sede === undefined || fila.id_sede === null) fila.id_sede = callerSede;
          }
          return fila;
        });

        for (const fila of filasFinales) {
          const err = await verificarSedeFila(table, fila);
          if (err) return err;
        }

        const valoresFinales = Array.isArray(values) ? filasFinales : filasFinales[0];
        const { data, error } = await admin.from(table).insert(valoresFinales as never).select();
        if (error) return json({ error: error.message }, 400);
        return json({ data });
      }

      case "dbUpdate": {
        const { table, matches, inFilter, values } = payload as {
          table?: string;
          matches?: { column: string; value: unknown }[];
          inFilter?: { column: string; values: unknown[] } | null;
          values?: Record<string, unknown>;
        };
        if (!table || !ALLOWED_TABLES.has(table)) {
          return json({ error: `tabla no permitida: ${table}` }, 400);
        }
        if (!Array.isArray(matches) || matches.length === 0) {
          return json({ error: "Falta matches" }, 400);
        }
        for (const m of matches) {
          if (!m?.column) return json({ error: "match inválido: falta column" }, 400);
        }

        // 1) Verificar que TODAS las filas que este update va a tocar ya
        //    pertenezcan a la sede del admin (o cualquiera si es super admin).
        const errExistente = await verificarSedeExistente(table, matches, null, inFilter);
        if (errExistente) return errExistente;

        // 2) Si el update intenta mover la fila a otra sede, un admin normal
        //    no puede — se le fuerza a que se quede en la suya.
        const valoresFinales = { ...(values as Record<string, unknown>) };
        if ((TABLAS_SEDE_DIRECTA.has(table) || table === "profesores") && !esSuperAdmin && valoresFinales.id_sede !== undefined) {
          valoresFinales.id_sede = callerSede;
        }

        let query = admin.from(table).update(valoresFinales as never);
        for (const m of matches) query = query.eq(m.column, m.value);
        if (inFilter?.column && Array.isArray(inFilter.values)) {
          query = query.in(inFilter.column, inFilter.values);
        }

        const { data, error } = await query.select();
        if (error) return json({ error: error.message }, 400);
        return json({ data });
      }

      case "dbDelete": {
        const { table, column, value } = payload as {
          table?: string;
          column?: string;
          value?: unknown;
        };
        if (!table || !ALLOWED_TABLES.has(table)) {
          return json({ error: `tabla no permitida: ${table}` }, 400);
        }
        if (!column) return json({ error: "Falta column" }, 400);

        const errExistente = await verificarSedeExistente(table, null, { column, value }, null);
        if (errExistente) return errExistente;

        const { error } = await admin.from(table).delete().eq(column, value);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      /* ============================= */
      /* AVATARES (bucket "avatars") */
      /* ============================= */

      case "avatarUpload": {
        const { rol, id, fileBase64, fileName, contentType } = payload as {
          rol?: string;
          id?: string;
          fileBase64?: string;
          fileName?: string;
          contentType?: string;
        };
        const tabla = rol ? TABLA_POR_ROL[rol] : undefined;
        if (!tabla) return json({ error: `rol desconocido: ${rol}` }, 400);
        if (!id || !fileBase64) return json({ error: "Falta id o archivo" }, 400);

        const errSede = await verificarSedeExistente(tabla, null, { column: "id", value: id }, null);
        if (errSede) return errSede;

        const ext = (fileName || "").split(".").pop() || "jpg";
        const path = `${rol}/${id}.${ext}`;
        const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

        const { error: uploadError } = await admin.storage.from("avatars").upload(path, bytes, {
          upsert: true,
          cacheControl: "3600",
          contentType: contentType || "image/jpeg",
        });
        if (uploadError) return json({ error: uploadError.message }, 400);

        const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
        const fotoUrl = `${pub.publicUrl}?v=${Date.now()}`;

        const { error: updateError } = await admin.from(tabla).update({ foto_url: fotoUrl }).eq("id", id);
        if (updateError) return json({ error: updateError.message }, 400);

        return json({ fotoUrl });
      }

      case "avatarRemove": {
        const { rol, id } = payload as { rol?: string; id?: string };
        const tabla = rol ? TABLA_POR_ROL[rol] : undefined;
        if (!tabla) return json({ error: `rol desconocido: ${rol}` }, 400);
        if (!id) return json({ error: "Falta id" }, 400);

        const errSede = await verificarSedeExistente(tabla, null, { column: "id", value: id }, null);
        if (errSede) return errSede;

        const { data: archivos, error: listError } = await admin.storage
          .from("avatars")
          .list(rol, { search: `${id}.` });
        if (listError) return json({ error: listError.message }, 400);

        const propios = (archivos || []).filter((f) => f.name.startsWith(`${id}.`));
        if (propios.length > 0) {
          const { error: removeError } = await admin.storage
            .from("avatars")
            .remove(propios.map((f) => `${rol}/${f.name}`));
          if (removeError) return json({ error: removeError.message }, 400);
        }

        const { error: updateError } = await admin.from(tabla).update({ foto_url: null }).eq("id", id);
        if (updateError) return json({ error: updateError.message }, 400);

        return json({ ok: true });
      }

      default:
        return json({ error: `acción desconocida: ${action}` }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Error interno" }, 500);
  }
});
