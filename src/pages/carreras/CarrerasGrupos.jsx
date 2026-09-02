    import React, { useEffect, useState } from "react";
    import { supabase } from "../../components/supabaseClient.js";
    import { useNavigate } from "react-router-dom";
    import Navbar from "../../components/Navbar";
    // Librería de iconos (asegúrate de tenerla instalada: npm install react-icons)
    import {
    FaGraduationCap,
    FaCalendarWeek,
    FaChurch,
    FaLaptopCode,
    FaRobot,
    FaHeartbeat,
    FaChartLine,
    FaTools,
    FaPalette,
    FaGlobe,
    FaUniversity,
    } from "react-icons/fa";

    // Landing de "Consultar Grupos" (ruta /carreras, el botón del Dashboard
    // con ese mismo nombre): agrupa el catálogo de `carrera` en 4 tarjetones
    // por modalidad (escolarizada/sabatina/dominical/virtual), deducida del
    // propio nombre de la carrera (todas siguen el patrón "Carrera -
    // Modalidad"). Al elegir una carrera navega a AlumnosPorCarrera.jsx.
    // El ícono junto a cada carrera es solo estético, elegido por
    // coincidencia de palabras clave en el nombre (obtenerIconoCarrera).
    export default function CarrerasGrupos() {
    const [carreras, setCarreras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerCarreras();
    }, []);

    const regresar = () => {
  navigate(-1);
};

    const obtenerCarreras = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
        .from("carrera")
        .select("*")
        .order("id_carrera");

        if (error) {
        console.error(error);
        setError("No se pudieron cargar las carreras. Intente de nuevo más tarde.");
        setLoading(false);
        return;
        }

        setCarreras(data);
        setLoading(false);
    };

    // Función para agrupar carreras por modalidad
    // Asumimos que cada carrera tiene un campo "modalidad" con valores:
    // "escolarizada", "sabatina", "dominical", "virtual"
    // Si tu campo se llama diferente (ej. "tipo"), ajústalo aquí.
    const agruparPorModalidad = () => {
    const grupos = {
        escolarizadas: [],
        sabatinas: [],
        dominicales: [],
        virtuales: [],
    };

    carreras.forEach((carrera) => {
        if (!carrera.nombre) return;

        // Extraer la modalidad después del guion
        // Ej: "Administración - Escolarizado"
        const partes = carrera.nombre.split("-");

        if (partes.length < 2) return;

        const modalidad = partes[1]
        .toLowerCase()
        .trim();

        switch (modalidad) {
        case "escolarizado":
            grupos.escolarizadas.push(carrera);
            break;

        case "sabatino":
            grupos.sabatinas.push(carrera);
            break;

        case "dominical":
            grupos.dominicales.push(carrera);
            break;

        case "virtual":
            grupos.virtuales.push(carrera);
            break;

        default:
            console.warn("Modalidad no reconocida:", modalidad);
            break;
        }
    });

    return grupos;
    };

    // Función para obtener un icono representativo según el nombre de la carrera
    const obtenerIconoCarrera = (nombre) => {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes("ingenier") || nombreLower.includes("sistemas") || nombreLower.includes("computación"))
        return <FaLaptopCode className="inline mr-2 text-blue-300" />;
        if (nombreLower.includes("medicina") || nombreLower.includes("enfermer") || nombreLower.includes("salud"))
        return <FaHeartbeat className="inline mr-2 text-red-300" />;
        if (nombreLower.includes("administrac") || nombreLower.includes("negocios") || nombreLower.includes("contaduría"))
        return <FaChartLine className="inline mr-2 text-green-300" />;
        if (nombreLower.includes("mecánica") || nombreLower.includes("electr") || nombreLower.includes("industrial"))
        return <FaTools className="inline mr-2 text-yellow-300" />;
        if (nombreLower.includes("diseño") || nombreLower.includes("arte") || nombreLower.includes("arquitectura"))
        return <FaPalette className="inline mr-2 text-pink-300" />;
        if (nombreLower.includes("derecho") || nombreLower.includes("leyes"))
        return <FaUniversity className="inline mr-2 text-indigo-300" />;
        if (nombreLower.includes("turismo") || nombreLower.includes("gastronomía"))
        return <FaGlobe className="inline mr-2 text-teal-300" />;
        // Icono genérico
        return <FaGraduationCap className="inline mr-2 text-white" />;
    };

    const irAlumnos = (id, nombre) => {
        navigate(`/alumnos/${id}`, {
        state: { nombreCarrera: nombre },
        });
    };

    // Renderizado condicional de carga y error
    if (loading) {
        return (
        <main className="min-h-screen bg-gray-50">
            <Navbar titulo="Carreras y Grupos" />
            <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        </main>
        );
    }

    if (error) {
        return (
        <main className="min-h-screen bg-gray-50">
            <Navbar titulo="Carreras y Grupos" />
            <div className="p-10 text-center text-red-600">
            <p>{error}</p>
            <button
                onClick={obtenerCarreras}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
                Reintentar
            </button>
            </div>
        </main>
        );
    }

    const grupos = agruparPorModalidad();

    // Definición de secciones con título, ícono representativo y listado
    const secciones = [
        {
        titulo: "Escolarizadas",
        key: "escolarizadas",
        icono: <FaGraduationCap className="inline mr-2 text-2xl" />,
        colorFondo: "bg-blue-50",
        colorBorde: "border-blue-200",
        colorHeader: "text-blue-800",
        },
        {
        titulo: "Sabatinas",
        key: "sabatinas",
        icono: <FaCalendarWeek className="inline mr-2 text-2xl" />,
        colorFondo: "bg-green-50",
        colorBorde: "border-green-200",
        colorHeader: "text-green-800",
        },
        {
        titulo: "Dominicales",
        key: "dominicales",
        icono: <FaChurch className="inline mr-2 text-2xl" />,
        colorFondo: "bg-yellow-50",
        colorBorde: "border-yellow-200",
        colorHeader: "text-yellow-800",
        },
        {
        titulo: "Virtuales",
        key: "virtuales",
        icono: <FaLaptopCode className="inline mr-2 text-2xl" />,
        colorFondo: "bg-purple-50",
        colorBorde: "border-purple-200",
        colorHeader: "text-purple-800",
        },
    ];

    return (
        <main className="min-h-screen bg-gray-50">
        <Navbar titulo="Carreras y Grupos" />

        <div className="p-6 md:p-10">

  {/* Botón regresar */}
  <div className="mb-4">
    <button
      onClick={regresar}
      className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
    >
      ← Regresar
    </button>
  </div>

  <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
    📚 Selecciona una carrera por modalidad
  </h1>

            <div className="space-y-12">
            {secciones.map((seccion) => {
                const carrerasSeccion = grupos[seccion.key];
                if (carrerasSeccion.length === 0) return null;

                return (
                <div
                    key={seccion.key}
                    className={`rounded-2xl shadow-sm border ${seccion.colorBorde} ${seccion.colorFondo} overflow-hidden`}
                >
                    <div className={`px-6 py-4 border-b ${seccion.colorBorde} bg-white bg-opacity-60`}>
                    <h2 className={`text-2xl font-semibold ${seccion.colorHeader} flex items-center`}>
                        {seccion.icono}
                        {seccion.titulo}
                        <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {carrerasSeccion.length}
                        </span>
                    </h2>
                    </div>
                    <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {carrerasSeccion.map((carrera) => (
                        <button
                            key={carrera.id_carrera}
                            onClick={() => irAlumnos(carrera.id_carrera, carrera.nombre)}
                            className="group bg-white hover:shadow-lg transition-all duration-200 rounded-xl p-5 text-left border border-gray-200 hover:border-purple-300 flex items-center justify-between"
                        >
                            <div className="flex items-center">
                            {obtenerIconoCarrera(carrera.nombre)}
                            <span className="font-medium text-gray-800 group-hover:text-purple-700 transition">
                                {carrera.nombre}
                            </span>
                            </div>
                            <span className="text-gray-400 group-hover:text-purple-500 transition-transform group-hover:translate-x-1">
                            →
                            </span>
                        </button>
                        ))}
                    </div>
                    </div>
                </div>
                );
            })}

            {/* Mensaje si no hay carreras en ninguna sección */}
            {Object.values(grupos).every((arr) => arr.length === 0) && (
                <div className="text-center text-gray-500 py-12">
                No hay carreras disponibles en este momento.
                </div>
            )}
            </div>
        </div>
        </main>
    );
    }   