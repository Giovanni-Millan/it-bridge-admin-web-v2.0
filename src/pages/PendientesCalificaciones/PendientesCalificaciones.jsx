import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMagnifyingGlass,
  faUserGraduate,
  faBook,
  faFilePdf,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
// xlsx-js-style solo se carga bajo demanda (import dinámico) al exportar a
// Excel: es un fork completo de xlsx que duplica lo que la librería `xlsx`
// (ya usada en el resto del portal) ya trae, así que cargarlo de entrada
// aquí infla el bundle de TODA la app en ~900 kB aunque nadie exporte nunca.

const TIPOS = [
  { valor: "universidad", etiqueta: "Universidad" },
  { valor: "bachillerato", etiqueta: "Bachillerato" },
  { valor: "autoplaneado", etiqueta: "Autoplaneado" },
];

/* =====================================================================
   EXPORTACIÓN A EXCEL Y PDF
   ===================================================================== */

// xlsx (community) no soporta estilos de celda — se usa xlsx-js-style
// (mismo API, drop-in) solo en esta página para el diseño formal pedido.
const COLOR_BANNER = "5B21B6"; // purple-800
const COLOR_HEADER = "7C3AED"; // purple-600
const COLOR_SUBBANDA = "EDE9FE"; // purple-100
const COLOR_FILA_PAR = "F5F3FF"; // purple-50
const COLOR_TEXTO = "374151";
const COLOR_TENUE = "6B7280";

const BORDE_FINO = {
  top: { style: "thin", color: { rgb: "E5E7EB" } },
  bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  left: { style: "thin", color: { rgb: "E5E7EB" } },
  right: { style: "thin", color: { rgb: "E5E7EB" } },
};

function estilizar(ws, ref, estilo) {
  if (!ws[ref]) ws[ref] = { t: "s", v: "" };
  ws[ref].s = estilo;
}

function descargarWorkbook(XLSXStyle, ws, nombreHoja, nombreArchivo) {
  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, nombreHoja);
  XLSXStyle.writeFile(wb, nombreArchivo);
}

// Banner + subtítulo + meta, comunes a los 2 exports de Excel. `anchoCols`
// es cuántas columnas ocupan los merges (6 para el general, 2 para el de
// un solo profesor).
function encabezadoExcel(filas, anchoCols, titulo, subtitulo, meta) {
  filas.push([titulo]);
  filas.push([subtitulo]);
  filas.push([meta]);
  filas.push([]);
  return { filaTitulo: 0, filaSubtitulo: 1, filaMeta: 2, ultimaCol: anchoCols - 1 };
}

