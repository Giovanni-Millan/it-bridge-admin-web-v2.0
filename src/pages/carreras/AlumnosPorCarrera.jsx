import React, { useEffect, useState } from "react";
import { supabase } from "../../components/supabaseClient.js";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

// Listado de alumnos de UNA carrera específica (id_carrera en la URL, ya
// filtra por `alumnos.id_carrera` directo — no por grupo). Búsqueda +
// filtro por cuatrimestre, y export a PDF/Excel con el diseño más formal
// del proyecto (encabezado con marca, filtros aplicados, tabla con
// theme "striped", pie de página con numeración — este archivo fue la
// referencia que se copió para el export de otras pantallas, como
// PendientesCalificaciones.jsx).
export default function AlumnosPorCarrera() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nombreCarrera = location.state?.nombreCarrera || "Carrera";

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cuatrimestreFilter, setCuatrimestreFilter] = useState("");

  useEffect(() => {
    obtenerAlumnos();
  }, [id]);

  const regresar = () => {
  navigate(-1);
};

  const obtenerAlumnos = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("alumnos")
      .select("*")
      .eq("id_carrera", id)
      .order("apellido_paterno")
      .order("apellido_materno")
      .order("nombre");

    if (error) {
      console.error(error);
      setError("No se pudieron cargar los alumnos. Intente de nuevo más tarde.");
      setLoading(false);
      return;
    }

    setAlumnos(data);
    setLoading(false);
  };

  // Filtrar alumnos por búsqueda y cuatrimestre
  const filteredAlumnos = alumnos.filter((alumno) => {
    const nombreCompleto = `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}`.toLowerCase();
    const curp = (alumno.curp || "").toLowerCase();
    const telefono = (alumno.telefono || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      nombreCompleto.includes(search) ||
      curp.includes(search) ||
      telefono.includes(search);

    const matchesCuatrimestre =
      !cuatrimestreFilter || alumno.cuatrimestre === parseInt(cuatrimestreFilter);

    return matchesSearch && matchesCuatrimestre;
  });

  // Obtener cuatrimestres únicos para el filtro
  const cuatrimestresUnicos = [...new Set(alumnos.map(a => a.cuatrimestre).filter(Boolean))].sort((a,b) => a-b);

  // Función para exportar a Excel
  const exportarAExcel = () => {
    if (filteredAlumnos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin datos",
        text: "No hay alumnos para exportar",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    try {
      const datosParaExcel = filteredAlumnos.map((alumno) => ({
        "Nombre": `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}`,
        "CURP": alumno.curp || "",
        "Cuatrimestre": alumno.cuatrimestre || "",
        "Teléfono": alumno.telefono || "",
        "Correo": alumno.correo || "",
      }));

      const ws = XLSX.utils.json_to_sheet(datosParaExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
      
      // Ajustar anchos de columnas
      const colWidths = [
        { wch: 40 }, // Nombre
        { wch: 20 }, // CURP
        { wch: 15 }, // Cuatrimestre
        { wch: 15 }, // Teléfono
        { wch: 30 }, // Correo
      ];
      ws['!cols'] = colWidths;

      const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      XLSX.writeFile(wb, `${nombreCarrera.replace(/ /g, "_")}_Alumnos_${fecha}.xlsx`);
      
      // Alerta de éxito
      Swal.fire({
        icon: "success",
        title: "¡Exportado!",
        text: `El archivo Excel se ha generado correctamente con ${filteredAlumnos.length} alumnos`,
        confirmButtonColor: "#7c3aed",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al generar el archivo Excel",
        confirmButtonColor: "#7c3aed",
      });
    }
  };

  // Función para exportar a PDF (corregida)
  const exportarAPDF = () => {
  if (filteredAlumnos.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sin datos",
      text: "No hay alumnos para exportar",
      confirmButtonColor: "#7c3aed",
    });
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Colores corporativos
    const primaryColor = [128, 90, 213]; // #7c3aed
    const secondaryColor = [100, 100, 100];

    // --- ENCABEZADO ---
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Bridge Admin", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`${nombreCarrera} - Listado de Alumnos`, 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const fecha = new Date().toLocaleString();
    doc.text(`Generado: ${fecha}`, 14, 42);

    // --- FILTROS APLICADOS (si hay) ---
    let yOffset = 48;
    let filtrosTexto = [];
    if (searchTerm) filtrosTexto.push(`Búsqueda: "${searchTerm}"`);
    if (cuatrimestreFilter) filtrosTexto.push(`Cuatrimestre: ${cuatrimestreFilter}°`);
    if (filtrosTexto.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Filtros aplicados: ${filtrosTexto.join(" | ")}`, 14, yOffset);
      yOffset += 6;
    } else {
      yOffset = 46;
    }

    // --- TOTAL DE ALUMNOS ---
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de alumnos: ${filteredAlumnos.length}`, 14, yOffset + 4);

    // --- TABLA ---
    const tableColumnas = ["N°", "Nombre Completo", "CURP", "Cuatrimestre", "Teléfono"];
    const tableDatos = filteredAlumnos.map((alumno, index) => [
      index + 1,
      `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}`,
      alumno.curp || "",
      alumno.cuatrimestre ? `${alumno.cuatrimestre}°` : "",
      alumno.telefono || "",
    ]);

    autoTable(doc, {
      startY: yOffset + 8,
      head: [tableColumnas],
      body: tableDatos,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" }, // N°
        1: { cellWidth: 70 }, // Nombre
        2: { cellWidth: 45 }, // CURP
        3: { cellWidth: 25, halign: "center" }, // Cuatrimestre
        4: { cellWidth: 35 }, // Teléfono
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
    });

    // --- PIE DE PÁGINA (número de página) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - Generado por Bridge Admin`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Guardar PDF con nombre dinámico
    const fechaArchivo = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    doc.save(`${nombreCarrera.replace(/ /g, "_")}_Alumnos_${fechaArchivo}.pdf`);

    Swal.fire({
      icon: "success",
      title: "¡PDF Generado!",
      text: `El archivo PDF se ha generado correctamente con ${filteredAlumnos.length} alumnos`,
      confirmButtonColor: "#7c3aed",
      timer: 3000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al generar el PDF. Por favor, recargue la página.",
      confirmButtonColor: "#7c3aed",
    });
  }
};

  // Función para imprimir
  const imprimirListado = () => {
    if (filteredAlumnos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin datos",
        text: "No hay alumnos para imprimir",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    try {
      const ventanaImpresion = window.open("", "_blank");
      
      const tablaHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${nombreCarrera} - Listado de Alumnos</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 0;
              }
              h1 {
                color: #4a1d6d;
                text-align: center;
                margin-bottom: 10px;
              }
              .info {
                text-align: center;
                margin-bottom: 20px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #7c3aed;
                color: white;
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
              }
              td {
                padding: 8px;
                text-align: left;
                border: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <h1>${nombreCarrera}</h1>
            <div class="info">
              <p>Fecha: ${new Date().toLocaleString()}</p>
              <p>Total de alumnos: ${filteredAlumnos.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre Completo</th>
                  <th>CURP</th>
                  <th>Cuatrimestre</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAlumnos.map((alumno, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}</td>
                    <td>${alumno.curp || ""}</td>
                    <td>${alumno.cuatrimestre || ""}</td>
                    <td>${alumno.telefono || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>Documento generado desde el Sistema Bridge Admin</p>
            </div>
          </body>
        </html>
      `;
      
      ventanaImpresion.document.write(tablaHTML);
      ventanaImpresion.document.close();
      
      // Mostrar alerta antes de imprimir
      Swal.fire({
        icon: "info",
        title: "Preparando impresión",
        text: "Se abrirá una nueva ventana con el listado para imprimir",
        confirmButtonColor: "#7c3aed",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        ventanaImpresion.print();
      });
    } catch (error) {
      console.error("Error al imprimir:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al preparar la impresión",
        confirmButtonColor: "#7c3aed",
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar titulo="Listado de Alumnos" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar titulo="Listado de Alumnos" />
        <div className="p-10 text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={obtenerAlumnos}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar titulo="Listado de Alumnos" />

      <div className="p-4 md:p-10">
        {/* Barra de navegación y botones de exportación */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <button
  onClick={regresar}
  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded inline-block transition flex items-center gap-2"
>
  ← Regresar
</button>

          <div className="flex gap-3">
            <button
              onClick={imprimirListado}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center gap-2"
              disabled={filteredAlumnos.length === 0}
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={exportarAExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition flex items-center gap-2"
              disabled={filteredAlumnos.length === 0}
            >
              📊 Exportar Excel
            </button>
            <button
              onClick={exportarAPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center gap-2"
              disabled={filteredAlumnos.length === 0}
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <span>📚</span> {nombreCarrera}
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-3">
            {filteredAlumnos.length} {filteredAlumnos.length === 1 ? "alumno" : "alumnos"}
          </span>
        </h1>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔍 Buscar por nombre, CURP o teléfono
              </label>
              <input
                type="text"
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📊 Filtrar por cuatrimestre
              </label>
              <select
                value={cuatrimestreFilter}
                onChange={(e) => setCuatrimestreFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos los cuatrimestres</option>
                {cuatrimestresUnicos.map((cuatri) => (
                  <option key={cuatri} value={cuatri}>
                    {cuatri}° Cuatrimestre
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Botón para limpiar filtros */}
          {(searchTerm || cuatrimestreFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCuatrimestreFilter("");
              }}
              className="mt-3 text-sm text-purple-600 hover:text-purple-800"
            >
              ✖ Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla de alumnos */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Nombre Completo</th>
                  <th className="p-3 text-left">CURP</th>
                  <th className="p-3 text-left">Cuatrimestre</th>
                  <th className="p-3 text-left">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      {alumnos.length === 0 
                        ? "No hay alumnos registrados en esta carrera" 
                        : "No se encontraron alumnos con los filtros aplicados"}
                    </td>
                  </tr>
                ) : (
                  filteredAlumnos.map((alumno, index) => (
                    <tr key={alumno.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 text-gray-500">{index + 1}</td>
                      <td className="p-3 font-medium">
                        {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                      </td>
                      <td className="p-3 font-mono text-sm">{alumno.curp || "—"}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {alumno.cuatrimestre || "—"}°
                        </span>
                      </td>
                      <td className="p-3">{alumno.telefono || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen al final */}
        {filteredAlumnos.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-right">
            Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos
          </div>
        )}
      </div>
    </main>
  );
}