// Bloqueo de acceso a alumnos por falta de pago (u otro motivo administrativo).
// Distinto del Activar/Desactivar de Consultar Usuarios (que banea la cuenta
// por completo a nivel Auth): aquí solo se marca `alumnos.acceso_bloqueado`,
// así que el alumno sigue existiendo con su cuenta normal, pero el Portal del
// Alumno lo detecta al iniciar sesión (o al recargar el Dashboard) y le
// muestra un mensaje de que debe pagar en vez de dejarlo entrar — no es un
// baneo silencioso de Auth, es un candado de negocio con su propio mensaje.
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../components/supabaseClient.js";
import { updateRows } from "../../components/adminApi";
import Avatar from "../../components/Avatar.jsx";

export default function BloqueoAcceso() {
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("alumnos")
      .select(
        "id, nombre, apellido_paterno, apellido_materno, correo, tipo, foto_url, acceso_bloqueado, carrera:carrera(nombre)"
      )
      .order("apellido_paterno", { ascending: true });

    if (!error) setAlumnos(data || []);
    setLoading(false);
  };

  const alumnosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return alumnos;
    return alumnos.filter((a) => {
      const nombreCompleto = `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno || ""}`.toLowerCase();
      return nombreCompleto.includes(termino) || (a.correo || "").toLowerCase().includes(termino);
    });
  }, [alumnos, busqueda]);

  const toggleBloqueo = async (alumno) => {
    const nombreCompleto = `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno || ""}`.trim();
    const bloquear = !alumno.acceso_bloqueado;

    const result = await Swal.fire({
      title: bloquear ? "¿Bloquear acceso?" : "¿Quitar el bloqueo?",
      text: bloquear
        ? `${nombreCompleto} no podrá iniciar sesión en el Portal del Alumno — verá un mensaje pidiéndole que realice su pago.`
        : `${nombreCompleto} podrá volver a iniciar sesión normalmente.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: bloquear ? "#dc2626" : "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: bloquear ? "Sí, bloquear" : "Sí, desbloquear",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setActualizandoId(alumno.id);
    const { error } = await updateRows("alumnos", "id", alumno.id, { acceso_bloqueado: bloquear });
    setActualizandoId(null);

    if (error) {
      Swal.fire("Error", "No se pudo actualizar el acceso del alumno.", "error");
      return;
    }

    setAlumnos((prev) => prev.map((a) => (a.id === alumno.id ? { ...a, acceso_bloqueado: bloquear } : a)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Bloqueo de Acceso" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Bloqueo de Acceso</h1>
          <p className="text-gray-500 mt-1">
            Listado de todos los alumnos. Usa el interruptor para bloquear a quien no haya realizado su pago — al
            intentar entrar al Portal del Alumno verá un mensaje pidiéndole que se ponga al corriente, en vez de
            poder acceder a sus calificaciones y demás secciones.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            {alumnos.length === 0 ? "No hay alumnos registrados." : "Ningún resultado coincide con la búsqueda."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl shadow-md bg-white">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-purple-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Carrera</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-48">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnosFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <Avatar
                          fotoUrl={a.foto_url}
                          nombre={a.nombre}
                          apellidoPaterno={a.apellido_paterno}
                          apellidoMaterno={a.apellido_materno}
                          size={32}
                        />
                        <div>
                          {a.nombre} {a.apellido_paterno} {a.apellido_materno}
                          <p className="text-xs text-gray-400">{a.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.carrera?.nombre || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          a.acceso_bloqueado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {a.acceso_bloqueado ? "Bloqueado" : "Al corriente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16 text-right">
                          {actualizandoId === a.id ? "Guardando…" : a.acceso_bloqueado ? "Bloqueado" : "Permitido"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={a.acceso_bloqueado}
                            disabled={actualizandoId === a.id}
                            onChange={() => toggleBloqueo(a)}
                          />
                          <div className="w-14 h-8 bg-green-500 rounded-full peer peer-checked:bg-red-500 transition-colors duration-300 peer-disabled:opacity-60"></div>
                          <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 peer-checked:translate-x-6"></div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
