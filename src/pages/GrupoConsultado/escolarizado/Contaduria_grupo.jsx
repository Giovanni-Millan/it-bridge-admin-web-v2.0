import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

export default function Contaduria_grupo() {
  const [alumno, setAlumno] = useState([]);

  // 🔹 Endpoint para consultar alumnos de Contaduría
  useEffect(() => {
    axios.get('http://localhost:4000/ConsultarAlumnosContaduria')
      .then(res => setAlumno(res.data))
      .catch(err => console.log(err));
  }, []);

  // 🔸 Exportar a PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(85, 26, 139);
    doc.text("Lista de Alumnos - Carrera de Contaduría", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [[
        "Nombre",
        "Apellido Paterno",
        "Apellido Materno",
        "Fecha Nac.",
        "Correo",
        "Teléfono",
        "Cuatrimestre"
      ]],
      body: alumno.map(a => [
        a.nombre,
        a.apellido_paterno,
        a.apellido_materno,
        a.fecha_nacimiento,
        a.correo,
        a.telefono,
        a.cuatrimestre
      ]),
      styles: {
        fontSize: 8,
        textColor: [40, 40, 40],
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [128, 90, 213],
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [243, 232, 255]
      }
    });

    doc.save("alumnos_contaduria.pdf");

    Swal.fire({
      icon: 'success',
      title: '¡PDF guardado!',
      html: `Revisa tu carpeta de <b>Descargas</b>`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // 🔸 Exportar a Excel
  const exportExcel = () => {
    const worksheetData = alumno.map((a) => ({
      Nombre: a.nombre,
      "Apellido Paterno": a.apellido_paterno,
      "Apellido Materno": a.apellido_materno,
      "Fecha Nacimiento": a.fecha_nacimiento,
      Correo: a.correo,
      Teléfono: a.telefono,
      Cuatrimestre: a.cuatrimestre
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnos Contaduría");

    XLSX.writeFile(workbook, "alumnos_contaduria.xlsx");

    Swal.fire({
      icon: 'success',
      title: '¡Excel guardado!',
      html: `Revisa tu carpeta de <b>Descargas</b>`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* 🔹 Encabezado principal */}
      <Navbar titulo="Carrera de Contaduría - Alumnos" />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          {/* Botón de regreso */}
          <div className="mt-8 ml-10">
            <Link
              to={'/ConsultarGrupos'}
              className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-purple-300 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Regresar</span>
            </Link>
          </div>

          {/* Botones de exportación */}
          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition transform hover:scale-105"
              aria-label="Exportar PDF"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              Exportar PDF
            </button>

            <button
              onClick={exportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition transform hover:scale-105"
              aria-label="Exportar Excel"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Tabla de alumnos */}
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="bg-purple-700 text-white text-sm select-none">
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Apellido Paterno</th>
                <th className="text-left py-3 px-4">Apellido Materno</th>
                <th className="text-left py-3 px-4">Fecha Nac.</th>
                <th className="text-left py-3 px-4">Correo</th>
                <th className="text-left py-3 px-4">Teléfono</th>
                <th className="text-left py-3 px-4">Cuatrimestre</th>
              </tr>
            </thead>
            <tbody>
              {alumno.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 italic">
                    No hay alumnos registrados.
                  </td>
                </tr>
              ) : (
                alumno.map((data, i) => (
                  <tr
                    key={i}
                    className="border-t text-sm hover:bg-purple-50 transition-colors duration-200"
                  >
                    <td className="py-3 px-4">{data.nombre}</td>
                    <td className="py-3 px-4">{data.apellido_paterno}</td>
                    <td className="py-3 px-4">{data.apellido_materno}</td>
                    <td className="p-3 text-xs">
                      {new Date(data.fecha_nacimiento).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-3 px-4">{data.correo}</td>
                    <td className="py-3 px-4">{data.telefono}</td>
                    <td className="py-3 px-4">{data.cuatrimestre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
