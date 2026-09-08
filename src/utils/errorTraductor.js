import Swal from "sweetalert2";

// Traductor de errores de Supabase/Postgres (y de red) al español.
//
// El problema que resuelve: antes, los `catch` de este proyecto mostraban
// `error.message` tal cual en un Swal.fire — el texto crudo de Postgres/
// PostgREST/Supabase Auth, siempre en inglés (ej. "duplicate key value
// violates unique constraint..."). Este archivo centraliza la traducción
// para que la ventana de error SIEMPRE salga en español y explique qué
// hacer, sin excepción.
//
// Ver también: el mismo archivo en los otros 4 repos Bridge
// (bridge-alumno-front, bridge-docente-front, bridge-psicologo-front,
// bridge-docentes-app/lib/errorTraductor.ts) — replicar cualquier cambio
// al diccionario ahí también.

// Reglas ordenadas de más a menos específicas. Cada regla se prueba contra
// el código SQLSTATE de Postgres (cuando existe, típico de PostgrestError)
// y/o contra el texto crudo del mensaje (case-insensitive).
const REGLAS = [
  {
    test: (code, raw) => code === "23505" || /duplicate key value violates unique constraint/i.test(raw),
    titulo: "Registro duplicado",
    mensaje:
      "Ya existe un registro con esos mismos datos (por ejemplo, el mismo correo, matrícula o clave). Verifica los datos e intenta con uno distinto.",
  },
  {
    test: (code, raw) => /user already registered/i.test(raw) || /already been registered/i.test(raw),
    titulo: "Usuario ya registrado",
    mensaje:
      "Ya existe una cuenta con ese correo electrónico. Usa otro correo o recupera el acceso a la cuenta existente.",
  },
  {
    test: (code, raw) => code === "23503" || /violates foreign key constraint/i.test(raw),
    titulo: "Registro relacionado no encontrado",
    mensaje:
      "La operación hace referencia a un dato que no existe o ya fue eliminado (por ejemplo, un grupo, alumno o materia). Actualiza la página e intenta de nuevo.",
  },
  {
    test: (code, raw) => code === "23502" || /null value in column .* violates not-null constraint/i.test(raw),
    titulo: "Falta información obligatoria",
    mensaje: "Falta llenar uno o más campos obligatorios. Revisa el formulario y completa todos los campos.",
  },
  {
    test: (code, raw) => code === "23514" || /violates check constraint/i.test(raw),
    titulo: "Dato fuera de rango",
    mensaje: "El valor capturado no es válido para este campo. Corrige el valor e intenta de nuevo.",
  },
  {
    test: (code, raw) =>
      code === "42501" || /violates row-level security policy/i.test(raw) || /permission denied/i.test(raw),
    titulo: "Sin permiso para esta acción",
    mensaje:
      "No tienes permiso para realizar esta operación. Cierra sesión y vuelve a entrar; si el problema continúa, contacta al administrador del sistema.",
  },
  {
    test: (code) => code === "PGRST116",
    titulo: "No se encontró el registro",
    mensaje: "No se encontró la información solicitada. Verifica que el registro exista o actualiza la página.",
  },
  {
    test: (code, raw) => /no unique or exclusion constraint matching the on conflict/i.test(raw),
    titulo: "Error al guardar (configuración)",
    mensaje:
      "No se pudo guardar por un problema de configuración interna del sistema. Intenta de nuevo; si persiste, repórtalo al administrador.",
  },
  {
    test: (code, raw) => /invalid login credentials/i.test(raw),
    titulo: "Credenciales incorrectas",
    mensaje: "El correo o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.",
  },
  {
    test: (code, raw) => /email not confirmed/i.test(raw),
    titulo: "Correo no confirmado",
    mensaje: "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada (y spam) y confírmalo.",
  },
  {
    test: (code, raw) => /jwt expired/i.test(raw) || /invalid jwt/i.test(raw) || /invalid token/i.test(raw),
    titulo: "Sesión expirada",
    mensaje: "Tu sesión expiró. Vuelve a iniciar sesión.",
  },
  {
    test: (code, raw) => /email rate limit exceeded/i.test(raw) || /too many requests/i.test(raw),
    titulo: "Demasiados intentos",
    mensaje: "Se hicieron demasiadas solicitudes en poco tiempo. Espera unos minutos e intenta de nuevo.",
  },
  {
    test: (code, raw) =>
      /failed to fetch/i.test(raw) || /networkerror/i.test(raw) || /network request failed/i.test(raw),
    titulo: "Sin conexión",
    mensaje: "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.",
  },
  {
    test: (code, raw, error) => error?.name === "AbortError" || /aborted/i.test(raw),
    titulo: "La operación tardó demasiado",
    mensaje: "La operación tardó demasiado y se canceló. Intenta de nuevo.",
  },
];

/**
 * Traduce un error de Supabase (Auth o PostgREST) o un Error nativo de JS
 * a un título + mensaje en español, listos para mostrar al usuario. Nunca
 * deja pasar el texto crudo del error en una rama no reconocida — en ese
 * caso usa un mensaje genérico y registra el error real solo en consola.
 *
 * @param {unknown} error
 * @param {string} [accion] - descripción en español de la acción que falló
 *                            (ej. "inscribir al alumno"), usada solo en el
 *                            fallback genérico para dar contexto.
 * @returns {{ titulo: string, mensaje: string }}
 */
export function traducirError(error, accion) {
  console.error(error);

  if (error == null) {
    return {
      titulo: "Ocurrió un error",
      mensaje: `No se pudo completar la acción${accion ? ` de ${accion}` : ""}. Intenta de nuevo; si el problema continúa, contacta al administrador del sistema.`,
    };
  }

  const code = error.code;
  const raw = String(error.message || error.error_description || error.msg || "");

  for (const regla of REGLAS) {
    if (regla.test(code, raw, error)) {
      return { titulo: regla.titulo, mensaje: regla.mensaje };
    }
  }

  return {
    titulo: "Ocurrió un error",
    mensaje: `No se pudo completar la acción${accion ? ` de ${accion}` : ""}. Intenta de nuevo; si el problema continúa, contacta al administrador del sistema.`,
  };
}

/** Azúcar sintáctica: traduce el error y lo muestra directo con Swal.fire. */
export function mostrarError(error, accion) {
  const { titulo, mensaje } = traducirError(error, accion);
  Swal.fire(titulo, mensaje, "error");
}
