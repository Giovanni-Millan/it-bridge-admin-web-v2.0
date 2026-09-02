// Pantalla de login del portal admin. Punto de entrada único (ruta "/"):
// no hay registro propio aquí, las cuentas de admin las da de alta otro
// admin ya existente (o se crean directo en la BD/dashboard de Supabase —
// la Edge Function admin-api a propósito NO permite crear rol "admin").
import React, { useState } from 'react';
import logo from './../../assets/logo.png';
import { supabase } from '../../components/supabaseClient.js';
import Swal from 'sweetalert2';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Autentica con Supabase Auth y, si el login es válido, verifica además
  // que la cuenta tenga rol "admin" en app_metadata (no en user_metadata —
  // esa distinción importa, ver convenciones en ARQUITECTURA_SISTEMA.md).
  // Si alguien con credenciales válidas pero de OTRO rol (alumno, docente,
  // psicólogo) intenta entrar aquí, se le cierra la sesión de inmediato y
  // se le niega el acceso — cada portal valida su propio rol así.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contraseña,
    });

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Correo o contraseña incorrectos',
      });
      setIsLoading(false);
      return;
    }

    if (data.user?.app_metadata?.rol !== 'admin') {
      await supabase.auth.signOut();
      Swal.fire({
        icon: 'error',
        title: 'Sin acceso',
        text: 'Esta cuenta no tiene permiso para acceder al Portal del Administrador.',
      });
      setIsLoading(false);
      return;
    }

    Swal.fire({
      title: 'Bienvenido al sistema',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });

    window.location.href = '/Dashboard';
    setIsLoading(false);
  };

  return (
    <main className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 min-h-screen flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <section className="relative bg-white/95 backdrop-blur-sm w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/20">
        
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-purple-100 to-indigo-100 p-3 rounded-full shadow-md">
            <img src={logo} className="h-20 w-auto" alt="Logo" />
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50"
              placeholder="usuario@ejemplo.com"
              onChange={(e) => setCorreo(e.target.value)}
              value={correo}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50"
              placeholder="••••••••"
              onChange={(e) => setContraseña(e.target.value)}
              value={contraseña}
              required
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-70"
          >
            {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Sistema seguro • Supabase Auth
        </p>
      </section>
    </main>
  );
}