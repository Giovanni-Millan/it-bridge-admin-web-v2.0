import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faMagnifyingGlass, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../components/supabaseClient.js";
import Avatar from "../../components/Avatar.jsx";

// Punto de entrada al Historial Académico: lista TODOS los alumnos (no
// solo los que ya tienen historial capturado) con buscador; al elegir uno
// se navega a DetalleHistorialAcademico.jsx con su registro permanente
// completo.
export default function ListarAlumnosHistorial() {
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("alumnos")
      .select("id, nombre, apellido_paterno, apellido_materno, correo, tipo, foto_url, carrera:id_carrera(nombre)")
      .order("apellido_paterno", { ascending: true })
      .order("apellido_materno", { ascending: true })
      .order("nombre", { ascending: true });

    if (!error) {
      setAlumnos(
        (data || []).map((a) => ({
          ...a,
          nombreCompleto: [a.nombre, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(" "),
        }))
      );
    }

    setLoading(false);
  };

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return alumnos;
    return alumnos.filter(
      (a) =>
        a.nombreCompleto.toLowerCase().includes(texto) ||
        (a.correo || "").toLowerCase().includes(texto) ||
        (a.carrera?.nombre || "").toLowerCase().includes(texto)
    );
  }, [alumnos, busqueda]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <Navbar titulo="Historial Académico" />

      <div className="mt-8 px-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-purple-300 transition-all duration-300"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>
      </div>

      <div className="px-6 mt-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-purple-100">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno por nombre, correo o carrera..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : alumnosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No se encontraron alumnos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Correo</th>
                    <th className="py-3 px-4 text-left">Carrera</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-purple-50 transition">
                      <td className="py-3 px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar
                            fotoUrl={a.foto_url}
                            nombre={a.nombre}
                            apellidoPaterno={a.apellido_paterno}
                            apellidoMaterno={a.apellido_materno}
                            size={32}
                          />
                          {a.nombreCompleto}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{a.correo}</td>
                      <td className="py-3 px-4 text-gray-600">{a.carrera?.nombre || "Sin asignar"}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.tipo === "bachillerato"
                              ? "bg-red-100 text-red-700"
                              : a.tipo === "autoplaneado"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {a.tipo ? a.tipo.charAt(0).toUpperCase() + a.tipo.slice(1) : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/HistorialAcademico/${a.id}`)}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition text-sm"
                        >
                          <FontAwesomeIcon icon={faClockRotateLeft} className="mr-1" />
                          Ver historial
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
    </main>
  );
}
