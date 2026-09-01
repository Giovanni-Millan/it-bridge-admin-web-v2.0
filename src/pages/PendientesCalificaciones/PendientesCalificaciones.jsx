import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// ExcelJS solo se carga bajo demanda (import dinámico) al exportar a Excel:
// es la única librería del proyecto que puede tanto darle estilo formal a
// las celdas COMO incrustar la imagen de la gráfica (xlsx/xlsx-js-style no
// soportan imágenes en absoluto, es limitación real de esas librerías) —
// pero pesa bastante, así que cargarla de entrada inflaría el bundle de
// TODA la app aunque nadie exporte nunca.

const TIPOS = [
  { valor: "universidad", etiqueta: "Universidad" },
  { valor: "bachillerato", etiqueta: "Bachillerato" },
  { valor: "autoplaneado", etiqueta: "Autoplaneado" },
];

/* =====================================================================
   EXPORTACIÓN A EXCEL Y PDF (con la gráfica incrustada)
   ===================================================================== */

const COLOR_BANNER = "5B21B6"; // purple-800
const COLOR_HEADER = "7C3AED"; // purple-600
const COLOR_SUBBANDA = "EDE9FE"; // purple-100
const COLOR_FILA_PAR = "F5F3FF"; // purple-50
const COLOR_TEXTO = "374151";
const COLOR_TENUE = "6B7280";

const argb = (hex6) => "FF" + hex6;
const FILL = (hex6) => ({ type: "pattern", pattern: "solid", fgColor: { argb: argb(hex6) } });
const BORDE_FINO = {
  top: { style: "thin", color: { argb: argb("E5E7EB") } },
  bottom: { style: "thin", color: { argb: argb("E5E7EB") } },
  left: { style: "thin", color: { argb: argb("E5E7EB") } },
  right: { style: "thin", color: { argb: argb("E5E7EB") } },
};

