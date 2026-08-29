import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../../../components/supabaseClient.js';

export default function ModificarCalificacion() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState({});
  const [calificacion_final, setCalificacionFinal] = useState('');
  const [periodoCuatrimestre, setPeriodoCuatrimestre] = useState('');
  const [anoCuatrimestre, setAnoCuatrimestre] = useState('');
  const [loading, setLoading] = useState(true);

  // ================= OBTENER CALIFICACIÓN =================

  useEffect(() => {

    const fetchCalificacion = async () => {

      try {

        setLoading(true);

        const { data: calificacionData, error } = await supabase
          .from('calificaciones')
          .select(`
            id,
            materia,
            calificacion,
            periodo_cuatrimestre,
            ano_cuatrimestre
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setData(calificacionData);

        setCalificacionFinal(calificacionData.calificacion);
        setPeriodoCuatrimestre(calificacionData.periodo_cuatrimestre);
        setAnoCuatrimestre(calificacionData.ano_cuatrimestre);

      } catch (err) {

        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la calificación',
        });

      } finally {

        setLoading(false);

      }

    };

    fetchCalificacion();

  }, [id]);

  // ================= ACTUALIZAR =================

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (calificacion_final === '') {

      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor ingresa la calificación.',
        confirmButtonColor: '#7e22ce',
      });

      return;

    }

    if (calificacion_final < 0 || calificacion_final > 10) {

      Swal.fire({
        icon: 'error',
        title: 'Valor inválido',
        text: 'La calificación debe estar entre 0 y 10.',
        confirmButtonColor: '#7e22ce',
      });

      return;

    }

    if (!periodoCuatrimestre) {

      Swal.fire({
        icon: 'warning',
        title: 'Periodo requerido',
        text: 'Selecciona un periodo.',
      });

      return;

    }

    if (!anoCuatrimestre) {

      Swal.fire({
        icon: 'warning',
        title: 'Año requerido',
        text: 'Ingresa el año.',
      });

      return;

    }

    const result = await Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizarán los datos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7e22ce',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, guardar'
    });

    if (!result.isConfirmed) return;

    try {

      const { error } = await supabase
        .from('calificaciones')
        .update({
          calificacion: Number(calificacion_final),
          periodo_cuatrimestre: periodoCuatrimestre,
          ano_cuatrimestre: Number(anoCuatrimestre)
        })
        .eq('id', id);

      if (error) throw error;

      await Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonColor: '#7e22ce',
      });

      navigate(-1);

    } catch (err) {

      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar.',
      });

    }

  };

  // ================= ESTADO VISUAL =================

  const obtenerColor = () => {

    if (calificacion_final >= 8) return "text-green-600";
    if (calificacion_final >= 6) return "text-yellow-600";
    return "text-red-600";

  };

  const obtenerEstado = () => {

    if (calificacion_final >= 8) return "Aprobado";
    if (calificacion_final >= 6) return "Regular";
    return "Reprobado";

  };

  // ================= LOADING =================

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700"></div>
      </main>
    );
  }

  return (

    <main className="min-h-screen bg-gray-50">

      <Navbar titulo="Modificar Calificación" />

      <div className="max-w-3xl mx-auto mt-10 px-6">

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center bg-purple-200 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-300 transition mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>

        <div className="bg-white shadow-lg rounded-2xl p-8 border">

          <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
            Modificar calificación
          </h2>

          <div className="text-center mb-6">

            <p className="text-lg font-semibold">
              Materia:
              <span className="text-purple-700">
                {" "} {data.materia}
              </span>
            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* PERIODO */}

            <div>

              <label className="block font-semibold mb-2">
                Periodo Cuatrimestre
              </label>

              <select
                value={periodoCuatrimestre}
                onChange={(e) => setPeriodoCuatrimestre(e.target.value)}
                className="w-full border rounded-md px-4 py-2"
                required
              >

                <option value="">
                  Selecciona un periodo
                </option>

                <option value="ENE-ABR">
                  ENE-ABR
                </option>

                <option value="MAY-AGO">
                  MAY-AGO
                </option>

                <option value="SEP-DIC">
                  SEP-DIC
                </option>

              </select>

            </div>

            {/* AÑO */}

            <div>

              <label className="block font-semibold mb-2">
                Año Cuatrimestre
              </label>

              <input
                type="number"
                value={anoCuatrimestre}
                onChange={(e) => setAnoCuatrimestre(e.target.value)}
                className="w-full border rounded-md px-4 py-2"
                min="2000"
                max="2100"
                step="1"
                required
              />

            </div>

            {/* CALIFICACIÓN */}

            <div>

              <label className="block font-semibold mb-2">
                Calificación Final
              </label>

              <input
                type="number"
                value={calificacion_final}
                onChange={(e) => setCalificacionFinal(e.target.value)}
                className="w-full border rounded-md px-4 py-2"
                min="0"
                max="10"
                step="0.1"
                required
              />

            </div>

            {/* ESTADO */}

            {calificacion_final !== '' && (

              <div className={`text-center text-lg font-bold ${obtenerColor()}`}>

                Estado: {obtenerEstado()} ({calificacion_final})

              </div>

            )}

            {/* BOTÓN */}

            <div className="flex justify-center pt-4">

              <button
                type="submit"
                className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-2 rounded-md flex items-center gap-2"
              >

                <FontAwesomeIcon icon={faSave} />
                Actualizar

              </button>

            </div>

          </form>

        </div>

      </div>

    </main>

  );

}