async function exportarExcelGeneral(porProfesor, resumen, filtrosTexto) {
  const XLSXStyle = (await import("xlsx-js-style")).default;

  const filas = [];
  const { filaTitulo, filaSubtitulo, filaMeta, ultimaCol } = encabezadoExcel(
    filas,
    6,
    "Instituto Tecnológico Bridge",
    "Pendientes de Calificaciones — Reporte General",
    `Generado: ${new Date().toLocaleString("es-MX")}${filtrosTexto ? " · Filtros: " + filtrosTexto : ""}`
  );

  filas.push([
    `Profesores con pendientes: ${resumen.profesores}    ·    Asignaciones con huecos: ${resumen.asignaciones}    ·    Alumnos sin calificación: ${resumen.alumnos}`,
  ]);
  filas.push([]);

  const filaEncabezadoTabla = filas.length;
  filas.push(["Profesor", "Materia", "Grupo", "Carrera", "Alumno", "Correo"]);

  const filaInicioDatos = filas.length;
  porProfesor.forEach((prof) => {
    prof.asignaciones.forEach((asig) => {
      asig.alumnos.forEach((al) => {
        filas.push([prof.profesorNombre, asig.materia, asig.grupoNombre, asig.carreraNombre, al.nombre, al.correo]);
      });
    });
  });

  const ws = XLSXStyle.utils.aoa_to_sheet(filas);
  ws["!merges"] = [
    { s: { r: filaTitulo, c: 0 }, e: { r: filaTitulo, c: ultimaCol } },
    { s: { r: filaSubtitulo, c: 0 }, e: { r: filaSubtitulo, c: ultimaCol } },
    { s: { r: filaMeta, c: 0 }, e: { r: filaMeta, c: ultimaCol } },
    { s: { r: filaMeta + 1, c: 0 }, e: { r: filaMeta + 1, c: ultimaCol } },
  ];
  ws["!cols"] = [{ wch: 30 }, { wch: 28 }, { wch: 32 }, { wch: 24 }, { wch: 32 }, { wch: 36 }];
  ws["!rows"] = [{ hpx: 30 }, { hpx: 22 }, { hpx: 18 }, { hpx: 18 }];

  for (let c = 0; c <= ultimaCol; c++) {
    const col = XLSXStyle.utils.encode_col(c);
    estilizar(ws, `${col}${filaTitulo + 1}`, {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_BANNER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    estilizar(ws, `${col}${filaSubtitulo + 1}`, {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_HEADER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    estilizar(ws, `${col}${filaMeta + 1}`, {
      font: { italic: true, sz: 9, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_HEADER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    estilizar(ws, `${col}${filaMeta + 2}`, {
      font: { bold: true, sz: 10, color: { rgb: COLOR_BANNER } },
      fill: { fgColor: { rgb: COLOR_SUBBANDA } },
      alignment: { horizontal: "center", vertical: "center" },
    });
  }

  for (let c = 0; c <= ultimaCol; c++) {
    const col = XLSXStyle.utils.encode_col(c);
    estilizar(ws, `${col}${filaEncabezadoTabla + 1}`, {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_HEADER } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDE_FINO,
    });
  }

  const totalFilasDatos = filas.length - filaInicioDatos;
  for (let f = 0; f < totalFilasDatos; f++) {
    const filaExcel = filaInicioDatos + f + 1;
    const par = f % 2 === 0;
    for (let c = 0; c <= ultimaCol; c++) {
      const col = XLSXStyle.utils.encode_col(c);
      estilizar(ws, `${col}${filaExcel}`, {
        font: { sz: 10, color: { rgb: c === 5 ? COLOR_TENUE : COLOR_TEXTO } },
        fill: { fgColor: { rgb: par ? COLOR_FILA_PAR : "FFFFFF" } },
        border: BORDE_FINO,
        alignment: { vertical: "center" },
      });
    }
  }

  ws["!autofilter"] = { ref: `A${filaEncabezadoTabla + 1}:F${filaInicioDatos + totalFilasDatos}` };

  descargarWorkbook(XLSXStyle, ws, "Pendientes", `pendientes_calificaciones_general_${Date.now()}.xlsx`);
}

async function exportarExcelProfesor(prof) {
  const XLSXStyle = (await import("xlsx-js-style")).default;

  const filas = [];
  const { filaTitulo, filaSubtitulo, filaMeta, ultimaCol } = encabezadoExcel(
    filas,
    2,
    "Instituto Tecnológico Bridge",
    `Pendientes de Calificaciones — ${prof.profesorNombre}`,
    `Generado: ${new Date().toLocaleString("es-MX")} · ${prof.asignaciones.length} materia${
      prof.asignaciones.length === 1 ? "" : "s"
    } con huecos · ${prof.totalAlumnos} alumno${prof.totalAlumnos === 1 ? "" : "s"} sin calificación`
  );

  const filasEspeciales = []; // { fila, tipo: 'materia' | 'meta' | 'header' }

  prof.asignaciones.forEach((asig) => {
    filasEspeciales.push({ fila: filas.length, tipo: "materia" });
    filas.push([`▸ ${asig.materia}`]);

    filasEspeciales.push({ fila: filas.length, tipo: "meta" });
    filas.push([`${asig.grupoNombre} · ${asig.carreraNombre}`]);

    filasEspeciales.push({ fila: filas.length, tipo: "header" });
    filas.push(["Alumno", "Correo"]);

    const inicioDatos = filas.length;
    asig.alumnos.forEach((al) => filas.push([al.nombre, al.correo]));
    filasEspeciales.push({ fila: inicioDatos, tipo: "datos", cantidad: asig.alumnos.length });

    filas.push([]);
  });

  const ws = XLSXStyle.utils.aoa_to_sheet(filas);
  ws["!merges"] = [
    { s: { r: filaTitulo, c: 0 }, e: { r: filaTitulo, c: ultimaCol } },
    { s: { r: filaSubtitulo, c: 0 }, e: { r: filaSubtitulo, c: ultimaCol } },
    { s: { r: filaMeta, c: 0 }, e: { r: filaMeta, c: ultimaCol } },
  ];
  ws["!cols"] = [{ wch: 34 }, { wch: 38 }];
  ws["!rows"] = [{ hpx: 30 }, { hpx: 22 }, { hpx: 18 }];

  for (let c = 0; c <= ultimaCol; c++) {
    const col = XLSXStyle.utils.encode_col(c);
    estilizar(ws, `${col}${filaTitulo + 1}`, {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_BANNER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    estilizar(ws, `${col}${filaSubtitulo + 1}`, {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_HEADER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    estilizar(ws, `${col}${filaMeta + 1}`, {
      font: { italic: true, sz: 9, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: COLOR_HEADER } },
      alignment: { horizontal: "center", vertical: "center" },
    });
  }

  filasEspeciales.forEach(({ fila, tipo, cantidad }) => {
    const filaExcel = fila + 1;

    if (tipo === "materia") {
      ws["!merges"].push({ s: { r: fila, c: 0 }, e: { r: fila, c: ultimaCol } });
      for (let c = 0; c <= ultimaCol; c++) {
        estilizar(ws, `${XLSXStyle.utils.encode_col(c)}${filaExcel}`, {
          font: { bold: true, sz: 11, color: { rgb: COLOR_BANNER } },
          fill: { fgColor: { rgb: COLOR_SUBBANDA } },
        });
      }
    } else if (tipo === "meta") {
      ws["!merges"].push({ s: { r: fila, c: 0 }, e: { r: fila, c: ultimaCol } });
      for (let c = 0; c <= ultimaCol; c++) {
        estilizar(ws, `${XLSXStyle.utils.encode_col(c)}${filaExcel}`, {
          font: { italic: true, sz: 9, color: { rgb: COLOR_TENUE } },
        });
      }
    } else if (tipo === "header") {
      for (let c = 0; c <= ultimaCol; c++) {
        estilizar(ws, `${XLSXStyle.utils.encode_col(c)}${filaExcel}`, {
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: COLOR_HEADER } },
          border: BORDE_FINO,
        });
      }
    } else if (tipo === "datos") {
      for (let i = 0; i < cantidad; i++) {
        const par = i % 2 === 0;
        for (let c = 0; c <= ultimaCol; c++) {
          estilizar(ws, `${XLSXStyle.utils.encode_col(c)}${filaExcel + i}`, {
            font: { sz: 10, color: { rgb: c === 1 ? COLOR_TENUE : COLOR_TEXTO } },
            fill: { fgColor: { rgb: par ? COLOR_FILA_PAR : "FFFFFF" } },
            border: BORDE_FINO,
          });
        }
      }
    }
  });

  const nombreArchivo = `pendientes_${prof.profesorNombre.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
  descargarWorkbook(XLSXStyle, ws, "Pendientes", nombreArchivo);
}

function encabezadoPDF(doc, subtitulo, meta) {
  doc.setFontSize(20);
  doc.setTextColor(91, 33, 182);
  doc.text("Bridge Admin", 14, 20);

  doc.setFontSize(15);
  doc.setTextColor(40, 40, 40);
  doc.text(subtitulo, 14, 30);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(meta, 14, 38);
}

function piePagina(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} · Bridge Admin · Pendientes de Calificaciones`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
}

function exportarPDFGeneral(porProfesor, resumen, filtrosTexto) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  encabezadoPDF(
    doc,
    "Pendientes de Calificaciones — Reporte General",
    `Generado: ${new Date().toLocaleString("es-MX")}${filtrosTexto ? " · Filtros: " + filtrosTexto : ""}  ·  ${
      resumen.profesores
    } profesores  ·  ${resumen.asignaciones} asignaciones con huecos  ·  ${resumen.alumnos} alumnos pendientes`
  );

  const filas = [];
  porProfesor.forEach((prof) => {
    prof.asignaciones.forEach((asig) => {
      asig.alumnos.forEach((al) => {
        filas.push([prof.profesorNombre, asig.materia, asig.grupoNombre, asig.carreraNombre, al.nombre, al.correo]);
      });
    });
  });

  autoTable(doc, {
    startY: 44,
    head: [["Profesor", "Materia", "Grupo", "Carrera", "Alumno", "Correo"]],
    body: filas,
    theme: "striped",
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: 50 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    margin: { left: 14, right: 14 },
  });

  piePagina(doc);
  doc.save(`pendientes_calificaciones_general_${Date.now()}.pdf`);
}

function exportarPDFProfesor(prof) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  encabezadoPDF(
    doc,
    `Pendientes de Calificaciones — ${prof.profesorNombre}`,
    `Generado: ${new Date().toLocaleString("es-MX")} · ${prof.asignaciones.length} materia${
      prof.asignaciones.length === 1 ? "" : "s"
    } con huecos · ${prof.totalAlumnos} alumno${prof.totalAlumnos === 1 ? "" : "s"} sin calificación`
  );

  let y = 46;
  const pageHeight = doc.internal.pageSize.getHeight();

  prof.asignaciones.forEach((asig) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(91, 33, 182);
    doc.text(asig.materia, 14, y);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`${asig.grupoNombre} · ${asig.carreraNombre}`, 14, y + 5);

    autoTable(doc, {
      startY: y + 9,
      head: [["Alumno", "Correo"]],
      body: asig.alumnos.map((al) => [al.nombre, al.correo]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: 50 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  piePagina(doc);
  doc.save(`pendientes_${prof.profesorNombre.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

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
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);

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
    const set = new Set(gruposTodos.map((g) => `${g.periodo} ${g.anio}`).filter((s) => s.trim()));
    return [...set].sort().reverse();
  }, [gruposTodos]);

  // Por defecto, el período más reciente — para que cuando exista más de
  // uno no se mezclen cuatrimestres viejos con el actual.
  useEffect(() => {
    if (periodos.length > 0 && !periodoFiltro) setPeriodoFiltro(periodos[0]);
  }, [periodos]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = pendientes.filter((p) => {
    const termino = busqueda.trim().toLowerCase();
    const coincideTexto =
      !termino ||
      p.alumnoNombre.toLowerCase().includes(termino) ||
      p.alumnoCorreo?.toLowerCase().includes(termino) ||
      p.materia.toLowerCase().includes(termino) ||
      p.grupoNombre.toLowerCase().includes(termino) ||
      p.profesorNombre.toLowerCase().includes(termino);
    const coincideTipo = !tipoFiltro || p.tipo === tipoFiltro;
    const coincidePeriodo = !periodoFiltro || `${p.periodo} ${p.anio}` === periodoFiltro;
    return coincideTexto && coincideTipo && coincidePeriodo;
  });

  // Un renglón por profesor con pendientes (nada más), ordenado por quién
  // tiene más huecos primero — es lo que más ayuda a priorizar a quién
  // recordarle. Cada profesor trae ya armado su desglose por grupo+materia.
  const porProfesor = useMemo(() => {
    const mapa = new Map();

    filtrados.forEach((p) => {
      if (!mapa.has(p.id_profesor)) {
        mapa.set(p.id_profesor, { id_profesor: p.id_profesor, profesorNombre: p.profesorNombre, items: [] });
      }
      mapa.get(p.id_profesor).items.push(p);
    });

    return [...mapa.values()]
      .map((prof) => {
        const porAsignacion = new Map();
        prof.items.forEach((p) => {
          const clave = `${p.id_grupo}|${p.materia}`;
          if (!porAsignacion.has(clave)) {
            porAsignacion.set(clave, {
              clave,
              materia: p.materia,
              grupoNombre: p.grupoNombre,
              carreraNombre: p.carreraNombre,
              alumnos: [],
            });
          }
          porAsignacion.get(clave).alumnos.push({ nombre: p.alumnoNombre, correo: p.alumnoCorreo });
        });

        return {
          ...prof,
          totalAlumnos: prof.items.length,
          asignaciones: [...porAsignacion.values()].sort((a, b) => a.materia.localeCompare(b.materia, "es")),
        };
      })
      .sort((a, b) => b.totalAlumnos - a.totalAlumnos);
  }, [filtrados]);

  const resumen = useMemo(() => {
    const base = periodoFiltro ? pendientes.filter((p) => `${p.periodo} ${p.anio}` === periodoFiltro) : pendientes;
    const profesoresUnicos = new Set(base.map((p) => p.id_profesor)).size;
    const asignacionesUnicas = new Set(base.map((p) => `${p.id_grupo}|${p.materia}`)).size;
    return { profesores: profesoresUnicos, asignaciones: asignacionesUnicas, alumnos: base.length };
  }, [pendientes, periodoFiltro]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setTipoFiltro("");
  };

  const profesorDetalle = porProfesor.find((p) => p.id_profesor === profesorSeleccionado) || null;

  const filtrosTexto = [
    busqueda && `texto "${busqueda}"`,
    tipoFiltro && TIPOS.find((t) => t.valor === tipoFiltro)?.etiqueta,
    periodoFiltro,
  ]
    .filter(Boolean)
    .join(" · ");

  const confirmarExportar = async (tipo) => {
    const result = await Swal.fire({
      title: `¿Descargar ${tipo}?`,
      text: `Se generará el reporte en formato ${tipo}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: tipo === "Excel" ? "#16a34a" : "#7c3aed",
    });
    return result.isConfirmed;
  };

  const handleExportarExcelGeneral = async () => {
    if (porProfesor.length === 0) return Swal.fire("Sin datos", "No hay pendientes para exportar.", "warning");
    if (!(await confirmarExportar("Excel"))) return;
    await exportarExcelGeneral(porProfesor, resumen, filtrosTexto);
  };

  const handleExportarPDFGeneral = async () => {
    if (porProfesor.length === 0) return Swal.fire("Sin datos", "No hay pendientes para exportar.", "warning");
    if (!(await confirmarExportar("PDF"))) return;
    exportarPDFGeneral(porProfesor, resumen, filtrosTexto);
  };

  const handleExportarExcelProfesor = async () => {
    if (!profesorDetalle) return;
    if (!(await confirmarExportar("Excel"))) return;
    await exportarExcelProfesor(profesorDetalle);
  };

  const handleExportarPDFProfesor = async () => {
    if (!profesorDetalle) return;
    if (!(await confirmarExportar("PDF"))) return;
    exportarPDFProfesor(profesorDetalle);
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
            Profesores con alumnos sin calificación capturada. Haz clic en un profesor para ver el desglose por
            grupo, materia y alumno.
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

        {/* Exportar (todos los profesores) */}
        {!loading && !profesorDetalle && porProfesor.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleExportarExcelGeneral}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Exportar Excel (todos)
            </button>
            <button
              onClick={handleExportarPDFGeneral}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              Exportar PDF (todos)
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar profesor, alumno, materia o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>

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

          {(busqueda || tipoFiltro) && (
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
        ) : porProfesor.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            {pendientes.length === 0 ? (
              <span className="text-green-700 font-medium">
                Todo el sistema está al día — no hay ninguna calificación pendiente de capturar.
              </span>
            ) : (
              "Ningún resultado coincide con los filtros."
            )}
          </div>
        ) : profesorDetalle ? (
          <div>
            <button
              onClick={() => setProfesorSeleccionado(null)}
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Regresar a la lista de profesores</span>
            </button>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{profesorDetalle.profesorNombre}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {profesorDetalle.asignaciones.length} materia{profesorDetalle.asignaciones.length === 1 ? "" : "s"} con
                  huecos
                </p>
              </div>
              <span className="inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-full bg-red-100 text-red-700 font-bold">
                {profesorDetalle.totalAlumnos}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleExportarExcelProfesor}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Exportar Excel
              </button>
              <button
                onClick={handleExportarPDFProfesor}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                Exportar PDF
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {profesorDetalle.asignaciones.map((asig) => (
                <div key={asig.clave} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faBook} className="text-purple-500" />
                    <p className="font-semibold text-gray-800 text-lg">{asig.materia}</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {asig.grupoNombre} · {asig.carreraNombre}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {asig.alumnos.map((al) => (
                      <li
                        key={al.correo}
                        className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5"
                      >
                        <FontAwesomeIcon icon={faUserGraduate} className="text-gray-400 text-xs" />
                        <span>
                          {al.nombre}
                          <span className="text-gray-400"> — {al.correo}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {porProfesor.map((prof) => (
              <button
                key={prof.id_profesor}
                onClick={() => setProfesorSeleccionado(prof.id_profesor)}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-300 flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="bg-purple-100 rounded-full p-4 group-hover:bg-purple-200 transition">
                    <FontAwesomeIcon icon={faUserGraduate} className="text-3xl text-purple-700" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                    {prof.totalAlumnos}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-1">{prof.profesorNombre}</h4>
                <p className="text-gray-500 text-sm">
                  {prof.asignaciones.length} materia{prof.asignaciones.length === 1 ? "" : "s"} con huecos
                </p>
                <p className="text-red-600 text-sm font-semibold mt-1">
                  {prof.totalAlumnos} alumno{prof.totalAlumnos === 1 ? "" : "s"} sin calificación
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
