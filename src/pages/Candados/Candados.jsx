import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { updateRows } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLock, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Búsqueda rápida de candados: pensada para cuando un profesor pide
// VERBALMENTE que se desbloquee una calificación y el admin necesita
// encontrarla ya, sin tener que recordar en qué grupo estaba.
//
// Lee de `vista_calificaciones_candados`, una vista que ya une en el
// servidor las calificaciones de universidad/autoplaneado (tabla
// `calificaciones`) con las de bachillerato (tabla `calificaciones_parciales`,
// con su número de parcial) — por eso el filtro es solo `bloqueada = true`,
// sin importar de qué tabla venga cada fila (`tabla_origen` guarda cuál,
// se usa al desbloquear para saber en qué tabla escribir).
export default function Candados() {
  const navigate = useNavigate();

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [carreraFiltro, setCarreraFiltro] = useState("");
  const [profesorFiltro, setProfesorFiltro] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vista_calificaciones_candados")
      .select("*")
      .eq("bloqueada", true)
      .order("fecha_captura", { ascending: false, nullsFirst: false });

    if (!error) setRegistros(data || []);
    setLoading(false);
  };

  const carreras = useMemo(
    () => [...new Set(registros.map((r) => r.carrera_nombre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [registros]
  );

  const profesores = useMemo(() => {
    const nombres = new Map();
    registros.forEach((r) => {
      if (!r.id_profesor) return;
      const nombreCompleto = `${r.profesor_nombre} ${r.profesor_apellido_paterno} ${r.profesor_apellido_materno || ""}`.trim();
      nombres.set(r.id_profesor, nombreCompleto);
    });
    return [...nombres.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [registros]);

  const filtrados = registros.filter((r) => {
    const termino = busquedaAlumno.trim().toLowerCase();
    const nombreCompleto = `${r.alumno_nombre} ${r.alumno_apellido_paterno} ${r.alumno_apellido_materno || ""}`.toLowerCase();
    const coincideAlumno = !termino || nombreCompleto.includes(termino) || r.alumno_correo?.toLowerCase().includes(termino);
    const coincideCarrera = !carreraFiltro || r.carrera_nombre === carreraFiltro;
    const coincideProfesor = !profesorFiltro || r.id_profesor === profesorFiltro;
    return coincideAlumno && coincideCarrera && coincideProfesor;
  });

  // `registro.tabla_origen` ("calificaciones" o "calificaciones_parciales")
  // le dice a updateRows en qué tabla real escribir — la vista mezcla ambas,
  // pero la escritura tiene que ir a la tabla correcta.
  const desbloquear = async (registro) => {
    const nombreCompleto = `${registro.alumno_nombre} ${registro.alumno_apellido_paterno} ${registro.alumno_apellido_materno || ""}`.trim();

    const result = await Swal.fire({
      title: "¿Desbloquear esta calificación?",
      text: `${nombreCompleto} — ${registro.materia}${registro.parcial ? ` (Parcial ${registro.parcial})` : ""}. El profesor podrá volver a capturarla mientras la captura de calificaciones siga habilitada.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, desbloquear",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await updateRows(registro.tabla_origen, "id", registro.id, { bloqueada: false });

    if (error) {
      Swal.fire("Error", "No se pudo desbloquear la calificación.", "error");
      return;
    }

    // Ya no está bloqueada: sale de la lista (que solo muestra bloqueada = true).
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
  };

  const limpiarFiltros = () => {
    setBusquedaAlumno("");
    setCarreraFiltro("");
    setProfesorFiltro("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Candados" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Candados de calificaciones</h1>
          <p className="text-gray-500 mt-1">
            Búsqueda rápida de calificaciones bloqueadas en todo el sistema — para cuando un profesor te pida en
            persona que le desbloquees alguna. Busca por alumno, o filtra por carrera / profesor.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno por nombre o correo..."
              value={busquedaAlumno}
              onChange={(e) => setBusquedaAlumno(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>

          <select
            value={carreraFiltro}
            onChange={(e) => setCarreraFiltro(e.target.value)}
            className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          >
            <option value="">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={profesorFiltro}
            onChange={(e) => setProfesorFiltro(e.target.value)}
            className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          >
            <option value="">Todos los profesores</option>
            {profesores.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>

          {(busquedaAlumno || carreraFiltro || profesorFiltro) && (
            <div className="md:col-span-4">
              <button onClick={limpiarFiltros} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            {registros.length === 0
              ? "No hay ninguna calificación bloqueada en todo el sistema en este momento."
              : "Ningún resultado coincide con los filtros."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl shadow-md bg-white">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-purple-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Carrera</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Materia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Profesor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Grupo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-28">Calificación</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-36">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((r) => (
                  <tr key={`${r.tabla_origen}-${r.id}`} className="hover:bg-purple-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {r.alumno_nombre} {r.alumno_apellido_paterno} {r.alumno_apellido_materno}
                      <p className="text-xs text-gray-400">{r.alumno_correo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.carrera_nombre || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {r.materia}
                      {r.parcial && <span className="text-xs text-gray-400"> · Parcial {r.parcial}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.id_profesor
                        ? `${r.profesor_nombre} ${r.profesor_apellido_paterno} ${r.profesor_apellido_materno || ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.grupo_nombre || "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{r.calificacion}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => desbloquear(r)}
                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <FontAwesomeIcon icon={faLock} />
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
