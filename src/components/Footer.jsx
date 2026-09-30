// Pie de página del sistema. Vive montado dentro de RutaProtegida, después
// del <Outlet/> — por diseño nunca aparece en el Login, solo dentro del
// sistema ya autenticado.
export default function Footer() {
  return (
    <footer className="bg-purple-950 text-purple-200 text-center text-xs sm:text-sm py-4 px-4">
      Sistema Bridge · Creado por <span className="font-semibold text-white">Ing. Giovanni Millán Guevara</span> · Todos los
      derechos reservados © {new Date().getFullYear()}
    </footer>
  );
}
