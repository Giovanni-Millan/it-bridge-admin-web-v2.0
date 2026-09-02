// Formulario simple de alta de avisos: título + descripción, se insertan
// en la tabla `avisos` con `supabase` directo (anon key) — no pasa por
// adminApi.js porque la política RLS de `avisos` ya le permite INSERT al
// rol admin sin necesitar la service role key. Los avisos publicados aquí
// los ven docente/alumno/psicólogo (`avisos` es un canal compartido de
// comunicación entre los 4 portales); verlos/borrarlos desde el admin es
// en Dashboard.jsx, no en esta pantalla.
import React, { useState } from 'react'
import Navbar from '../../components/Navbar'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { supabase } from '../../components/supabaseClient.js'; // 👈 IMPORTANTE

export default function CrearAvisos() {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('avisos')
      .insert([
        {
          titulo: titulo,
          descripcion: descripcion
        }
      ]);

    setLoading(false);

    if (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudo crear el aviso",
        icon: "error"
      });
    } else {
      Swal.fire({
        title: "Aviso creado con éxito!",
        text: "El aviso ha sido publicado correctamente.",
        icon: "success"
      });
      navigate('/Dashboard');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar titulo="Crear Avisos" />

      {/* Botón volver */}
      <div className="mt-10 px-10">
        <Link
          to="/Dashboard"
          className="inline-flex items-center gap-2 bg-purple-200 hover:bg-purple-400 text-purple-900 font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="hidden sm:inline">Regresar al panel</span>
        </Link>
      </div>

      {/* Formulario */}
      <div className="flex justify-center mt-16 px-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg border border-purple-200 p-8">
          <h1 className="text-2xl font-semibold text-purple-800 text-center mb-8">
            Crear un nuevo aviso
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo título */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Título:</label>
              <input
                type="text"
                className="w-full border border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 rounded-md px-3 py-2 text-gray-700 outline-none transition-all"
                placeholder="Escribe el título del aviso"
                onChange={e => setTitulo(e.target.value)}
                required
              />
            </div>

            {/* Campo descripción */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Descripción:</label>
              <textarea
                className="w-full border border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 rounded-md px-3 py-2 h-32 resize-none text-gray-700 outline-none transition-all"
                placeholder="Escribe los detalles del aviso"
                onChange={e => setDescripcion(e.target.value)}
                required
              />
            </div>

            {/* Botón enviar */}
            <div className="flex justify-center">
              <input
                type="submit"
                value={loading ? "Guardando..." : "Crear Aviso"}
                disabled={loading}
                className="bg-purple-800 hover:bg-purple-900 text-white font-medium py-2 px-16 rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
              />
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}