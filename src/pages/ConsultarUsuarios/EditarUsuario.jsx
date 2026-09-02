import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserSlash, faUserCheck, faCamera } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Avatar from "../../components/Avatar.jsx";
import Swal from "sweetalert2";
import { supabase } from "../../components/supabaseClient.js";
import { getUserById, updateUserById, updateRows } from "../../components/adminApi";
import { subirAvatar } from "../../utils/avatarUpload.js";

// Pantalla genérica de edición para docente/psicólogo/admin (ruta
// /ConsultarUsuarios/Editar/:rol/:id — el alumno tiene su propia pantalla,
// ModificarInfoAlumno.jsx, con más campos académicos). `CONFIG_POR_ROL`
// es lo único que cambia entre los 3 roles: a qué tabla escribir, el
// título de la pantalla, y si mostrar el campo teléfono (admin no lo tiene).
//
// Referencia del patrón CORRECTO para cambiar la contraseña real de un
// usuario: el campo "Nueva contraseña" de este formulario SÍ llama a
// updateUserById (Auth real), a diferencia del bug que tenía
// ModificarInfoAlumno.jsx antes del 31-ago-2026 (guardaba la contraseña
// como texto plano en la tabla, sin tocar Auth — ya corregido siguiendo
// este mismo patrón).
const CONFIG_POR_ROL = {
  docente: { tabla: "profesores", titulo: "Profesor", tieneTelefono: true },
  psicologo: { tabla: "psicologos", titulo: "Psicólogo", tieneTelefono: true },
  admin: { tabla: "admins", titulo: "Administrador", tieneTelefono: false },
};

export default function EditarUsuario() {

  const navigate = useNavigate();
  const { rol, id } = useParams();
  const config = CONFIG_POR_ROL[rol];

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo: "",
    telefono: "",
    contraseña: "",
  });

  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {

    if (!config) return;

    const fetchUsuario = async () => {

      setCargando(true);

      const { data, error } = await supabase
        .from(config.tabla)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        Swal.fire("Error", error.message, "error");
        setCargando(false);
        return;
      }

      setForm({
        nombre: data.nombre || "",
        apellido_paterno: data.apellido_paterno || "",
        apellido_materno: data.apellido_materno || "",
        correo: data.correo || "",
        telefono: data.telefono || "",
        contraseña: "",
      });

      setFotoUrl(data.foto_url || null);

      const { data: authData } = await getUserById(id);
      setActivo(!authData?.user?.banned_until || new Date(authData.user.banned_until) < new Date());

      setCargando(false);

    };

    fetchUsuario();

  }, [id, rol]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);

    try {
      const nuevaUrl = await subirAvatar(file, rol, id);
      setFotoUrl(nuevaUrl);
      Swal.fire({ icon: "success", title: "Foto actualizada", timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo subir la foto", "error");
    } finally {
      setSubiendoFoto(false);
      e.target.value = "";
    }
  };

  const toggleActivo = async () => {

    setCambiandoEstado(true);

    try {

      const { error } = await updateUserById(id, {
        ban_duration: activo ? "87600h" : "none",
      });

      if (error) throw error;

      setActivo(!activo);

      Swal.fire({
        icon: "success",
        title: activo ? "Usuario desactivado" : "Usuario activado",
        text: activo
          ? "Ya no podrá iniciar sesión, pero su información se conserva."
          : "El usuario ya puede volver a iniciar sesión.",
        timer: 1800,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo cambiar el estado del usuario", "error");
    } finally {
      setCambiandoEstado(false);
    }

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.nombre || !form.apellido_paterno || !form.correo) {
      Swal.fire("Campos incompletos", "Nombre, apellido paterno y correo son obligatorios", "warning");
      return;
    }

    try {

      const payload = {
        nombre: form.nombre,
        apellido_paterno: form.apellido_paterno,
        apellido_materno: form.apellido_materno || null,
        correo: form.correo,
      };

      if (config.tieneTelefono) {
        payload.telefono = form.telefono || null;
      }

      // 3 escrituras independientes: datos de contacto (siempre), password
      // (solo si se escribió algo en ese campo) y correo de Auth (solo si
      // hay correo — en la práctica siempre, ya es obligatorio arriba).
      // El correo se actualiza en 2 lugares a propósito: en `payload` va a
      // la tabla del rol (lo que se muestra en listados), y aquí además a
      // Auth (con qué correo puede hacer login) — deben mantenerse iguales.
      const { error } = await updateRows(config.tabla, "id", id, payload);

      if (error) throw error;

      if (form.contraseña) {
        const { error: passError } = await updateUserById(id, {
          password: form.contraseña,
        });
        if (passError) throw passError;
      }

      if (form.correo) {
        await updateUserById(id, { email: form.correo });
      }

      Swal.fire("Actualizado", "Los datos se actualizaron correctamente", "success");
      navigate(-1);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo actualizar la información", "error");
    }

  };

  if (!config) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Rol no reconocido.</p>
      </main>
    );
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar titulo={`Modificar ${config.titulo}`} />

      <div className="mt-6 px-6 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center bg-purple-200 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-300 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>

        <button
          onClick={toggleActivo}
          disabled={cambiandoEstado}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition ${
            activo ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          <FontAwesomeIcon icon={activo ? faUserSlash : faUserCheck} />
          {activo ? "Desactivar acceso" : "Activar acceso"}
        </button>
      </div>

      <div className="flex justify-center mt-8 px-4">
        <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Actualizar {config.titulo}
          </h2>

          <div className="flex flex-col items-center gap-3 mb-6">
            <Avatar
              fotoUrl={fotoUrl}
              nombre={form.nombre}
              apellidoPaterno={form.apellido_paterno}
              apellidoMaterno={form.apellido_materno}
              size={96}
            />
            <label className="inline-flex items-center gap-2 text-sm text-purple-700 font-medium cursor-pointer hover:text-purple-900">
              <FontAwesomeIcon icon={faCamera} />
              {subiendoFoto ? "Subiendo..." : "Cambiar foto"}
              <input type="file" accept="image/*" onChange={handleFoto} disabled={subiendoFoto} className="hidden" />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre"
              className="input-field"
            />

            <input
              type="text"
              name="apellido_paterno"
              value={form.apellido_paterno}
              onChange={handleChange}
              placeholder="Apellido paterno"
              className="input-field"
            />

            <input
              type="text"
              name="apellido_materno"
              value={form.apellido_materno}
              onChange={handleChange}
              placeholder="Apellido materno"
              className="input-field"
            />

            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="Correo"
              className="input-field"
            />

            {config.tieneTelefono && (
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="input-field"
              />
            )}

            <div>
              <input
                type="text"
                name="contraseña"
                value={form.contraseña}
                onChange={handleChange}
                placeholder="Nueva contraseña (opcional)"
                className="input-field w-full"
              />
              <p className="text-xs text-gray-400 mt-1">Déjalo en blanco para no cambiarla</p>
            </div>

            <div className="md:col-span-2 text-center mt-6">
              <button
                type="submit"
                className="bg-purple-700 text-white px-10 py-2 rounded-md hover:bg-purple-800 transition"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
