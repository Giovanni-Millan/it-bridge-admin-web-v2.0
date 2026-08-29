import React, { useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEdit, faTrash, faEye, faStar } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function ConsultarAlumnosDerecho() {
  const [alumnos, setAlumnos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const response = await axios.get("http://localhost:4000/ConsultarAlumnosDerecho");
        setAlumnos(response.data);
      } catch (error) {
        console.error("Error al obtener los alumnos:", error);
      }
    };
    fetchAlumnos();
  }, []);

  const handleDelete = (id_alumno) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará al alumno de forma permanente",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9333ea",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.patch('http://localhost:4000/EliminarAlumno/' + id_alumno);
          setAlumnos(alumnos.filter((a) => a.id_alumno !== id_alumno));
          Swal.fire("Eliminado", "El alumno ha sido eliminado", "success");
        } catch (error) {
          Swal.fire("Error", "No se pudo eliminar el alumno", "error");
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔹 Navbar con título adaptado */}
      <Navbar titulo="Modificar Alumnos Derecho" />

      <div className="p-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div className="mt-8 ml-10">
            <Link
              to={"/ConsultarUsuarios"}
              className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-purple-300 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Regresar</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Lista de Alumnos de Derecho</h1>
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs md:text-sm bg-transparent">
            <thead className="bg-purple-700 text-white text-xs">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Apellido Paterno</th>
                <th className="p-3 text-left">Apellido Materno</th>
                <th className="p-3 text-left">Fecha Nacimiento</th>
                <th className="p-3 text-left">CURP</th>
                <th className="p-3 text-left">Correo</th>
                <th className="p-3 text-left">Teléfono</th>
                <th className="p-3 text-left">Dirección</th>
                <th className="p-3 text-left">Cuatrimestre</th>
                <th className="p-3 text-left">Carrera</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno, index) => (
                <tr
                  key={index}
                  className="odd:bg-white even:bg-gray-100 hover:bg-purple-50 transition"
                >
                  <td className="p-3 text-xs">{alumno.id_alumno}</td>
                  <td className="p-3 text-xs">{alumno.nombre}</td>
                  <td className="p-3 text-xs">{alumno.apellido_paterno}</td>
                  <td className="p-3 text-xs">{alumno.apellido_materno}</td>
                  <td className="p-3 text-xs">
                      {new Date(alumno.fecha_nacimiento).toLocaleDateString("es-MX")}
                    </td>
                  <td className="p-3 text-xs">{alumno.curp}</td>
                  <td className="p-3 text-xs">{alumno.correo}</td>
                  <td className="p-3 text-xs">{alumno.telefono}</td>
                  <td className="p-3 text-xs">{alumno.direccion}</td>
                  <td className="p-3 text-xs">{alumno.cuatrimestre}</td>
                  <td className="p-3 text-xs">{alumno.carrera}</td>

                  {/* Botones de acción */}
                  <td className="p-3 text-center">
                    <div className="grid grid-cols-2 gap-1 justify-center">
                      {/* Ver */}
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        title="Ver información del alumno"
                        onClick={() =>
                          Swal.fire({
                            title: "Detalles del Alumno",
                            html: `
                              <b>Nombre:</b> ${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}<br>
                              <b>Correo:</b> ${alumno.correo}<br>
                              <b>Teléfono:</b> ${alumno.telefono}<br>
                              <b>Dirección:</b> ${alumno.direccion}<br>
                              <b>Cuatrimestre:</b> ${alumno.cuatrimestre}<br>
                              <b>Carrera:</b> ${alumno.carrera}
                            `,
                            icon: "info",
                          })
                        }
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                      {/* Editar */}
                      <Link
                        title="Editar información del alumno"
                        to={`/ModificarInfoAlumno/${alumno.id_alumno}`}
                        className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>

                      {/* Eliminar */}
                      <button
                        title="Eliminar alumno"
                        className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        onClick={() => handleDelete(alumno.id_alumno)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      {/* Adjuntar calificaciones */}
                      <Link
                        title="Agregar calificaciones"
                        to={`/ListarCalisAlumno/${alumno.id_alumno}`}
                        className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
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
      </div>
    </div>
  );
}
