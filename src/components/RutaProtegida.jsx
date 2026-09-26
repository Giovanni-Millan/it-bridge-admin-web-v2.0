// Protege un grupo de rutas: si no hay sesión real de Supabase, o la sesión
// no tiene el rol esperado, regresa al Login en vez de dejar montar la
// pantalla. Antes de esto, entrar directo a una URL como /Dashboard sin
// haber iniciado sesión dejaba pasar (cada pantalla solo pedía sus propios
// datos, sin verificar sesión primero).
//
// Uso en App.jsx: envolver TODAS las rutas privadas dentro de
// <Route element={<RutaProtegida rol="admin" />}> ... </Route> (rutas
// anidadas, se renderizan en el <Outlet/> de aquí abajo).
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient.js";

export default function RutaProtegida({ rol }) {
  const [estado, setEstado] = useState("cargando"); // cargando | autorizado | rechazado

  useEffect(() => {
    let activo = true;

    const verificar = (session) => {
      if (!activo) return;
      const rolSesion = session?.user?.app_metadata?.rol;
      setEstado(rolSesion === rol ? "autorizado" : "rechazado");
    };

    supabase.auth.getSession().then(({ data }) => verificar(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      verificar(session);
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, [rol]);

  if (estado === "cargando") return null;
  if (estado === "rechazado") return <Navigate to="/" replace />;
  return <Outlet />;
}
