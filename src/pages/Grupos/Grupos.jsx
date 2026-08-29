import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { deleteRows } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faEye,
  faTrash,
  faSearch,
  faLayerGroup,
  faUserGraduate,
  faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Grupos() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vista_grupos_resumen")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron cargar los grupos.", "error");
      setLoading(false);
      return;
    }

    setGrupos(data || []);
    setLoading(false);
  };

  const handleEliminar = async (grupo) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${grupo.nombre}"?`,
      text: "Se quitarán también todos los alumnos y profesores asignados a este grupo. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await deleteRows("grupos", "id_grupo", grupo.id_grupo);

    if (error) {
      Swal.fire("Error", "No se pudo eliminar el grupo.", "error");
      return;
    }

    Swal.fire({
      title: "Grupo eliminado",
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });
    fetchGrupos();
  };

  const filteredGrupos = grupos.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.nombre?.toLowerCase().includes(term) ||
      g.carrera_nombre?.toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Gestionar Grupos" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            onClick={() => navigate("/Dashboard")}
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Regresar</span>
          </button>

          <Link
            to="/Grupos/Crear"
            className="inline-flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 w-fit"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Crear grupo</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <FontAwesomeIcon icon={faLayerGroup} className="text-purple-600 text-2xl" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Grupos</h1>
        </div>

        <div className="relative w-full md:w-96 mb-6">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre de grupo o carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredGrupos.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-2xl shadow-sm">
            {grupos.length === 0
              ? "Aún no has creado ningún grupo."
              : "No hay grupos que coincidan con la búsqueda."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGrupos.map((grupo) => (
              <div
                key={grupo.id_grupo}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{grupo.nombre}</h3>
                  <p className="text-sm text-purple-700 font-medium mb-1">
                    {grupo.carrera_nombre || "Sin carrera asignada"}
                  </p>
                  {grupo.cuatrimestre && (
                    <p className="text-xs text-gray-500 mb-3">Cuatrimestre {grupo.cuatrimestre}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600 mt-3">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faUserGraduate} className="text-purple-500" />
                      {grupo.total_alumnos} alumno{grupo.total_alumnos === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faChalkboardTeacher} className="text-purple-500" />
                      {grupo.total_profesores} profesor{grupo.total_profesores === 1 ? "" : "es"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                  <Link
                    to={`/Grupos/Detalle/${grupo.id_grupo}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Ver
                  </Link>
                  <button
                    onClick={() => handleEliminar(grupo)}
                    className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition"
                    title="Eliminar grupo"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
