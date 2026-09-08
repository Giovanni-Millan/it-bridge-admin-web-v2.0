import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faFilePdf, 
  faFileExcel, 
  faPenToSquare, 
  faGraduationCap,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import Avatar from '../../../components/Avatar.jsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { supabase } from '../../../components/supabaseClient.js';

export default function CalificacionesAlumno() {

  const { id } = useParams();
  const [alumno, setAlumno] = useState([]);      // Array de calificaciones
  const [infoAlumno, setInfoAlumno] = useState(null);
  const [historial, setHistorial] = useState([]); // Historial académico permanente
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener información del alumno desde tabla 'alumnos'
      const { data: alumnoData, error: alumnoError } = await supabase
        .from('alumnos')
        .select(`
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          foto_url
        `)
        .eq('id', id)
        .single();

      if (alumnoError) throw alumnoError;

      setInfoAlumno(alumnoData);

      // 2. Obtener calificaciones relacionadas por id del alumno

      const { data: gradesData, error: gradesError } = await supabase
        .from('calificaciones')
        .select(`
        id,
    materia,
    calificacion,
    fecha_registro,
    periodo_cuatrimestre,
    ano_cuatrimestre
        `)
        .eq('id_alumno', id)
        .order('ano_cuatrimestre', { ascending: true })
.order('periodo_cuatrimestre', { ascending: true })

      if (gradesError) throw gradesError;

      // Formatear datos

      const calificacionesFormateadas = gradesData.map(g => ({
        id_calificacion: g.id,
  nombre_materia: g.materia,
  calificacion_final: g.calificacion,
  fecha_registro: g.fecha_registro,
  periodo_cuatrimestre: g.periodo_cuatrimestre,
  ano_cuatrimestre: g.ano_cuatrimestre
      }));

      setAlumno(calificacionesFormateadas);

      // 3. Historial académico permanente (sobrevive aunque se elimine el
      // grupo/materia que originó la calificación, incluye bachillerato).
      const { data: historialData, error: historialError } = await supabase
        .from('historial_academico')
        .select('*')
        .eq('id_alumno', id)
        .order('anio', { ascending: false })
        .order('periodo', { ascending: true })
        .order('materia', { ascending: true });

      if (historialError) throw historialError;

      setHistorial(historialData || []);

    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las calificaciones',
      });

    } finally {
      setLoading(false);
    }
  };

  fetchData();

}, [id]);

  // ================= PROMEDIO GENERAL =================
  const calcularPromedioGeneral = () => {
    const calificacionesValidas = alumno
      .map(a => Number(a.calificacion_final))
      .filter(c => !isNaN(c));
    if (calificacionesValidas.length === 0) return 0;
    const suma = calificacionesValidas.reduce((acc, val) => acc + val, 0);
    return (suma / calificacionesValidas.length).toFixed(1);
  };

  const obtenerColorCalificacion = (calificacion) => {
    if (calificacion >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (calificacion >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const obtenerEstadoCalificacion = (calificacion) => {
    if (calificacion >= 8) return 'Aprobado';
    if (calificacion >= 6) return 'Regular';
    return 'Reprobado';
  };

  // ================== PDF ==================
  const exportPDF = async () => {
    if (alumno.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay calificaciones para exportar'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Descargar PDF?',
      text: 'Se generará el reporte en formato PDF',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7c3aed'
    });

    if (!result.isConfirmed) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(85, 26, 139);
    doc.text(
      `Calificaciones de ${infoAlumno?.nombre || ''} ${infoAlumno?.apellido_paterno || ''}`,
      14,
      20
    );

    autoTable(doc, {
      startY: 30,
      head: [["Materia", "Calificación"]],
      body: alumno.map(a => [a.nombre_materia, a.calificacion_final]),
    });

    doc.save(`calificaciones_${infoAlumno?.nombre || 'alumno'}.pdf`);

    Swal.fire({
      icon: 'success',
      title: 'Descarga completada',
      text: 'El PDF se descargó correctamente',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // ================== EXCEL ==================
  const exportExcel = async () => {
    if (alumno.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay calificaciones para exportar'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Descargar Excel?',
      text: 'Se generará el reporte en formato Excel',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a'
    });

    if (!result.isConfirmed) return;

    const worksheetData = alumno.map((a) => ({
      Materia: a.nombre_materia,
      Calificación: a.calificacion_final
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");
    XLSX.writeFile(workbook, `calificaciones_${infoAlumno?.nombre || 'alumno'}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Descarga completada',
      text: 'El Excel se descargó correctamente',
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700"></div>
      </main>
    );
  }

  const eliminarCalificacion = async (id_calificacion) => {

  const result = await Swal.fire({
    title: "¿Eliminar calificación?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return;

  try {

    const { error } = await supabase
      .from("calificaciones")
      .delete()
      .eq("id", id_calificacion);

    if (error) throw error;

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "La calificación se eliminó correctamente",
      timer: 1500,
      showConfirmButton: false
    });

    // refrescar lista
    setAlumno(prev =>
      prev.filter(c => c.id_calificacion !== id_calificacion)
    );

  } catch (err) {

    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la calificación"
    });

  }

};

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <Navbar titulo="Calificaciones del Alumno" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Botones */}
        <div className="flex justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-white border border-purple-200 text-purple-700 px-5 py-2 rounded-lg shadow hover:bg-purple-50 transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </button>

          <div className="flex gap-3 flex-wrap">
            <Link
              to={`/SubirCalificacionesAlumno/${id}`}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
              Registrar
            </Link>

            <button
              onClick={exportPDF}
              className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition"
            >
              <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
              PDF
            </button>

            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
              Excel
            </button>
          </div>
        </div>

        {/* Info Alumno */}
        {infoAlumno && (
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border">
            <div className="flex items-center gap-4 mb-4">
              <Avatar
                fotoUrl={infoAlumno.foto_url}
                nombre={infoAlumno.nombre}
                apellidoPaterno={infoAlumno.apellido_paterno}
                apellidoMaterno={infoAlumno.apellido_materno}
                size={56}
              />
              <div>
                <h2 className="text-2xl font-bold">
                  {infoAlumno.nombre} {infoAlumno.apellido_paterno} {infoAlumno.apellido_materno}
                </h2>
                <p className="text-gray-500 text-sm">Información académica</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-5 rounded-xl text-center">
                <p className="text-gray-600">Promedio General</p>
                <p className="text-4xl font-bold text-purple-700">
                  {calcularPromedioGeneral()}
                </p>
              </div>

              <div className="bg-green-50 p-5 rounded-xl text-center">
                <p className="text-gray-600">Materias</p>
                <p className="text-4xl font-bold text-green-700">
                  {alumno.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de calificaciones */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left">Materia</th>
  <th className="py-3 px-4 text-center">Periodo</th>
  <th className="py-3 px-4 text-center">Año</th>
  <th className="py-3 px-4 text-center">Calificación</th>
  <th className="py-3 px-4 text-center">Estado</th>
  <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumno.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No hay calificaciones registradas
                  </td>
                </tr>
              ) : (
                alumno.map((data, i) => {
                  const calificacion = Number(data.calificacion_final);
                  return (
                    <tr key={i} className="border-b hover:bg-purple-50 transition">

  <td className="py-3 px-6">
    {data.nombre_materia}
  </td>

  <td className="py-3 px-4 text-center">
    {data.periodo_cuatrimestre}
  </td>

  <td className="py-3 px-4 text-center">
    {data.ano_cuatrimestre}
  </td>

  <td className="py-3 px-4 text-center font-bold">
    {calificacion}
  </td>

  {/* ESTADO */}

  <td className="py-3 px-4 text-center">

    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${obtenerColorCalificacion(calificacion)}`}
    >
      {obtenerEstadoCalificacion(calificacion)}
    </span>

  </td>

  {/* ACCIONES */}

  <td className="py-3 px-4 text-center">

    <div className="flex justify-center gap-2">

      <Link
        to={`/ModificarCalificacion/${data.id_calificacion}`}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
      >
        Editar
      </Link>

      <button
        onClick={() => eliminarCalificacion(data.id_calificacion)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
      >
        Eliminar
      </button>

    </div>

  </td>

</tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Historial académico permanente */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8">
          <div className="bg-indigo-700 px-6 py-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-white" />
            <h2 className="text-lg font-semibold text-white">Historial académico (permanente)</h2>
          </div>
          <p className="px-6 pt-4 text-sm text-gray-500">
            Se conserva aunque el grupo o la materia se eliminen más adelante. Incluye Bachillerato y Universidad.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full mt-2">
              <thead className="bg-gray-100 text-gray-700">
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
                      <tr key={h.id} className="border-b hover:bg-indigo-50 transition">
                        <td className="py-3 px-6 font-medium">{h.materia}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${h.tipo === "Bachillerato" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                            {h.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4">{h.grupo_nombre ?? "-"}</td>
                        <td className="py-3 px-4">{h.docente_nombre ?? "-"}</td>
                        <td className="py-3 px-4 text-center">{h.tipo === "Bachillerato" ? (h.semestre ? `Semestre ${h.semestre}` : "-") : (h.periodo ?? "-")}</td>
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