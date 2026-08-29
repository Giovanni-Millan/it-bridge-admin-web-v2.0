import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../components/supabaseClient.js";
import { insertRows, updateRows } from "../../components/adminApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function CrearGrupo() {
  const navigate = useNavigate();
  const { id_grupo } = useParams();
  const modoEdicion = Boolean(id_grupo);

  const [carreras, setCarreras] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const [cargandoGrupo, setCargandoGrupo] = useState(modoEdicion);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "universidad",
    id_carrera: "",
    cuatrimestre: "",
    semestre: "",
    periodo: "",
    anio: "",
  });

  const PERIODOS = ["ENE-ABR", "MAY-AGO", "SEP-DIC"];
  const anioActual = new Date().getFullYear();
  const AÑOS = Array.from({ length: 6 }, (_, i) => anioActual - 1 + i);

  useEffect(() => {
    fetchCarreras();
    if (modoEdicion) fetchGrupo();
  }, [id_grupo]);

  const fetchGrupo = async () => {
    setCargandoGrupo(true);
    const { data, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("id_grupo", id_grupo)
      .single();

    if (error || !data) {
      Swal.fire("Error", "No se pudo cargar el grupo a editar.", "error").then(() =>
        navigate("/Grupos")
      );
      return;
    }

    setFormData({
      nombre: data.nombre || "",
      tipo: data.tipo || "universidad",
      id_carrera: data.id_carrera ?? "",
      cuatrimestre: data.cuatrimestre ?? "",
      semestre: data.semestre ?? "",
      periodo: data.periodo ?? "",
      anio: data.anio ?? "",
    });
    setCargandoGrupo(false);
  };

  const fetchCarreras = async () => {
    setLoadingCarreras(true);
    const { data, error } = await supabase
      .from("carrera")
      .select("*")
      .order("nombre");

    if (!error) setCarreras(data || []);
    setLoadingCarreras(false);
  };

  // Las carreras de Bachillerato empiezan con "Bachillerato", las de Autoplaneado con "Autoplaneado"
  const carrerasFiltradas = useMemo(() => {
    return carreras.filter((c) => {
      const nombre = c.nombre?.toLowerCase() || "";
      if (formData.tipo === "bachillerato") return nombre.startsWith("bachillerato");
      if (formData.tipo === "autoplaneado") return nombre.startsWith("autoplaneado");
      return !nombre.startsWith("bachillerato") && !nombre.startsWith("autoplaneado");
    });
  }, [carreras, formData.tipo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (tipo) => {
    setFormData({ ...formData, tipo, id_carrera: "", cuatrimestre: "", semestre: "", periodo: "", anio: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGuardando(true);

    try {
      const payload = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        id_carrera: formData.id_carrera ? parseInt(formData.id_carrera) : null,
        cuatrimestre:
          formData.tipo === "universidad" && formData.cuatrimestre
            ? parseInt(formData.cuatrimestre)
            : null,
        semestre:
          formData.tipo === "bachillerato" && formData.semestre
            ? parseInt(formData.semestre)
            : null,
        periodo:
          (formData.tipo === "universidad" || formData.tipo === "autoplaneado") && formData.periodo
            ? formData.periodo
            : null,
        anio: formData.anio ? parseInt(formData.anio) : null,
      };

      let idDestino = id_grupo;

      if (modoEdicion) {
        const { error } = await updateRows("grupos", "id_grupo", id_grupo, payload);

        if (error) throw new Error(error.message);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await insertRows("grupos", [
          { ...payload, created_by: userData?.user?.id ?? null },
        ]);

        if (error) throw new Error(error.message);
        idDestino = data[0].id_grupo;
      }

      Swal.fire({
        title: modoEdicion ? "Grupo actualizado" : "Grupo creado",
        text: `"${formData.nombre}" se ${modoEdicion ? "actualizó" : "creó"} correctamente.`,
        icon: "success",
        confirmButtonColor: "#6D28D9",
      });

      navigate(`/Grupos/Detalle/${idDestino}`);
    } catch (err) {
      console.error(err);
      Swal.fire(`Error al ${modoEdicion ? "actualizar" : "crear"} el grupo`, err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoGrupo) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
        <Navbar titulo="Editar Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <Navbar titulo={modoEdicion ? "Editar Grupo" : "Crear Grupo"} />

      <div className="mt-8 px-10">
        <Link
          to={modoEdicion ? `/Grupos/Detalle/${id_grupo}` : "/Grupos"}
          className="inline-flex items-center gap-2 bg-purple-200 hover:bg-purple-400 text-purple-900 font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          {modoEdicion ? "Regresar al grupo" : "Regresar a Grupos"}
        </Link>
      </div>

      <div className="flex justify-center mt-12 px-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg border border-purple-200 p-8 mb-10">
          <h1 className="text-3xl font-semibold text-purple-800 text-center mb-8">
            {modoEdicion ? "Editar Grupo" : "Nuevo Grupo"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel educativo
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleTipoChange("universidad")}
                  className={`py-2.5 rounded-lg font-medium border-2 transition-all ${
                    formData.tipo === "universidad"
                      ? "bg-purple-700 text-white border-purple-700"
                      : "bg-white text-purple-700 border-purple-200 hover:border-purple-400"
                  }`}
                >
                  Universidad
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoChange("bachillerato")}
                  className={`py-2.5 rounded-lg font-medium border-2 transition-all ${
                    formData.tipo === "bachillerato"
                      ? "bg-purple-700 text-white border-purple-700"
                      : "bg-white text-purple-700 border-purple-200 hover:border-purple-400"
                  }`}
                >
                  Bachillerato
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoChange("autoplaneado")}
                  className={`py-2.5 rounded-lg font-medium border-2 transition-all ${
                    formData.tipo === "autoplaneado"
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-green-700 border-green-200 hover:border-green-400"
                  }`}
                >
                  Autoplaneado
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del grupo
              </label>
              <input
                type="text"
                name="nombre"
                placeholder={
                  formData.tipo === "bachillerato"
                    ? "Ej. Bachillerato 3er Semestre - Grupo A"
                    : "Ej. Sistemas Escolarizado - Grupo A"
                }
                value={formData.nombre}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.tipo === "bachillerato" ? "Carrera / Modalidad de Bachillerato" : "Carrera y modalidad"}
              </label>
              <select
                name="id_carrera"
                value={formData.id_carrera}
                onChange={handleChange}
                required
                disabled={loadingCarreras}
                className="input bg-white"
              >
                <option value="">
                  {loadingCarreras ? "Cargando carreras..." : "Selecciona una opción"}
                </option>
                {carrerasFiltradas.map((carrera) => (
                  <option key={carrera.id_carrera} value={carrera.id_carrera}>
                    {carrera.nombre}
                  </option>
                ))}
              </select>
              {(formData.tipo === "bachillerato" || formData.tipo === "autoplaneado") &&
                carrerasFiltradas.length === 0 &&
                !loadingCarreras && (
                  <p className="text-xs text-red-500 mt-1">
                    No hay carreras de {formData.tipo === "bachillerato" ? "Bachillerato" : "Autoplaneado"} en el
                    catálogo. Ejecuta el script SQL más reciente en Supabase.
                  </p>
                )}
            </div>

            {formData.tipo === "universidad" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuatrimestre (opcional)
                  </label>
                  <input
                    type="number"
                    name="cuatrimestre"
                    placeholder="Ej. 3"
                    value={formData.cuatrimestre}
                    onChange={handleChange}
                    min="1"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Periodo
                    </label>
                    <select
                      name="periodo"
                      value={formData.periodo}
                      onChange={handleChange}
                      className="input bg-white"
                    >
                      <option value="">Selecciona...</option>
                      {PERIODOS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <select
                      name="anio"
                      value={formData.anio}
                      onChange={handleChange}
                      className="input bg-white"
                    >
                      <option value="">Selecciona...</option>
                      {AÑOS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {formData.tipo === "autoplaneado" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodo
                  </label>
                  <select
                    name="periodo"
                    value={formData.periodo}
                    onChange={handleChange}
                    className="input bg-white"
                  >
                    <option value="">Selecciona...</option>
                    {PERIODOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select
                    name="anio"
                    value={formData.anio}
                    onChange={handleChange}
                    className="input bg-white"
                  >
                    <option value="">Selecciona...</option>
                    {AÑOS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.tipo === "bachillerato" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semestre
                  </label>
                  <select
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleChange}
                    className="input bg-white"
                  >
                    <option value="">Selecciona...</option>
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select
                    name="anio"
                    value={formData.anio}
                    onChange={handleChange}
                    className="input bg-white"
                  >
                    <option value="">Selecciona...</option>
                    {AÑOS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={guardando}
                className="bg-purple-700 hover:bg-purple-900 text-white font-medium py-2 px-10 rounded-md shadow-md transition-all disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : modoEdicion
                  ? "Guardar cambios"
                  : "Crear grupo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
