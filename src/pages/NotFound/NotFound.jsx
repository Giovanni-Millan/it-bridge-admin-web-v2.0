// Página de respaldo para la ruta comodín `*` en App.jsx: cualquier URL que
// no coincida con ninguna ruta declarada cae aquí en vez de dejar pantalla
// en blanco (que es lo que pasaba antes de agregar esto, el 31-ago-2026).
import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-purple-800">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Esta página no existe o se movió.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 bg-purple-700 text-white px-6 py-2 rounded-md hover:bg-purple-800 transition"
      >
        Volver al Dashboard
      </button>
    </main>
  );
}
