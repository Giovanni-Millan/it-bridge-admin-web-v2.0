import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBook, faUserGraduate, faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";

// Resumen "capturado vs. total" por materia de un grupo — clic en una
// materia lleva a CalificacionesGrupoMateria.jsx para ver/editar el detalle
// alumno por alumno. Es el mismo cálculo que después se generalizó a TODOS
// los grupos en PendientesCalificaciones.jsx (1-sep-2026), pero aquí acotado
// a un solo grupo. Distingue bachillerato (tabla `calificaciones_parciales`)
// de universidad/autoplaneado (tabla `calificaciones`) — ver el `if` de abajo.
export default function CalificacionesGrupo() {
  const { id_grupo } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  // [{ materia, alumnosCalificados, totalAlumnos, bloqueadas, editables }]
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTodo();
  }, [id_grupo]);

  const cargarTodo = async () => {
    setLoading(true);

    const [{ data: grupoData }, { data: asignaciones }, { data: alumnosGrupo }] = await Promise.all([
      supabase.from("vista_grupos_resumen").select("*").eq("id_grupo", id_grupo).single(),
      supabase.from("grupo_profesores").select("materia").eq("id_grupo", id_grupo),
      supabase
        .from("grupo_alumnos")
        .select("id_alumno, alumnos(correo)")
        .eq("id_grupo", id_grupo),
    ]);

    setGrupo(grupoData || null);
    const totalAlumnos = (alumnosGrupo || []).length;

    if (grupoData?.tipo === "bachillerato") {
      // Bachillerato: calificaciones_parciales sí tiene id_grupo directo.
      const { data: parciales } = await supabase
        .from("calificaciones_parciales")
        .select("materia, id_alumno, bloqueada")
        .eq("id_grupo", id_grupo);

      const nombresMaterias = new Set();
      (asignaciones || []).forEach((a) => a.materia && nombresMaterias.add(a.materia));
      (parciales || []).forEach((p) => p.materia && nombresMaterias.add(p.materia));

      const resumen = [...nombresMaterias].sort((a, b) => a.localeCompare(b, "es")).map((materia) => {
        const deLaMateria = (parciales || []).filter((p) => p.materia === materia);
        const alumnosCalificados = new Set(deLaMateria.map((p) => p.id_alumno)).size;
        const bloqueadas = deLaMateria.filter((p) => p.bloqueada).length;
        const editables = deLaMateria.filter((p) => !p.bloqueada).length;
        return { materia, alumnosCalificados, totalAlumnos, bloqueadas, editables };
      });

      setMaterias(resumen);
    } else {
      // Universidad / Autoplaneado: "calificaciones" ya tiene id_grupo
      // (antes se relacionaba solo por correo del alumno, y mezclaba
      // materias de otros grupos/cuatrimestres del mismo alumno).
      const correos = (alumnosGrupo || []).map((r) => r.alumnos?.correo).filter(Boolean);

      const { data: calificaciones } =
        correos.length > 0
          ? await supabase
              .from("calificaciones")
              .select("materia, correo, bloqueada")
              .eq("id_grupo", id_grupo)
              .in("correo", correos)
          : { data: [] };

      const nombresMaterias = new Set();
      (asignaciones || []).forEach((a) => a.materia && nombresMaterias.add(a.materia));
      (calificaciones || []).forEach((c) => c.materia && nombresMaterias.add(c.materia));

      const resumen = [...nombresMaterias].sort((a, b) => a.localeCompare(b, "es")).map((materia) => {
        const deLaMateria = (calificaciones || []).filter((c) => c.materia === materia);
        const alumnosCalificados = new Set(deLaMateria.map((c) => c.correo)).size;
        const bloqueadas = deLaMateria.filter((c) => c.bloqueada).length;
        const editables = deLaMateria.filter((c) => !c.bloqueada).length;
        return { materia, alumnosCalificados, totalAlumnos, bloqueadas, editables };
      });

      setMaterias(resumen);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Calificaciones del Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Calificaciones del Grupo" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/Grupos/Detalle/${id_grupo}`)}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar al grupo</span>
        </button>

        {grupo && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
            <p className="text-purple-700 font-medium mt-1">
              Calificaciones por materia (
              {grupo.tipo === "bachillerato" ? "Bachillerato" : grupo.tipo === "autoplaneado" ? "Autoplaneado" : "Universidad"}
              )
            </p>
          </div>
        )}

        {materias.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            Este grupo todavía no tiene materias asignadas ni calificaciones capturadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materias.map((m) => {
              // Estado del candado a nivel materia, para verlo de un
              // vistazo sin tener que entrar: todo bloqueado (normal),
              // todo editable (nadie lo ha bloqueado todavía), o mixto
              // (alguien desbloqueó algo — vale la pena revisarlo).
              const sinCapturar = m.alumnosCalificados === 0;
              const todoBloqueado = !sinCapturar && m.editables === 0;
              const todoEditable = !sinCapturar && m.bloqueadas === 0;
              const mixto = !sinCapturar && !todoBloqueado && !todoEditable;

              return (
                <Link
                  key={m.materia}
                  to={`/Grupos/Detalle/${id_grupo}/Calificaciones/${encodeURIComponent(m.materia)}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-300 flex flex-col items-center text-center"
                >
                  <div className="relative mb-4">
                    <div className="bg-purple-100 rounded-full p-4 group-hover:bg-purple-200 transition">
                      <FontAwesomeIcon icon={faBook} className="text-3xl text-purple-700" />
                    </div>
                    {!sinCapturar && (
                      <span
                        title={
                          todoBloqueado
                            ? "Todas las calificaciones capturadas están bloqueadas"
                            : todoEditable
                            ? "Todas las calificaciones capturadas están editables"
                            : "Mezcla de calificaciones bloqueadas y editables"
                        }
                        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          todoBloqueado ? "bg-gray-500" : todoEditable ? "bg-green-500" : "bg-amber-500"
                        }`}
                      >
                        <FontAwesomeIcon icon={todoEditable ? faLockOpen : faLock} className="text-white text-xs" />
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{m.materia}</h4>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUserGraduate} />
                    {m.alumnosCalificados} de {m.totalAlumnos} alumno{m.totalAlumnos === 1 ? "" : "s"} calificado{m.alumnosCalificados === 1 ? "" : "s"}
                  </p>

                  {!sinCapturar && (
                    <div className="flex items-center gap-2 mt-3">
                      {m.bloqueadas > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                          {m.bloqueadas} bloqueada{m.bloqueadas === 1 ? "" : "s"}
                        </span>
                      )}
                      {m.editables > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          <FontAwesomeIcon icon={faLockOpen} className="text-[10px]" />
                          {m.editables} desbloqueada{m.editables === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
