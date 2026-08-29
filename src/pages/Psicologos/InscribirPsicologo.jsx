import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createUser, insertRows } from "../../components/adminApi";

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

export default function InscribirPsicologo() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo: "",
    contraseña: "",
    telefono: "",
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
      actualizado.contraseña = generarPassword("Psicologo", actualizado.nombre);
    }

    setFormData(actualizado);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const { data: userData, error: authError } =
        await createUser({
          email: formData.correo,
          password: formData.contraseña,
          rol: "psicologo",
        });

      if (authError) throw new Error(authError.message);

      const userId = userData.user.id;

      const { error: psicologoError } = await insertRows("psicologos", [
        {
          id: userId,
          nombre: formData.nombre,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno || null,
          correo: formData.correo,
          telefono: formData.telefono || null,
        },
      ]);

      if (psicologoError) throw new Error(psicologoError.message);

      const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno}`;

      Swal.fire({
        title: "Psicólogo(a) inscrito correctamente",
        text: `${nombreCompleto} ya puede iniciar sesión en el Portal del Psicólogo.`,
        icon: "success",
        confirmButtonColor: "#6D28D9",
      });

      navigate("/Dashboard");
    } catch (err) {
      console.error("ERROR:", err);
      Swal.fire({
        title: "Error al registrar",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <Navbar titulo="Inscribir Psicólogo" />

      <div className="mt-8 px-10">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 bg-purple-200 hover:bg-purple-400 text-purple-900 font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Regresar
        </Link>
      </div>

      <div className="flex justify-center mt-12 px-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg border border-purple-200 p-8 mb-10">
          <h1 className="text-3xl font-semibold text-purple-800 text-center mb-8">
            Inscribir Psicólogo(a)
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                onChange={handleChange}
                required
                className="input"
              />
              <input
                type="text"
                name="apellido_paterno"
                placeholder="Apellido paterno"
                onChange={handleChange}
                required
                className="input"
              />
              <input
                type="text"
                name="apellido_materno"
                placeholder="Apellido materno"
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo electrónico"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Se sugiere automáticamente; puedes editarlo</p>
              </div>
              <div>
                <input
                  type="text"
                  name="contraseña"
                  placeholder="Contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  required
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Se sugiere automáticamente; puedes editarla</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="bg-purple-700 hover:bg-purple-900 text-white font-medium py-2 px-10 rounded-md shadow-md transition-all"
              >
                Inscribir Psicólogo(a)
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
