// Listado unificado de los 4 roles (alumno/docente/psicólogo/admin) en una
// sola tabla — trae cada tabla de rol por separado (no hay una tabla
// "usuarios" única) y las junta en el cliente, cruzando además el estado
// real de baneo desde Auth (`listUsers`) para mostrar Activo/Inactivo.
// Desde aquí se puede: buscar/filtrar por rol, editar (ver `editar` abajo)
// y activar/desactivar el acceso de cualquiera.
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMagnifyingGlass,
  faPenToSquare,
  faUserSlash,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../components/supabaseClient.js";
import { listUsers, updateUserById } from "../../components/adminApi";
import Avatar from "../../components/Avatar.jsx";

const ROLES = [
  { key: "todos", label: "Todos" },
  { key: "alumno", label: "Alumnos" },
  { key: "docente", label: "Docentes" },
  { key: "psicologo", label: "Psicólogos" },
  { key: "admin", label: "Admins" },
];

const BADGE_COLOR = {
  alumno: "bg-purple-100 text-purple-700",
  docente: "bg-blue-100 text-blue-700",
  psicologo: "bg-pink-100 text-pink-700",
  admin: "bg-amber-100 text-amber-700",
};

export default function ConsultarUsuarios() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [rolActivo, setRolActivo] = useState("todos");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);

    const [{ data: alumnos }, { data: profesores }, { data: psicologos }, { data: admins }] =
      await Promise.all([
        supabase.from("alumnos").select("id, nombre, apellido_paterno, apellido_materno, correo, tipo, foto_url"),
        supabase.from("profesores").select("id, nombre, apellido_paterno, apellido_materno, correo, telefono, foto_url"),
        supabase.from("psicologos").select("id, nombre, apellido_paterno, apellido_materno, correo, telefono, foto_url"),
        supabase.from("admins").select("id, nombre, apellido_paterno, apellido_materno, correo, foto_url"),
      ]);

    // Estado de acceso (activo/baneado) viene de Auth, no de las tablas de rol.
    const bannedMap = {};
    try {
      const { data: authData } = await listUsers();
      (authData?.users || []).forEach((u) => {
        bannedMap[u.id] = !!u.banned_until && new Date(u.banned_until) > new Date();
      });
    } catch (err) {
      console.error("No se pudo consultar el estado de acceso:", err);
    }

    const normalizar = (lista, rol) =>
      (lista || []).map((u) => ({
        ...u,
        rol,
        nombreCompleto: [u.nombre, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(" "),
        activo: !bannedMap[u.id],
      }));

    const todos = [
      ...normalizar(alumnos, "alumno"),
      ...normalizar(profesores, "docente"),
      ...normalizar(psicologos, "psicologo"),
      ...normalizar(admins, "admin"),
    ].sort((a, b) =>
      `${a.apellido_paterno || ""} ${a.apellido_materno || ""} ${a.nombre || ""}`.localeCompare(
        `${b.apellido_paterno || ""} ${b.apellido_materno || ""} ${b.nombre || ""}`,
        "es"
      )
    );

    setUsuarios(todos);
    setLoading(false);
  };

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (rolActivo !== "todos" && u.rol !== rolActivo) return false;
      if (!texto) return true;
      return u.nombreCompleto.toLowerCase().includes(texto) || (u.correo || "").toLowerCase().includes(texto);
    });
  }, [usuarios, busqueda, rolActivo]);

  // Los alumnos tienen su propia pantalla de edición (ModificarInfoAlumno,
  // con más campos académicos: carrera, cuatrimestre, tipo, etc.); los
  // otros 3 roles comparten EditarUsuario.jsx (genérica, recibe el rol
  // por la URL).
  const editar = (usuario) => {
    if (usuario.rol === "alumno") {
      navigate(`/ModificarInfoAlumno/${usuario.id}`);
    } else {
      navigate(`/ConsultarUsuarios/Editar/${usuario.rol}/${usuario.id}`);
    }
  };

  const toggleActivo = async (usuario) => {
    const result = await Swal.fire({
      title: usuario.activo ? "¿Desactivar acceso?" : "¿Activar acceso?",
      text: usuario.activo
        ? `${usuario.nombreCompleto} ya no podrá iniciar sesión, pero su información se conserva.`
        : `${usuario.nombreCompleto} podrá volver a iniciar sesión.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await updateUserById(usuario.id, {
        ban_duration: usuario.activo ? "87600h" : "none",
      });
      if (error) throw error;

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, activo: !u.activo } : u))
      );
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo cambiar el estado del usuario", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <Navbar titulo="Consultar Usuarios" />

      <div className="mt-8 px-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-purple-300 transition-all duration-300"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>
      </div>

      <div className="px-6 mt-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-purple-100">
          <div className="relative mb-4">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRolActivo(r.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  rolActivo === r.key
                    ? "bg-purple-700 text-white"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No se encontraron usuarios.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Correo</th>
                    <th className="py-3 px-4 text-center">Rol</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={`${u.rol}-${u.id}`} className="border-b hover:bg-purple-50 transition">
                      <td className="py-3 px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar
                            fotoUrl={u.foto_url}
                            nombre={u.nombre}
                            apellidoPaterno={u.apellido_paterno}
                            apellidoMaterno={u.apellido_materno}
                            size={32}
                          />
                          {u.nombreCompleto}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{u.correo}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${BADGE_COLOR[u.rol]}`}>
                          {ROLES.find((r) => r.key === u.rol)?.label.replace(/s$/, "")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editar(u)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition text-sm"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(u)}
                            className={`px-3 py-1.5 rounded transition text-sm text-white ${
                              u.activo ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
                            }`}
                            title={u.activo ? "Desactivar" : "Activar"}
                          >
                            <FontAwesomeIcon icon={u.activo ? faUserSlash : faUserCheck} className="mr-1" />
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
