import React from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLaptopCode,
  faGavel,
  faChalkboardTeacher,
  faBrain,
  faMoneyBillTrendUp,
  faDumbbell,
  faFingerprint,
  faPeopleRoof,
  faIndustry,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function ConsultarGrupos() {
  const navigate = useNavigate();

  const modalidades = [
    {
      nombre: "Escolarizadas",
      color: "bg-purple-600",
      carreras: [
        { nombre: "Ingeniería en Sistemas", ruta: "/GruposSistemas", icono: faLaptopCode },
        { nombre: "Derecho", ruta: "/GruposDerecho", icono: faGavel },
        { nombre: "Pedagogía", ruta: "/GruposPedagogia", icono: faChalkboardTeacher },
        { nombre: "Psicología", ruta: "/GruposPsicologia", icono: faBrain },
        { nombre: "Administración", ruta: "/GruposAdministracion", icono: faMoneyBillTrendUp },
        { nombre: "Ciencias del Deporte", ruta: "/GruposDeporte", icono: faDumbbell },
        { nombre: "Contaduría", ruta: "/GruposContaduria", icono: faMoneyBillTrendUp },
        { nombre: "Criminología", ruta: "/GruposCriminologia", icono: faFingerprint },
        { nombre: "Trabajo Social", ruta: "/GruposTrabajoSocial", icono: faPeopleRoof },
        { nombre: "Ingeniería Industrial", ruta: "/GruposIndustrial", icono: faIndustry },
      ],
    },
    {
      nombre: "Sabatinas",
      color: "bg-green-600",
      carreras: [
        { nombre: "Ingeniería en Sistemas", ruta: "/GruposSistemasSabatino", icono: faLaptopCode },
        { nombre: "Derecho", ruta: "/GruposDerechoSabatino", icono: faGavel },
        { nombre: "Pedagogía", ruta: "/GruposPedagogiaSabatino", icono: faChalkboardTeacher },
        { nombre: "Psicología", ruta: "/GruposPsicologiaSabatino", icono: faBrain },
        { nombre: "Administración", ruta: "/GruposAdministracionSabatino", icono: faMoneyBillTrendUp },
        { nombre: "Ciencias del Deporte", ruta: "/GruposDeporteSabatino", icono: faDumbbell },
        { nombre: "Contaduría", ruta: "/GruposContaduriaSabatino", icono: faMoneyBillTrendUp },
        { nombre: "Criminología", ruta: "/GruposCriminologiaSabatino", icono: faFingerprint },
        { nombre: "Trabajo Social", ruta: "/GruposTrabajoSocialSabatino", icono: faPeopleRoof },
        { nombre: "Ingeniería Industrial", ruta: "/GruposIndustrialSabatino", icono: faIndustry },
      ],
    },
    {
      nombre: "Dominicales",
      color: "bg-blue-600",
      carreras: [
        { nombre: "Ingeniería en Sistemas", ruta: "/GruposSistemasDominical", icono: faLaptopCode },
        { nombre: "Derecho", ruta: "/GruposDerechoDominical", icono: faGavel },
        { nombre: "Pedagogía", ruta: "/GruposPedagogiaDominical", icono: faChalkboardTeacher },
        { nombre: "Psicología", ruta: "/GruposPsicologiaDominical", icono: faBrain },
        { nombre: "Administración", ruta: "/GruposAdministracionDominical", icono: faMoneyBillTrendUp },
        { nombre: "Ciencias del Deporte", ruta: "/GruposDeporteDominical", icono: faDumbbell },
        { nombre: "Contaduría", ruta: "/GruposContaduriaDominical", icono: faMoneyBillTrendUp },
        { nombre: "Criminología", ruta: "/GruposCriminologiaDominical", icono: faFingerprint },
        { nombre: "Trabajo Social", ruta: "/GruposTrabajoSocialDominical", icono: faPeopleRoof },
        { nombre: "Ingeniería Industrial", ruta: "/GruposIndustrialDominical", icono: faIndustry },
      ],
    },
    {
      nombre: "Virtuales",
      color: "bg-yellow-500",
      carreras: [
        { nombre: "Ingeniería en Sistemas", ruta: "/GruposSistemasVirtual", icono: faLaptopCode },
        { nombre: "Derecho", ruta: "/GruposDerechoVirtual", icono: faGavel },
        { nombre: "Pedagogía", ruta: "/GruposPedagogiaVirtual", icono: faChalkboardTeacher },
        { nombre: "Psicología", ruta: "/GruposPsicologiaVirtual", icono: faBrain },
        { nombre: "Administración", ruta: "/GruposAdministracionVirtual", icono: faMoneyBillTrendUp },
        { nombre: "Ciencias del Deporte", ruta: "/GruposDeporteVirtual", icono: faDumbbell },
        { nombre: "Contaduría", ruta: "/GruposContaduriaVirtual", icono: faMoneyBillTrendUp },
        { nombre: "Criminología", ruta: "/GruposCriminologiaVirtual", icono: faFingerprint },
        { nombre: "Trabajo Social", ruta: "/GruposTrabajoSocialVirtual", icono: faPeopleRoof },
        { nombre: "Ingeniería Industrial", ruta: "/GruposIndustrialVirtual", icono: faIndustry },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <Navbar titulo="Consultar Grupos" />

      {/* Botón de regreso */}
      <div className="mt-8 ml-10">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-purple-300 transition-all duration-300"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>
      </div>

      {/* Encabezado */}
      <section className="text-center mt-12 mb-10">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">Selecciona una carrera y modalidad</h1>
        <p className="text-purple-700 text-lg">Consulta los grupos disponibles</p>
      </section>

      {/* Secciones por modalidad */}
      <section className="space-y-12 px-10 pb-16">
        {modalidades.map((mod, idx) => (
          <div key={idx}>
            <h2 className={`text-2xl font-bold text-white p-3 rounded-xl ${mod.color} mb-6`}>
              {mod.nombre}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mod.carreras.map((carrera, i) => (
                <div
                  key={i}
                  onClick={() => navigate(carrera.ruta)}
                  className="cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-4 p-5 border border-purple-200"
                >
                  <div className={`${mod.color} p-3 rounded-full text-white flex items-center justify-center`}>
                    <FontAwesomeIcon icon={carrera.icono} size="lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">{carrera.nombre}</h3>
                    <p className="text-sm text-purple-600">{mod.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
