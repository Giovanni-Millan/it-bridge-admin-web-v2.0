  import React, { useEffect, useState } from "react";
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faArrowLeft, faUserSlash, faUserCheck, faCamera, faTrash } from "@fortawesome/free-solid-svg-icons";
  import { useNavigate, useParams } from "react-router-dom";
  import Navbar from "../../../components/Navbar";
  import Avatar from "../../../components/Avatar.jsx";
  import Swal from "sweetalert2";
  import { supabase, supabaseAdmin } from "../../../components/supabaseClient.js";
  import { subirAvatar, eliminarAvatar } from "../../../utils/avatarUpload.js";

  export default function ModificarInfoAlumno() {

    const navigate = useNavigate();
    const { id } = useParams(); // UUID

    /*
    =========================
    ESTADOS
    =========================
    */

    const [alumno, setAlumno] = useState({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      curp: "",
      correo: "",
      contraseña: "",
      telefono: "",
      direccion: "",
      cuatrimestre: "",
      id_carrera: "",
      tipo: "",
      plan_meses: "",
    });

    const [carreras, setCarreras] = useState([]);
    const [activo, setActivo] = useState(true);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);
    const [fotoUrl, setFotoUrl] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [eliminandoFoto, setEliminandoFoto] = useState(false);

    /*
    =========================
    OBTENER CARRERAS
    =========================
    */

    useEffect(() => {

      const fetchCarreras = async () => {

        const { data, error } = await supabase
          .from("carrera")
          .select("id_carrera, nombre")
          .order("nombre", { ascending: true });

        if (error) {

          console.error("Error cargando carreras:", error);
          return;

        }

        setCarreras(data);

      };

      fetchCarreras();

    }, []);

    /*
    =========================
    OBTENER ALUMNO
    =========================
    */

    useEffect(() => {

      if (!id) return;

      const fetchAlumno = async () => {

        console.log("Buscando alumno con id:", id);

        const { data, error } = await supabase
          .from("alumnos")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {

          console.error("Error al consultar:", error);

          Swal.fire(
            "Error",
            error.message,
            "error"
          );

          return;

        }

        setAlumno({
          nombre: data.nombre || "",
          apellido_paterno: data.apellido_paterno || "",
          apellido_materno: data.apellido_materno || "",
          fecha_nacimiento: data.fecha_nacimiento
            ? data.fecha_nacimiento.split("T")[0]
            : "",
          curp: data.curp || "",
          correo: data.correo || "",
          contraseña: "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          cuatrimestre: data.cuatrimestre || "",
          id_carrera: data.id_carrera || "",
          tipo: data.tipo || "",
          plan_meses: data.plan_meses || "",
        });

        setFotoUrl(data.foto_url || null);

        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(id);
        setActivo(!authData?.user?.banned_until || new Date(authData.user.banned_until) < new Date());

      };

      fetchAlumno();

    }, [id]);

    /*
    =========================
    FOTO DE PERFIL
    =========================
    */

    const handleFoto = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSubiendoFoto(true);

      try {
        const nuevaUrl = await subirAvatar(file, "alumno", id);
        setFotoUrl(nuevaUrl);
        Swal.fire({ icon: "success", title: "Foto actualizada", timer: 1200, showConfirmButton: false });
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudo subir la foto", "error");
      } finally {
        setSubiendoFoto(false);
        e.target.value = "";
      }
    };

    const handleEliminarFoto = async () => {
      const result = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar foto?",
        text: "Esta acción eliminará la foto de perfil del alumno.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!result.isConfirmed) return;

      setEliminandoFoto(true);

      try {
        await eliminarAvatar("alumno", id);
        setFotoUrl(null);
        Swal.fire({ icon: "success", title: "Foto eliminada", timer: 1200, showConfirmButton: false });
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudo eliminar la foto", "error");
      } finally {
        setEliminandoFoto(false);
      }
    };

    /*
    =========================
    ACTIVAR / DESACTIVAR ACCESO
    =========================
    */

    const toggleActivo = async () => {

      setCambiandoEstado(true);

      try {

        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
          ban_duration: activo ? "87600h" : "none",
        });

        if (error) throw error;

        setActivo(!activo);

        Swal.fire({
          icon: "success",
          title: activo ? "Alumno desactivado" : "Alumno activado",
          text: activo
            ? "Ya no podrá iniciar sesión, pero su información e historial se conservan."
            : "El alumno ya puede volver a iniciar sesión.",
          timer: 1800,
          showConfirmButton: false,
        });

      } catch (err) {

        console.error(err);
        Swal.fire("Error", "No se pudo cambiar el estado del alumno", "error");

      } finally {

        setCambiandoEstado(false);

      }

    };

    /*
    =========================
    INPUTS
    =========================
    */

    const handleChange = (e) => {

      const { name, value } = e.target;

      setAlumno((prev) => ({
        ...prev,
        [name]: value,
      }));

    };

    /*
    =========================
    ACTUALIZAR ALUMNO
    =========================
    */

    const handleSubmit = async (e) => {

      e.preventDefault();

      const {
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento,
        curp,
        correo,
        contraseña,
        telefono,
        direccion,
        cuatrimestre,
        id_carrera,
        tipo,
        plan_meses,
      } = alumno;

      if (
        !nombre ||
        !apellido_paterno ||
        !apellido_materno ||
        !fecha_nacimiento ||
        !curp ||
        !correo ||
        !telefono ||
        !direccion ||
        !tipo
      ) {

        Swal.fire(
          "Campos incompletos",
          "Por favor completa todos los campos",
          "warning"
        );

        return;

      }

      try {

        const payload = {
          nombre,
          apellido_paterno,
          apellido_materno,
          fecha_nacimiento,
          curp,
          correo,
          telefono,
          direccion,
          cuatrimestre: cuatrimestre || null,
          id_carrera: id_carrera || null,
          tipo,
          plan_meses: tipo === "autoplaneado" && plan_meses ? parseInt(plan_meses) : null,
        };

        if (contraseña) {

          payload.contraseña = contraseña;

        }

        const { error } = await supabase
          .from("alumnos")
          .update(payload)
          .eq("id", id);

        if (error) {

          console.error("Error al actualizar:", error);

          Swal.fire(
            "Error",
            error.message,
            "error"
          );

          return;

        }

        Swal.fire(
          "Actualizado",
          "Los datos del alumno se actualizaron correctamente",
          "success"
        );

        navigate(-1);

      } catch (err) {

        console.error(err);

        Swal.fire(
          "Error",
          "No se pudo actualizar la información",
          "error"
        );

      }

    };

    return (

      <main className="min-h-screen bg-gray-50">

        <Navbar titulo="Modificar Información del Alumno" />

        <div className="mt-6 px-6">

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-purple-200 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-300 transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </button>

          <button
            onClick={toggleActivo}
            disabled={cambiandoEstado}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition ml-3 ${
              activo ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            <FontAwesomeIcon icon={activo ? faUserSlash : faUserCheck} />
            {activo ? "Desactivar acceso" : "Activar acceso"}
          </button>

        </div>

        <div className="flex justify-center mt-8 px-4">

          <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-8">

            <h2 className="text-2xl font-semibold mb-6 text-center">
              Actualizar Alumno
            </h2>

            <div className="flex flex-col items-center gap-3 mb-6">
              <Avatar
                fotoUrl={fotoUrl}
                nombre={alumno.nombre}
                apellidoPaterno={alumno.apellido_paterno}
                apellidoMaterno={alumno.apellido_materno}
                size={96}
              />
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-purple-700 font-medium cursor-pointer hover:text-purple-900">
                  <FontAwesomeIcon icon={faCamera} />
                  {subiendoFoto ? "Subiendo..." : "Cambiar foto"}
                  <input type="file" accept="image/*" onChange={handleFoto} disabled={subiendoFoto} className="hidden" />
                </label>

                {fotoUrl && (
                  <button
                    type="button"
                    onClick={handleEliminarFoto}
                    disabled={eliminandoFoto}
                    className="inline-flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {eliminandoFoto ? "Eliminando..." : "Eliminar foto"}
                  </button>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >

              <input
                type="text"
                name="nombre"
                value={alumno.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="input-field"
              />

              <input
                type="text"
                name="apellido_paterno"
                value={alumno.apellido_paterno}
                onChange={handleChange}
                placeholder="Apellido paterno"
                className="input-field"
              />

              <input
                type="text"
                name="apellido_materno"
                value={alumno.apellido_materno}
                onChange={handleChange}
                placeholder="Apellido materno"
                className="input-field"
              />

              <input
                type="date"
                name="fecha_nacimiento"
                value={alumno.fecha_nacimiento}
                onChange={handleChange}
                className="input-field"
              />

              <input
                type="text"
                name="curp"
                value={alumno.curp}
                onChange={handleChange}
                placeholder="CURP"
                className="input-field"
              />

              <input
                type="email"
                name="correo"
                value={alumno.correo}
                onChange={handleChange}
                placeholder="Correo"
                className="input-field"
              />



              <input
                type="text"
                name="telefono"
                value={alumno.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="input-field"
              />

              <input
                type="text"
                name="direccion"
                value={alumno.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="input-field md:col-span-2"
              />

              <input
                type="number"
                name="cuatrimestre"
                value={alumno.cuatrimestre}
                onChange={handleChange}
                placeholder="Cuatrimestre"
                className="input-field"
              />

              {/* TIPO */}

              <select
                name="tipo"
                value={alumno.tipo}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">¿Bachillerato, Universidad o Autoplaneado?</option>
                <option value="bachillerato">Bachillerato</option>
                <option value="universidad">Universidad</option>
                <option value="autoplaneado">Autoplaneado</option>
              </select>

              {alumno.tipo === "autoplaneado" && (
                <select
                  name="plan_meses"
                  value={alumno.plan_meses}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">¿Plan de 6, 12 o 18 meses?</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="18">18 meses</option>
                </select>
              )}

              {/* SELECT DE CARRERAS */}

              <div className="md:col-span-2">
                <select
                  name="id_carrera"
                  value={alumno.id_carrera}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">
                    Sin asignar (se autocompleta al inscribirlo en un grupo)
                  </option>

                  {carreras.map((carrera) => (

                    <option
                      key={carrera.id_carrera}
                      value={carrera.id_carrera}
                    >
                      {carrera.nombre}
                    </option>

                  ))}

                </select>
              </div>

              <div className="md:col-span-2 text-center mt-6">

                <button
                  type="submit"
                  className="bg-purple-700 text-white px-10 py-2 rounded-md hover:bg-purple-800 transition"
                >
                  Actualizar Alumno
                </button>

              </div>

            </form>

          </div>

        </div>

      </main>

    );

  }