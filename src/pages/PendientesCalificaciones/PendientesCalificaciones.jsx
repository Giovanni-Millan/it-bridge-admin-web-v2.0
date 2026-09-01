import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const TIPOS = [
  { valor: "universidad", etiqueta: "Universidad" },
  { valor: "bachillerato", etiqueta: "Bachillerato" },
  { valor: "autoplaneado", etiqueta: "Autoplaneado" },
];

// "Pendiente" = un alumno inscrito en un grupo (grupo_alumnos) cuya materia
// tiene profesor asignado (grupo_profesores), pero no existe ninguna fila en
// `calificaciones` (universidad/autoplaneado) ni `calificaciones_parciales`
// (bachillerato) para ese (id_grupo, materia, id_alumno). Ambas tablas ya
// tienen id_grupo directo, así que el cruce es exacto — no hay estado
// intermedio (calificacion NULL): o existe la fila o no existe.
export default function PendientesCalificaciones() {
  const navigate = useNavigate();

  const [pendientes, setPendientes] = useState([]);
  const [gruposTodos, setGruposTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [profesorFiltro, setProfesorFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);

    const [
      { data: grupos },
      { data: asignaciones },
      { data: inscripciones },
      { data: calificaciones },
      { data: parciales },
    ] = await Promise.all([
      supabase.from("vista_grupos_resumen").select("id_grupo, nombre, carrera_nombre, tipo, periodo, anio"),
      supabase
        .from("grupo_profesores")
        .select("id_grupo, id_profesor, materia, profesores(id, nombre, apellido_paterno, apellido_materno)"),
      supabase
        .from("grupo_alumnos")
        .select("id_grupo, id_alumno, alumnos(id, nombre, apellido_paterno, apellido_materno, correo)"),
      supabase.from("calificaciones").select("id_grupo, materia, id_alumno"),
      supabase.from("calificaciones_parciales").select("id_grupo, materia, id_alumno"),
    ]);

    const gruposPorId = new Map((grupos || []).map((g) => [g.id_grupo, g]));

    // Un solo Set combinado: para un id_grupo dado solo existirán filas en
    // UNA de las dos tablas (según su tipo), así que no hay riesgo de mezcla.
    const capturado = new Set();
    [...(calificaciones || []), ...(parciales || [])].forEach((c) => {
      if (c.id_grupo == null) return; // capturas viejas/sin grupo, no aplican a ningún grupo actual
      capturado.add(`${c.id_grupo}|${c.materia}|${c.id_alumno}`);
    });

    // Alumnos por grupo
    const alumnosPorGrupo = new Map();
    (inscripciones || []).forEach((i) => {
      if (!i.alumnos) return;
      const lista = alumnosPorGrupo.get(i.id_grupo) || [];
      lista.push({ id_alumno: i.id_alumno, ...i.alumnos });
      alumnosPorGrupo.set(i.id_grupo, lista);
    });

    const filas = [];
    (asignaciones || []).forEach((asig) => {
      if (!asig.materia || !asig.profesores) return;
      const grupo = gruposPorId.get(asig.id_grupo);
      const alumnosDelGrupo = alumnosPorGrupo.get(asig.id_grupo) || [];

      alumnosDelGrupo.forEach((alumno) => {
        const clave = `${asig.id_grupo}|${asig.materia}|${alumno.id_alumno}`;
        if (capturado.has(clave)) return;

        filas.push({
          clave,
          id_profesor: asig.id_profesor,
          profesorNombre: `${asig.profesores.nombre} ${asig.profesores.apellido_paterno} ${
            asig.profesores.apellido_materno || ""
          }`.trim(),
          materia: asig.materia,
          id_grupo: asig.id_grupo,
          grupoNombre: grupo?.nombre || "—",
          carreraNombre: grupo?.carrera_nombre || "—",
          tipo: grupo?.tipo || "universidad",
          periodo: grupo?.periodo || "",
          anio: grupo?.anio || "",
          alumnoNombre: `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno || ""}`.trim(),
          alumnoCorreo: alumno.correo,
        });
      });
    });

    setPendientes(filas);
    setGruposTodos(grupos || []);
    setLoading(false);
  };

  // Períodos presentes entre TODOS los grupos (no solo los que tienen
  // pendientes), para que el filtro siga sirviendo aunque un período ya
  // esté 100% al día. Ordenado del más reciente al más viejo (funciona
  // porque "ENE-ABR" < "MAY-AGO" < "SEP-DIC" alfabéticamente coincide con
  // el orden cronológico del año).
  const periodos = useMemo(() => {
    const set = new Set(
      gruposTodos.map((g) => `${g.periodo} ${g.anio}`).filter((s) => s.trim())
    );
    return [...set].sort().reverse();
  }, [gruposTodos]);

  // Por defecto, el período más reciente — para que cuando exista más de
  // uno no se mezclen cuatrimestres viejos con el actual.
  useEffect(() => {
    if (periodos.length > 0 && !periodoFiltro) setPeriodoFiltro(periodos[0]);
  }, [periodos]); // eslint-disable-line react-hooks/exhaustive-deps

  const profesores = useMemo(() => {
    const nombres = new Map();
    pendientes.forEach((p) => nombres.set(p.id_profesor, p.profesorNombre));
    return [...nombres.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [pendientes]);

  const filtrados = pendientes.filter((p) => {
    const termino = busqueda.trim().toLowerCase();
    const coincideTexto =
      !termino ||
      p.alumnoNombre.toLowerCase().includes(termino) ||
      p.alumnoCorreo?.toLowerCase().includes(termino) ||
      p.materia.toLowerCase().includes(termino) ||
      p.grupoNombre.toLowerCase().includes(termino);
    const coincideProfesor = !profesorFiltro || p.id_profesor === profesorFiltro;
    const coincideTipo = !tipoFiltro || p.tipo === tipoFiltro;
    const coincidePeriodo = !periodoFiltro || `${p.periodo} ${p.anio}` === periodoFiltro;
    return coincideTexto && coincideProfesor && coincideTipo && coincidePeriodo;
  });

  const resumen = useMemo(() => {
    const base = periodoFiltro ? pendientes.filter((p) => `${p.periodo} ${p.anio}` === periodoFiltro) : pendientes;
    const profesoresUnicos = new Set(base.map((p) => p.id_profesor)).size;
    const asignacionesUnicas = new Set(base.map((p) => `${p.id_grupo}|${p.materia}`)).size;
    return { profesores: profesoresUnicos, asignaciones: asignacionesUnicas, alumnos: base.length };
  }, [pendientes, periodoFiltro]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setProfesorFiltro("");
    setTipoFiltro("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Pendientes de Calificaciones" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pendientes de Calificaciones</h1>
          <p className="text-gray-500 mt-1">
            Alumnos que ya están inscritos en un grupo con materia asignada a un profesor, pero que todavía no
            tienen ninguna calificación capturada. Filtra por profesor, tipo o período, o busca por alumno/materia/grupo.
          </p>
        </div>

        {/* Resumen */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-purple-800">{resumen.profesores}</p>
              <p className="text-sm text-gray-500 mt-1">profesores con pendientes</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-purple-800">{resumen.asignaciones}</p>
              <p className="text-sm text-gray-500 mt-1">grupo+materia con huecos</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-purple-800">{resumen.alumnos}</p>
              <p className="text-sm text-gray-500 mt-1">alumnos sin calificación</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno, materia o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>

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

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>

          {periodos.length > 1 && (
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
            >
              {periodos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          {(busqueda || profesorFiltro || tipoFiltro) && (
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
            {pendientes.length === 0 ? (
              <span className="text-green-700 font-medium">
                Todo el sistema está al día — no hay ninguna calificación pendiente de capturar.
              </span>
            ) : (
              "Ningún resultado coincide con los filtros."
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl shadow-md bg-white">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-purple-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Profesor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Materia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Carrera</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((p) => (
                  <tr key={p.clave} className="hover:bg-purple-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">{p.profesorNombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.materia}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.grupoNombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.carreraNombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {p.alumnoNombre}
                      <p className="text-xs text-gray-400">{p.alumnoCorreo}</p>
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
