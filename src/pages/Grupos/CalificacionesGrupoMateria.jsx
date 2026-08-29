import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase, supabaseAdmin } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLock, faLockOpen, faFilePdf, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function CalificacionesGrupoMateria() {
  const { id_grupo, materia } = useParams();
  const materiaDecoded = decodeURIComponent(materia);
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  // Bachillerato: una fila por alumno con { clave, alumno, parciales: {1,2,3} }
  // Universidad/Autoplaneado: una fila por alumno con { clave, alumno, calificacion }
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);

  const esBachillerato = grupo?.tipo === "bachillerato";

  useEffect(() => {
    cargarTodo();
  }, [id_grupo, materia]);

  const cargarTodo = async () => {
    setLoading(true);

    const { data: grupoData } = await supabase.from("vista_grupos_resumen").select("*").eq("id_grupo", id_grupo).single();
    setGrupo(grupoData || null);

    if (grupoData?.tipo === "bachillerato") {
      await fetchCalificacionesParciales();
    } else {
      await fetchCalificacionesUniversidad();
    }

    setLoading(false);
  };

  // ===== Bachillerato: calificaciones_parciales (sí tiene id_grupo) =====
  const fetchCalificacionesParciales = async () => {
    const { data, error } = await supabase
      .from("calificaciones_parciales")
      .select("id, parcial, calificacion, bloqueada, id_alumno, alumnos(id, nombre, apellido_paterno, apellido_materno)")
      .eq("id_grupo", id_grupo)
      .eq("materia", materiaDecoded);

    if (error) return;

    const agrupado = {};
    (data || []).forEach((fila) => {
      const clave = fila.id_alumno;
      if (!agrupado[clave]) {
        agrupado[clave] = { clave, alumno: fila.alumnos, parciales: {} };
      }
      agrupado[clave].parciales[fila.parcial] = fila;
    });

    setFilas(ordenarPorApellido(Object.values(agrupado)));
  };

  // ===== Universidad / Autoplaneado: "calificaciones" no tiene id_grupo,
  // se relaciona por el correo del alumno (igual que hace el portal docente) =====
  const fetchCalificacionesUniversidad = async () => {
    const { data: alumnosGrupo } = await supabase
      .from("grupo_alumnos")
      .select("alumnos(id, nombre, apellido_paterno, apellido_materno, correo)")
      .eq("id_grupo", id_grupo);

    const roster = (alumnosGrupo || []).map((r) => r.alumnos).filter(Boolean);
    const correos = roster.map((a) => a.correo).filter(Boolean);

    const calPorCorreo = {};
    if (correos.length > 0) {
      const { data: calData } = await supabase
        .from("calificaciones")
        .select("id, correo, calificacion, bloqueada")
        .eq("materia", materiaDecoded)
        .eq("id_grupo", id_grupo)
        .in("correo", correos);
      (calData || []).forEach((c) => (calPorCorreo[c.correo] = c));
    }

    const filasNuevas = roster.map((alumno) => ({
      clave: alumno.id,
      alumno,
      calificacion: calPorCorreo[alumno.correo] || null,
    }));

    setFilas(ordenarPorApellido(filasNuevas));
  };

  const ordenarPorApellido = (arr) =>
    [...arr].sort((a, b) => {
      const nombreA = `${a.alumno?.apellido_paterno || ""} ${a.alumno?.apellido_materno || ""} ${a.alumno?.nombre || ""}`;
      const nombreB = `${b.alumno?.apellido_paterno || ""} ${b.alumno?.apellido_materno || ""} ${b.alumno?.nombre || ""}`;
      return nombreA.localeCompare(nombreB, "es");
    });

  const cambiarBloqueo = async (registro, tabla, bloquear) => {
    const result = await Swal.fire({
      title: bloquear ? "¿Estás seguro de bloquear esta calificación?" : "¿Desbloquear esta calificación?",
      text: bloquear
        ? "El profesor ya no podrá editarla desde el Portal del Docente hasta que la vuelvas a desbloquear."
        : "El profesor podrá volver a capturarla mientras la captura de calificaciones siga habilitada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: bloquear ? "#dc2626" : "#7c3aed",
      cancelButtonColor: "#6b7280",
      confirmButtonText: bloquear ? "Sí, bloquear" : "Sí, desbloquear",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabaseAdmin.from(tabla).update({ bloqueada: bloquear }).eq("id", registro.id);

    if (error) {
      Swal.fire("Error", `No se pudo ${bloquear ? "bloquear" : "desbloquear"} la calificación.`, "error");
      return;
    }

    if (esBachillerato) fetchCalificacionesParciales();
    else fetchCalificacionesUniversidad();
  };

  const bloquearTodas = async () => {
    const { editables } = resumenCandados();

    if (editables === 0) {
      Swal.fire("Nada que bloquear", "No hay calificaciones editables en esta materia.", "info");
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro de bloquear las calificaciones?",
      text: `Se bloquearán las ${editables} calificación${editables === 1 ? "" : "es"} editable${
        editables === 1 ? "" : "s"
      } de "${materiaDecoded}". El profesor ya no podrá editarlas hasta que las vuelvas a desbloquear.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, bloquear todas",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    let error;
    if (esBachillerato) {
      ({ error } = await supabaseAdmin
        .from("calificaciones_parciales")
        .update({ bloqueada: true })
        .eq("id_grupo", id_grupo)
        .eq("materia", materiaDecoded)
        .eq("bloqueada", false));
    } else {
      const correos = filas.map((f) => f.alumno?.correo).filter(Boolean);
      if (correos.length === 0) return;
      ({ error } = await supabaseAdmin
        .from("calificaciones")
        .update({ bloqueada: true })
        .eq("materia", materiaDecoded)
        .eq("id_grupo", id_grupo)
        .eq("bloqueada", false)
        .in("correo", correos));
    }

    if (error) {
      Swal.fire("Error", "No se pudieron bloquear todas las calificaciones.", "error");
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Calificaciones bloqueadas",
      timer: 1500,
      showConfirmButton: false,
    });

    if (esBachillerato) fetchCalificacionesParciales();
    else fetchCalificacionesUniversidad();
  };

  const calcularPromedio = (fila) => {
    const valores = [1, 2, 3]
      .map((p) => fila.parciales[p]?.calificacion)
      .filter((c) => c !== undefined && c !== null)
      .map(Number);

    if (valores.length === 0) return null;
    return valores.reduce((acc, v) => acc + v, 0) / valores.length;
  };

  // Resumen de candados para ver de un vistazo, sin leer fila por fila.
  const resumenCandados = () => {
    let bloqueadas = 0;
    let editables = 0;
    let sinCapturar = 0;

    if (esBachillerato) {
      filas.forEach((f) => {
        [1, 2, 3].forEach((p) => {
          const registro = f.parciales[p];
          if (!registro) sinCapturar++;
          else if (registro.bloqueada) bloqueadas++;
          else editables++;
        });
      });
    } else {
      filas.forEach((f) => {
        if (!f.calificacion) sinCapturar++;
        else if (f.calificacion.bloqueada) bloqueadas++;
        else editables++;
      });
    }

    return { bloqueadas, editables, sinCapturar };
  };

  const filasParaExportar = () => {
    if (esBachillerato) {
      return filas.map((f) => {
        const promedio = calcularPromedio(f);
        return {
          Alumno: `${f.alumno?.nombre} ${f.alumno?.apellido_paterno} ${f.alumno?.apellido_materno || ""}`.trim(),
          "Parcial 1": f.parciales[1]?.calificacion ?? "-",
          "Parcial 2": f.parciales[2]?.calificacion ?? "-",
          "Parcial 3": f.parciales[3]?.calificacion ?? "-",
          Promedio: promedio !== null ? promedio.toFixed(1) : "-",
        };
      });
    }

    return filas.map((f) => ({
      Alumno: `${f.alumno?.nombre} ${f.alumno?.apellido_paterno} ${f.alumno?.apellido_materno || ""}`.trim(),
      Calificación: f.calificacion?.calificacion ?? "-",
      Estado: !f.calificacion ? "Sin capturar" : f.calificacion.bloqueada ? "Bloqueada" : "Editable",
    }));
  };

  const exportPDF = async () => {
    if (filas.length === 0) {
      Swal.fire("Sin datos", "No hay calificaciones para exportar.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "¿Descargar PDF?",
      text: "Se generará el reporte en formato PDF",
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
    doc.text(`${materiaDecoded} · ${grupo?.nombre || ""}`, 14, 20);

    if (esBachillerato) {
      autoTable(doc, {
        startY: 30,
        head: [["Alumno", "Parcial 1", "Parcial 2", "Parcial 3", "Promedio"]],
        body: filasParaExportar().map((f) => [f.Alumno, f["Parcial 1"], f["Parcial 2"], f["Parcial 3"], f.Promedio]),
      });
    } else {
      autoTable(doc, {
        startY: 30,
        head: [["Alumno", "Calificación", "Estado"]],
        body: filasParaExportar().map((f) => [f.Alumno, f["Calificación"], f.Estado]),
      });
    }

    doc.save(`calificaciones_${materiaDecoded}_${grupo?.nombre || "grupo"}.pdf`);
    Swal.fire({ icon: "success", title: "Descarga completada", timer: 1500, showConfirmButton: false });
  };

  const exportExcel = async () => {
    if (filas.length === 0) {
      Swal.fire("Sin datos", "No hay calificaciones para exportar.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "¿Descargar Excel?",
      text: "Se generará el reporte en formato Excel",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });
    if (!result.isConfirmed) return;

    const worksheet = XLSX.utils.json_to_sheet(filasParaExportar());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");
    XLSX.writeFile(workbook, `calificaciones_${materiaDecoded}_${grupo?.nombre || "grupo"}.xlsx`);

    Swal.fire({ icon: "success", title: "Descarga completada", timer: 1500, showConfirmButton: false });
  };

  const CeldaParcial = ({ parcial }) => {
    if (!parcial) return <span className="text-gray-300">-</span>;

    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-semibold text-gray-900">{parcial.calificacion}</span>
        {parcial.bloqueada ? (
          <button
            onClick={() => cambiarBloqueo(parcial, "calificaciones_parciales", false)}
            title="Bloqueada — clic para desbloquear"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-amber-600 transition"
          >
            <FontAwesomeIcon icon={faLock} />
            Desbloquear
          </button>
        ) : (
          <button
            onClick={() => cambiarBloqueo(parcial, "calificaciones_parciales", true)}
            title="Editable — clic para bloquear"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-red-600 transition"
          >
            <FontAwesomeIcon icon={faLockOpen} />
            Bloquear
          </button>
        )}
      </div>
    );
  };

  const CeldaCalificacion = ({ registro }) => {
    if (!registro) return <span className="text-gray-300">Sin capturar</span>;

    return (
      <div className="flex flex-col items-center gap-1">
        <span className="font-semibold text-gray-900 text-lg">{registro.calificacion}</span>
        {registro.bloqueada ? (
          <button
            onClick={() => cambiarBloqueo(registro, "calificaciones", false)}
            title="Bloqueada — clic para desbloquear"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-amber-600 transition"
          >
            <FontAwesomeIcon icon={faLock} />
            Desbloquear
          </button>
        ) : (
          <button
            onClick={() => cambiarBloqueo(registro, "calificaciones", true)}
            title="Editable — clic para bloquear"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-red-600 transition"
          >
            <FontAwesomeIcon icon={faLockOpen} />
            Bloquear
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Calificaciones de la Materia" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const { bloqueadas, editables, sinCapturar } = resumenCandados();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Calificaciones de la Materia" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/Grupos/Detalle/${id_grupo}/Calificaciones`)}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar a materias</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{materiaDecoded}</h1>
            <p className="text-purple-700 font-medium mt-1">{grupo?.nombre}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editables > 0 && (
              <button
                onClick={bloquearTodas}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faLock} />
                Bloquear todas ({editables})
              </button>
            )}
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

        {/* Resumen de candados, para verlo de un vistazo antes de bajar a la tabla */}
        {filas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {bloqueadas > 0 && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl bg-gray-100 text-gray-600">
                <FontAwesomeIcon icon={faLock} />
                {bloqueadas} bloqueada{bloqueadas === 1 ? "" : "s"}
              </span>
            )}
            {editables > 0 && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl bg-amber-100 text-amber-700">
                <FontAwesomeIcon icon={faLockOpen} />
                {editables} desbloqueada{editables === 1 ? "" : "s"}
              </span>
            )}
            {sinCapturar > 0 && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl bg-purple-50 text-purple-600">
                {sinCapturar} sin capturar
              </span>
            )}
          </div>
        )}

        {esBachillerato ? (
          <>
            {/* Tabla escritorio — Bachillerato (3 parciales + promedio) */}
            <div className="hidden md:block w-full overflow-x-auto rounded-2xl shadow-md bg-white">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-purple-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">Parcial 1</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">Parcial 2</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">Parcial 3</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-28">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500 italic">
                        Todavía no hay calificaciones capturadas en esta materia.
                      </td>
                    </tr>
                  ) : (
                    filas.map((fila) => {
                      const promedio = calcularPromedio(fila);
                      return (
                        <tr key={fila.clave} className="hover:bg-purple-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {fila.alumno?.nombre} {fila.alumno?.apellido_paterno} {fila.alumno?.apellido_materno}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CeldaParcial parcial={fila.parciales[1]} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CeldaParcial parcial={fila.parciales[2]} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CeldaParcial parcial={fila.parciales[3]} />
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-purple-700">
                            {promedio !== null ? promedio.toFixed(1) : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil — Bachillerato */}
            <div className="md:hidden space-y-4">
              {filas.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow">
                  Todavía no hay calificaciones capturadas en esta materia.
                </div>
              ) : (
                filas.map((fila) => {
                  const promedio = calcularPromedio(fila);
                  return (
                    <div key={fila.clave} className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-gray-800">
                          {fila.alumno?.nombre} {fila.alumno?.apellido_paterno} {fila.alumno?.apellido_materno}
                        </p>
                        <p className="font-bold text-purple-700">{promedio !== null ? promedio.toFixed(1) : "-"}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Parcial 1</p>
                          <CeldaParcial parcial={fila.parciales[1]} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Parcial 2</p>
                          <CeldaParcial parcial={fila.parciales[2]} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Parcial 3</p>
                          <CeldaParcial parcial={fila.parciales[3]} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tabla escritorio — Universidad / Autoplaneado (1 calificación) */}
            <div className="hidden md:block w-full overflow-x-auto rounded-2xl shadow-md bg-white">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-purple-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Correo</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-40">Calificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filas.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-gray-500 italic">
                        Este grupo todavía no tiene alumnos asignados.
                      </td>
                    </tr>
                  ) : (
                    filas.map((fila) => (
                      <tr key={fila.clave} className="hover:bg-purple-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {fila.alumno?.nombre} {fila.alumno?.apellido_paterno} {fila.alumno?.apellido_materno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{fila.alumno?.correo}</td>
                        <td className="px-4 py-3 text-center">
                          <CeldaCalificacion registro={fila.calificacion} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil — Universidad / Autoplaneado */}
            <div className="md:hidden space-y-4">
              {filas.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow">
                  Este grupo todavía no tiene alumnos asignados.
                </div>
              ) : (
                filas.map((fila) => (
                  <div key={fila.clave} className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                    <p className="font-bold text-gray-800">
                      {fila.alumno?.nombre} {fila.alumno?.apellido_paterno} {fila.alumno?.apellido_materno}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">{fila.alumno?.correo}</p>
                    <div className="border-t border-gray-100 pt-3 flex justify-center">
                      <CeldaCalificacion registro={fila.calificacion} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
