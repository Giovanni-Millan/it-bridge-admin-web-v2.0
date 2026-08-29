import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEdit,
  faTrash,
  faEye,
  faStar,
  faSearch,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function AlumnosPorCarrera() {
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carreraNombre, setCarreraNombre] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { id_carrera } = useParams();

  useEffect(() => {
    if (!id_carrera) return;
    fetchCarreraNombre();
    fetchAlumnos();
  }, [id_carrera]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAlumnos(alumnos);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = alumnos.filter(
        (alumno) =>
          alumno.nombre?.toLowerCase().includes(term) ||
          alumno.apellido_paterno?.toLowerCase().includes(term) ||
          alumno.apellido_materno?.toLowerCase().includes(term)
      );
      setFilteredAlumnos(filtered);
    }
  }, [searchTerm, alumnos]);

  const fetchCarreraNombre = async () => {
    const { data, error } = await supabase
      .from("carrera")
      .select("nombre")
      .eq("id_carrera", Number(id_carrera))
      .single();

    if (!error && data) {
      setCarreraNombre(data.nombre);
    }
  };

  const fetchAlumnos = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("vista_alumnos_por_carrera")
        .select("*")
        .eq("id_carrera", Number(id_carrera))
        .gt("cuatrimestre", 0)
        .order("apellido_paterno", { ascending: true })
        .order("apellido_materno", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) throw error;

      setAlumnos(data || []);
      setFilteredAlumnos(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los alumnos. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      Swal.fire("Error", "No se recibió el ID del alumno", "error");
      return;
    }

    const result = await Swal.fire({
      title: "¿Reiniciar cuatrimestre?",
      text: "El alumno pasará a cuatrimestre 0. ¿Estás seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "Sí, reiniciar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("alumnos")
          .update({ cuatrimestre: 0 })
          .eq("id", id);

        if (error) throw error;

        Swal.fire({
          title: "¡Actualizado!",
          text: "El cuatrimestre fue reiniciado a 0.",
          icon: "success",
          confirmButtonColor: "#7c3aed",
        });
        fetchAlumnos();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudo actualizar el alumno", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Alumnos por Carrera" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Alumnos por Carrera" />
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAlumnos}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Gestión de Alumnos" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Regresar</span>
          </button>

          <div className="text-center sm:text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center sm:justify-end gap-2">
              <FontAwesomeIcon icon={faUserGraduate} className="text-purple-600" />
              {carreraNombre ? `Alumnos de ${carreraNombre}` : "Lista de Alumnos"}
            </h1>
            {carreraNombre && (
              <p className="text-sm text-gray-500 mt-1">
                Alumnos activos con cuatrimestre mayor a 0
              </p>
            )}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredAlumnos.length} {filteredAlumnos.length === 1 ? "alumno" : "alumnos"} encontrados
          </div>
        </div>

        {/* Tabla full width - escritorio */}
        <div className="hidden md:block w-full overflow-x-auto rounded-2xl shadow-md bg-white">
          <table className="w-full table-auto divide-y divide-gray-200">
            <thead className="bg-purple-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Nombre</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Apellido Paterno</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Apellido Materno</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Fecha Nac.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">CURP</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Correo</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Teléfono</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Dirección</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Cuatrimestre</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlumnos.map((alumno) => (
                <tr key={alumno.id_alumno} className="hover:bg-purple-50 transition">
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.id_alumno}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.nombre}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.apellido_paterno}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.apellido_materno}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString("es-MX") : "-"}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.curp || "-"}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.correo}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.telefono}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{alumno.direccion || "-"}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-center">
                    <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-xs">
                      {alumno.cuatrimestre}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        title="Ver detalles"
                        className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                        onClick={() =>
                          Swal.fire({
                            title: `Detalles de ${alumno.nombre} ${alumno.apellido_paterno}`,
                            html: `
                              <div class="text-left">
                                <p><strong>Correo:</strong> ${alumno.correo}</p>
                                <p><strong>Teléfono:</strong> ${alumno.telefono}</p>
                                <p><strong>Dirección:</strong> ${alumno.direccion || "-"}</p>
                                <p><strong>CURP:</strong> ${alumno.curp || "-"}</p>
                                <p><strong>Cuatrimestre:</strong> ${alumno.cuatrimestre}</p>
                                <p><strong>Fecha de nacimiento:</strong> ${alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString("es-MX") : "-"}</p>
                              </div>
                            `,
                            icon: "info",
                            confirmButtonColor: "#7c3aed",
                          })
                        }
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <Link
                        title="Editar información"
                        to={`/ModificarInfoAlumno/${alumno.id}`}
                        className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button
                        title="Reiniciar cuatrimestre"
                        className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                        onClick={() => handleDelete(alumno.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <Link
                        title="Calificaciones"
                        to={`/ListarCalisAlumno/${alumno.id}`}
                        className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-sm"
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista tarjetas móviles */}
        <div className="md:hidden space-y-4">
          {filteredAlumnos.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow">
              No hay alumnos que coincidan con la búsqueda.
            </div>
          ) : (
            filteredAlumnos.map((alumno) => (
              <div key={alumno.id_alumno} className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {alumno.id_alumno}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                    Cuatrimestre {alumno.cuatrimestre}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-sm text-gray-600 mb-3">
                  <p><strong>Correo:</strong> {alumno.correo}</p>
                  <p><strong>Teléfono:</strong> {alumno.telefono}</p>
                  <p><strong>Dirección:</strong> {alumno.direccion || "-"}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() =>
                      Swal.fire({
                        title: `${alumno.nombre} ${alumno.apellido_paterno}`,
                        html: `
                          <p><strong>CURP:</strong> ${alumno.curp || "-"}</p>
                          <p><strong>Fecha nacimiento:</strong> ${alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString("es-MX") : "-"}</p>
                          <p><strong>Cuatrimestre:</strong> ${alumno.cuatrimestre}</p>
                        `,
                        icon: "info",
                        confirmButtonColor: "#7c3aed",
                      })
                    }
                    className="text-blue-600 hover:text-blue-800"
                    title="Ver detalles"
                  >
                    <FontAwesomeIcon icon={faEye} size="lg" />
                  </button>
                  <Link to={`/ModificarInfoAlumno/${alumno.id}`} className="text-green-600 hover:text-green-800">
                    <FontAwesomeIcon icon={faEdit} size="lg" />
                  </Link>
                  <button onClick={() => handleDelete(alumno.id)} className="text-red-600 hover:text-red-800">
                    <FontAwesomeIcon icon={faTrash} size="lg" />
                  </button>
                  <Link to={`/ListarCalisAlumno/${alumno.id}`} className="text-yellow-500 hover:text-yellow-700">
                    <FontAwesomeIcon icon={faStar} size="lg" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mensaje sin alumnos */}
        {filteredAlumnos.length === 0 && alumnos.length > 0 && (
          <div className="text-center text-gray-500 mt-8">
            No hay alumnos que coincidan con la búsqueda.
          </div>
        )}
        {alumnos.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm mt-6">
            No hay alumnos registrados en esta carrera con cuatrimestre mayor a 0.
          </div>
        )}
      </div>
    </div>
  );
}