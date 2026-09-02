import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { insertRows, deleteRows } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash, faSearch, faBook } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

// CRUD del catálogo de materias, agrupado por área (Bachillerato + cada
// carrera de universidad). Es solo un catálogo DE REFERENCIA para el
// autocompletado al asignar profesor a un grupo (ver DetalleGrupo.jsx) —
// `grupo_profesores.materia` es texto libre, sin FK real hacia esta tabla,
// así que borrar una materia de aquí no afecta asignaciones que ya la usen.
export default function Materias() {
  const [materias, setMaterias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroArea, setFiltroArea] = useState("");

  const [nuevaMateria, setNuevaMateria] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    await Promise.all([fetchMaterias(), fetchAreas()]);
    setLoading(false);
  };

  const fetchMaterias = async () => {
    const { data, error } = await supabase
      .from("materias")
      .select("*")
      .order("area", { ascending: true })
      .order("nombre", { ascending: true });

    if (!error) setMaterias(data || []);
  };

  // Las áreas son "Bachillerato" y cada carrera de universidad (sin la
  // modalidad), derivadas de la tabla carrera para que siempre coincidan
  // con las carreras reales del sistema.
  const fetchAreas = async () => {
    const { data, error } = await supabase.from("carrera").select("nombre");
    if (error) return;

    const set = new Set();
    (data || []).forEach((c) => {
      const base = (c.nombre || "").split(" - ")[0].trim();
      if (base) set.add(base);
    });

    setAreas([...set].sort((a, b) => a.localeCompare(b, "es")));
  };

  const materiasFiltradas = useMemo(() => {
    return materias.filter((m) => {
      if (filtroArea && m.area !== filtroArea) return false;
      if (busqueda.trim() && !m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) return false;
      return true;
    });
  }, [materias, busqueda, filtroArea]);

  const materiasPorArea = useMemo(() => {
    const grupos = {};
    materiasFiltradas.forEach((m) => {
      if (!grupos[m.area]) grupos[m.area] = [];
      grupos[m.area].push(m);
    });
    return grupos;
  }, [materiasFiltradas]);

  const agregarMateria = async (event) => {
    event.preventDefault();

    const nombre = nuevaMateria.trim();
    if (!nombre) {
      Swal.fire("Falta el nombre", "Escribe el nombre de la materia.", "warning");
      return;
    }
    if (!areaSeleccionada) {
      Swal.fire("Falta el área", "Selecciona si es de Bachillerato o de qué carrera de universidad.", "warning");
      return;
    }

    setGuardando(true);
    const { error } = await insertRows("materias", [{ nombre, area: areaSeleccionada }]);
    setGuardando(false);

    if (error) {
      const mensaje = error.code === "23505"
        ? "Esa materia ya existe registrada en esa área."
        : "No se pudo agregar la materia.";
      Swal.fire("Error", mensaje, "error");
      return;
    }

    setNuevaMateria("");
    fetchMaterias();
  };

  const eliminarMateria = async (materia) => {
    const result = await Swal.fire({
      title: "¿Quitar del catálogo?",
      text: `"${materia.nombre}" (${materia.area})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await deleteRows("materias", "id_materia", materia.id_materia);

    if (error) {
      Swal.fire("Error", "No se pudo quitar la materia del catálogo.", "error");
      return;
    }

    fetchMaterias();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Materias" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </Link>

        {/* Agregar materia */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faBook} className="text-purple-600" />
            Agregar materia al catálogo
          </h2>
          <form onSubmit={agregarMateria} className="flex flex-col sm:flex-row gap-3">
            <select
              value={areaSeleccionada}
              onChange={(e) => setAreaSeleccionada(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white sm:w-72"
            >
              <option value="">Selecciona un área...</option>
              <option value="Bachillerato">Bachillerato</option>
              {areas.filter((a) => a !== "Bachillerato").map((area) => (
                <option key={area} value={area}>
                  {area} (Universidad)
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={nuevaMateria}
              onChange={(e) => setNuevaMateria(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faPlus} />
              Agregar
            </button>
          </form>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar materia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm md:w-64"
          >
            <option value="">Todas las áreas</option>
            <option value="Bachillerato">Bachillerato</option>
            {areas.filter((a) => a !== "Bachillerato").map((area) => (
              <option key={area} value={area}>
                {area} (Universidad)
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : materiasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            No hay materias que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(materiasPorArea)
              .sort((a, b) => a.localeCompare(b, "es"))
              .map((area) => (
                <div key={area} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="bg-purple-700 px-6 py-3 flex items-center justify-between">
                    <h3 className="text-white font-semibold">
                      {area} {area !== "Bachillerato" && <span className="font-normal text-purple-200 text-sm">(Universidad)</span>}
                    </h3>
                    <span className="text-purple-200 text-sm">{materiasPorArea[area].length} materia{materiasPorArea[area].length === 1 ? "" : "s"}</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {materiasPorArea[area].map((m) => (
                      <li key={m.id_materia} className="flex items-center justify-between px-6 py-2.5 hover:bg-purple-50 transition">
                        <span className="text-sm text-gray-800">{m.nombre}</span>
                        <button
                          onClick={() => eliminarMateria(m)}
                          className="text-red-400 hover:text-red-600 p-1.5"
                          title="Quitar del catálogo"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
