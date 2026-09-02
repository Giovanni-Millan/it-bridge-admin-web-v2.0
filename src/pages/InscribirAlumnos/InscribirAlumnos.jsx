// Formulario de alta de alumnos. El correo y la contraseña se autogeneran
// mientras se escribe el nombre/apellidos (convención de la escuela), pero
// quedan editables por si hay que ajustarlos a mano. El alta real son 2
// pasos independientes: 1) crear el usuario en Supabase Auth (vía la Edge
// Function, rol "alumno"), 2) insertar su fila en la tabla `alumnos` con
// `supabase` directo (la política RLS de esa tabla ya permite INSERT al
// admin). Si el paso 2 falla, el usuario de Auth ya quedó creado — no hay
// rollback automático del paso 1 aquí.
import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../components/supabaseClient.js";
import { createUser } from "../../components/adminApi";

// Quita acentos y cualquier caracter que no sea letra, todo en minúsculas
const normalizarTexto = (texto) =>
  (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

const capitalizar = (texto) => (texto ? texto[0].toUpperCase() + texto.slice(1) : "");

// Convención: nombre + apellidopaterno + primera letra del apellido materno
const generarCorreo = (nombre, apellidoPaterno, apellidoMaterno) => {
  const letraMaterno = apellidoMaterno ? normalizarTexto(apellidoMaterno)[0] || "" : "";
  return `${normalizarTexto(nombre)}${normalizarTexto(apellidoPaterno)}${letraMaterno}@itbridge.edu.mx`;
};

// Convención: Rol + Nombre + Año
const generarPassword = (rolLabel, nombre) =>
  `${rolLabel}${capitalizar(normalizarTexto(nombre))}${new Date().getFullYear()}`;

export default function InscribirAlumnos() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    curp: "",
    correo: "",
    contraseña: "",
    telefono: "",
    direccion: "",
    tipo: "",
    plan_meses: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const actualizado = { ...formData, [name]: value };

    if (["nombre", "apellido_paterno", "apellido_materno"].includes(name)) {
      actualizado.correo = generarCorreo(
        actualizado.nombre,
        actualizado.apellido_paterno,
        actualizado.apellido_materno
      );
      actualizado.contraseña = generarPassword("Estudiante", actualizado.nombre);
    }

    setFormData(actualizado);
  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      /* ===================================== */
      /* 1. CREAR USUARIO EN AUTH */
      /* ===================================== */

      const { data: userData, error: authError } =
        await createUser({
          email: formData.correo,
          password: formData.contraseña,
          rol: "alumno",
        });

      if (authError) {

        throw new Error(authError.message);

      }

      const userId = userData.user.id;

      console.log("USER ID:", userId);

      /* ===================================== */
      /* 2. INSERTAR EN TABLA ALUMNOS */
      /* ===================================== */

      const { error: alumnoError } =
        await supabase
          .from("alumnos")
          .insert([
            {
              id: userId,

              nombre: formData.nombre,

              apellido_paterno: formData.apellido_paterno,

              apellido_materno: formData.apellido_materno,

              fecha_nacimiento: formData.fecha_nacimiento,

              curp: formData.curp,

              telefono: formData.telefono,

              direccion: formData.direccion,

              correo: formData.correo,

              tipo: formData.tipo,

              plan_meses: formData.tipo === "autoplaneado" && formData.plan_meses ? parseInt(formData.plan_meses) : null,

              codigo: Math.floor(
                100000 + Math.random() * 900000
              )
            }
          ]);

      if (alumnoError) {

        throw new Error(alumnoError.message);

      }

      /* ===================================== */
      /* 3. ALERTA DE ÉXITO */
      /* ===================================== */

      const nombreCompleto =
        `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno}`;

      Swal.fire({
        title: "Alumno inscrito correctamente",
        text: `${nombreCompleto} se ha inscrito correctamente.`,
        icon: "success",
        confirmButtonColor: "#6D28D9"
      });

      navigate("/Dashboard");

    }

    catch (err) {

      console.error("ERROR:", err);

      Swal.fire({
        title: "Error al registrar",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#d33"
      });

    }

  };

  return (

    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">

      <Navbar titulo="Inscribir Alumnos" />

      <div className="mt-8 px-10">

        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 bg-purple-200 hover:bg-purple-400 text-purple-900 font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Regresar al panel
        </Link>

      </div>

      <div className="flex justify-center mt-12 px-4">

        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg border border-purple-200 p-8 mb-10">

          <h1 className="text-3xl font-semibold text-purple-800 text-center mb-8">

            Formulario de Inscripción

          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required className="input" />

              <input type="text" name="apellido_paterno" placeholder="Apellido paterno" onChange={handleChange} required className="input" />

              <input type="text" name="apellido_materno" placeholder="Apellido materno" onChange={handleChange} required className="input" />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input type="date" name="fecha_nacimiento" onChange={handleChange} required className="input" />

              <input type="text" name="curp" placeholder="CURP" onChange={handleChange} required maxLength="18" className="input uppercase" />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <input type="email" name="correo" placeholder="Correo electrónico" value={formData.correo} onChange={handleChange} required className="input" />
                <p className="text-xs text-gray-400 mt-1">Se sugiere automáticamente; puedes editarlo</p>
              </div>

              <div>
                <input type="text" name="contraseña" placeholder="Contraseña" value={formData.contraseña} onChange={handleChange} required className="input" />
                <p className="text-xs text-gray-400 mt-1">Se sugiere automáticamente; puedes editarla</p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input type="tel" name="telefono" placeholder="Teléfono" onChange={handleChange} required className="input" />

              <input type="text" name="direccion" placeholder="Dirección" onChange={handleChange} required className="input" />

            </div>

            <div>

              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className="input bg-white"
              >

                <option value="">
                  ¿Bachillerato, Universidad o Autoplaneado?
                </option>

                <option value="bachillerato">Bachillerato</option>
                <option value="universidad">Universidad</option>
                <option value="autoplaneado">Autoplaneado</option>

              </select>

              <p className="text-xs text-gray-400 mt-1">
                La carrera y el semestre/cuatrimestre se asignan automáticamente al inscribir al alumno en un grupo.
              </p>

            </div>

            {formData.tipo === "autoplaneado" && (
              <div>
                <select
                  name="plan_meses"
                  value={formData.plan_meses}
                  onChange={handleChange}
                  required
                  className="input bg-white"
                >
                  <option value="">¿Plan de 6, 12 o 18 meses?</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="18">18 meses</option>
                </select>
              </div>
            )}

            <div className="flex justify-center pt-4">

              <button
                type="submit"
                className="bg-purple-700 hover:bg-purple-900 text-white font-medium py-2 px-10 rounded-md shadow-md transition-all"
              >
                Inscribir Alumno
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>

  );

}