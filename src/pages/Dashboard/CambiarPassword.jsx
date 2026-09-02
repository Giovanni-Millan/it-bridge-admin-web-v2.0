// Pantalla "Cambiar Contraseñas" (ruta /CambiarPassword): lista TODOS los
// usuarios de Supabase Auth (de los 4 roles, no solo alumnos) y le permite
// al admin fijarle una contraseña nueva a cualquiera, sin necesitar la
// contraseña anterior. Nótese que el componente se llama `Usuarios` por
// dentro (nombre heredado, no se renombró al mover la pantalla aquí) pero
// la ruta y el propósito real son de cambio de contraseña, no de gestión
// general de usuarios (esa es ConsultarUsuarios.jsx).
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Swal from "sweetalert2";
import { listUsers, updateUserById } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMagnifyingGlass,
  faUser,
  faKey
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function Usuarios() {

  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  /* ============================= */
  /* OBTENER USUARIOS */
  /* ============================= */
  // listUsers() (adminApi.js → Edge Function admin-api) trae la lista
  // completa de Auth de los 4 roles — no hay paginación aquí, se trae todo
  // de una vez y se filtra en el cliente (ver "FILTRAR USUARIOS" abajo).

  const fetchUsuarios = async () => {

    setLoading(true);

    try {

      const { data, error } =
        await listUsers();

      if (error) throw error;

      console.log("Usuarios:", data.users);

      setUsuarios(data.users);

    } catch (error) {

      console.error("Error al obtener usuarios:", error);

      Swal.fire(
        "Error",
        error.message ||
        "No se pudieron obtener los usuarios",
        "error"
      );

    }

    setLoading(false);

  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  /* ============================= */
  /* FILTRAR USUARIOS */
  /* ============================= */

  const usuariosFiltrados =
    usuarios.filter((usuario) =>
      usuario.email
        ?.toLowerCase()
        .includes(
          busqueda.toLowerCase()
        )
    );

  /* ============================= */
  /* CAMBIAR PASSWORD */
  /* ============================= */
  // Pide la contraseña nueva con un prompt de SweetAlert2 (con su propio
  // inputValidator: no vacía, mínimo 6 caracteres — este bug de validación
  // ASI de JS se corrigió el 31-ago-2026, el string ahora va en la misma
  // línea que el `return`). Si se confirma, la actualiza de verdad en
  // Supabase Auth vía updateUserById (adminApi.js → Edge Function).

  const handleCambiarPassword =
    async (usuario) => {

      const { value: nuevaPassword } =
        await Swal.fire({

          title: "Cambiar contraseña",

          html: `
            <p style="margin-bottom:10px;">
              Usuario:
            </p>
            <strong>
              ${usuario.email}
            </strong>
          `,

          input: "password",

          inputPlaceholder:
            "Nueva contraseña",

          showCancelButton: true,

          confirmButtonText:
            "Actualizar",

          cancelButtonText:
            "Cancelar",

          confirmButtonColor:
            "#7c3aed",

          inputValidator:
            (value) => {

              if (!value) {
                return "Debes escribir una contraseña";
              }

              if (
                value.length < 6
              ) {
                return "Mínimo 6 caracteres";
              }

            }

        });

      if (!nuevaPassword) return;

      try {

        setProcesando(true);

        console.log(
          "Actualizando password para:",
          usuario.id
        );

        const {
          data,
          error
        } =
          await updateUserById(
            usuario.id,
            {
              password:
                nuevaPassword
            }
          );

        console.log(
          "Respuesta:",
          data
        );

        if (error)
          throw error;

        Swal.fire({
          title:
            "Contraseña actualizada",
          icon:
            "success",
          timer:
            1500,
          showConfirmButton:
            false
        });

      } catch (error) {

        console.error(
          "Error al cambiar password:",
          error
        );

        Swal.fire(
          "Error",
          error.message ||
          "No se pudo actualizar la contraseña",
          "error"
        );

      }

      setProcesando(false);

    };

  /* ============================= */
  /* FORMATEAR FECHA */
  /* ============================= */

  const formatearFecha =
    (fecha) => {

      try {

        return new Date(
          fecha
        ).toLocaleString(
          "es-MX"
        );

      } catch {

        return "—";

      }

    };

  /* ============================= */
  /* RENDER */
  /* ============================= */

  return (

    <main className="min-h-screen bg-gray-50">

      <Navbar
        titulo="Usuarios del sistema"
      />

      <div className="p-8">

        {/* BOTON REGRESAR */}

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          className="
            flex
            items-center
            gap-2
            bg-gray-600
            hover:bg-gray-700
            text-white
            px-4
            py-2
            rounded-lg
            mb-6
          "
        >

          <FontAwesomeIcon
            icon={faArrowLeft}
          />

          Regresar

        </button>

        {/* BUSCADOR */}

        <div className="relative mb-6">

          <input
            type="text"
            placeholder="Buscar usuario por correo..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              px-4
              py-2
              pl-10
              focus:outline-none
              focus:ring-2
              focus:ring-purple-600
            "
          />

          <FontAwesomeIcon
            icon={
              faMagnifyingGlass
            }
            className="
              absolute
              left-3
              top-3
              text-gray-400
            "
          />

        </div>

        {/* CONTADOR */}

        <p className="mb-4 text-sm text-gray-600">

          Usuarios encontrados:

          <strong>

            {" "}

            {
              usuariosFiltrados.length
            }

          </strong>

        </p>

        {/* TABLA */}

        <div className="
          bg-white
          shadow-md
          rounded-xl
          overflow-hidden
        ">

          <table className="w-full">

            <thead className="
              bg-purple-800
              text-white
            ">

              <tr>

                <th className="p-3 text-left">
                  Usuario
                </th>

                <th className="p-3 text-left">
                  Fecha registro
                </th>

                <th className="p-3 text-left">
                  Acción
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="3"
                    className="
                      text-center
                      p-6
                    "
                  >
                    Cargando usuarios...
                  </td>
                </tr>

              ) : usuariosFiltrados.length === 0 ? (

                <tr>
                  <td
                    colSpan="3"
                    className="
                      text-center
                      p-6
                    "
                  >
                    No hay usuarios
                  </td>
                </tr>

              ) : (

                usuariosFiltrados.map(
                  (usuario) => (

                    <tr
                      key={
                        usuario.id
                      }
                      className="
                        border-b
                        hover:bg-purple-50
                      "
                    >

                      <td className="p-3">

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">

                          <FontAwesomeIcon
                            icon={
                              faUser
                            }
                            className="
                              text-purple-700
                            "
                          />

                          {
                            usuario.email
                          }

                        </div>

                      </td>

                      <td className="p-3">

                        {
                          formatearFecha(
                            usuario.created_at
                          )
                        }

                      </td>

                      <td className="p-3">

                        <button
                          disabled={
                            procesando
                          }
                          onClick={() =>
                            handleCambiarPassword(
                              usuario
                            )
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            bg-purple-700
                            hover:bg-purple-800
                            disabled:bg-gray-400
                            text-white
                            px-3
                            py-1
                            rounded-lg
                          "
                        >

                          <FontAwesomeIcon
                            icon={
                              faKey
                            }
                          />

                          {
                            procesando
                              ? "Actualizando..."
                              : "Cambiar contraseña"
                          }

                        </button>

                      </td>

                    </tr>

                  )

                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>

  );

}