import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { insertRows, updateRows, deleteRows } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUserPlus,
  faChalkboardTeacher,
  faTrash,
  faXmark,
  faUserGraduate,
  faPlus,
  faClipboardCheck,
  faStar,
  faCalendarDays,
  faSearch,
  faPen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Avatar from "../../components/Avatar.jsx";

// Pantalla central para armar un grupo: inscribir/quitar alumnos, asignar/
// quitar profesores con su materia, y editar la materia de una asignación
// ya existente. Todas las escrituras a grupo_alumnos/grupo_profesores usan
// insertRows/updateRows/deleteRows de adminApi.js — no hay alternativa:
// esas 2 tablas no tienen ninguna política RLS de escritura para el rol
// admin, así que un `supabase.from(...).insert()` directo aquí fallaría
// siempre (ver ARQUITECTURA_SISTEMA.md §1.4).
export default function DetalleGrupo() {
  const { id_grupo } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [alumnosAsignados, setAlumnosAsignados] = useState([]);
  const [profesoresAsignados, setProfesoresAsignados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [panelAlumnos, setPanelAlumnos] = useState(false);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [seleccionAlumnos, setSeleccionAlumnos] = useState(new Set());
  const [busquedaAlumnos, setBusquedaAlumnos] = useState("");

  const [panelProfesores, setPanelProfesores] = useState(false);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);
  const [materiaInputs, setMateriaInputs] = useState({});
  const [catalogoMaterias, setCatalogoMaterias] = useState([]);
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [materiaEditando, setMateriaEditando] = useState("");

  useEffect(() => {
    cargarTodo();
    fetchCatalogoMaterias();
  }, [id_grupo]);

  const cargarTodo = async () => {
    setLoading(true);
    await Promise.all([fetchGrupo(), fetchAlumnosAsignados(), fetchProfesoresAsignados()]);
    setLoading(false);
  };

  // Catálogo de materias para el autocompletado de "Materia que impartirá":
  // combina el catálogo oficial (tabla materias, ver /Materias) con los
  // nombres que ya están en uso real, para no perder materias antiguas
  // que aún no se hayan formalizado en el catálogo.
  const fetchCatalogoMaterias = async () => {
    const [{ data: delCatalogo }, { data: deGrupos }, { data: deCalificaciones }] = await Promise.all([
      supabase.from("materias").select("nombre"),
      supabase.from("grupo_profesores").select("materia"),
      supabase.from("calificaciones").select("materia"),
    ]);

    const materias = new Set();
    (delCatalogo || []).forEach((f) => f.nombre && materias.add(f.nombre.trim()));
    (deGrupos || []).forEach((f) => f.materia && materias.add(f.materia.trim()));
    (deCalificaciones || []).forEach((f) => f.materia && materias.add(f.materia.trim()));

    setCatalogoMaterias([...materias].sort((a, b) => a.localeCompare(b, "es")));
  };

  const fetchGrupo = async () => {
    const { data, error } = await supabase
      .from("vista_grupos_resumen")
      .select("*")
      .eq("id_grupo", id_grupo)
      .single();

    if (!error) setGrupo(data);
  };

  const fetchAlumnosAsignados = async () => {
    const { data, error } = await supabase
      .from("grupo_alumnos")
      .select("id, id_alumno, alumnos(id, nombre, apellido_paterno, apellido_materno, correo, cuatrimestre, plan_meses, foto_url)")
      .eq("id_grupo", id_grupo);

    if (!error) {
      setAlumnosAsignados(
        (data || []).sort((a, b) =>
          `${a.alumnos?.apellido_paterno || ""} ${a.alumnos?.apellido_materno || ""} ${a.alumnos?.nombre || ""}`.localeCompare(
            `${b.alumnos?.apellido_paterno || ""} ${b.alumnos?.apellido_materno || ""} ${b.alumnos?.nombre || ""}`,
            "es"
          )
        )
      );
    }
  };

  const fetchProfesoresAsignados = async () => {
    const { data, error } = await supabase
      .from("grupo_profesores")
      .select("id, id_profesor, materia, profesores(id, nombre, apellido_paterno, apellido_materno, correo, foto_url)")
      .eq("id_grupo", id_grupo);

    if (!error) setProfesoresAsignados(data || []);
  };

  /* ===================== ALUMNOS ===================== */

  const abrirPanelAlumnos = async () => {
    let alumnosData = [];

    if (grupo?.tipo === "universidad") {
      // Universidad: se muestran TODOS los alumnos de universidad, sin
      // filtrar por carrera — la carrera se autoasigna al agregarlos al
      // grupo (trigger en grupo_alumnos). Esto es necesario para grupos
      // "Inicios" donde conviven alumnos de distintas carreras.
      const { data, error } = await supabase
        .from("alumnos")
        .select("id, nombre, apellido_paterno, apellido_materno, correo, cuatrimestre, foto_url, carrera:id_carrera(nombre)")
        .eq("tipo", "universidad")
        .order("apellido_paterno", { ascending: true })
        .order("apellido_materno", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) {
        Swal.fire("Error", "No se pudieron cargar los alumnos de universidad.", "error");
        return;
      }

      alumnosData = (data || []).map((a) => ({ ...a, carrera_nombre: a.carrera?.nombre }));
    } else if (grupo?.tipo === "autoplaneado") {
      // Autoplaneado: se muestran TODOS los alumnos de autoplaneado, sin
      // filtrar por carrera/modalidad — la carrera se autoasigna al
      // agregarlos al grupo (mismo trigger que en universidad).
      const { data, error } = await supabase
        .from("alumnos")
        .select("id, nombre, apellido_paterno, apellido_materno, correo, plan_meses, foto_url, carrera:id_carrera(nombre)")
        .eq("tipo", "autoplaneado")
        .order("apellido_paterno", { ascending: true })
        .order("apellido_materno", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) {
        Swal.fire("Error", "No se pudieron cargar los alumnos de Autoplaneado.", "error");
        return;
      }

      alumnosData = (data || []).map((a) => ({ ...a, carrera_nombre: a.carrera?.nombre }));
    } else {
      // Bachillerato (o cualquier grupo con carrera fija): solo alumnos de
      // ESA carrera específica, ya cursando (cuatrimestre > 0 — un alumno
      // recién dado de alta sin grupo todavía tiene cuatrimestre 0/null).
      if (!grupo?.id_carrera) {
        Swal.fire("Falta carrera", "Este grupo no tiene una carrera asignada.", "warning");
        return;
      }

      const { data, error } = await supabase
        .from("vista_alumnos_por_carrera")
        .select("*")
        .eq("id_carrera", grupo.id_carrera)
        .gt("cuatrimestre", 0)
        .order("apellido_paterno", { ascending: true })
        .order("apellido_materno", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) {
        Swal.fire("Error", "No se pudieron cargar los alumnos de esta carrera.", "error");
        return;
      }

      alumnosData = data || [];
    }

    const idsAsignados = new Set(alumnosAsignados.map((a) => a.id_alumno));
    setAlumnosDisponibles(alumnosData.filter((a) => !idsAsignados.has(a.id)));
    setSeleccionAlumnos(new Set());
    setBusquedaAlumnos("");
    setPanelAlumnos(true);
  };

  const toggleSeleccionAlumno = (id) => {
    setSeleccionAlumnos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // La búsqueda solo filtra qué se muestra; seleccionAlumnos vive aparte,
  // así que lo marcado no se pierde al escribir o borrar el término.
  const alumnosFiltrados = alumnosDisponibles.filter((alumno) => {
    const term = busquedaAlumnos.trim().toLowerCase();
    if (!term) return true;
    const nombreCompleto = `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno || ""}`.toLowerCase();
    return nombreCompleto.includes(term) || alumno.correo?.toLowerCase().includes(term);
  });

  const agregarAlumnosSeleccionados = async () => {
    if (seleccionAlumnos.size === 0) return;

    const filas = Array.from(seleccionAlumnos).map((id_alumno) => ({
      id_grupo: Number(id_grupo),
      id_alumno,
    }));

    const { error } = await insertRows("grupo_alumnos", filas);

    if (error) {
      Swal.fire("Error", "No se pudieron agregar los alumnos seleccionados.", "error");
      return;
    }

    Swal.fire({
      title: "Alumnos agregados",
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });

    setPanelAlumnos(false);
    fetchAlumnosAsignados();
  };

  const quitarAlumno = async (relacion) => {
    const result = await Swal.fire({
      title: "¿Quitar alumno del grupo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await deleteRows("grupo_alumnos", "id", relacion.id);

    if (error) {
      Swal.fire("Error", "No se pudo quitar al alumno.", "error");
      return;
    }

    fetchAlumnosAsignados();
  };

  /* ===================== PROFESORES ===================== */

  const abrirPanelProfesores = async () => {
    const { data, error } = await supabase
      .from("profesores")
      .select("*")
      .order("apellido_paterno", { ascending: true });

    if (error) {
      Swal.fire("Error", "No se pudieron cargar los profesores.", "error");
      return;
    }

    setProfesoresDisponibles(data || []);
    setMateriaInputs({});
    setPanelProfesores(true);
  };

  // Materias que ya imparte cada profesor en este mismo grupo (para mostrarlas como referencia)
  const materiasPorProfesor = (id_profesor) =>
    profesoresAsignados.filter((rel) => rel.id_profesor === id_profesor).map((rel) => rel.materia).filter(Boolean);

  const asignarProfesor = async (id_profesor) => {
    const materia = (materiaInputs[id_profesor] || "").trim();

    if (!materia) {
      Swal.fire("Falta la materia", "Escribe la materia que impartirá en este grupo.", "warning");
      return;
    }

    const { error } = await insertRows("grupo_profesores", [
      { id_grupo: Number(id_grupo), id_profesor, materia },
    ]);

    if (error) {
      const mensaje = error.code === "23505"
        ? "Ese profesor ya está asignado a este grupo con esa misma materia."
        : "No se pudo asignar al profesor.";
      Swal.fire("Error", mensaje, "error");
      return;
    }

    Swal.fire({
      title: "Profesor asignado",
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });

    setPanelProfesores(false);
    fetchProfesoresAsignados();
  };

  const quitarProfesor = async (relacion) => {
    const result = await Swal.fire({
      title: "¿Quitar profesor del grupo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await deleteRows("grupo_profesores", "id", relacion.id);

    if (error) {
      Swal.fire("Error", "No se pudo quitar al profesor.", "error");
      return;
    }

    fetchProfesoresAsignados();
  };

  /* ---- Editar la materia de una asignación ya existente ---- */

  const iniciarEdicionMateria = (rel) => {
    setEditandoMateriaId(rel.id);
    setMateriaEditando(rel.materia || "");
  };

  const cancelarEdicionMateria = () => {
    setEditandoMateriaId(null);
    setMateriaEditando("");
  };

  const guardarMateriaEditada = async (rel) => {
    const materia = materiaEditando.trim();

    if (!materia) {
      Swal.fire("Falta la materia", "Escribe la materia que impartirá en este grupo.", "warning");
      return;
    }

    if (materia === rel.materia) {
      cancelarEdicionMateria();
      return;
    }

    const { error } = await updateRows("grupo_profesores", "id", rel.id, { materia });

    if (error) {
      const mensaje = error.code === "23505"
        ? "Ese profesor ya está asignado a este grupo con esa misma materia."
        : "No se pudo actualizar la materia.";
      Swal.fire("Error", mensaje, "error");
      return;
    }

    cancelarEdicionMateria();
    fetchProfesoresAsignados();
    fetchCatalogoMaterias();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Detalle del Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Detalle del Grupo" />
        <div className="text-center py-16 text-gray-500">Este grupo no existe.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Detalle del Grupo" />

      <datalist id="catalogo-materias">
        {catalogoMaterias.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Grupos")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar a Grupos</span>
        </button>

        {/* Encabezado del grupo */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    grupo.tipo === "bachillerato"
                      ? "bg-amber-100 text-amber-800"
                      : grupo.tipo === "autoplaneado"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {grupo.tipo === "bachillerato"
                    ? "Bachillerato"
                    : grupo.tipo === "autoplaneado"
                    ? "Autoplaneado"
                    : "Universidad"}
                </span>
              </div>
              <p className="text-purple-700 font-medium mt-1">{grupo.carrera_nombre || "Sin carrera asignada"}</p>
              {grupo.tipo === "bachillerato" &&
                grupo.semestre && <p className="text-sm text-gray-500 mt-1">Semestre {grupo.semestre}</p>}
              {grupo.tipo === "universidad" &&
                grupo.cuatrimestre && <p className="text-sm text-gray-500 mt-1">Cuatrimestre {grupo.cuatrimestre}</p>}
              {(grupo.periodo || grupo.anio) && (
                <p className="text-sm text-gray-500">
                  {[grupo.periodo, grupo.anio].filter(Boolean).join(" ")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/Grupos/Editar/${id_grupo}`}
                className="inline-flex items-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200"
              >
                <FontAwesomeIcon icon={faPen} />
                Editar grupo
              </Link>
              <Link
                to={`/Grupos/Detalle/${id_grupo}/Asistencia`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
                Asistencia
              </Link>
              <Link
                to={`/Grupos/Detalle/${id_grupo}/Calificaciones`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200"
              >
                <FontAwesomeIcon icon={faClipboardCheck} />
                Calificaciones por materia
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ===== ALUMNOS ===== */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-purple-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faUserGraduate} />
                Alumnos ({alumnosAsignados.length})
              </h2>
              <button
                onClick={abrirPanelAlumnos}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Agregar
              </button>
            </div>

            <div className="p-4 max-h-[420px] overflow-y-auto">
              {alumnosAsignados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no hay alumnos en este grupo.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {alumnosAsignados.map((rel) => (
                    <li key={rel.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          fotoUrl={rel.alumnos?.foto_url}
                          nombre={rel.alumnos?.nombre}
                          apellidoPaterno={rel.alumnos?.apellido_paterno}
                          apellidoMaterno={rel.alumnos?.apellido_materno}
                          size={36}
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {rel.alumnos?.nombre} {rel.alumnos?.apellido_paterno} {rel.alumnos?.apellido_materno}
                            {grupo.tipo === "autoplaneado" && rel.alumnos?.plan_meses && (
                              <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                Plan {rel.alumnos.plan_meses} meses
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{rel.alumnos?.correo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(grupo.tipo === "universidad" || grupo.tipo === "autoplaneado") && (
                          <Link
                            to={`/ListarCalisAlumno/${rel.id_alumno}`}
                            className="text-purple-500 hover:text-purple-700 p-2"
                            title="Ver / capturar calificaciones"
                          >
                            <FontAwesomeIcon icon={faStar} />
                          </Link>
                        )}
                        <button
                          onClick={() => quitarAlumno(rel)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Quitar del grupo"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ===== PROFESORES ===== */}
          <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-purple-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faChalkboardTeacher} />
                Profesores ({profesoresAsignados.length})
              </h2>
              <button
                onClick={abrirPanelProfesores}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Asignar
              </button>
            </div>

            <div className="p-4 max-h-[420px] overflow-y-auto">
              {profesoresAsignados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no hay profesores asignados.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {profesoresAsignados.map((rel) => (
                    <li key={rel.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-start gap-3">
                          <Avatar
                            fotoUrl={rel.profesores?.foto_url}
                            nombre={rel.profesores?.nombre}
                            apellidoPaterno={rel.profesores?.apellido_paterno}
                            apellidoMaterno={rel.profesores?.apellido_materno}
                            size={36}
                          />
                          <div className="min-w-0">
                          <p className="font-medium text-gray-800">
                            {rel.profesores?.nombre} {rel.profesores?.apellido_paterno} {rel.profesores?.apellido_materno}
                          </p>
                          <p className="text-xs text-gray-500">{rel.profesores?.correo}</p>

                          {editandoMateriaId === rel.id ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                list="catalogo-materias"
                                autoFocus
                                value={materiaEditando}
                                onChange={(e) => setMateriaEditando(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") guardarMateriaEditada(rel);
                                  if (e.key === "Escape") cancelarEdicionMateria();
                                }}
                                className="flex-1 border border-purple-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                              />
                              <button
                                onClick={() => guardarMateriaEditada(rel)}
                                className="text-green-600 hover:text-green-800 p-1.5"
                                title="Guardar"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                              <button
                                onClick={cancelarEdicionMateria}
                                className="text-gray-400 hover:text-gray-600 p-1.5"
                                title="Cancelar"
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          ) : (
                            rel.materia && (
                              <button
                                onClick={() => iniciarEdicionMateria(rel)}
                                className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full transition"
                                title="Editar materia"
                              >
                                {rel.materia}
                                <FontAwesomeIcon icon={faPen} className="text-[10px] opacity-60" />
                              </button>
                            )
                          )}
                          </div>
                        </div>
                        <button
                          onClick={() => quitarProfesor(rel)}
                          className="text-red-500 hover:text-red-700 p-2 shrink-0"
                          title="Quitar del grupo"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ===== PANEL: agregar alumnos ===== */}
      {panelAlumnos && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPanelAlumnos(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {grupo.tipo === "universidad"
                  ? "Agregar alumnos de Universidad"
                  : grupo.tipo === "autoplaneado"
                  ? "Agregar alumnos de Autoplaneado"
                  : `Agregar alumnos de ${grupo.carrera_nombre}`}
              </h3>
              <button onClick={() => setPanelAlumnos(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </button>
            </div>

            {alumnosDisponibles.length > 0 && (
              <div className="px-4 pt-4">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar por nombre o correo..."
                    value={busquedaAlumnos}
                    onChange={(e) => setBusquedaAlumnos(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
                {seleccionAlumnos.size > 0 && (
                  <p className="text-xs text-purple-600 mt-2">
                    {seleccionAlumnos.size} seleccionado{seleccionAlumnos.size === 1 ? "" : "s"} en total
                    {busquedaAlumnos ? " (aunque no se muestren con este filtro)" : ""}.
                  </p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {alumnosDisponibles.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {grupo.tipo === "universidad"
                    ? "No hay más alumnos de universidad disponibles para agregar."
                    : grupo.tipo === "autoplaneado"
                    ? "No hay más alumnos de Autoplaneado disponibles para agregar."
                    : "No hay más alumnos disponibles de esta carrera para agregar."}
                </p>
              ) : alumnosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Ningún alumno coincide con "{busquedaAlumnos}".
                </p>
              ) : (
                <ul className="space-y-1">
                  {alumnosFiltrados.map((alumno) => (
                    <li key={alumno.id}>
                      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seleccionAlumnos.has(alumno.id)}
                          onChange={() => toggleSeleccionAlumno(alumno.id)}
                          className="h-4 w-4 text-purple-600 rounded"
                        />
                        <Avatar
                          fotoUrl={alumno.foto_url}
                          nombre={alumno.nombre}
                          apellidoPaterno={alumno.apellido_paterno}
                          apellidoMaterno={alumno.apellido_materno}
                          size={28}
                        />
                        <span className="text-sm text-gray-800">
                          {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                          <span className="text-gray-400">
                            {" "}
                            · {alumno.carrera_nombre || "Sin carrera asignada"}
                            {grupo.tipo === "autoplaneado"
                              ? alumno.plan_meses
                                ? ` · Plan ${alumno.plan_meses} meses`
                                : ""
                              : alumno.cuatrimestre
                              ? ` · ${grupo.tipo === "bachillerato" ? "Semestre" : "Cuatrimestre"} ${alumno.cuatrimestre}`
                              : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setPanelAlumnos(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={agregarAlumnosSeleccionados}
                disabled={seleccionAlumnos.size === 0}
                className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
              >
                <FontAwesomeIcon icon={faPlus} />
                Agregar ({seleccionAlumnos.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PANEL: asignar profesor ===== */}
      {panelProfesores && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPanelProfesores(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Asignar profesor</h3>
              <button onClick={() => setPanelProfesores(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {profesoresDisponibles.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay profesores disponibles para asignar.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {profesoresDisponibles.map((profesor) => {
                    const materiasActuales = materiasPorProfesor(profesor.id);
                    return (
                      <li key={profesor.id} className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              fotoUrl={profesor.foto_url}
                              nombre={profesor.nombre}
                              apellidoPaterno={profesor.apellido_paterno}
                              apellidoMaterno={profesor.apellido_materno}
                              size={32}
                            />
                            <div>
                              <p className="font-medium text-gray-800">
                                {profesor.nombre} {profesor.apellido_paterno} {profesor.apellido_materno}
                              </p>
                              <p className="text-xs text-gray-500">{profesor.correo}</p>
                              {materiasActuales.length > 0 && (
                                <p className="text-xs text-purple-600 mt-0.5">
                                  Ya imparte: {materiasActuales.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            list="catalogo-materias"
                            placeholder="Materia que impartirá"
                            value={materiaInputs[profesor.id] || ""}
                            onChange={(e) =>
                              setMateriaInputs({ ...materiaInputs, [profesor.id]: e.target.value })
                            }
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                          <button
                            onClick={() => asignarProfesor(profesor.id)}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Asignar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <Link
                to="/Grupos/InscribirProfesor"
                state={{ returnTo: `/Grupos/Detalle/${id_grupo}` }}
                className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 text-sm font-medium"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                ¿No está en la lista? Inscribir un nuevo profesor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
