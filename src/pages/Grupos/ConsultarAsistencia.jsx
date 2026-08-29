import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFilePdf, faFileExcel, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ETIQUETAS_ESTADO = {
  presente: "Presente",
  falta: "Falta",
  retardo: "Retardo",
  justificado: "Justificado",
};

const CLASES_ESTADO = {
  presente: "bg-green-100 text-green-700",
  falta: "bg-red-100 text-red-700",
  retardo: "bg-amber-100 text-amber-700",
  justificado: "bg-blue-100 text-blue-700",
};

const hoyISO = () => new Date().toLocaleDateString("sv-SE");

export default function ConsultarAsistencia() {
  const { id_grupo } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [fecha, setFecha] = useState("");
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  useEffect(() => {
    cargarGrupo();
  }, [id_grupo]);

  useEffect(() => {
    fetchAsistencia();
  }, [fecha, id_grupo]);

  const cargarGrupo = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vista_grupos_resumen")
      .select("*")
      .eq("id_grupo", id_grupo)
      .single();

    if (!error) setGrupo(data);
    setLoading(false);
  };

  const fetchAsistencia = async () => {
    setCargandoTabla(true);
    let query = supabase
      .from("vista_asistencias")
      .select("*")
      .eq("id_grupo", id_grupo)
      .order("fecha", { ascending: false })
      .order("alumno_apellido_paterno", { ascending: true })
      .order("alumno_apellido_materno", { ascending: true });

    if (fecha) query = query.eq("fecha", fecha);

    const { data, error } = await query;
    if (!error) setRegistros(data || []);
    setCargandoTabla(false);
  };

  const filasParaExportar = () =>
    registros.map((r) => ({
      Fecha: r.fecha,
      Alumno: `${r.alumno_nombre} ${r.alumno_apellido_paterno} ${r.alumno_apellido_materno || ""}`.trim(),
      Estado: ETIQUETAS_ESTADO[r.estado] || r.estado,
      Profesor: `${r.profesor_nombre} ${r.profesor_apellido_paterno}`.trim(),
    }));

  const exportPDF = async () => {
    if (registros.length === 0) {
      Swal.fire({ icon: "warning", title: "Sin datos", text: "No hay asistencia para exportar" });
      return;
    }

    const result = await Swal.fire({
      title: "¿Descargar PDF?",
      text: "Se generará el reporte de asistencia en formato PDF",
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
    doc.text(`Asistencia · ${grupo?.nombre || ""}${fecha ? " · " + fecha : ""}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Fecha", "Alumno", "Estado", "Profesor"]],
      body: filasParaExportar().map((f) => [f.Fecha, f.Alumno, f.Estado, f.Profesor]),
    });

    doc.save(`asistencia_${grupo?.nombre || "grupo"}${fecha ? "_" + fecha : ""}.pdf`);

    Swal.fire({ icon: "success", title: "Descarga completada", timer: 1500, showConfirmButton: false });
  };

  const exportExcel = async () => {
    if (registros.length === 0) {
      Swal.fire({ icon: "warning", title: "Sin datos", text: "No hay asistencia para exportar" });
      return;
    }

    const result = await Swal.fire({
      title: "¿Descargar Excel?",
      text: "Se generará el reporte de asistencia en formato Excel",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });
    if (!result.isConfirmed) return;

    const worksheet = XLSX.utils.json_to_sheet(filasParaExportar());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");
    XLSX.writeFile(workbook, `asistencia_${grupo?.nombre || "grupo"}${fecha ? "_" + fecha : ""}.xlsx`);

    Swal.fire({ icon: "success", title: "Descarga completada", timer: 1500, showConfirmButton: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Asistencia del Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Asistencia del Grupo" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/Grupos/Detalle/${id_grupo}`)}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar al grupo</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            {grupo && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
                <p className="text-purple-700 font-medium mt-1">{grupo.carrera_nombre || "Sin carrera asignada"}</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm">
              <FontAwesomeIcon icon={faCalendarDays} className="text-purple-600" />
              <input
                type="date"
                value={fecha}
                max={hoyISO()}
                onChange={(e) => setFecha(e.target.value)}
                className="outline-none"
              />
              {fecha && (
                <button
                  onClick={() => setFecha("")}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                  title="Ver todas las fechas"
                >
                  ✕
                </button>
              )}
            </label>

            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Excel
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              PDF
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-2xl shadow-md bg-white relative">
          {cargandoTabla && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}
          <table className="w-full table-auto divide-y divide-gray-200">
            <thead className="bg-purple-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Profesor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500 italic">
                    No hay asistencia registrada{fecha ? " para esta fecha" : ""}.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">{r.fecha}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {r.alumno_nombre} {r.alumno_apellido_paterno} {r.alumno_apellido_materno}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex text-xs font-bold uppercase px-2.5 py-1 rounded-full ${CLASES_ESTADO[r.estado] || "bg-gray-100 text-gray-700"}`}>
                        {ETIQUETAS_ESTADO[r.estado] || r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {r.profesor_nombre} {r.profesor_apellido_paterno}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
