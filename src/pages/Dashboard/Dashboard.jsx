// Hub central del admin (ruta /dashboard): grilla de accesos directos a
// cada sección del portal, el switch global de "captura de calificaciones"
// (activa/desactiva que los docentes puedan capturar notas), y el panel
// de avisos (crear los avisos vive en otra pantalla, aquí solo se ven/
// eliminan). No trae lógica de negocio compleja — es sobre todo navegación
// + 2 fetches simples (avisos, configuración) + 1 escritura (el switch).
import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faComment,
  faIdBadge,
  faMagnifyingGlass,
  faUsers,
  faBell,
  faLayerGroup,
  faUserNurse,
  faKey,
  faBook,
  faClockRotateLeft,
  faLock,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';

import { Link } from 'react-router-dom';
import Swal from 'sweetalert2'
import { supabase } from '../../components/supabaseClient.js';
import { updateRows } from '../../components/adminApi';

export default function Dashboard() {

  const [avisos, setAvisos] = useState([]);
  const [correo, setCorreo] = useState("");
  const [mostrarAvisos, setMostrarAvisos] = useState(false);
  const [capturaHabilitada, setCapturaHabilitada] = useState(false);
  const [actualizandoCaptura, setActualizandoCaptura] = useState(false);

  /* ============================= */
  /* USUARIO LOGUEADO (SUPABASE) */
  /* ============================= */

  useEffect(() => {

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setCorreo(data.user.email);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCorreo(session?.user?.email || "");
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  /* ============================= */
  /* OBTENER AVISOS */
  /* ============================= */

  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setAvisos(data);
  };

  /* ============================= */
  /* ELIMINAR AVISO */
  /* ============================= */

  const handleDelete = async (id_aviso) => {

    const confirmacion = await Swal.fire({
      title: "¿Eliminar aviso?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33"
    });

    if (!confirmacion.isConfirmed) return;

    const { error } = await supabase
      .from('avisos')
      .delete()
      .eq('id_aviso', id_aviso);

    if (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el aviso",
        icon: "error"
      });
      return;
    }

    Swal.fire({
      title: "Aviso eliminado",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });

    fetchAvisos();
  };

  /* ============================= */
  /* VER AVISO */
  /* ============================= */

  const handleViewAviso = async (aviso) => {

    const fecha = new Date(aviso.created_at).toLocaleString();

    const result = await Swal.fire({
      title: aviso.titulo,
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 10px; white-space: pre-line;">
            ${aviso.descripcion}
          </p>

          <p style="font-size: 13px; color: gray; margin-top: 10px;">
            📅 Publicado: ${fecha}
          </p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Eliminar aviso",
      cancelButtonText: "Cerrar",
      confirmButtonColor: "#d33",
      width: 600
    });

    if (result.isConfirmed) {
      handleDelete(aviso.id_aviso);
    }
  };

  /* ============================= */
  /* LOGOUT SUPABASE */
  /* ============================= */

  async function handleLogOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  /* ============================= */
  /* SWITCH: CAPTURA DE CALIFICACIONES */
  /* ============================= */
  // `configuracion_sistema` es una tabla de una sola fila (id=1) con 2
  // switches globales: este (`captura_calificaciones_habilitada`, lo
  // controla el admin) y otro que controla el psicólogo desde su propio
  // portal (seguimiento emocional — no vive aquí). Apagar este switch hace
  // que los docentes ya no puedan capturar/corregir notas desde su portal,
  // sin importar si la calificación individual está bloqueada o no (es un
  // candado maestro, además de los candados por calificación de Candados.jsx).

  const fetchConfiguracion = async () => {
    const { data, error } = await supabase
      .from('configuracion_sistema')
      .select('captura_calificaciones_habilitada')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setCapturaHabilitada(data.captura_calificaciones_habilitada);
    }
  };

  // updateRows pasa por la Edge Function admin-api (no por RLS directo) —
  // ver adminApi.js. Optimista solo después de confirmar éxito: si falla,
  // el switch visualmente no cambia (no se actualiza el estado local).
  const handleToggleCaptura = async () => {
    const nuevoValor = !capturaHabilitada;
    setActualizandoCaptura(true);

    const { error } = await updateRows('configuracion_sistema', 'id', 1, {
      captura_calificaciones_habilitada: nuevoValor,
    });

    setActualizandoCaptura(false);

    if (error) {
      Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
      return;
    }

    setCapturaHabilitada(nuevoValor);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: nuevoValor
        ? 'Captura de calificaciones habilitada'
        : 'Captura de calificaciones deshabilitada',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
    });
  };

  /* ============================= */
  /* INIT */
  /* ============================= */

  useEffect(() => {
    fetchAvisos();
    fetchConfiguracion();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar titulo="Instituto Tecnológico Bridge" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-6 bg-white shadow-md">

        <h1 className="text-lg md:text-2xl font-semibold text-gray-800">
          Bienvenido {correo ? correo : "cargando..."}
        </h1>

        <button
          onClick={handleLogOut}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          Cerrar sesión
        </button>

      </div>

      {/* BOTONES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-10 px-10">

        <Link to="/CrearAvisos" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faComment} className="text-6xl" />
          Crear Avisos
        </Link>

        <Link to="/InscribirAlumnos" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faIdBadge} className="text-6xl" />
          Inscribir Alumnos
        </Link>

        <Link to="/carreras" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-6xl" />
          Consultar Grupos
        </Link>

        <Link to="/ConsultarUsuarios" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faUsers} className="text-6xl" />
          Consultar Usuarios
        </Link>

        <Link to="/Grupos/InscribirProfesor" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faIdBadge} className="text-6xl" />
          Agregar Profesor
        </Link>

        <Link to="/Grupos" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faLayerGroup} className="text-6xl" />
          Gestionar Grupos
        </Link>

        <Link to="/InscribirPsicologo" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faUserNurse} className="text-6xl" />
          Inscribir Psicólogo
        </Link>

        <Link to="/Materias" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faBook} className="text-6xl" />
          Materias
        </Link>

        <Link to="/HistorialAcademico" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faClockRotateLeft} className="text-6xl" />
          Historial Académico
        </Link>

        <Link to="/CambiarPassword" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faKey} className="text-6xl" />
          Cambiar Contraseñas
        </Link>

        <Link to="/Candados" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faLock} className="text-6xl" />
          Candados
        </Link>

        <Link to="/PendientesCalificaciones" className="bg-purple-800 text-white rounded-2xl py-10 flex flex-col items-center">
          <FontAwesomeIcon icon={faClipboardList} className="text-6xl" />
          Pendientes de Calificaciones
        </Link>

      </section>

      {/* SWITCH: CAPTURA DE CALIFICACIONES */}
      <section className="px-10 mt-10">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Captura de calificaciones</h3>
            <p className="text-sm text-gray-500 mt-1">
              Habilita este interruptor cuando llegue el periodo en el que los profesores deban
              registrar calificaciones (bachillerato y universidad). Al desactivarlo, los profesores
              ya no podrán capturar ni corregir calificaciones desde el Portal del Docente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              {actualizandoCaptura ? 'Guardando...' : capturaHabilitada ? 'Habilitada' : 'Deshabilitada'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={capturaHabilitada}
                disabled={actualizandoCaptura}
                onChange={handleToggleCaptura}
              />
              <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300 peer-disabled:opacity-60"></div>
              <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 peer-checked:translate-x-6"></div>
            </label>
          </div>
        </div>
      </section>

      {/* AVISOS */}
      <div className="px-10 mt-14">

        <button
          onClick={() => setMostrarAvisos(!mostrarAvisos)}
          className="bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-3"
        >
          <FontAwesomeIcon icon={faBell} />
          Avisos ({avisos.length})
        </button>

      </div>

      {mostrarAvisos && (
        <section className="mt-6 px-10 pb-10">

          <div className="bg-white shadow-lg rounded-xl p-6">

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

              {avisos.map((aviso) => (
                <button
                  key={aviso.id_aviso}
                  onClick={() => handleViewAviso(aviso)}
                  className="border rounded-lg p-4 bg-purple-50 text-left"
                >
                  <h3 className="font-semibold">{aviso.titulo}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {aviso.descripcion}
                  </p>
                </button>
              ))}

            </div>

            {avisos.length === 0 && (
              <p className="text-center text-gray-500">
                No hay avisos
              </p>
            )}

          </div>

        </section>
      )}

    </main>
  );
}