// Convierte el <svg> de la gráfica ya renderizada en pantalla a un PNG en
// memoria (data URL). No usa html2canvas: al ser SVG puro (Recharts), pasar
// por <img>+<canvas> directo es más simple y fiel que capturar DOM+CSS.
// Devuelve null si el contenedor no tiene ninguna gráfica montada (p. ej.
// un profesor sin asignaciones) — los exports deben seguir funcionando sin
// imagen en ese caso, no truena nada.
async function capturarGraficaComoPNG(contenedorRef, escala = 2) {
  const svg = contenedorRef.current?.querySelector("svg");
  if (!svg) return null;

  const { width, height } = svg.getBoundingClientRect();
  if (!width || !height) return null;

  const clon = svg.cloneNode(true);
  clon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clon.setAttribute("width", width);
  clon.setAttribute("height", height);

  // Fondo blanco de por medio: el SVG de Recharts es transparente, y sin
  // esto las barras quedan "flotando" tanto en Excel como en el PDF.
  const fondo = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  fondo.setAttribute("width", "100%");
  fondo.setAttribute("height", "100%");
  fondo.setAttribute("fill", "#ffffff");
  clon.insertBefore(fondo, clon.firstChild);

  const svgString = new XMLSerializer().serializeToString(clon);
  const url = URL.createObjectURL(new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * escala;
    canvas.height = height * escala;
    const ctx = canvas.getContext("2d");
    ctx.scale(escala, escala);
    ctx.drawImage(img, 0, 0, width, height);

    return { dataUrl: canvas.toDataURL("image/png"), width: Math.round(width), height: Math.round(height) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function descargarWorkbookExcelJS(wb, nombreArchivo) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function bannerExcel(ws, numCols, titulo, subtitulo, meta) {
  ws.mergeCells(1, 1, 1, numCols);
  const cTitulo = ws.getCell(1, 1);
  cTitulo.value = titulo;
  cTitulo.fill = FILL(COLOR_BANNER);
  cTitulo.font = { bold: true, size: 16, color: { argb: argb("FFFFFF") } };
  cTitulo.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, numCols);
  const cSub = ws.getCell(2, 1);
  cSub.value = subtitulo;
  cSub.fill = FILL(COLOR_HEADER);
  cSub.font = { bold: true, size: 12, color: { argb: argb("FFFFFF") } };
  cSub.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 20;

  ws.mergeCells(3, 1, 3, numCols);
  const cMeta = ws.getCell(3, 1);
  cMeta.value = meta;
  cMeta.fill = FILL(COLOR_HEADER);
  cMeta.font = { italic: true, size: 9, color: { argb: argb("FFFFFF") } };
  cMeta.alignment = { horizontal: "center", vertical: "middle" };
}

// Inserta la imagen de la gráfica (si se pudo capturar) y devuelve la
// siguiente fila libre — se reservan filas en blanco del alto aproximado
// de la imagen para que la tabla de abajo no le quede encima.
function insertarGraficaExcel(wb, ws, grafica, filaInicio) {
  if (!grafica) return filaInicio + 1;
  const imageId = wb.addImage({ base64: grafica.dataUrl, extension: "png" });
  ws.addImage(imageId, {
    tl: { col: 0, row: filaInicio - 1 },
    ext: { width: grafica.width, height: grafica.height },
  });
  const filasReservadas = Math.max(6, Math.ceil(grafica.height / 20) + 1);
  return filaInicio + filasReservadas + 1;
}

async function exportarExcelGeneral(porProfesor, resumen, filtrosTexto, grafica) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pendientes");
  ws.columns = [{ width: 30 }, { width: 28 }, { width: 32 }, { width: 24 }, { width: 32 }, { width: 36 }];

  bannerExcel(
    ws,
    6,
    "Instituto Tecnológico Bridge",
    "Pendientes de Calificaciones — Reporte General",
    `Generado: ${new Date().toLocaleString("es-MX")}${filtrosTexto ? " · Filtros: " + filtrosTexto : ""}`
  );

  ws.mergeCells(4, 1, 4, 6);
  const cResumen = ws.getCell(4, 1);
  cResumen.value = `Profesores con pendientes: ${resumen.profesores}    ·    Asignaciones con huecos: ${resumen.asignaciones}    ·    Alumnos sin calificación: ${resumen.alumnos}`;
  cResumen.fill = FILL(COLOR_SUBBANDA);
  cResumen.font = { bold: true, size: 10, color: { argb: argb(COLOR_BANNER) } };
  cResumen.alignment = { horizontal: "center", vertical: "middle" };

  const filaEncabezado = insertarGraficaExcel(wb, ws, grafica, 6);
  ["Profesor", "Materia", "Grupo", "Carrera", "Alumno", "Correo"].forEach((texto, i) => {
    const c = ws.getCell(filaEncabezado, i + 1);
    c.value = texto;
    c.fill = FILL(COLOR_HEADER);
    c.font = { bold: true, size: 10, color: { argb: argb("FFFFFF") } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = BORDE_FINO;
  });

  let f = filaEncabezado + 1;
  let i = 0;
  porProfesor.forEach((prof) => {
    prof.asignaciones.forEach((asig) => {
      asig.alumnos.forEach((al) => {
        const par = i % 2 === 0;
        [prof.profesorNombre, asig.materia, asig.grupoNombre, asig.carreraNombre, al.nombre, al.correo].forEach(
          (valor, c) => {
            const celda = ws.getCell(f, c + 1);
            celda.value = valor;
            celda.fill = FILL(par ? COLOR_FILA_PAR : "FFFFFF");
            celda.font = { size: 10, color: { argb: argb(c === 5 ? COLOR_TENUE : COLOR_TEXTO) } };
            celda.border = BORDE_FINO;
            celda.alignment = { vertical: "middle" };
          }
        );
        f++;
        i++;
      });
    });
  });

  if (f > filaEncabezado + 1) ws.autoFilter = `A${filaEncabezado}:F${f - 1}`;

  await descargarWorkbookExcelJS(wb, `pendientes_calificaciones_general_${Date.now()}.xlsx`);
}

async function exportarExcelProfesor(prof, grafica) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pendientes");
  ws.columns = [{ width: 34 }, { width: 38 }];

  bannerExcel(
    ws,
    2,
    "Instituto Tecnológico Bridge",
    `Pendientes de Calificaciones — ${prof.profesorNombre}`,
    `Generado: ${new Date().toLocaleString("es-MX")} · ${prof.asignaciones.length} materia${
      prof.asignaciones.length === 1 ? "" : "s"
    } con huecos · ${prof.totalAlumnos} alumno${prof.totalAlumnos === 1 ? "" : "s"} sin calificación`
  );

  let f = insertarGraficaExcel(wb, ws, grafica, 4);

  prof.asignaciones.forEach((asig) => {
    ws.mergeCells(f, 1, f, 2);
    const cMateria = ws.getCell(f, 1);
    cMateria.value = `▸ ${asig.materia}`;
    cMateria.fill = FILL(COLOR_SUBBANDA);
    cMateria.font = { bold: true, size: 11, color: { argb: argb(COLOR_BANNER) } };
    f++;

    ws.mergeCells(f, 1, f, 2);
    const cMeta = ws.getCell(f, 1);
    cMeta.value = `${asig.grupoNombre} · ${asig.carreraNombre}`;
    cMeta.font = { italic: true, size: 9, color: { argb: argb(COLOR_TENUE) } };
    f++;

    ["Alumno", "Correo"].forEach((texto, c) => {
      const celda = ws.getCell(f, c + 1);
      celda.value = texto;
      celda.fill = FILL(COLOR_HEADER);
      celda.font = { bold: true, size: 10, color: { argb: argb("FFFFFF") } };
      celda.border = BORDE_FINO;
    });
    f++;

    asig.alumnos.forEach((al, idx) => {
      const par = idx % 2 === 0;
      [al.nombre, al.correo].forEach((valor, c) => {
        const celda = ws.getCell(f, c + 1);
        celda.value = valor;
        celda.fill = FILL(par ? COLOR_FILA_PAR : "FFFFFF");
        celda.font = { size: 10, color: { argb: argb(c === 1 ? COLOR_TENUE : COLOR_TEXTO) } };
        celda.border = BORDE_FINO;
      });
      f++;
    });

    f++; // espaciador entre materias
  });

  const nombreArchivo = `pendientes_${prof.profesorNombre.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
  await descargarWorkbookExcelJS(wb, nombreArchivo);
}

// Convierte el tamaño capturado (px, a 96dpi) a mm para jsPDF, y lo achica
// si no cabe en el ancho útil de la página, conservando proporción.
function medidasImagenPDF(doc, grafica, margenMM = 14) {
  const pxToMm = 25.4 / 96;
  const anchoMax = doc.internal.pageSize.getWidth() - margenMM * 2;
  let w = grafica.width * pxToMm;
  let h = grafica.height * pxToMm;
  if (w > anchoMax) {
    const factor = anchoMax / w;
    w *= factor;
    h *= factor;
  }
  return { w, h };
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

function exportarPDFGeneral(porProfesor, resumen, filtrosTexto, grafica) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  encabezadoPDF(
    doc,
    "Pendientes de Calificaciones — Reporte General",
    `Generado: ${new Date().toLocaleString("es-MX")}${filtrosTexto ? " · Filtros: " + filtrosTexto : ""}  ·  ${
      resumen.profesores
    } profesores  ·  ${resumen.asignaciones} asignaciones con huecos  ·  ${resumen.alumnos} alumnos pendientes`
  );

  let startY = 44;
  if (grafica) {
    const { w, h } = medidasImagenPDF(doc, grafica);
    doc.addImage(grafica.dataUrl, "PNG", 14, startY, w, h);
    startY += h + 8;
  }

  const filas = [];
  porProfesor.forEach((prof) => {
    prof.asignaciones.forEach((asig) => {
      asig.alumnos.forEach((al) => {
        filas.push([prof.profesorNombre, asig.materia, asig.grupoNombre, asig.carreraNombre, al.nombre, al.correo]);
      });
    });
  });

  autoTable(doc, {
    startY,
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

function exportarPDFProfesor(prof, grafica) {
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

  if (grafica) {
    const { w, h } = medidasImagenPDF(doc, grafica);
    doc.addImage(grafica.dataUrl, "PNG", 14, y, w, h);
    y += h + 10;
  }

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

/* =====================================================================
   GRÁFICA
   ===================================================================== */

function acortarNombre(texto, maxLen = 24) {
  if (!texto) return "";
  return texto.length > maxLen ? texto.slice(0, maxLen - 1) + "…" : texto;
}

// Tooltip propio: el de Recharts por defecto no separa bien la etiqueta
// completa (puede venir truncada) del valor.
function TooltipGrafica({ active, payload }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="bg-white border border-purple-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800">{punto.etiquetaCompleta}</p>
      <p className="text-purple-700">
        {punto.valor} alumno{punto.valor === 1 ? "" : "s"} sin calificación
      </p>
    </div>
  );
}

function GraficaBarras({ datos }) {
  const alto = Math.max(180, datos.length * 34);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} layout="vertical" margin={{ top: 5, right: 24, left: 4, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
        <YAxis
          type="category"
          dataKey="etiqueta"
          width={150}
          interval={0}
          tick={{ fontSize: 12, fill: "#374151" }}
        />
        <Tooltip content={<TooltipGrafica />} cursor={{ fill: "#F5F3FF" }} />
        <Bar dataKey="valor" fill="#7C3AED" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
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

  const graficaProfesoresRef = useRef(null);
  const graficaMateriaRef = useRef(null);

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

  // Top 15 para que la gráfica general siga siendo legible aunque haya
  // muchos profesores con pendientes — la tabla de abajo (y los exports)
  // sí traen a todos, esto es solo el vistazo visual.
  const MAX_BARRAS_PROFESORES = 15;
  const datosGraficaProfesores = useMemo(
    () =>
      porProfesor.slice(0, MAX_BARRAS_PROFESORES).map((p) => ({
        etiqueta: acortarNombre(p.profesorNombre),
        etiquetaCompleta: p.profesorNombre,
        valor: p.totalAlumnos,
      })),
    [porProfesor]
  );

  const datosGraficaMateria = useMemo(
    () =>
      (profesorDetalle?.asignaciones || []).map((a) => ({
        etiqueta: acortarNombre(a.materia, 28),
        etiquetaCompleta: `${a.materia} — ${a.grupoNombre}`,
        valor: a.alumnos.length,
      })),
    [profesorDetalle]
  );

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
    const grafica = await capturarGraficaComoPNG(graficaProfesoresRef);
    await exportarExcelGeneral(porProfesor, resumen, filtrosTexto, grafica);
  };

  const handleExportarPDFGeneral = async () => {
    if (porProfesor.length === 0) return Swal.fire("Sin datos", "No hay pendientes para exportar.", "warning");
    if (!(await confirmarExportar("PDF"))) return;
    const grafica = await capturarGraficaComoPNG(graficaProfesoresRef);
    exportarPDFGeneral(porProfesor, resumen, filtrosTexto, grafica);
  };

  const handleExportarExcelProfesor = async () => {
    if (!profesorDetalle) return;
    if (!(await confirmarExportar("Excel"))) return;
    const grafica = await capturarGraficaComoPNG(graficaMateriaRef);
    await exportarExcelProfesor(profesorDetalle, grafica);
  };

  const handleExportarPDFProfesor = async () => {
    if (!profesorDetalle) return;
    if (!(await confirmarExportar("PDF"))) return;
    const grafica = await capturarGraficaComoPNG(graficaMateriaRef);
    exportarPDFProfesor(profesorDetalle, grafica);
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

        {/* Gráfica (todos los profesores) */}
        {!loading && !profesorDetalle && porProfesor.length > 0 && (
          <div ref={graficaProfesoresRef} className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">
              Alumnos pendientes por profesor
              {porProfesor.length > MAX_BARRAS_PROFESORES && ` (top ${MAX_BARRAS_PROFESORES} de ${porProfesor.length})`}
            </h3>
            <GraficaBarras datos={datosGraficaProfesores} />
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

            <div ref={graficaMateriaRef} className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Alumnos pendientes por materia</h3>
              <GraficaBarras datos={datosGraficaMateria} />
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
