import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFilePdf,
  faGraduationCap,
  faChartLine,
  faBook,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Avatar from "../../components/Avatar.jsx";

// Historial académico completo de un alumno: lee `historial_academico`, el
// registro PERMANENTE de calificaciones finales (sobrevive aunque el grupo
// o la materia original se borren después — no es lo mismo que consultar
// `calificaciones` directo). Calcula el promedio general en el cliente y
// exporta a PDF.
export default function DetalleHistorialAcademico() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alumno, setAlumno] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTodo();
  }, [id]);

  const cargarTodo = async () => {
    setLoading(true);

    const [{ data: alumnoData }, { data: historialData }] = await Promise.all([
      supabase
        .from("alumnos")
        .select("*, carrera:id_carrera(nombre)")
        .eq("id", id)
        .single(),
      supabase
        .from("historial_academico")
        .select("*")
        .eq("id_alumno", id)
        .order("anio", { ascending: false })
        .order("periodo", { ascending: true })
        .order("materia", { ascending: true }),
    ]);

    setAlumno(alumnoData || null);
    setHistorial(historialData || []);
    setLoading(false);
  };

  const calcularPromedio = () => {
    const finales = historial.map((h) => Number(h.calificacion_final)).filter((c) => !isNaN(c));
    if (finales.length === 0) return 0;
    return (finales.reduce((acc, v) => acc + v, 0) / finales.length).toFixed(1);
  };

  const nombreCompleto = alumno
    ? [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno].filter(Boolean).join(" ")
    : "";

  const exportPDF = async () => {
    if (historial.length === 0) {
      Swal.fire("Sin datos", "Este alumno todavía no tiene historial académico registrado.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "¿Descargar PDF?",
      text: "Se generará el historial académico completo del alumno",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });
    if (!result.isConfirmed) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(85, 26, 139);
    doc.text("Historial Académico", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Alumno: ${nombreCompleto}`, 14, 27);
    doc.text(`Correo: ${alumno?.correo || "-"}`, 14, 33);
    doc.text(`Carrera: ${alumno?.carrera?.nombre || "Sin asignar"}`, 14, 39);
    doc.text(`Promedio general: ${calcularPromedio()}  |  Materias cursadas: ${historial.length}`, 14, 45);

    autoTable(doc, {
      startY: 52,
      head: [["Materia", "Tipo", "Grupo", "Docente", "Periodo/Semestre", "Año", "Calificación"]],
      body: historial.map((h) => [
        h.materia,
        h.tipo,
        h.grupo_nombre || "-",
        h.docente_nombre || "-",
        h.tipo === "Bachillerato" ? (h.semestre ? `Semestre ${h.semestre}` : "-") : h.periodo || "-",
        h.anio || "-",
        !isNaN(Number(h.calificacion_final)) ? Number(h.calificacion_final).toFixed(1) : "-",
      ]),
      headStyles: { fillColor: [124, 58, 237] },
    });

    doc.save(`historial_academico_${nombreCompleto.replace(/\s+/g, "_")}.pdf`);
    Swal.fire({ icon: "success", title: "Descarga completada", timer: 1500, showConfirmButton: false });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <Navbar titulo="Historial Académico" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={() => navigate("/HistorialAcademico")}
            className="bg-white border border-purple-200 text-purple-700 px-5 py-2 rounded-lg shadow hover:bg-purple-50 transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </button>

          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition"
          >
            <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
            Exportar PDF
          </button>
        </div>

        {alumno && (
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border">
            <div className="flex items-center gap-4 mb-4">
              <Avatar
                fotoUrl={alumno.foto_url}
                nombre={alumno.nombre}
                apellidoPaterno={alumno.apellido_paterno}
                apellidoMaterno={alumno.apellido_materno}
                size={56}
              />
              <div>
                <h2 className="text-2xl font-bold">{nombreCompleto}</h2>
                <p className="text-gray-500 text-sm">{alumno.correo}</p>
                <p className="text-purple-700 font-medium text-sm mt-1">
                  {alumno.carrera?.nombre || "Sin carrera asignada"}
                  {alumno.tipo && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      {alumno.tipo.charAt(0).toUpperCase() + alumno.tipo.slice(1)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-purple-50 p-5 rounded-xl text-center">
                <FontAwesomeIcon icon={faChartLine} className="text-purple-600 text-2xl mb-2" />
                <p className="text-gray-600">Promedio General</p>
                <p className="text-3xl font-bold text-purple-700">{calcularPromedio()}</p>
              </div>

              <div className="bg-green-50 p-5 rounded-xl text-center">
                <FontAwesomeIcon icon={faBook} className="text-green-600 text-2xl mb-2" />
                <p className="text-gray-600">Materias Cursadas</p>
                <p className="text-3xl font-bold text-green-700">{historial.length}</p>
              </div>

              <div className="bg-indigo-50 p-5 rounded-xl text-center">
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-indigo-600 text-2xl mb-2" />
                <p className="text-gray-600 text-sm">Registro permanente</p>
                <p className="text-xs text-indigo-700 mt-2">Se conserva aunque el grupo o la materia se elimine</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left">Materia</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-left">Grupo</th>
                  <th className="py-3 px-4 text-left">Docente</th>
                  <th className="py-3 px-4 text-center">Periodo / Semestre</th>
                  <th className="py-3 px-4 text-center">Año</th>
                  <th className="py-3 px-4 text-center">Calificación final</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      Este alumno todavía no tiene registros en su historial académico.
                    </td>
                  </tr>
                ) : (
                  historial.map((h) => {
                    const cal = Number(h.calificacion_final);
                    return (
                      <tr key={h.id} className="border-b hover:bg-purple-50 transition">
                        <td className="py-3 px-6 font-medium">{h.materia}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              h.tipo === "Bachillerato" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {h.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4">{h.grupo_nombre ?? "-"}</td>
                        <td className="py-3 px-4">{h.docente_nombre ?? "-"}</td>
                        <td className="py-3 px-4 text-center">
                          {h.tipo === "Bachillerato" ? (h.semestre ? `Semestre ${h.semestre}` : "-") : h.periodo ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-center">{h.anio ?? "-"}</td>
                        <td className="py-3 px-4 text-center font-bold">{!isNaN(cal) ? cal.toFixed(1) : "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
